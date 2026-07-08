import API_URL from '../config/api';

export const resolveMediaUrl = (path) => {
  if (!path || typeof path !== 'string') return null;

  const trimmed = path.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const base = String(API_URL || '').replace(/\/$/, '');
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${normalizedPath}`;
};

export const getAttachmentPath = (attachment) => {
  if (!attachment) return '';
  return attachment.path || attachment.filePath || attachment.fileUrl || '';
};

export const getAttachmentName = (attachment) => {
  if (!attachment) return 'Attachment';
  return attachment.filename || attachment.fileName || attachment.originalName || 'Attachment';
};

export const isImageAttachment = (fileName = '') => {
  const ext = (String(fileName).split('.').pop() || '').toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
};
