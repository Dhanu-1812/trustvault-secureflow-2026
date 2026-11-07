const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  uploadDocument,
  listDocuments,
  downloadDocument,
  searchDocuments,
  deleteDocument,
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
  "/",
  authenticate,
  listDocuments
);

router.get(
  "/search",
  authenticate,
  searchDocuments
);

router.get(
  "/:documentId/download",
  authenticate,
  downloadDocument
);

router.delete(
  "/:documentId",
  authenticate,
  deleteDocument
);

module.exports = router;