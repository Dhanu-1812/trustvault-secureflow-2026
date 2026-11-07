const express = require("express");

const {
  register,
  login,
  getCurrentUser,
} = require("../controllers/authController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again later.",
  },
});
router.post("/register", register);

router.post("/login", login);

router.get("/me", authenticate, getCurrentUser);

router.get(
  "/owner-only",
  authenticate,
  authorizeRoles("OWNER"),
  (req, res) => {
    res.json({
      message: "Owner access granted",
    });
  }
);

module.exports = router;