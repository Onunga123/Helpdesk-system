const nodemailer = require('nodemailer');

let transporter;
let configChecked = false;

const getEmailConfig = () => ({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === 'true',
  user: process.env.EMAIL_USER || process.env.EMAIL_FROM_ADDRESS,
  pass: process.env.EMAIL_PASSWORD || process.env.BREVO_SMTP_KEY,
  fromName: process.env.EMAIL_FROM_NAME || 'TUC ICT Help Desk',
  fromAddress: process.env.EMAIL_FROM_ADDRESS,
});

const isEmailConfigured = () => {
  const { fromAddress, pass } = getEmailConfig();
  return Boolean(fromAddress && pass);
};

const logEmailConfigStatus = () => {
  if (configChecked) return;
  configChecked = true;

  if (!isEmailConfigured()) {
    console.warn(
      '[Email] SMTP is not fully configured. Set EMAIL_FROM_ADDRESS and BREVO_SMTP_KEY (or EMAIL_PASSWORD). Emails will be skipped.'
    );
    return;
  }

  const { host, port, fromName, fromAddress } = getEmailConfig();
  console.log(`[Email] SMTP ready via ${host}:${port} as "${fromName}" <${fromAddress}>`);
};

const getTransporter = () => {
  if (transporter) return transporter;

  const { host, port, secure, user, pass } = getEmailConfig();
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
};

const sanitizeRecipient = (to) => {
  if (!to || typeof to !== 'string') return null;
  const trimmed = to.trim();
  if (!trimmed || /[\r\n]/.test(trimmed)) return null;
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) return null;
  return trimmed;
};

const sanitizeSubject = (subject) => {
  if (!subject || typeof subject !== 'string') return 'TUC ICT Help Desk Notification';
  return subject.replace(/[\r\n]/g, ' ').trim().slice(0, 200);
};

/**
 * Send an email. Never throws — returns { success, messageId? | error? }.
 * Skips silently (with log) when SMTP is not configured.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  logEmailConfigStatus();

  const recipient = sanitizeRecipient(to);
  if (!recipient) {
    console.error('[Email] Invalid or missing recipient address.');
    return { success: false, error: 'Invalid recipient' };
  }

  if (!isEmailConfigured()) {
    console.warn(`[Email] Skipped (not configured): ${sanitizeSubject(subject)} -> ${recipient}`);
    return { success: false, error: 'Email not configured' };
  }

  const { fromName, fromAddress } = getEmailConfig();

  try {
    const info = await getTransporter().sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: recipient,
      subject: sanitizeSubject(subject),
      html,
      text: text || undefined,
    });
    console.log(`[Email] Sent to ${recipient}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] Failed to ${recipient}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
module.exports.isEmailConfigured = isEmailConfigured;
module.exports.logEmailConfigStatus = logEmailConfigStatus;
