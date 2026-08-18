-- PostgreSQL initialization script
-- This runs once when the container is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_crypto for password hashing helpers (optional)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- The main schema is handled by Prisma migrations
-- This file just ensures extensions are available
