export const logReq = (req, _res, next) => {
  console.log(
    `${req.method} -- ${req.url} -- ${new Date().toLocaleDateString()}`,
  );

  next();
};

export const globalErr = (err, _req, res, _next) => {
  res.status(err.status || 500).json({ error: `❌ Error: ${err.message}` });
};
