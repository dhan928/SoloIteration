CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inference_records (
    record_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('single', 'compare')),
    prompt TEXT NOT NULL,
    selected_models TEXT NOT NULL DEFAULT '[]',
    results TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_inference_records_user ON inference_records(user_id);
CREATE INDEX IF NOT EXISTS idx_inference_records_mode ON inference_records(mode);
CREATE INDEX IF NOT EXISTS idx_inference_records_created_at ON inference_records(created_at DESC);
