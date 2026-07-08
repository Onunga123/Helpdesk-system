const Counter = require('../models/counterModel');

const TICKET_COUNTER_ID = 'ticketNumber';
const TICKET_PREFIX = 'TUC-ICT-';

const formatTicketNumber = (sequence) =>
  `${TICKET_PREFIX}${String(sequence).padStart(6, '0')}`;

const parseTicketSequence = (ticketNumber) => {
  if (!ticketNumber) return 0;
  const match = String(ticketNumber).match(/^TUC-ICT-(\d{6})$/);
  return match ? parseInt(match[1], 10) : 0;
};

const generateTicketNumber = async () => {
  const counter = await Counter.findByIdAndUpdate(
    TICKET_COUNTER_ID,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return formatTicketNumber(counter.seq);
};

module.exports = {
  TICKET_COUNTER_ID,
  TICKET_PREFIX,
  formatTicketNumber,
  parseTicketSequence,
  generateTicketNumber,
};
