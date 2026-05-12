-- Re-create missing/moved migrations for the hiring platform.
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS job_tests (
    id SERIAL PRIMARY KEY,
    job_id UUID UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
    questions JSONB NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    deadline_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Candidate test sessions
CREATE TABLE IF NOT EXISTS test_sessions (
    id SERIAL PRIMARY KEY,
    application_id UUID UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
    questions JSONB NOT NULL,
    duration_minutes INTEGER NOT NULL,
    expires_at TIMESTAMP,
    status TEXT DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT NOW(),
    submitted_at TIMESTAMP,

    mcq_answers JSONB,
    coding_answers JSONB,
    coding_language TEXT,

    coding_test_results JSONB,
    mcq_score INTEGER,
    coding_score INTEGER,
    total_score INTEGER,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Proctoring sessions
CREATE TABLE IF NOT EXISTS proctoring_sessions (
    application_id UUID PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
    tab_switches INTEGER DEFAULT 0,
    window_switches INTEGER DEFAULT 0,
    face_away_count INTEGER DEFAULT 0,
    multiple_faces_count INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT false,
    flag_reasons JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Proctoring events
CREATE TABLE IF NOT EXISTS proctor_events (
    id SERIAL PRIMARY KEY,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    detail JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_test_sessions_application_id ON test_sessions(application_id);
CREATE INDEX IF NOT EXISTS idx_job_tests_job_id ON job_tests(job_id);

-- Patch jobs table if deadline column is missing is out of scope.
-- We store deadline per job test in job_tests.deadline_at.

