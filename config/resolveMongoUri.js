const fs = require('fs');

const LOCAL_MONGO = /^mongodb:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i;

function stripQuotes(value) {
  const v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1);
  }
  return v;
}

/**
 * Reads server/.env and returns the best MONGO_URI when the file repeats keys
 * (dotenv keeps the *last* value, which often leaves localhost if it appears twice).
 * Prefers mongodb+srv (Atlas), then remote mongodb://, then last declared value.
 */
function pickMongoUriFromEnvFile(envFilePath) {
  if (!fs.existsSync(envFilePath)) {
    return null;
  }

  const text = fs.readFileSync(envFilePath, 'utf8');
  const values = [];

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^MONGO_URI\s*=\s*(.*)$/);
    if (!match) continue;

    const raw = stripQuotes(match[1]);
    if (raw) values.push(raw);
  }

  if (!values.length) return null;

  const srv = values.filter((u) => u.startsWith('mongodb+srv://'));
  if (srv.length) return srv[srv.length - 1];

  const remoteStandard = values.filter(
    (u) => u.startsWith('mongodb://') && !LOCAL_MONGO.test(u)
  );
  if (remoteStandard.length) return remoteStandard[remoteStandard.length - 1];

  return values[values.length - 1];
}

module.exports = pickMongoUriFromEnvFile;
