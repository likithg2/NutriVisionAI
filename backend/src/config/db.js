import fs from 'fs';
import './env.js';
import { Sequelize } from 'sequelize';

const dbUrl = process.env.DATABASE_URL;

const isProduction = process.env.NODE_ENV === 'production';
const requiresSsl = process.env.DB_SSL === 'false' ? false : (isProduction || Boolean(dbUrl && (
  dbUrl.includes('sslmode=require') || 
  dbUrl.includes('supabase') || 
  dbUrl.includes('render') || 
  dbUrl.includes('neon') ||
  process.env.DB_SSL === 'true'
)));

let caCert = null;
if (process.env.DB_CA_CERT_PATH) {
  try {
    if (fs.existsSync(process.env.DB_CA_CERT_PATH)) {
      caCert = fs.readFileSync(process.env.DB_CA_CERT_PATH, 'utf-8');
    } else {
      console.warn(`[DB SSL] CA certificate path in DB_CA_CERT_PATH was not found: ${process.env.DB_CA_CERT_PATH}`);
    }
  } catch (err) {
    console.warn(`[DB SSL] Failed to read CA certificate from DB_CA_CERT_PATH:`, err?.message || err);
  }
}

const dialectOptions = requiresSsl ? {
  ssl: caCert ? {
    require: true,
    rejectUnauthorized: true,
    ca: caCert
  } : {
    require: true,
    rejectUnauthorized: false // Standard for managed cloud PostgreSQL providers (Supabase, Render, Neon) without custom CA
  }
} : {};

// Fallback to placeholder if DATABASE_URL is not set at module load time.
// This prevents unhandled TypeError crashes on startup and lets connectDB() produce a clear error message.
export const sequelize = new Sequelize(dbUrl || 'postgres://localhost:5432/nutrivision_placeholder', {
  dialect: 'postgres',
  logging: false,
  dialectOptions,
});

// Ensure our explicit SSL configuration (including rejectUnauthorized and optional CA bundle)
// is preserved and not overwritten if the connection URI includes query parameters like ?sslmode=require
if (requiresSsl && sequelize.config?.dialectOptions) {
  sequelize.config.dialectOptions.ssl = dialectOptions.ssl;
}

export async function connectDB() {
  if (!process.env.DATABASE_URL) {
    const errorMsg = 'DATABASE_URL environment variable is missing. Please configure it in your .env or host environment settings.';
    console.error('\x1b[31m%s\x1b[0m', errorMsg);
    throw new Error(errorMsg);
  }

  try {
    await sequelize.authenticate();
    console.log('\x1b[32m%s\x1b[0m', 'PostgreSQL connected successfully');
    
    // Development: { force: false, alter: true }
    // Production:  { force: false } (never alters or drops existing production tables/columns)
    const syncOptions = isProduction ? { force: false } : { force: false, alter: true };
    await sequelize.sync(syncOptions);
    console.log('\x1b[32m%s\x1b[0m', `PostgreSQL models synced successfully (mode: ${isProduction ? 'production [non-destructive]' : 'development [alter]'})`);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'PostgreSQL connection error:', error.message || error);
    throw error; // rethrow so server startup aborts if DB is unreachable
  }
}
