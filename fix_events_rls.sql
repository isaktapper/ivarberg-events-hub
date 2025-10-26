-- Fix RLS policies for events table to allow user submissions

-- Enable RLS on events table (if not already enabled)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read published events" ON events;
DROP POLICY IF EXISTS "Anyone can create events" ON events;
DROP POLICY IF EXISTS "Anyone can update events" ON events;

-- Policy for reading published events (public access)
CREATE POLICY "Anyone can read published events" ON events
  FOR SELECT USING (status = 'published');

-- Policy for creating events (allow user submissions)
CREATE POLICY "Anyone can create events" ON events
  FOR INSERT WITH CHECK (true);

-- Policy for updating events (restrict to admins later)
-- For now, allow updates to draft events (user-submitted events)
CREATE POLICY "Anyone can update draft events" ON events
  FOR UPDATE USING (status = 'draft');

-- Optional: Policy for admins to update any events
-- CREATE POLICY "Admins can update any events" ON events
--   FOR UPDATE USING (auth.role() = 'admin');

-- Grant necessary permissions
GRANT SELECT ON events TO anon;
GRANT INSERT ON events TO anon;
GRANT UPDATE ON events TO anon;
GRANT USAGE ON SEQUENCE events_id_seq TO anon;
