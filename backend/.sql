CREATE TABLE IF NOT EXISTS job_tests (
    id SERIAL PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE UNIQUE,
    questions JSONB NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT NOW()
);