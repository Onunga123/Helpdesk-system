const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addComment,
  deleteTicket,
  getTicketStats,
  uploadAttachment,
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/stats', authorize('admin', 'ict_officer'), getTicketStats);

router
  .route('/')
  .get(getTickets)
  .post(createTicket);

router
  .route('/:id')
  .get(getTicketById)
  .put(authorize('admin', 'ict_officer'), updateTicket)
  .delete(authorize('admin'), deleteTicket);

router.post('/:id/comments', addComment);
router.post('/:id/attachments', upload.single('file'), uploadAttachment);

module.exports = router;