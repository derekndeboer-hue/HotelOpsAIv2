import { AsyncLocalStorage } from 'async_hooks';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from './env';

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

interface RequestContext {
  tenantId: string | null;
}

const requestContext = new AsyncLocalStorage<RequestContext>();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(value: string, label: string): void {
  if (!UUID_RE.test(value)) {
    throw new Error(`Invalid UUID for ${label}`);
  }
}

/**
 * Run a function with a tenant bound to the async context.
 * Every query() executed inside the callback automatically applies the tenant
 * via set_config so RLS policies fire.
 */
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  assertUuid(tenantId, 'tenantId');
  return requestContext.run({ tenantId }, fn);
}

export function getCurrentTenantId(): string | null {
  return requestContext.getStore()?.tenantId ?? null;
}

async function applyTenantContext(client: PoolClient, tenantId: string | null): Promise<void> {
  if (!tenantId) return;
  await client.query('SELECT set_tenant_context($1::uuid)', [tenantId]);
}

/**
 * Execute a parameterized query. Tenant context is taken from the explicit
 * argument first, then from AsyncLocalStorage. RLS is enforced when either
 * is present; queries running outside any tenant context (e.g. login lookup)
 * skip set_config entirely.
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[],
  tenantId?: string
): Promise<QueryResult<T>> {
  const effectiveTenant = tenantId ?? getCurrentTenantId();
  if (tenantId) assertUuid(tenantId, 'tenantId');

  const client = await pool.connect();
  try {
    if (effectiveTenant) {
      await client.query('BEGIN');
      await applyTenantContext(client, effectiveTenant);
      const result = await client.query<T>(text, params);
      await client.query('COMMIT');
      return result;
    }
    return await client.query<T>(text, params);
  } catch (err) {
    if (effectiveTenant) {
      try { await client.query('ROLLBACK'); } catch { /* ignore */ }
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Borrow a raw client. Caller is responsible for releasing it and for
 * setting tenant context if needed. Prefer query() or withTransaction().
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Run a function inside a transaction with tenant context applied.
 * Tenant resolves from the explicit argument first, then AsyncLocalStorage.
 */
export async function withTransaction<T>(
  tenantIdOrFn: string | ((client: PoolClient) => Promise<T>),
  maybeFn?: (client: PoolClient) => Promise<T>
): Promise<T> {
  const explicitTenant = typeof tenantIdOrFn === 'string' ? tenantIdOrFn : undefined;
  const fn = (typeof tenantIdOrFn === 'function' ? tenantIdOrFn : maybeFn)!;
  const tenantId = explicitTenant ?? getCurrentTenantId();
  if (explicitTenant) assertUuid(explicitTenant, 'tenantId');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await applyTenantContext(client, tenantId);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* ignore */ }
    throw err;
  } finally {
    client.release();
  }
}

export { pool };
