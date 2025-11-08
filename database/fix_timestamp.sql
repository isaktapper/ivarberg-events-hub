-- Ändra kolumntyp från timestampz till timestamp
ALTER TABLE events 
ALTER COLUMN date_time TYPE TIMESTAMP WITHOUT TIME ZONE;

-- Ändra även created_at och updated_at om du vill
ALTER TABLE events 
ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE events 
ALTER COLUMN updated_at TYPE TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE organizers 
ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE organizers 
ALTER COLUMN updated_at TYPE TIMESTAMP WITHOUT TIME ZONE;

-- Uppdatera ditt test-event med enklare datum
UPDATE events 
SET date_time = '2025-12-25 19:00:00' 
WHERE event_id = '1';
