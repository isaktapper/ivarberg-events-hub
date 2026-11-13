-- Svar från "Tyck till"-rutan om sajtens nya utseende
CREATE TABLE site_feedback (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  verdict TEXT NOT NULL CHECK (verdict IN ('gillar', 'gillar_inte')),
  comment TEXT CHECK (char_length(comment) <= 2000),
  email TEXT CHECK (char_length(email) <= 254), -- frivillig, bara om man vill ha svar
  page TEXT, -- sidan man svarade från
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE site_feedback ENABLE ROW LEVEL SECURITY;

-- Alla får lämna svar, ingen får läsa via den publika nyckeln
CREATE POLICY "Anyone can leave feedback" ON site_feedback
  FOR INSERT TO anon, authenticated WITH CHECK (true);
