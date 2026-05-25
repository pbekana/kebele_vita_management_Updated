// Rate limiters disabled for development and normal operations
// Pass-through middleware that allows all requests

const passThrough = (req, res, next) => {
  next();
};

// All limiters are now disabled
const apiLimiter = passThrough;
const authLimiter = passThrough;
const strictLimiter = passThrough;


module.exports = {
  apiLimiter,
  authLimiter,
  strictLimiter
};