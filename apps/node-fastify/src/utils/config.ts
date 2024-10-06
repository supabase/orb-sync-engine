import dotenv from 'dotenv';
import assert from 'assert';

type configType = {
  /** Optional, API key to authorize requests against the sync endpoints */
  API_KEY_SYNC?: string;

  /** Port number the API is running on, defaults to 8080 */
  PORT: number;

  /** Postgres database URL including auth and search path */
  DATABASE_URL: string;

  /** Secret to validate signatures of Orb webhooks */
  ORB_WEBHOOK_SECRET: string;

  /** Defaults to Orb */
  DATABASE_SCHEMA: string;

  /** Access the Orb API */
  ORB_API_KEY?: string;

  /** Whether to verify the Orb webhook signature */
  VERIFY_WEBHOOK_SIGNATURE: boolean;
};

function getConfigFromEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  return value || defaultValue!;
}

let config: configType;

export function getConfig(): configType {
  if (config) return config;

  dotenv.config();

  config = {
    API_KEY_SYNC: getConfigFromEnv('API_KEY_SYNC'),
    ORB_API_KEY: getConfigFromEnv('ORB_API_KEY'),
    DATABASE_SCHEMA: getConfigFromEnv('DATABASE_SCHEMA', 'orb'),
    DATABASE_URL: getConfigFromEnv('DATABASE_URL'),
    ORB_WEBHOOK_SECRET: getConfigFromEnv('ORB_WEBHOOK_SECRET'),
    PORT: Number(getConfigFromEnv('PORT', '8080')),
    VERIFY_WEBHOOK_SIGNATURE: getConfigFromEnv('VERIFY_WEBHOOK_SIGNATURE', 'true') === 'true',
  };

  assert(!Number.isNaN(config.PORT), 'PORT must be a number');
  assert(config.DATABASE_URL, 'DATABASE_URL is required');
  assert(config.ORB_WEBHOOK_SECRET, 'ORB_WEBHOOK_SECRET is required');

  return config;
}
