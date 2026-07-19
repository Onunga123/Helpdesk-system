const nodemailer = require('nodemailer');

let transporter;
let configChecked = false;

const getEmailConfig = () => ({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === 'true',
  user: process.env.EMAIL_USER || process.env.BREVO_SMTP_LOGIN || process.env.EMAIL_FROM_ADDRESS,
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
    console.warn('[Email] Current values:', {
      EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS ? '(set)' : '(missing)',
      BREVO_SMTP_KEY: process.env.BREVO_SMTP_KEY ? '(set)' : '(missing)',
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '(set)' : '(missing)',
    });
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

const verifyEmailTransport = async () => {
  if (!isEmailConfigured()) return false;

  try {
    await getTransporter().verify();
    console.log('[Email] transporter.verify() succeeded — SMTP connection OK');
    return true;
  } catch (error) {
    console.error('[Email] transporter.verify() FAILED:', error.message);
    return false;
  }
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

const sendEmail = async ({ to, subject, html, text }) => {
  console.log('[Email] sendEmail called with to:', to, 'subject:', subject);
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
    console.log('[Email] Calling transporter.sendMail()...');
    const info = await getTransporter().sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: recipient,
      subject: sanitizeSubject(subject),
      html,
      text: text || undefined,
    });
    console.log(`[Email] sendMail() success — sent to ${recipient}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] sendMail() FAILED to ${recipient}:`, error.message);
    if (error.response) console.error('[Email] SMTP response:', error.response);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
module.exports.isEmailConfigured = isEmailConfigured;
module.exports.logEmailConfigStatus = logEmailConfigStatus;
module.exports.verifyEmailTransport = verifyEmailTransport;
