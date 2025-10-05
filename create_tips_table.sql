-- Tabell för event-tips från användare
CREATE TABLE event_tips (
  id SERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_description TEXT,
  event_date TEXT, -- Användaren skriver fritext
  event_location TEXT,
  venue_name TEXT,
  organizer_name TEXT,
  organizer_contact TEXT, -- Email eller telefon
  category TEXT,
  website_url TEXT,
  additional_info TEXT,
  submitter_name TEXT,
  submitter_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index för bättre prestanda
CREATE INDEX idx_event_tips_status ON event_tips(status);
CREATE INDEX idx_event_tips_created_at ON event_tips(created_at);

-- RLS för säkerhet
ALTER TABLE event_tips ENABLE ROW LEVEL SECURITY;

-- Policy för att alla kan skapa tips
CREATE POLICY 'Anyone can submit tips' ON event_tips
  FOR INSERT WITH CHECK (true);

-- Policy för att bara admins kan läsa tips (du kan ändra detta senare)
CREATE POLICY 'Only admins can read tips' ON event_tips
  FOR SELECT USING (false); -- Ändra till admin-check senare

-- Trigger för updated_at
CREATE TRIGGER update_event_tips_updated_at 
  BEFORE UPDATE ON event_tips 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
