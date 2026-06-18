/**
 * Setup file for integration tests
 * Ejecuta antes de todos los tests
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootEnvPath = resolve(__dirname, '../.env');
const testEnvPath = resolve(__dirname, '../.env.test');
const defaultEnv = {
  NODE_ENV: 'test',
  JWT_EXPIRATION: '24h',
  JWT_SECRET: 'test-secret-key',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'konekt_pn_test',
};

function parseEnvFile(path: string) {
  const content = readFileSync(path, 'utf8');
  return content.split(/\r?\n/).reduce<Record<string, string>>((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return acc;
    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
    acc[key] = value;
    return acc;
  }, {});
}

const envFilePath = existsSync(testEnvPath) ? testEnvPath : existsSync(rootEnvPath) ? rootEnvPath : undefined;
const envValues = envFilePath ? parseEnvFile(envFilePath) : {};

for (const [key, value] of Object.entries({ ...defaultEnv, ...envValues })) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

// Aumentar timeout para tests de integración
jest.setTimeout(30000);

// Silenciar logs en tests (almacenar referencias originales para restaurar)
const originalLog = console.log;
const originalDebug = console.debug;
const originalInfo = console.info;

beforeAll(() => {
  global.console.log = jest.fn();
  global.console.debug = jest.fn();
  global.console.info = jest.fn();
});

// Restaurar logs después de tests
afterAll(() => {
  global.console.log = originalLog;
  global.console.debug = originalDebug;
  global.console.info = originalInfo;
});
