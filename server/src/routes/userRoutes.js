const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const { lookupUserByEmail } = require("../controllers/userController");

const router = express.Router();

router.get("/lookup", authenticate, lookupUserByEmail);

module.exports = router;