-- Very basic class-friendly database design
-- Keeps the project easy to explain in the report.
-- One table stores users.
-- One table stores every prompt/response record, including multi-model comparisons.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inference_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('single', 'compare')),
    prompt TEXT NOT NULL,
    selected_models JSONB NOT NULL DEFAULT '[]'::jsonb,
    results JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email_basic ON users(email);
CREATE INDEX IF NOT EXISTS idx_inference_records_user ON inference_records(user_id);
CREATE INDEX IF NOT EXISTS idx_inference_records_created ON inference_records(created_at DESC);
