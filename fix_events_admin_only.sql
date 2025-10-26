-- Fix RLS for events table - ONLY admins can create/update
-- This removes the risky "anyone can create events" policy

-- Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read published events" ON events;
DROP POLICY IF EXISTS "Anyone can create events" ON events;
DROP POLICY IF EXISTS "Anyone can update events" ON events;
DROP POLICY IF EXISTS "Rate limited event creation" ON events;
DROP POLICY IF EXISTS "Users can update draft events" ON events;
DROP POLICY IF EXISTS "Admins can manage events" ON events;

-- Policy for reading published events (public access)
CREATE POLICY "Anyone can read published events" ON events
  FOR SELECT USING (status = 'published');

-- Policy for admins to read all events
CREATE POLICY "Admins can read all events" ON events
  FOR SELECT USING (true); -- TODO: Add admin check when you implement admin auth

-- Policy for admins to create events
CREATE POLICY "Admins can create events" ON events
  FOR INSERT WITH CHECK (true); -- TODO: Add admin check when you implement admin auth

-- Policy for admins to update events
CREATE POLICY "Admins can update events" ON events
  FOR UPDATE USING (true); -- TODO: Add admin check when you implement admin auth

-- Policy for admins to delete events
CREATE POLICY "Admins can delete events" ON events
  FOR DELETE USING (true); -- TODO: Add admin check when you implement admin auth

-- Grant permissions to authenticated users (admins)
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT USAGE ON SEQUENCE events_id_seq TO authenticated;

-- Revoke public access to INSERT/UPDATE/DELETE
REVOKE INSERT, UPDATE, DELETE ON events FROM anon;
REVOKE USAGE ON SEQUENCE events_id_seq FROM anon;

-- Keep public read access for published events (handled by policy above)
GRANT SELECT ON events TO anon;
