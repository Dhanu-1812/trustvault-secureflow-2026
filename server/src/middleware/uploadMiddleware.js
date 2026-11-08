const multer = require("multer");

const storage = multer.memoryStorage();

const allowedTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

const fileFilter = (req, file, callback) => {
  if (!allowedTypes.includes(file.mimetype)) {
    return callback(
      new Error("Only PDF, PNG, and JPEG files are allowed")
    );
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = upload;