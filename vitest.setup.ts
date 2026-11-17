// Provide minimal environment variables required by modules under test.
// These are dummy values used only for testing — not real credentials.
process.env.COOKIE_SECRET = 'test-cookie-secret-at-least-32-chars-long';
process.env.ADMIN_EMAIL = 'admin@test.example.com';
process.env.ADMIN_PASSWORD_HASH = 'dummy-hash';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
