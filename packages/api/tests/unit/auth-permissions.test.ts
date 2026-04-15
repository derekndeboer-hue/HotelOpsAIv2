import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requirePermission, requireRole, roleHasPermission } from '../../src/middleware/auth';

function fakeReq(role?: string): Request {
  return { user: role ? { id: 'u1', tenantId: 't1', hotelId: 'h1', role, name: 'X', email: 'x@y' } : undefined } as unknown as Request;
}

function fakeRes() {
  const res: Partial<Response> & { _status?: number; _body?: unknown } = {};
  res.status = vi.fn(function (this: Response, code: number) {
    (res as { _status: number })._status = code;
    return this;
  }) as unknown as Response['status'];
  res.json = vi.fn(function (this: Response, body: unknown) {
    (res as { _body: unknown })._body = body;
    return this;
  }) as unknown as Response['json'];
  return res as Response & { _status?: number; _body?: unknown };
}

describe('roleHasPermission', () => {
  it('grants management the work_orders.assign permission', () => {
    expect(roleHasPermission('management', 'work_orders.assign')).toBe(true);
  });

  it('denies front_desk the work_orders.assign permission', () => {
    expect(roleHasPermission('front_desk', 'work_orders.assign')).toBe(false);
  });

  it('returns false for unknown roles', () => {
    expect(roleHasPermission('nonexistent', 'rooms.status.view')).toBe(false);
  });
});

describe('requirePermission middleware', () => {
  it('rejects unauthenticated requests with 401', () => {
    const req = fakeReq();
    const res = fakeRes();
    const next = vi.fn() as unknown as NextFunction;

    requirePermission('rooms.status.view')(req, res, next);

    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects authenticated users without the permission with 403', () => {
    const req = fakeReq('housekeeper');
    const res = fakeRes();
    const next = vi.fn() as unknown as NextFunction;

    requirePermission('reports.export')(req, res, next);

    expect(res._status).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows authenticated users that hold the permission', () => {
    const req = fakeReq('admin');
    const res = fakeRes();
    const next = vi.fn() as unknown as NextFunction;

    requirePermission('reports.export')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res._status).toBeUndefined();
  });

  it('requires every listed permission to be granted', () => {
    const req = fakeReq('management');
    const res = fakeRes();
    const next = vi.fn() as unknown as NextFunction;

    requirePermission('rooms.status.view', 'work_orders.assign')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});

describe('requireRole middleware', () => {
  it('still works as a thin role allowlist', () => {
    const req = fakeReq('engineer');
    const res = fakeRes();
    const next = vi.fn() as unknown as NextFunction;

    requireRole('engineer', 'maint_supervisor')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
