import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
  });
}

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Unit tests never use a real Prisma client. Test files that need one replace this mock,
// including the PostgreSQL integration suite.
jest.mock('@/lib/prisma-rewrite', () => ({ __esModule: true, default: {} }));
