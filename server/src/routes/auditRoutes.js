const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  verifyAuditChain,
} = require("../audit/auditService");

const router = express.Router();

router.get(
  "/verify",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const result = await verifyAuditChain();

      if (!result.valid) {
        return res.status(500).json({
          message: "Audit chain verification failed",
          ...result,
        });
      }

      return res.json({
        message: "Audit chain is valid",
        ...result,
      });
    } catch (error) {
      console.error("Audit verification error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);

module.exports = router;