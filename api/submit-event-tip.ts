import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory rate limiter för Vercel serverless
// OBS: Detta är per serverless instance, men fungerar bra för att förhindra massattacker
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rensa gamla poster var 10:e minut
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 5 * 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // Ny period eller första requesten
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false; // Rate limit överskriden
  }

  // Öka counter
  record.count++;
  return true;
}

// Säkerhetsvalidering (samma som i frontend, men körs på servern)
function validateEventSubmission(eventData: any): { isValid: boolean; error?: string } {
  // Validera att alla required fields finns
  if (!eventData.event_name || !eventData.date_time || !eventData.event_location || !eventData.description) {
    return { isValid: false, error: 'Alla obligatoriska fält måste fyllas i' };
  }

  // Validera namn
  if (typeof eventData.event_name !== 'string' || eventData.event_name.trim().length < 3 || eventData.event_name.trim().length > 200) {
    return { isValid: false, error: 'Namnet måste vara mellan 3 och 200 tecken' };
  }

  // Validera beskrivning
  if (typeof eventData.description !== 'string' || eventData.description.trim().length < 10 || eventData.description.trim().length > 2000) {
    return { isValid: false, error: 'Beskrivningen måste vara mellan 10 och 2000 tecken' };
  }

  // Validera plats
  if (typeof eventData.event_location !== 'string' || eventData.event_location.trim().length < 3 || eventData.event_location.trim().length > 200) {
    return { isValid: false, error: 'Platsen måste vara mellan 3 och 200 tecken' };
  }

  // Validera kategorier
  if (!Array.isArray(eventData.categories) || eventData.categories.length === 0) {
    return { isValid: false, error: 'Du måste välja minst en kategori' };
  }

  if (eventData.categories.length > 3) {
    return { isValid: false, error: 'Du kan bara välja max 3 kategorier' };
  }

  // Validera URL:er om de finns
  if (eventData.image_url) {
    try {
      new URL(eventData.image_url);
    } catch {
      return { isValid: false, error: 'Bild-URL:en är inte giltig' };
    }
  }

  if (eventData.website_url) {
    try {
      new URL(eventData.website_url);
    } catch {
      return { isValid: false, error: 'Hemsida-URL:en är inte giltig' };
    }
  }

  // Validera email om den finns
  if (eventData.submitter_email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(eventData.submitter_email)) {
      return { isValid: false, error: 'Ogiltig e-postadress' };
    }
  }

  // Kontrollera för potentiellt skadligt innehåll
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i,
    /vbscript:/i
  ];

  const textToCheck = `${eventData.event_name} ${eventData.description} ${eventData.event_location}`;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(textToCheck)) {
      return { isValid: false, error: 'Innehållet innehåller otillåten kod' };
    }
  }

  return { isValid: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Endast POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Rate limiting baserat på IP-adress
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const identifier = Array.isArray(ip) ? ip[0] : ip;

    if (!checkRateLimit(identifier, 10, 5 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        error: 'För många försök. Vänta 5 minuter innan du skickar in fler evenemang.'
      });
    }

    // Validera input
    const validationResult = validateEventSubmission(req.body);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: validationResult.error
      });
    }

    // Hämta Supabase credentials
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).json({
        success: false,
        error: 'Serverfel: Saknar konfiguration'
      });
    }

    // Förbered data för Supabase
    const tipRecord = {
      event_name: req.body.event_name.trim(),
      event_date: req.body.date_time,
      date_time: req.body.date_time,
      event_location: req.body.event_location.trim(),
      venue_name: req.body.venue_name?.trim() || req.body.event_location.trim(),
      event_description: req.body.description.trim(),
      categories: req.body.categories,
      category: req.body.categories[0] || req.body.category,
      image_url: req.body.image_url?.trim() || null,
      website_url: req.body.website_url?.trim() || null,
      submitter_email: req.body.submitter_email?.trim() || null,
      submitter_name: req.body.submitter_name?.trim() || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Skicka till Supabase via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/event_tips`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(tipRecord)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Supabase error:', errorData);
      return res.status(500).json({
        success: false,
        error: 'Kunde inte spara evenemangstipset. Försök igen senare.'
      });
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      tip_id: data[0]?.id
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Ett oväntat fel uppstod. Försök igen senare.'
    });
  }
}
