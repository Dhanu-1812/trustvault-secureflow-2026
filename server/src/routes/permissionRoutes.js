const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const {
  grantPermission,
  revokePermission,
} = require("../controllers/permissionController");

const router = express.Router();
const validateUuidParam = require("../middleware/validateUuid");
router.post(
  "/:documentId/grant",
  authenticate,
  validateUuidParam("documentId"),
  grantPermission
);

router.delete(
  "/:documentId/revoke/:userId",
  authenticate,
  validateUuidParam("documentId"),
  validateUuidParam("userId"),
  revokePermission
);

module.exports = router;