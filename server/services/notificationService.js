const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

const buildLink = (relatedId) => (relatedId ? `/tickets/${relatedId}` : '');

/**
 * Create a single in-app notification.
 */
const createNotification = async (userId, type, title, message = '', relatedId = '') => {
  if (!userId) return null;

  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    relatedId: relatedId ? String(relatedId) : '',
    link: buildLink(relatedId),
    isRead: false,
  });

  console.log(`[Notification] Created for user ${userId}: ${title}`);
  return notification;
};

/**
 * Create notifications for multiple users (deduplicated).
 */
const broadcastNotification = async (userIds, type, title, message = '', relatedId = '') => {
  const uniqueIds = [...new Set((userIds || []).map((id) => String(id)).filter(Boolean))];
  if (!uniqueIds.length) {
    console.log('[Notification] Broadcast skipped — no recipients');
    return [];
  }

  const link = buildLink(relatedId);
  const relatedIdStr = relatedId ? String(relatedId) : '';

  const docs = uniqueIds.map((userId) => ({
    userId,
    type,
    title,
    message,
    relatedId: relatedIdStr,
    link,
    isRead: false,
  }));

  const created = await Notification.insertMany(docs);
  console.log(`[Notification] Broadcasted "${title}" to ${created.length} user(s)`);
  return created;
};

const getAdminAndOfficerIds = async (excludeUserId = null) => {
  const exclude = excludeUserId ? String(excludeUserId) : null;
  const staff = await User.find({
    role: { $in: ['admin', 'ict_officer'] },
    isActive: { $ne: false },
  }).select('_id');

  return staff
    .map((u) => u._id)
    .filter((id) => !exclude || String(id) !== exclude);
};

const getAdminAndOfficerUsers = async () => {
  return User.find({
    role: { $in: ['admin', 'ict_officer'] },
    isActive: { $ne: false },
  }).select('name email notificationPreferences role');
};

module.exports = {
  createNotification,
  broadcastNotification,
  getAdminAndOfficerIds,
  getAdminAndOfficerUsers,
};
