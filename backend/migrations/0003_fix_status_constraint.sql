-- Fix applications status check constraint to include interview statuses
-- Safe to re-run

ALTER TABLE applications 
DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications 
ADD CONSTRAINT applications_status_check 
CHECK (status = ANY (ARRAY[
  'applied',
  'resume_reviewed', 
  'shortlisted',
  'rejected',
  'test_invited',
  'test_in_progress',
  'test_completed',
  'interview_scheduled',
  'interview_completed',
  'hired'
]));
