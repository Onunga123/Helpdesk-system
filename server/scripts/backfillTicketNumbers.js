const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Ticket = require('../models/ticketModel');
const Counter = require('../models/counterModel');
const {
  TICKET_COUNTER_ID,
  formatTicketNumber,
  parseTicketSequence,
} = require('../utils/generateTicketNumber');

dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

const backfillTicketNumbers = async () => {
  await connectDB();

  const allTickets = await Ticket.find({}).select('ticketNumber createdAt').sort({ createdAt: 1 }).lean();

  let maxSeq = 0;
  for (const ticket of allTickets) {
    maxSeq = Math.max(maxSeq, parseTicketSequence(ticket.ticketNumber));
  }

  const missingTickets = await Ticket.find({
    $or: [
      { ticketNumber: { $exists: false } },
      { ticketNumber: null },
      { ticketNumber: '' },
    ],
  }).sort({ createdAt: 1 });

  let assigned = 0;
  let seq = maxSeq;

  for (const ticket of missingTickets) {
    seq += 1;
    ticket.ticketNumber = formatTicketNumber(seq);
    await ticket.save({ validateBeforeSave: true });
    assigned += 1;
    console.log(`Assigned ${ticket.ticketNumber} → ticket ${ticket._id}`);
  }

  await Counter.findByIdAndUpdate(
    TICKET_COUNTER_ID,
    { seq: Math.max(seq, maxSeq) },
    { upsert: true, setDefaultsOnInsert: true }
  );

  console.log(`Backfill complete. Assigned ${assigned} ticket number(s). Counter set to ${Math.max(seq, maxSeq)}.`);
};

backfillTicketNumbers()
  .then(() => mongoose.connection.close())
  .catch((error) => {
    console.error('Ticket number backfill failed:', error.message);
    mongoose.connection.close();
    process.exit(1);
  });
