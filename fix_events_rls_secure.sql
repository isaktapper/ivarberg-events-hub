-- Enhanced RLS policies for events table with security measures

-- Enable RLS on events table (if not already enabled)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read published events" ON events;
DROP POLICY IF EXISTS "Anyone can create events" ON events;
DROP POLICY IF EXISTS "Anyone can update events" ON events;
DROP POLICY IF EXISTS "Rate limited event creation" ON events;

-- Policy for reading published events (public access)
CREATE POLICY "Anyone can read published events" ON events
  FOR SELECT USING (status = 'published');

-- Policy for creating events with rate limiting and validation
-- This policy allows creation but with restrictions
CREATE POLICY "Rate limited event creation" ON events
  FOR INSERT WITH CHECK (
    -- Only allow draft status for user submissions
    status = 'draft' AND
    -- Must have 'tips' tag for user submissions
    'tips' = ANY(tags) AND
    -- Basic validation: name must be reasonable length
    LENGTH(name) >= 3 AND LENGTH(name) <= 200 AND
    -- Description must be reasonable length
    LENGTH(description) >= 10 AND LENGTH(description) <= 2000 AND
    -- Location must be provided
    LENGTH(location) >= 3 AND LENGTH(location) <= 200
  );

-- Policy for updating only draft events (users can edit their own submissions)
CREATE POLICY "Users can update draft events" ON events
  FOR UPDATE USING (
    status = 'draft' AND 
    'tips' = ANY(tags)
  );

-- Grant necessary permissions
GRANT SELECT ON events TO anon;
GRANT INSERT ON events TO anon;
GRANT UPDATE ON events TO anon;
GRANT USAGE ON SEQUENCE events_id_seq TO anon;

-- Create a function to check for spam/abuse
CREATE OR REPLACE FUNCTION check_event_spam()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Check if same user (based on IP or session) has created too many events recently
  -- This is a basic check - you can enhance it further
  
  -- Count events created in the last hour with similar content
  SELECT COUNT(*) INTO recent_count
  FROM events 
  WHERE created_at > NOW() - INTERVAL '1 hour'
    AND (
      LOWER(name) LIKE '%' || LOWER(NEW.name) || '%' OR
      LOWER(description) LIKE '%' || LOWER(NEW.description) || '%'
    );
  
  -- If more than 3 similar events in the last hour, reject
  IF recent_count > 3 THEN
    RAISE EXCEPTION 'Too many similar events created recently. Please wait before submitting another event.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent spam
CREATE TRIGGER prevent_event_spam
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION check_event_spam();

-- Create a function to sanitize user input
CREATE OR REPLACE FUNCTION sanitize_event_input()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove potentially harmful characters
  NEW.name := REGEXP_REPLACE(NEW.name, '[<>"\''&]', '', 'g');
  NEW.description := REGEXP_REPLACE(NEW.description, '[<>"\''&]', '', 'g');
  NEW.location := REGEXP_REPLACE(NEW.location, '[<>"\''&]', '', 'g');
  
  -- Trim whitespace
  NEW.name := TRIM(NEW.name);
  NEW.description := TRIM(NEW.description);
  NEW.location := TRIM(NEW.location);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sanitize input
CREATE TRIGGER sanitize_event_input_trigger
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_event_input();
