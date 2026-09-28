const multer = require("multer");

const storage = multer.memoryStorage();
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 8,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, WEBP, and GIF images are allowed."));
    }
    cb(null, true);
  },
});

const validateImageSignature = (req, res, next) => {
  const files = Array.isArray(req.files)
    ? req.files
    : req.file
      ? [req.file]
      : [];

  for (const file of files) {
    const b = file.buffer;

    const isJpeg =
      b.length >= 3 &&
      b[0] === 0xff &&
      b[1] === 0xd8 &&
      b[2] === 0xff;

    const isPng =
      b.length >= 8 &&
      b.slice(0, 8).equals(
        Buffer.from([
          137, 80, 78, 71,
          13, 10, 26, 10,
        ])
      );

    const isGif =
      b.length >= 6 &&
      (
        b.slice(0, 6).toString() === "GIF87a" ||
        b.slice(0, 6).toString() === "GIF89a"
      );

    const isWebp =
      b.length >= 12 &&
      b.slice(0, 4).toString() === "RIFF" &&
      b.slice(8, 12).toString() === "WEBP";

    if (!isJpeg && !isPng && !isGif && !isWebp) {
      return res.status(400).json({
        success: false,
        message: "One or more uploaded files are not valid images.",
      });
    }
  }

  next();
};

module.exports = upload;
module.exports.validateImageSignature = validateImageSignature;


// Multiple product-image upload middleware.
const uploadProductImages = upload.array("images", 8);

module.exports.uploadProductImages = uploadProductImages;
