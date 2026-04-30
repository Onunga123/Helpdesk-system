const express = require("express");
const router = express.Router();
const { uploadTicketAttachments, uploadProfileImage, deleteTicketAttachment } = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");

// Support both middleware export styles:
// 1) named handlers: { uploadTicketFiles, uploadProfileImage }
// 2) raw multer instance: upload
const uploadTicketFiles =
  uploadMiddleware.uploadTicketFiles ||
  uploadMiddleware.array("attachments", 5);
const uploadProfileImageMiddleware =
  uploadMiddleware.uploadProfileImage ||
  uploadMiddleware.single("profileImage");

router.use(protect);

router.post("/ticket/:ticketId", uploadTicketFiles, uploadTicketAttachments);
router.post("/profile", uploadProfileImageMiddleware, uploadProfileImage);
router.delete("/ticket/:ticketId/:attachmentId", deleteTicketAttachment);

module.exports = router;