const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsRoot = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}
const ticketsFolder = path.join(__dirname, '../uploads/tickets');
if (!fs.existsSync(ticketsFolder)) {
  fs.mkdirSync(ticketsFolder, { recursive: true });
}
const avatarsFolder = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarsFolder)) {
  fs.mkdirSync(avatarsFolder, { recursive: true });
}
const generalFolder = path.join(__dirname, '../uploads/general');
if (!fs.existsSync(generalFolder)) {
  fs.mkdirSync(generalFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadFolder = req.uploadFolder || 'general';
    const uploadPath = path.join(__dirname, '../uploads', uploadFolder);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const cleanName = file.originalname
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '');

    const safeName = cleanName.replace(/^\./, '') || 'file';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeName}`;
    cb(null, uniqueName);
  },
});

const ALLOWED_TICKET_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
];

const ALLOWED_TICKET_EXTENSIONS = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
const ALLOWED_IMAGE_EXTENSIONS = /jpeg|jpg|png|gif/;

const ticketFileFilter = (req, file, cb) => {
  const extname = ALLOWED_TICKET_EXTENSIONS.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = ALLOWED_TICKET_MIMES.includes(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only images (JPEG, PNG, GIF), PDF, Word, Excel, and TXT files are allowed.'
      ),
      false
    );
  }
};

const imageFileFilter = (req, file, cb) => {
  const extname = ALLOWED_IMAGE_EXTENSIONS.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = ALLOWED_IMAGE_MIMES.includes(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Profile image must be JPEG, JPG, PNG, or GIF.'
      ),
      false
    );
  }
};

const uploadTicket = multer({
  storage,
  fileFilter: ticketFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
});

const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

const uploadTicketFiles = (req, res, next) => {
  req.uploadFolder = 'tickets';
  uploadTicket.array('attachments', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('MulterError:', err.code, err.message, err.field);
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
      if (err.code === 'LIMIT_FILE_COUNT')
        return res.status(400).json({ success: false, message: 'Too many files. Maximum is 5 files.' });
      if (err.code === 'LIMIT_UNEXPECTED_FILE')
        return res.status(400).json({ success: false, message: 'Unexpected field name. Use "attachments" as the field name.' });
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      console.error('Upload error:', err.message);
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

const uploadProfileImage = (req, res, next) => {
  req.uploadFolder = 'avatars';
  uploadImage.single('profileImage')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ message: 'Image too large. Maximum size is 5MB.' });
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

module.exports = { uploadTicketFiles, uploadProfileImage };
