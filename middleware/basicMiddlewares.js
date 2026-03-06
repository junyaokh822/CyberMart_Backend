/**
 * logReq middleware
 * Logs each incoming HTTP request with its method, URL, and date.
 * Useful for debugging and monitoring traffic in development.
 */
export const logReq = (req, _res, next) => {
  console.log(
    `${req.method} -- ${req.url} -- ${new Date().toLocaleDateString()}`,
  );
  next();
};

/**
 * globalErr middleware
 * Express global error handler — must have 4 parameters (err, req, res, next)
 * to be recognized by Express as an error-handling middleware.
 * Catches errors passed via next(error) from any route and returns
 * a standardized JSON error response with the appropriate status code.
 */
export const globalErr = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: `❌ Error: ${err.message}` });
};
