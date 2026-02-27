export const logReq = (req, _res, next) => {
  console.log(
    `${req.method} -- ${req.url} -- ${new Date().toLocaleDateString()}`,
  );
  next();
};

export const globalErr = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: `❌ Error: ${err.message}` });
};
