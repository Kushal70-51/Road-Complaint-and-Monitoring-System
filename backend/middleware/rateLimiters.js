const rateLimit = require("express-rate-limit");

// Generous enough for normal retry-after-typo use, tight enough to blunt brute force.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." }
});

const createAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin-creation attempts. Please try again later." }
});

const suggestCategoryLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." }
});

module.exports = { loginLimiter, createAdminLimiter, suggestCategoryLimiter };
