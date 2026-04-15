import dotenv from 'dotenv';
import path from 'path';

// Load .env from packages/api/.env (works whether cwd is root or packages/api)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // Also check cwd

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || '',
  PORT: parseInt(process.env.PORT || '8080', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  DEFAULT_TENANT_SUBDOMAIN: process.env.DEFAULT_TENANT_SUBDOMAIN || 'gardens',
  REQUIRE_TENANT_SUBDOMAIN: process.env.REQUIRE_TENANT_SUBDOMAIN === 'true',
};
