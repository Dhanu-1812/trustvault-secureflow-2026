const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const uploadDirectory = path.resolve(
  __dirname,
  "../../../uploads"
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const safeName =
      crypto.randomUUID() +
      path.extname(file.originalname).toLowerCase();

    cb(null, safeName);
  },
});

const allowedTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

const fileFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type"));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = upload;