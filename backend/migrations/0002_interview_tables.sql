-- Interview infrastructure migration
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

CREATE TABLE IF NOT EXISTS interviewers (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_slots (
    id               SERIAL PRIMARY KEY,
    job_id           UUID REFERENCES jobs(id) ON DELETE CASCADE,
    interviewer_id   INTEGER REFERENCES interviewers(id) ON DELETE CASCADE,
    scheduled_at     TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 45,
    is_booked        BOOLEAN DEFAULT false,
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_sessions (
    id                  SERIAL PRIMARY KEY,
    application_id      UUID REFERENCES applications(id) ON DELETE CASCADE,
    slot_id             INTEGER REFERENCES interview_slots(id) ON DELETE CASCADE,
    interviewer_id      INTEGER REFERENCES interviewers(id) ON DELETE CASCADE,
    status              TEXT DEFAULT 'scheduled', -- scheduled | in_progress | completed
    started_at          TIMESTAMP,
    ended_at            TIMESTAMP,
    interviewer_score   INTEGER,
    interviewer_feedback TEXT,
    ai_notes            TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Add interview_score column to applications if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='applications' AND column_name='interview_score'
    ) THEN
        ALTER TABLE applications ADD COLUMN interview_score INTEGER;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='applications' AND column_name='test_score'
    ) THEN
        ALTER TABLE applications ADD COLUMN test_score INTEGER;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='applications' AND column_name='final_score'
    ) THEN
        ALTER TABLE applications ADD COLUMN final_score INTEGER;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_interview_slots_job_id      ON interview_slots(job_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_app_id   ON interview_sessions(application_id);
CREATE INDEX IF NOT EXISTS idx_interviewers_company_id     ON interviewers(company_id);
