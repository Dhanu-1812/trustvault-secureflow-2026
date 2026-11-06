const express = require("express");

const {
  register,
  login,
  getCurrentUser,
} = require("../controllers/authController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

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