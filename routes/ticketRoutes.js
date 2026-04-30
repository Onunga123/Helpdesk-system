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
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All ticket routes require login
router.use(protect);

// Stats route — must be BEFORE /:id route
// otherwise Express reads 'stats' as a ticket ID
router.get('/stats', authorize('admin', 'ict_officer'), getTicketStats);

// Main ticket routes
router.route('/')
  .get(getTickets)      // GET  /api/tickets
  .post(createTicket);  // POST /api/tickets

router.route('/:id')
  .get(getTicketById)                                     // GET    /api/tickets/:id
  .put(authorize('admin', 'ict_officer'), updateTicket)   // PUT    /api/tickets/:id
  .delete(authorize('admin'), deleteTicket);              // DELETE /api/tickets/:id

// Comments
router.post('/:id/comments', addComment);

module.exports = router;