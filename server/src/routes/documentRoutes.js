const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  uploadDocument,
  listDocuments,
  downloadDocument,
  searchDocuments,
} = require("../controllers/documentController");

const router = express.Router();

router.post(
  "/upload",
  authenticate,
  authorizeRoles("OWNER"),
  upload.single("file"),
  uploadDocument
);

router.get(
  "/search",
  authenticate,
  listDocuments
);

router.get(
  "/:documentId/download",
  authenticate,
  downloadDocument
);

module.exports = router;