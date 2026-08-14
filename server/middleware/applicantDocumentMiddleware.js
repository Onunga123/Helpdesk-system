const multer = require("multer");
const path = require("path");
const fs = require("fs");

const applicantsDir = path.join(__dirname, "..", "uploads", "applicants");
const resumesDir = path.join(__dirname, "..", "uploads", "resumes");

[applicantsDir, resumesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const documentTypes = {
  profilePhoto: {
    dir: applicantsDir,
    prefix: "applicant-photo-",
    allowed: [".jpg", ".jpeg", ".png", ".webp"],
    maxSize: 2 * 1024 * 1024,
  },
  cv: {
    dir: resumesDir,
    prefix: "resume-",
    allowed: [".pdf", ".doc", ".docx"],
    maxSize: 5 * 1024 * 1024,
  },
  coverLetter: {
    dir: applicantsDir,
    prefix: "applicant-cover-",
    allowed: [".pdf", ".doc", ".docx"],
    maxSize: 5 * 1024 * 1024,
  },
  certificate: {
    dir: applicantsDir,
    prefix: "applicant-cert-",
    allowed: [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
    maxSize: 5 * 1024 * 1024,
  },
  supporting: {
    dir: applicantsDir,
    prefix: "applicant-support-",
    allowed: [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
    maxSize: 5 * 1024 * 1024,
  },
  applicationDocument: {
    dir: applicantsDir,
    prefix: "application-doc-",
    allowed: [".pdf", ".doc", ".docx"],
    maxSize: 5 * 1024 * 1024,
  },
};

const SUPPORTED_DOCUMENT_TYPES = Object.keys(documentTypes);

const resolveDocumentType = (req) => req.query.documentType || req.body.documentType || null;

const getDocumentConfig = (documentType) => {
  if (!documentType || !documentTypes[documentType]) {
    return null;
  }
  return documentTypes[documentType];
};

const invalidTypeError = () =>
  new Error(
    `Invalid or missing document type. Supported types: ${SUPPORTED_DOCUMENT_TYPES.join(", ")}`
  );

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const config = getDocumentConfig(resolveDocumentType(req));
    if (!config) {
      cb(invalidTypeError());
      return;
    }
    cb(null, config.dir);
  },
  filename(req, file, cb) {
    const config = getDocumentConfig(resolveDocumentType(req));
    if (!config) {
      cb(invalidTypeError());
      return;
    }
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${config.prefix}${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (req, file, cb) => {
  const config = getDocumentConfig(resolveDocumentType(req));
  if (!config) {
    cb(invalidTypeError(), false);
    return;
  }

  const fileExt = path.extname(file.originalname).toLowerCase();
  if (config.allowed.includes(fileExt)) {
    cb(null, true);
    return;
  }

  cb(new Error(`Invalid file type. Allowed: ${config.allowed.join(", ")}`), false);
};

const applicantDocumentUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const handleApplicantDocumentUpload = (req, res, next) => {
  applicantDocumentUpload.single("file")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400);
        next(new Error("File is too large. Maximum allowed size is 5MB."));
        return;
      }
      res.status(400);
      next(new Error(err.message));
      return;
    }

    res.status(400);
    next(err);
  });
};

module.exports = applicantDocumentUpload;
module.exports.handleApplicantDocumentUpload = handleApplicantDocumentUpload;
module.exports.documentTypes = documentTypes;
module.exports.SUPPORTED_DOCUMENT_TYPES = SUPPORTED_DOCUMENT_TYPES;
