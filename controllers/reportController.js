const asyncHandler = require('express-async-handler');
const Ticket = require('../models/ticketModel');
const User = require('../models/userModel');
const Asset = require('../models/assetModel');

// ─── HELPER: Validate and parse date ─────────────────────────
// FIX 1: Returns null if date string is invalid
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

// ─────────────────────────────────────────────────────────────
// @desc    Get full ticket report
// @route   GET /api/reports/tickets
// @access  Private (Admin / ICT Officer)
// ─────────────────────────────────────────────────────────────
const getTicketReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // FIX 1: Validate date inputs before using them
  const parsedStart = parseDate(startDate);
  const parsedEnd = parseDate(endDate);

  if ((startDate && !parsedStart) || (endDate && !parsedEnd)) {
    res.status(400);
    throw new Error('Invalid date format. Use YYYY-MM-DD e.g. 2024-01-01');
  }

  if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
    res.status(400);
    throw new Error('startDate cannot be later than endDate');
  }

  let dateFilter = {};
  if (parsedStart && parsedEnd) {
    dateFilter = {
      createdAt: { $gte: parsedStart, $lte: parsedEnd },
    };
  }

  // ── 1. Tickets by Status ──────────────────────────────────
  const byStatus = await Ticket.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // ── 2. Tickets by Priority ────────────────────────────────
  const byPriority = await Ticket.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // ── 3. Tickets by Category ────────────────────────────────
  const byCategory = await Ticket.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // ── 4. Tickets by Department ──────────────────────────────
  const byDepartment = await Ticket.aggregate([
    { $match: { ...dateFilter, department: { $ne: '' } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // ── 5. Average Resolution Time ────────────────────────────
  // Only for tickets that have been resolved
  const resolutionTimeData = await Ticket.aggregate([
    {
      $match: {
        ...dateFilter,
        resolvedAt: { $exists: true, $ne: null },
      },
    },
    {
      $project: {
        resolutionTimeHours: {
          $divide: [
            { $subtract: ['$resolvedAt', '$createdAt'] },
            1000 * 60 * 60, // convert milliseconds to hours
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgResolutionHours: { $avg: '$resolutionTimeHours' },
        minResolutionHours: { $min: '$resolutionTimeHours' },
        maxResolutionHours: { $max: '$resolutionTimeHours' },
      },
    },
  ]);

  // ── 6. Tickets created per Month ──────────────────────────
  const byMonth = await Ticket.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // ── 7. FIX 2: Query each status directly — no subtraction ─
  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    closedTickets,
  ] = await Promise.all([
    Ticket.countDocuments(dateFilter),
    Ticket.countDocuments({ ...dateFilter, status: 'Open' }),
    Ticket.countDocuments({ ...dateFilter, status: 'In Progress' }),
    Ticket.countDocuments({ ...dateFilter, status: 'Resolved' }),
    Ticket.countDocuments({ ...dateFilter, status: 'Closed' }),
  ]);

  res.json({
    success: true,
    data: {
      summary: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        closed: closedTickets,
      },
      byStatus,
      byPriority,
      byCategory,
      byDepartment,
      byMonth,
      resolutionTime: resolutionTimeData[0] || {
        avgResolutionHours: 0,
        minResolutionHours: 0,
        maxResolutionHours: 0,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get ICT Officer performance report
// @route   GET /api/reports/performance
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const getPerformanceReport = asyncHandler(async (req, res) => {
  const officerPerformance = await Ticket.aggregate([
    // Only look at tickets assigned to someone
    { $match: { assignedTo: { $ne: null } } },
    {
      $group: {
        _id: '$assignedTo',
        totalAssigned: { $sum: 1 },
        resolved: {
          $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] },
        },
        closed: {
          $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] },
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] },
        },
        avgResolutionHours: {
          $avg: {
            $cond: [
              {
                $and: [
                  { $ne: ['$resolvedAt', null] },
                  { $ne: ['$createdAt', null] },
                ],
              },
              {
                $divide: [
                  { $subtract: ['$resolvedAt', '$createdAt'] },
                  1000 * 60 * 60,
                ],
              },
              null,
            ],
          },
        },
      },
    },
    // Join with users collection to get officer details
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'officer',
      },
    },
    { $unwind: '$officer' },
    // DESIGN FIX: Only include ict_officer and admin roles
    {
      $match: {
        'officer.role': { $in: ['ict_officer', 'admin'] },
      },
    },
    {
      $project: {
        officerName: '$officer.name',
        officerEmail: '$officer.email',
        officerRole: '$officer.role',
        totalAssigned: 1,
        resolved: 1,
        closed: 1,
        inProgress: 1,
        avgResolutionHours: { $round: ['$avgResolutionHours', 2] },
        // FIX 3: Guard against division by zero
        resolutionRate: {
          $round: [
            {
              $multiply: [
                {
                  $cond: [
                    { $eq: ['$totalAssigned', 0] },
                    0,
                    { $divide: ['$resolved', '$totalAssigned'] },
                  ],
                },
                100,
              ],
            },
            1,
          ],
        },
      },
    },
    { $sort: { resolved: -1 } }, // best performer first
  ]);

  res.json({
    success: true,
    data: officerPerformance,
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get asset report
// @route   GET /api/reports/assets
// @access  Private (Admin / ICT Officer)
// ─────────────────────────────────────────────────────────────
const getAssetReport = asyncHandler(async (req, res) => {
  // ── 1. Assets by Status ───────────────────────────────────
  const byStatus = await Asset.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // ── 2. Assets by Category ─────────────────────────────────
  const byCategory = await Asset.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // ── 3. Assets by Department ───────────────────────────────
  const byDepartment = await Asset.aggregate([
    { $match: { department: { $ne: '' } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // ── 4. Assets by Condition ────────────────────────────────
  const byCondition = await Asset.aggregate([
    { $group: { _id: '$condition', count: { $sum: 1 } } },
  ]);

  // ── 5. Total asset value by category ─────────────────────
  const valueByCategory = await Asset.aggregate([
    {
      $group: {
        _id: '$category',
        totalValue: { $sum: '$purchasePrice' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalValue: -1 } },
  ]);

  // ── 6. Maintenance cost summary ───────────────────────────
  const maintenanceCosts = await Asset.aggregate([
    { $unwind: '$maintenanceHistory' },
    {
      $group: {
        _id: null,
        totalMaintenanceCost: { $sum: '$maintenanceHistory.cost' },
        totalMaintenanceRecords: { $sum: 1 },
      },
    },
  ]);

  const today = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);

  // FIX 5 & 6: Exclude Decommissioned assets from warranty reports
  // ── 7. Assets with warranty expiring in 30 days ───────────
  const warrantyExpiring = await Asset.find({
    warrantyExpiry: { $gte: today, $lte: thirtyDaysLater },
    status: { $ne: 'Decommissioned' },
  })
    .select('assetTag name category warrantyExpiry department status')
    .sort({ warrantyExpiry: 1 });

  // ── 8. Assets with expired warranty ──────────────────────
  const warrantyExpired = await Asset.find({
    warrantyExpiry: { $lt: today },
    status: { $ne: 'Decommissioned' },
  })
    .select('assetTag name category warrantyExpiry department status')
    .sort({ warrantyExpiry: -1 });

  // ── 9. Summary totals ─────────────────────────────────────
  const totalAssets = await Asset.countDocuments();
  const totalValueResult = await Asset.aggregate([
    { $group: { _id: null, total: { $sum: '$purchasePrice' } } },
  ]);

  res.json({
    success: true,
    data: {
      summary: {
        totalAssets,
        totalValue: totalValueResult[0]?.total || 0,
        totalMaintenanceCost:
          maintenanceCosts[0]?.totalMaintenanceCost || 0,
        totalMaintenanceRecords:
          maintenanceCosts[0]?.totalMaintenanceRecords || 0,
        warrantyExpiringCount: warrantyExpiring.length,
        warrantyExpiredCount: warrantyExpired.length,
      },
      byStatus,
      byCategory,
      byDepartment,
      byCondition,
      valueByCategory,
      warrantyExpiring,
      warrantyExpired,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get user activity report
// @route   GET /api/reports/users
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const getUserReport = asyncHandler(async (req, res) => {
  // ── 1. Users by Role ──────────────────────────────────────
  const byRole = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  // ── 2. Users by Department ────────────────────────────────
  const byDepartment = await User.aggregate([
    { $match: { department: { $ne: '' } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // ── 3. Top 10 most active ticket submitters ───────────────
  // DESIGN FIX: preserveNullAndEmptyArrays surfaces tickets
  // from deleted users instead of silently dropping them
  const topSubmitters = await Ticket.aggregate([
    { $group: { _id: '$submittedBy', ticketCount: { $sum: 1 } } },
    { $sort: { ticketCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        userName: { $ifNull: ['$user.name', 'Deleted User'] },
        userEmail: { $ifNull: ['$user.email', 'N/A'] },
        userRole: { $ifNull: ['$user.role', 'N/A'] },
        department: { $ifNull: ['$user.department', 'N/A'] },
        ticketCount: 1,
      },
    },
  ]);

  // ── 4. Total user counts ──────────────────────────────────
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const inactiveUsers = await User.countDocuments({ isActive: false });

  res.json({
    success: true,
    data: {
      summary: { totalUsers, activeUsers, inactiveUsers },
      byRole,
      byDepartment,
      topSubmitters,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get full dashboard overview (all key metrics)
// @route   GET /api/reports/dashboard
// @access  Private (Admin / ICT Officer)
// ─────────────────────────────────────────────────────────────
const getDashboardOverview = asyncHandler(async (req, res) => {
  // FIX 4: Query all statuses directly — no subtraction
  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    closedTickets,
    totalUsers,
    totalAssets,
    recentTickets,
    criticalTickets,
  ] = await Promise.all([
    Ticket.countDocuments(),
    Ticket.countDocuments({ status: 'Open' }),
    Ticket.countDocuments({ status: 'In Progress' }),
    Ticket.countDocuments({ status: 'Resolved' }),
    Ticket.countDocuments({ status: 'Closed' }),
    User.countDocuments(),
    Asset.countDocuments(),
    // 5 most recent tickets
    Ticket.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name department')
      .populate('assignedTo', 'name')
      .select('ticketNumber title status priority category createdAt createdBy assignedTo'),
    // All critical unresolved tickets
    Ticket.find({ priority: 'Critical', status: { $ne: 'Closed' } })
      .populate('createdBy', 'name department')
      .select('ticketNumber title status department createdAt createdBy'),
  ]);

  const normalizedRecentTickets = recentTickets.map((ticket) => {
    const row = ticket.toObject();
    row.submittedBy = row.createdBy || null;
    return row;
  });

  const normalizedCriticalTickets = criticalTickets.map((ticket) => {
    const row = ticket.toObject();
    row.submittedBy = row.createdBy || null;
    return row;
  });

  res.json({
    success: true,
    data: {
      tickets: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        closed: closedTickets,
      },
      users: { total: totalUsers },
      assets: { total: totalAssets },
      recentTickets: normalizedRecentTickets,
      criticalTickets: normalizedCriticalTickets,
    },
  });
});

module.exports = {
  getTicketReport,
  getPerformanceReport,
  getAssetReport,
  getUserReport,
  getDashboardOverview,
};