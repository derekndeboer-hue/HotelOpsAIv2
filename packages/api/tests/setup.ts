// Set required env vars before any module is loaded in tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/hotel_ops_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret';
process.env.NODE_ENV = 'test';
