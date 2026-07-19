const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const loadEnv = () => {
  const candidates = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
  ];

  let loadedAny = false;
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: loadedAny });
      console.log('[Env] Loaded:', envPath);
      loadedAny = true;
    }
  }

  if (!loadedAny) {
    console.warn('[Env] No .env file found. Checked:', candidates.join(', '));
  }

  const emailKeys = ['EMAIL_FROM_ADDRESS', 'BREVO_SMTP_KEY', 'EMAIL_FROM_NAME'];
  const present = emailKeys.filter((k) => Boolean(process.env[k]));
  console.log(`[Env] Email vars present: ${present.join(', ') || 'NONE'}`);
};

module.exports = loadEnv;
