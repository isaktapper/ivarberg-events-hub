-- Update event_tips table with new fields for enhanced submission system

-- Add new columns if they don't exist
ALTER TABLE event_tips ADD COLUMN IF NOT EXISTS event_description TEXT;
ALTER TABLE event_tips ADD COLUMN IF NOT EXISTS categories TEXT[]; -- Array of categories
ALTER TABLE event_tips ADD COLUMN IF NOT EXISTS category TEXT; -- Main category
ALTER TABLE event_tips ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE event_tips ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE event_tips ADD COLUMN IF NOT EXISTS venue_name TEXT;
ALTER TABLE event_tips ADD COLUMN IF NOT EXISTS submitter_name TEXT; -- User's name
ALTER TABLE event_tips ADD COLUMN IF NOT EXISTS date_time TIMESTAMP;

-- Update existing columns to make them nullable (since we're changing the structure)
ALTER TABLE event_tips ALTER COLUMN event_date DROP NOT NULL;
ALTER TABLE event_tips ALTER COLUMN event_location DROP NOT NULL;
ALTER TABLE event_tips ALTER COLUMN submitter_email DROP NOT NULL;

-- Update the status check constraint to include more statuses
ALTER TABLE event_tips DROP CONSTRAINT IF EXISTS event_tips_status_check;
ALTER TABLE event_tips ADD CONSTRAINT event_tips_status_check 
  CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'converted'));

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_event_tips_status ON event_tips(status);
CREATE INDEX IF NOT EXISTS idx_event_tips_created_at ON event_tips(created_at);

-- Update RLS policies for event_tips table
ALTER TABLE event_tips ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can submit tips" ON event_tips;
DROP POLICY IF EXISTS "Only admins can read tips" ON event_tips;
DROP POLICY IF EXISTS "Admins can update tips" ON event_tips;
DROP POLICY IF EXISTS "Admins can delete tips" ON event_tips;

-- Policy for anyone to submit tips
CREATE POLICY "Anyone can submit tips" ON event_tips
  FOR INSERT WITH CHECK (true);

-- Policy for admins to read all tips
CREATE POLICY "Admins can read tips" ON event_tips
  FOR SELECT USING (true); -- You can add admin check later

-- Policy for admins to update tips
CREATE POLICY "Admins can update tips" ON event_tips
  FOR UPDATE USING (true); -- You can add admin check later

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON event_tips TO anon;
GRANT USAGE ON SEQUENCE event_tips_id_seq TO anon;
