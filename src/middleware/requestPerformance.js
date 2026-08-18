const crypto = require("node:crypto");

const SLOW_REQUEST_MS = Number(process.env.SLOW_REQUEST_MS || 750);
const PERF_LOG_ENABLED = process.env.PERF_LOG === "1";

function requestPerformance(req, res, next) {
  const startedAt = process.hrtime.bigint();
  const requestId = String(req.get("X-Request-ID") || crypto.randomUUID()).slice(0, 100);
  req.requestId = requestId;
  res.set("X-Request-ID", requestId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    if (!PERF_LOG_ENABLED && durationMs < SLOW_REQUEST_MS) return;
    console.info(JSON.stringify({
      type: "api-performance",
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
      responseBytes: Number(res.get("Content-Length") || 0) || null,
      at: new Date().toISOString(),
    }));
  });
  next();
}

module.exports = { requestPerformance };
