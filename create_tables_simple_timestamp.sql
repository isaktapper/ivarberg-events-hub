-- Uppdaterat SQL-script för att skapa tabeller med TIMESTAMP (utan timezone)

-- Skapa enum för event status
CREATE TYPE event_status AS ENUM ('draft', 'pending_approval', 'published', 'cancelled');

-- Skapa enum för kategorier
CREATE TYPE event_category AS ENUM (
  'Scen', 
  'Nattliv', 
  'Sport', 
  'Utställningar', 
  'Föreläsningar', 
  'Barn & Familj', 
  'Mat & Dryck'
);

-- Organizer tabell
CREATE TABLE organizers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Events tabell
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  date_time TIMESTAMP NOT NULL,  -- Ändrat från TIMESTAMP WITH TIME ZONE
  location TEXT NOT NULL,
  price TEXT,
  image_url TEXT,
  organizer_event_url TEXT,
  category event_category NOT NULL,
  organizer_id INTEGER REFERENCES organizers(id),
  is_featured BOOLEAN DEFAULT FALSE,
  status event_status DEFAULT 'draft',
  max_participants INTEGER,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),  -- Ändrat från TIMESTAMP WITH TIME ZONE
  updated_at TIMESTAMP DEFAULT NOW()   -- Ändrat från TIMESTAMP WITH TIME ZONE
);
