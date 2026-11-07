const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const {
  grantPermission,
  revokePermission,
} = require("../controllers/permissionController");

const router = express.Router();

router.post(
  "/:documentId/grant",
  authenticate,
  grantPermission
);

router.delete(
  "/:documentId/revoke/:userId",
  authenticate,
  revokePermission
);

module.exports = router;