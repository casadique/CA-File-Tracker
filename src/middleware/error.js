function notFoundHandler(req, res, next) {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "API endpoint not found." });
    return;
  }
  next();
}

function errorHandler(error, _req, res, _next) {
  console.error(error);
  const status = Number(error.status || error.statusCode || 500);
  res.status(status).json({
    error: status >= 500 ? "Server error." : error.message,
  });
}

module.exports = { notFoundHandler, errorHandler };
