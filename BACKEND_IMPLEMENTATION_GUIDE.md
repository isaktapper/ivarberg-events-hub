# Backend Implementation: Admin Tips Management System

## 🎯 Översikt

Du behöver bygga ett admin-gränssnitt där administratörer kan hantera event-tips från användare. När en administratör konverterar ett tips till ett evenemang ska de tas till ett redigeringsformulär där de kan justera information och publicera evenemanget.

## 📋 Teknisk Struktur

### **Databas: `event_tips` tabell**

**Schema:**
```sql
CREATE TABLE event_tips (
  id SERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_date TEXT, -- Legacy field
  date_time TIMESTAMP, -- Proper datetime
  event_location TEXT,
  venue_name TEXT,
  event_description TEXT,
  categories TEXT[], -- Array of 1-3 categories
  category TEXT, -- Main category (first in array)
  image_url TEXT,
  website_url TEXT,
  submitter_email TEXT,
  submitter_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'converted')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Kolumner för konvertering:**
- `categories TEXT[]` - Array med 1-3 kategorier (ex: `["Scen", "Barn & Familj"]`)
- `category TEXT` - Huvudkategori (första i arrayen)
- `event_description` - Fullständig beskrivning av evenemanget
- `date_time TIMESTAMP` - Datum och tid i korrekt format
- `venue_name` - Separera platsnamn från adress
- `image_url` - Bild URL
- `website_url` - Länk till hemsida/biljetter
- `status` - Status för tipset (för att hantera arbetsflöde)

## 🔄 Arbetsflöde

### **Steg 1: Admin läser tips**
```
GET /api/admin/tips?status=pending
→ Returnerar alla tips med status 'pending'
```

### **Steg 2: Admin granskar ett specifikt tips**
```
GET /api/admin/tips/:id
→ Returnerar detaljerad information om ett tips
```

### **Steg 3A: Admin avböjer tips**
```
POST /api/admin/tips/:id/reject
Body: { reason: "Felaktig information" }
→ Uppdaterar status till 'rejected'
```

### **Steg 3B: Admin konverterar tips till event**
```
POST /api/admin/tips/:id/convert
→ Skapar event i `events` tabellen med följande data:
```

## 📝 Event Konvertering: Data Mapping

```typescript
// Från event_tips till events tabell
const eventData = {
  event_id: `tip-${tip.id}-${Date.now()}`, // Unikt ID
  name: tip.event_name,
  date_time: tip.date_time,
  location: tip.event_location,
  venue_name: tip.venue_name || tip.event_location,
  description: tip.event_description,
  description_format: 'plaintext',
  category: tip.category || tip.categories[0], // Huvudkategori
  categories: tip.categories, // Multi-category array
  category_scores: generateCategoryScores(tip.categories), // Helper function
  image_url: tip.image_url,
  organizer_event_url: tip.website_url,
  status: 'draft', // Väntar på admin approval
  tags: ['tips', 'user-submitted'], // Identifierar användar-submissions
  price: null,
  organizer_id: null,
  is_featured: false,
  featured: false,
  max_participants: null,
  quality_score: null,
  quality_issues: null,
  auto_published: false,
  created_at: new Date(),
  updated_at: new Date()
};

// Helper function för category scores
function generateCategoryScores(categories: string[]): JSONB {
  return categories.reduce((scores, category, index) => {
    scores[category] = 1.0 - (index * 0.1); // 1.0, 0.9, 0.8
    return scores;
  }, {});
}
```

## 🎨 Frontend Admin Interface Requirements

### **1. Tips List Page**
```
Route: /admin/tips
Component: AdminTipsList

Features:
- Tabell med alla tips
- Filter: pending, reviewed, rejected, converted
- Kolumner: Namn, Datum, Plats, Kategorier, Status, Åtgärder
- Sortering: Senast först
- Pagination
```

### **2. Tips Detail Page**
```
Route: /admin/tips/:id
Component: AdminTipsDetail

Display:
- All information från event_tips
- Categories som chips/list
- Image preview om image_url finns
- Website link om website_url finns
- Submit date & time

Actions:
- "Avböj" button (modal med reason field)
- "Konvertera till event" button
```

### **3. Event Edit Page (Efter konvertering)**
```
Route: /admin/events/:event_id/edit
Component: AdminEventEdit

Features:
- Förfylld data från event_tips
- Alla fält redigerbara
- Kategori-select med multi-select (max 3)
- DateTime picker
- Image URL validator
- Description editor (markdown support?)
- Status selector: draft, pending_approval, published
- "Publicera" button
- "Spara som draft" button
- "Avbryt" button
```

## 🔐 Admin Autentisering

**Implementera admin-autentisering:**
- Supabase Auth med custom claims
- Eller separat admin-auth system
- Middleware för att skydda /admin routes

```typescript
// Example middleware
async function adminAuthMiddleware(req, res, next) {
  const token = req.headers.authorization;
  // Verify token och kontrollera admin role
  if (!isAdmin(token)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
```

## 📊 API Endpoints

### **GET /api/admin/tips**
Hämta alla tips med filter
```typescript
Query params: ?status=pending&page=1&limit=20
Response: {
  tips: EventTip[],
  total: number,
  page: number,
  limit: number
}
```

### **GET /api/admin/tips/:id**
Hämta specifikt tips
```typescript
Response: EventTip
```

### **POST /api/admin/tips/:id/reject**
Avböj ett tips
```typescript
Body: { reason?: string }
Response: { success: true }
```

### **POST /api/admin/tips/:id/convert**
Konvertera tips till event
```typescript
Response: { 
  success: true, 
  event_id: string,
  event: Event 
}
```

### **GET /api/admin/events/:event_id**
Hämta event för redigering
```typescript
Response: Event
```

### **PUT /api/admin/events/:event_id**
Uppdatera event
```typescript
Body: { ...eventData }
Response: Event
```

### **POST /api/admin/events/:event_id/publish**
Publicera event
```typescript
Body: { 
  status: 'published',
  featured?: boolean 
}
Response: Event
```

## 🎨 Design Guidelines

**Använd samma design-språk som huvudappen:**
- Färger: `#08075C` (primary), `#4A90E2` (accent), `#F5F3F0` (background)
- Typography: Poppins font family
- Komponenter: Använd befintliga UI-komponenter
- Responsiv: Fungera på alla skärmstorlekar

**Key Features:**
- Clean och professionell layout
- Tydliga action buttons
- Confirmation modals för destructive actions
- Real-time updates
- Toast notifications för success/error

## 🔄 Status Flöde

```
pending (Väntar på granskning)
  ↓
reviewed (Granskad, beslutsvänt)
  ↓
  ├─→ rejected (Avböjd)
  │
  └─→ converted → event.created (Event skapat)
            ↓
      event.draft (Kan redigeras)
            ↓
      event.published (Live på sidan)
```

## 🛠️ Implementation Tips

### **1. Kategori-hantering**
```typescript
// Validera att kategorier stämmer överens
const validCategories = [
  'Scen', 'Nattliv', 'Sport', 'Utställningar', 'Föreläsningar',
  'Barn & Familj', 'Mat & Dryck', 'Jul', 'Film & bio',
  'Djur & Natur', 'Guidade visningar', 'Marknader', 'Okategoriserad'
];

function validateCategories(categories: string[]): boolean {
  return categories.length >= 1 && 
         categories.length <= 3 && 
         categories.every(cat => validCategories.includes(cat));
}
```

### **2. Event Skapande**
```typescript
async function convertTipToEvent(tipId: number): Promise<Event> {
  // 1. Hämta tips
  const tip = await getTip(tipId);
  
  // 2. Validera data
  validateTipForConversion(tip);
  
  // 3. Skapa event
  const event = await createEventFromTip(tip);
  
  // 4. Uppdatera tips status
  await updateTipStatus(tipId, 'converted');
  
  // 5. Returnera event
  return event;
}
```

### **3. Bild-hantering**
```typescript
// Validera bild URL
function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol) &&
           /\.(jpg|jpeg|png|gif|webp)$/i.test(parsedUrl.pathname);
  } catch {
    return false;
  }
}
```

## 📋 Checklist för Implementation

- [ ] Skapa admin authentication system
- [ ] Bygga admin tips list page
- [ ] Bygga admin tips detail page
- [ ] Implementera reject funktionalitet
- [ ] Implementera convert funktionalitet
- [ ] Bygga event edit page
- [ ] Implementera event update funktionalitet
- [ ] Implementera event publish funktionalitet
- [ ] Lägg till validering och felhantering
- [ ] Lägg till notifikationer (toasts)
- [ ] Testa all arbetsflöde
- [ ] Lägg till logging/audit trail

## 🚀 Next Steps

Efter att backend är implementerat kan du:
1. Testa hela arbetsflödet från user submission → admin review → event creation → publication
2. Överväg att lägga till email notifikationer för submitters
3. Bygga analytics dashboard för att se popularitet av kategorier
4. Implementera bulk actions för att hantera flera tips samtidigt
