// Set minimum required env vars for unit tests (no real DB/Redis needed)
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_that_is_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_that_is_at_least_32_chars_long';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.KAFKA_BROKERS = 'localhost:9092';
