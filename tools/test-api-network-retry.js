const assert = require("assert");
const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const index = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const functionStart = app.indexOf("async function backendApiJson");
const functionEnd = app.indexOf("async function refreshApiSession", functionStart);
const apiFunction = app.slice(functionStart, functionEnd);

assert(functionStart >= 0 && functionEnd > functionStart, "backendApiJson must exist");
assert(apiFunction.includes('method === "GET" && retryAttempt < 2'), "only idempotent GET requests may retry");
assert(apiFunction.includes("[502, 503, 504].includes(response.status)"), "temporary gateway/server errors must retry");
assert(apiFunction.includes("Your saved data is safe"), "network failures must not imply that records were deleted");
assert(/app\.js\?v=20260807-[^"']+/.test(index), "the repaired API client must retain a current cache version");
console.log("API transient-network recovery checks passed.");
