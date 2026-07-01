const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const mimeTypes = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function safeFilePath(requestUrl) {
  const cleanUrl = decodeURIComponent((requestUrl || "/").split("?")[0]);
  const requested = cleanUrl === "/" ? "CA File Tracker.html" : cleanUrl.replace(/^\/+/, "");
  const resolved = path.resolve(ROOT, requested);
  return resolved.startsWith(ROOT) ? resolved : null;
}

const server = http.createServer((req, res) => {
  const filePath = safeFilePath(req.url);
  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=UTF-8" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=UTF-8" });
      res.end("File not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`CA File Tracker running on port ${PORT}`);
});
