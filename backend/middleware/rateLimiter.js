const rateLimit = require('express-rate-limit');


// GENERAL API LIMITER

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error: 'Too many requests. Please try again later.'
  }
});



// AUTH LIMITER (LOGIN / REGISTER)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error: 'Too many login attempts. Try again after 15 minutes.'
  }
});



// STRICT LIMITER (FOR SENSITIVE ACTIONS)
// e.g. certificate request, ID card issuance

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error: 'Too many sensitive requests. Please slow down.'
  }
});


module.exports = {
  apiLimiter,
  authLimiter,
  strictLimiter
};