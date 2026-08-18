const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "..", "todo-client.js"), "utf8");
let loadingWrites = 0;
let paintCount = 0;
let hasWorkspace = false;
let apiCalls = 0;
let releaseRequest;

const workspace = {
  setAttribute() {},
  removeAttribute() {},
};
const target = {
  _html: "",
  get innerHTML() { return this._html; },
  set innerHTML(value) {
    this._html = value;
    if (String(value).includes("Loading secure To-Do workspace")) loadingWrites += 1;
  },
  querySelector(selector) { return selector === ".todo-workspace" && hasWorkspace ? workspace : null; },
};

const payload = {
  tasks: [{ id: "todo-1", title: "Stable task", created_at: "2026-08-18T00:00:00.000Z" }],
  dashboard: { summary: { pending: 1 }, staff: [] },
};
const context = {
  URLSearchParams,
  location: { search: "" },
  activePage: "todo",
  document: {
    addEventListener() {},
    querySelector(selector) { return selector === "#todo" ? target : null; },
  },
  apiJson: async () => {
    apiCalls += 1;
    if (releaseRequest) await new Promise((resolve) => { releaseRequest = resolve; });
    return payload;
  },
  toast() {},
  escapeHtml(value) { return String(value ?? ""); },
  setTimeout() {},
  setInterval() {},
  BroadcastChannel: class {},
  localStorage: { getItem() { return null; }, setItem() {} },
  sessionStorage: { getItem() { return null; }, setItem() {} },
  window: {},
};
context.globalThis = context;
const vmContext = vm.createContext(context);
vm.runInContext(`${source}\n;todoPaint = () => { __markPaint(); }; globalThis.__todoTest = { todoUi, todoRefresh };`, vmContext, {
  filename: "todo-client.js",
});
vmContext.__markPaint = () => { paintCount += 1; hasWorkspace = true; };

(async () => {
  const { todoUi, todoRefresh } = vmContext.__todoTest;
  await todoRefresh({ showLoading: true });
  assert.equal(loadingWrites, 1, "initial load should show one loading state");
  assert.equal(paintCount, 1, "initial data should paint once");
  assert.equal(apiCalls, 1);

  await todoRefresh({ background: true, maxAgeMs: 20000 });
  assert.equal(apiCalls, 1, "fresh cached To-Do data should not request again");
  assert.equal(loadingWrites, 1, "background refresh must not replace stable content with a loader");

  todoUi.lastLoadedAt = 0;
  releaseRequest = true;
  const first = todoRefresh({ background: true, maxAgeMs: 20000 });
  const second = todoRefresh({ background: true, maxAgeMs: 20000 });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(apiCalls, 2, "overlapping refreshes for the same query must share one request");
  assert.equal(loadingWrites, 1, "an in-flight background refresh must retain the visible To-Do page");
  releaseRequest();
  await Promise.all([first, second]);
  assert.equal(paintCount, 1, "unchanged background data must not repaint the page");

  console.log("To-Do stable background refresh and request deduplication checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
