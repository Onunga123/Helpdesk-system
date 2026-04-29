const asyncHandler = require("express-async-handler");
const Ticket = require("../models/ticketModel");
const User = require("../models/userModel");
const Asset = require("../models/assetModel");

const getTicketReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
  }
  const byStatus = await Ticket.aggregate([{ $match: dateFilter }, { $group: { _id: "$status", count: { $sum: 1 } } }]);
  const byPriority = await Ticket.aggregate([{ $match: dateFilter }, { $group: { _id: "$priority", count: { $sum: 1 } } }]);
  const byCategory = await Ticket.aggregate([{ $match: dateFilter }, { $group: { _id: "$category", count: { $sum: 1 } } }]);
  const byDepartment = await Ticket.aggregate([{ $match: { ...dateFilter, department: { $ne: "" } } }, { $group: { _id: "$department", count: { $sum: 1 } } }]);
  const byMonth = await Ticket.aggregate([{ $match: dateFilter }, { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { "_id.year": 1, "_id.month": 1 } }]);
  const totalTickets = await Ticket.countDocuments(dateFilter);
  const openTickets = await Ticket.countDocuments({ ...dateFilter, status: "Open" });
  const resolvedTickets = await Ticket.countDocuments({ ...dateFilter, status: "Resolved" });
  const closedTickets = await Ticket.countDocuments({ ...dateFilter, status: "Closed" });
  res.json({ success: true, data: { summary: { total: totalTickets, open: openTickets, resolved: resolvedTickets, closed: closedTickets }, byStatus, byPriority, byCategory, byDepartment, byMonth } });
});

const getPerformanceReport = asyncHandler(async (req, res) => {
  const officerPerformance = await Ticket.aggregate([
    { $match: { assignedTo: { $ne: null } } },
    { $group: { _id: "$assignedTo", totalAssigned: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } }, closed: { $sum: { $cond: [{ $eq: ["$status", "Closed"] }, 1, 0] } }, inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } } } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "officer" } },
    { $unwind: "$officer" },
    { $project: { officerName: "$officer.name", officerEmail: "$officer.email", totalAssigned: 1, resolved: 1, closed: 1, inProgress: 1, resolutionRate: { $round: [{ $multiply: [{ $divide: ["$resolved", "$totalAssigned"] }, 100] }, 1] } } },
    { $sort: { resolved: -1 } },
  ]);
  res.json({ success: true, data: officerPerformance });
});

const getAssetReport = asyncHandler(async (req, res) => {
  const byStatus = await Asset.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const byCategory = await Asset.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
  const byDepartment = await Asset.aggregate([{ $match: { department: { $ne: "" } } }, { $group: { _id: "$department", count: { $sum: 1 } } }]);
  const totalAssets = await Asset.countDocuments();
  const totalValueResult = await Asset.aggregate([{ $group: { _id: null, total: { $sum: "$purchasePrice" } } }]);
  res.json({ success: true, data: { summary: { totalAssets, totalValue: totalValueResult[0]?.total || 0 }, byStatus, byCategory, byDepartment } });
});

const getUserReport = asyncHandler(async (req, res) => {
  const byRole = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]);
  const byDepartment = await User.aggregate([{ $match: { department: { $ne: "" } } }, { $group: { _id: "$department", count: { $sum: 1 } } }]);
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  res.json({ success: true, data: { summary: { totalUsers, activeUsers, inactiveUsers: totalUsers - activeUsers }, byRole, byDepartment } });
});

const getDashboardOverview = asyncHandler(async (req, res) => {
  const [totalTickets, openTickets, inProgressTickets, resolvedTickets, totalUsers, totalAssets, recentTickets, criticalTickets] = await Promise.all([
    Ticket.countDocuments(),
    Ticket.countDocuments({ status: "Open" }),
    Ticket.countDocuments({ status: "In Progress" }),
    Ticket.countDocuments({ status: "Resolved" }),
    User.countDocuments(),
    Asset.countDocuments(),
    Ticket.find().sort({ createdAt: -1 }).limit(5).populate("submittedBy", "name department").populate("assignedTo", "name").select("ticketNumber title status priority category createdAt"),
    Ticket.find({ priority: "Critical", status: { $ne: "Closed" } }).populate("submittedBy", "name department").select("ticketNumber title status department createdAt"),
  ]);
  res.json({ success: true, data: { tickets: { total: totalTickets, open: openTickets, inProgress: inProgressTickets, resolved: resolvedTickets, closed: totalTickets - openTickets - inProgressTickets - resolvedTickets }, users: { total: totalUsers }, assets: { total: totalAssets }, recentTickets, criticalTickets } });
});

module.exports = { getTicketReport, getPerformanceReport, getAssetReport, getUserReport, getDashboardOverview };
