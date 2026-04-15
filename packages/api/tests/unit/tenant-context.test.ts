import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/config/env', () => ({
  config: {
    DATABASE_URL: 'postgres://localhost/test',
    JWT_SECRET: 'test',
    JWT_REFRESH_SECRET: 'test',
    GCP_PROJECT_ID: '',
    PORT: 8080,
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:3000',
  },
}));

vi.mock('pg', () => {
  class FakePool {
    on() { return this; }
    connect() {
      return Promise.resolve({
        query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: vi.fn(),
      });
    }
  }
  return { Pool: FakePool };
});

import { runWithTenant, getCurrentTenantId } from '../../src/config/database';

const VALID_TENANT = '11111111-2222-3333-4444-555555555555';

describe('AsyncLocalStorage tenant context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no tenant is bound', () => {
    expect(getCurrentTenantId()).toBeNull();
  });

  it('exposes the bound tenant inside runWithTenant', () => {
    runWithTenant(VALID_TENANT, () => {
      expect(getCurrentTenantId()).toBe(VALID_TENANT);
    });
  });

  it('persists the tenant across awaits', async () => {
    await new Promise<void>((resolve) => {
      runWithTenant(VALID_TENANT, () => {
        Promise.resolve()
          .then(() => Promise.resolve())
          .then(() => {
            expect(getCurrentTenantId()).toBe(VALID_TENANT);
            resolve();
          });
      });
    });
  });

  it('isolates tenant scopes between concurrent runs', async () => {
    const tenantA = '11111111-1111-1111-1111-111111111111';
    const tenantB = '22222222-2222-2222-2222-222222222222';

    await Promise.all([
      new Promise<void>((resolve) =>
        runWithTenant(tenantA, () => {
          setTimeout(() => {
            expect(getCurrentTenantId()).toBe(tenantA);
            resolve();
          }, 10);
        })
      ),
      new Promise<void>((resolve) =>
        runWithTenant(tenantB, () => {
          setTimeout(() => {
            expect(getCurrentTenantId()).toBe(tenantB);
            resolve();
          }, 5);
        })
      ),
    ]);
  });

  it('rejects non-UUID tenant identifiers', () => {
    expect(() => runWithTenant('not-a-uuid', () => undefined)).toThrow(/Invalid UUID/);
  });
});
