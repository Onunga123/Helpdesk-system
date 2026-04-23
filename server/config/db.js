const path = require('path');
const mongoose = require('mongoose');
const pickMongoUriFromEnvFile = require('./resolveMongoUri');

function mongoTargetLabel(uri) {
  try {
    if (uri.startsWith('mongodb+srv://')) {
      const afterScheme = uri.slice('mongodb+srv://'.length);
      const host = afterScheme.split('/')[0].split('@').pop();
      return `Atlas SRV → ${host}`;
    }
    const normalized = uri.replace(/^mongodb:\/\//, 'http://');
    const u = new URL(normalized);
    return `host ${u.hostname}:${u.port || '27017'}`;
  } catch {
    return '(unparsed URI)';
  }
}

const connectDB = async () => {
  const envPath = path.join(__dirname, '..', '.env');
  const uriFromFile = pickMongoUriFromEnvFile(envPath);
  const uri = (uriFromFile || process.env.MONGO_URI || '').trim();

  if (!uri) {
    throw new Error(
      'MONGO_URI is not set. Add your Atlas connection string to server/.env (see Atlas → Connect → Drivers).'
    );
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error(
      'MONGO_URI must be a MongoDB URI (mongodb:// or mongodb+srv://). For Atlas, use the SRV string from the Atlas UI.'
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    if (
      uriFromFile &&
      process.env.MONGO_URI &&
      process.env.MONGO_URI.trim() !== uri
    ) {
      console.warn(
        'MongoDB: MONGO_URI in server/.env had duplicate keys; using Atlas/remote URI from file instead of the last dotenv value.'
      );
    }
    console.log(`MongoDB: connecting to ${mongoTargetLabel(uri)}`);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
      console.error(
        'Tip: MONGO_URI points at localhost. Use your Atlas mongodb+srv:// string in server/.env (single MONGO_URI line). If it already is Atlas here but you still see this, save .env and ensure no other code overwrites process.env.MONGO_URI before connect.'
      );
    } else {
      console.error(
        'Atlas checklist: cluster running, database user/password correct (URL-encode special chars in password), Network Access allows your IP (or 0.0.0.0/0 for dev).'
      );
    }
    throw error;
  }
};

module.exports = connectDB;
