const KENYAN_PHONE_REGEX = /^\+254\d{9}$/;

let smsService = null;

const logSmsConfigStatus = () => {
  const hasKey = Boolean(process.env.AFRICAS_TALKING_API_KEY);
  const hasUsername = Boolean(process.env.AFRICAS_TALKING_USERNAME);
  const hasShortcode = Boolean(process.env.AFRICAS_TALKING_SHORTCODE);

  console.log(
    `[SMS] Config — username: ${hasUsername ? process.env.AFRICAS_TALKING_USERNAME : 'MISSING'}, ` +
      `apiKey: ${hasKey ? 'present' : 'MISSING'}, shortcode: ${hasShortcode ? process.env.AFRICAS_TALKING_SHORTCODE : 'MISSING'}`
  );

  if (process.env.AFRICAS_TALKING_USERNAME === 'sandbox') {
    console.warn('[SMS] Using sandbox username — SMS only delivers to verified sandbox test numbers.');
  }
};

const normalizeKenyanPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  const cleaned = phone.replace(/[\s\-()]/g, '');

  if (KENYAN_PHONE_REGEX.test(cleaned)) {
    return cleaned;
  }

  if (/^254\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  if (/^0\d{9}$/.test(cleaned)) {
    return `+254${cleaned.slice(1)}`;
  }

  if (/^\d{9}$/.test(cleaned)) {
    return `+254${cleaned}`;
  }

  return null;
};

const isValidKenyanPhone = (phone) => KENYAN_PHONE_REGEX.test(normalizeKenyanPhone(phone) || '');

const getSmsClient = () => {
  if (smsService) {
    return smsService;
  }

  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const username = process.env.AFRICAS_TALKING_USERNAME;

  if (!apiKey || !username) {
    console.error('[SMS] Missing AFRICAS_TALKING_API_KEY or AFRICAS_TALKING_USERNAME — SMS disabled');
    return null;
  }

  const AfricasTalking = require('africastalking')({
    apiKey,
    username,
  });

  smsService = AfricasTalking.SMS;
  logSmsConfigStatus();
  return smsService;
};

const sendSms = async (recipientPhone, message) => {
  const normalizedPhone = normalizeKenyanPhone(recipientPhone);

  if (!recipientPhone) {
    console.error('[SMS] Phone number is missing — cannot send SMS');
    return null;
  }

  if (!normalizedPhone || !isValidKenyanPhone(normalizedPhone)) {
    console.error('[SMS] Invalid phone format (expected +254XXXXXXXXX):', recipientPhone);
    return null;
  }

  const sms = getSmsClient();
  if (!sms) {
    console.error('[SMS] Africa\'s Talking client not configured — skipping send');
    return null;
  }

  const options = {
    to: [normalizedPhone],
    message,
  };

  const senderId = process.env.AFRICAS_TALKING_SHORTCODE;
  if (senderId) {
    options.senderId = senderId;
  }

  console.log('Attempting to send SMS to:', normalizedPhone);

  try {
    const response = await sms.send(options);
    console.log('SMS Response:', JSON.stringify(response));
    return response;
  } catch (error) {
    const apiMessage =
      typeof error.response?.data === 'string'
        ? error.response.data
        : error.response?.data?.SMSMessageData?.Message || error.message;

    console.error('SMS Error:', apiMessage);
    console.error('SMS Error details:', {
      status: error.response?.status,
      username: process.env.AFRICAS_TALKING_USERNAME,
      to: normalizedPhone,
    });

    if (error.response?.status === 401) {
      console.error(
        '[SMS] Authentication failed — verify AFRICAS_TALKING_USERNAME and AFRICAS_TALKING_API_KEY in server/.env match your Africa\'s Talking dashboard exactly.'
      );
    }

    throw error;
  }
};

const notifySMSApplicationSubmitted = async (jobTitle, recipientPhone) => {
  const message =
    `TUC Careers: Your application for "${jobTitle}" has been received successfully. ` +
    'We will contact you if you are shortlisted.';

  console.log('[SMS] notifySMSApplicationSubmitted:', {
    jobTitle,
    phone: recipientPhone || 'MISSING',
  });

  try {
    return await sendSms(recipientPhone, message);
  } catch (error) {
    // sendSms already logs a concise error — avoid dumping the full axios response
    return null;
  }
};

const notifySMSApplicationStatusChanged = async (jobTitle, status, recipientPhone) => {
  const statusMessages = {
    Shortlisted: `Great! Your application for ${jobTitle} has been shortlisted. Next steps coming soon.`,
    Selected: `Congratulations! You've been selected for the ${jobTitle} position. Interview details coming soon.`,
    Rejected: `Thank you for your interest in the ${jobTitle} position. We'll keep your profile for future opportunities.`,
  };

  const message = statusMessages[status];
  if (!message) {
    return null;
  }

  console.log('[SMS] notifySMSApplicationStatusChanged:', { jobTitle, status, phone: recipientPhone || 'MISSING' });

  try {
    return await sendSms(recipientPhone, message);
  } catch (error) {
    return null;
  }
};

const notifySMSJobPosted = async (jobTitle, applicationsLink, recipientPhone) => {
  const phone = recipientPhone || process.env.HR_SMS_PHONE;

  console.log("[SMS] notifySMSJobPosted called:", { jobTitle, phone: phone || "MISSING" });

  if (!phone) {
    console.warn("[SMS] HR phone not configured — skipping job posted SMS");
    return null;
  }

  const link = applicationsLink || `${process.env.CLIENT_URL || 'http://localhost:5173'}/recruitment/browse`;
  const message =
    `TUC Careers: New job posted — "${jobTitle}". Browse openings: ${link}`;

  try {
    return await sendSms(phone, message);
  } catch (error) {
    return null;
  }
};

const testSmsConnection = async (recipientPhone) => {
  console.log('[SMS] Running Africa\'s Talking connection test...');

  try {
    const response = await sendSms(
      recipientPhone,
      'TUC Careers Portal SMS test — if you received this, Africa\'s Talking is connected.'
    );
    console.log('[SMS] Connection test completed');
    return response;
  } catch (error) {
    console.error('[SMS] Connection test failed:', error);
    throw error;
  }
};

logSmsConfigStatus();

module.exports = {
  normalizeKenyanPhone,
  isValidKenyanPhone,
  sendSms,
  notifySMSApplicationSubmitted,
  notifySMSApplicationStatusChanged,
  notifySMSJobPosted,
  testSmsConnection,
};
