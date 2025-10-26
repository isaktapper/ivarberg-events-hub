// Test data för multi-category system
// Denna fil kan användas för att testa multi-category funktionaliteten lokalt

export const testMultiCategoryEvents = [
  {
    id: "test-1",
    title: "Barnmusikal: Trollkarlen från Oz",
    category: "Scen", // Bakåtkompatibilitet
    categories: ["Scen", "Barn & Familj"], // Multi-categories
    category_scores: {
      "Scen": 0.95,
      "Barn & Familj": 0.75
    },
    date: new Date("2024-02-15T19:00:00"),
    time: "19:00",
    location: "Varbergs Teater",
    venue_name: "Varbergs Teater",
    price: "150 kr",
    image: "/placeholder.svg",
    description: "En magisk musikal för hela familjen",
    isFeatured: true,
    organizer_event_url: null,
    organizer: {
      name: "Varbergs Teater",
      website: "https://varbergsteater.se"
    }
  },
  {
    id: "test-2", 
    title: "Konstutställning: Moderna Målningar",
    category: "Utställningar", // Bakåtkompatibilitet
    categories: ["Utställningar", "Föreläsningar"], // Multi-categories
    category_scores: {
      "Utställningar": 0.90,
      "Föreläsningar": 0.60
    },
    date: new Date("2024-02-20T14:00:00"),
    time: "14:00",
    location: "Varbergs Konsthall",
    venue_name: "Varbergs Konsthall", 
    price: "Gratis",
    image: "/placeholder.svg",
    description: "Utställning med moderna konstverk och guidade visningar",
    isFeatured: false,
    organizer_event_url: null,
    organizer: {
      name: "Varbergs Konsthall",
      website: "https://varbergskonsthall.se"
    }
  },
  {
    id: "test-3",
    title: "Fotbollsmatch: Varberg vs Helsingborg",
    category: "Sport", // Bakåtkompatibilitet  
    categories: ["Sport"], // Enkel kategori
    category_scores: {
      "Sport": 0.98
    },
    date: new Date("2024-02-25T15:00:00"),
    time: "15:00",
    location: "Påskbergsvallen",
    venue_name: "Påskbergsvallen",
    price: "200 kr",
    image: "/placeholder.svg", 
    description: "Höjdpunkt i fotbollssäsongen",
    isFeatured: true,
    organizer_event_url: null,
    organizer: {
      name: "Varbergs BoIS",
      website: "https://varbergsbois.se"
    }
  },
  {
    id: "test-4",
    title: "Kulinarisk Kväll med Lokala Produkter",
    category: "Mat & Dryck", // Bakåtkompatibilitet
    categories: ["Mat & Dryck", "Föreläsningar", "Nattliv"], // Tre kategorier
    category_scores: {
      "Mat & Dryck": 0.85,
      "Föreläsningar": 0.70,
      "Nattliv": 0.55
    },
    date: new Date("2024-03-01T18:00:00"),
    time: "18:00", 
    location: "Restaurang Havet",
    venue_name: "Restaurang Havet",
    price: "450 kr",
    image: "/placeholder.svg",
    description: "En kväll med lokal mat, dryck och föreläsning om hållbarhet",
    isFeatured: false,
    organizer_event_url: null,
    organizer: {
      name: "Restaurang Havet",
      website: "https://restauranghavet.se"
    }
  },
  // Ytterligare events för att testa liknande events funktionalitet
  {
    id: "test-5",
    title: "Teaterföreställning: Hamlet",
    category: "Scen", // Bakåtkompatibilitet
    categories: ["Scen"], // Enkel kategori
    category_scores: {
      "Scen": 0.92
    },
    date: new Date("2024-02-16T20:00:00"),
    time: "20:00",
    location: "Varbergs Teater",
    venue_name: "Varbergs Teater",
    price: "180 kr",
    image: "/placeholder.svg",
    description: "Shakespeares klassiska tragedi",
    isFeatured: false,
    organizer_event_url: null,
    organizer: {
      name: "Varbergs Teater",
      website: "https://varbergsteater.se"
    }
  },
  {
    id: "test-6",
    title: "Familjeaktivitet: Pyssla och Måla",
    category: "Barn & Familj", // Bakåtkompatibilitet
    categories: ["Barn & Familj", "Utställningar"], // Multi-categories
    category_scores: {
      "Barn & Familj": 0.88,
      "Utställningar": 0.65
    },
    date: new Date("2024-02-17T10:00:00"),
    time: "10:00",
    location: "Varbergs Konsthall",
    venue_name: "Varbergs Konsthall",
    price: "50 kr",
    image: "/placeholder.svg",
    description: "Kreativ aktivitet för hela familjen",
    isFeatured: false,
    organizer_event_url: null,
    organizer: {
      name: "Varbergs Konsthall",
      website: "https://varbergskonsthall.se"
    }
  },
  {
    id: "test-7",
    title: "Föreläsning: Framtidens Energi",
    category: "Föreläsningar", // Bakåtkompatibilitet
    categories: ["Föreläsningar"], // Enkel kategori
    category_scores: {
      "Föreläsningar": 0.95
    },
    date: new Date("2024-02-21T19:00:00"),
    time: "19:00",
    location: "Varbergs Bibliotek",
    venue_name: "Varbergs Bibliotek",
    price: "Gratis",
    image: "/placeholder.svg",
    description: "Föreläsning om hållbar energi och klimat",
    isFeatured: false,
    organizer_event_url: null,
    organizer: {
      name: "Varbergs Bibliotek",
      website: "https://varbergsbibliotek.se"
    }
  },
  {
    id: "test-8",
    title: "Nattklubb: DJ Set med Lokala Artister",
    category: "Nattliv", // Bakåtkompatibilitet
    categories: ["Nattliv"], // Enkel kategori
    category_scores: {
      "Nattliv": 0.90
    },
    date: new Date("2024-03-02T22:00:00"),
    time: "22:00",
    location: "Club Varberg",
    venue_name: "Club Varberg",
    price: "120 kr",
    image: "/placeholder.svg",
    description: "Dans och musik hela natten",
    isFeatured: false,
    organizer_event_url: null,
    organizer: {
      name: "Club Varberg",
      website: "https://clubvarberg.se"
    }
  },
  {
    id: "test-9",
    title: "Loppmarknad: Vintage och Antik",
    category: "Marknader", // Bakåtkompatibilitet
    categories: ["Marknader", "Barn & Familj"], // Multi-categories
    category_scores: {
      "Marknader": 0.92,
      "Barn & Familj": 0.65
    },
    date: new Date("2024-03-10T10:00:00"),
    time: "10:00",
    location: "Varbergs Centrum",
    venue_name: "Varbergs Centrum",
    price: "Gratis",
    image: "/placeholder.svg",
    description: "Loppmarknad med vintage och antika föremål för hela familjen",
    isFeatured: false,
    organizer_event_url: null,
    organizer: {
      name: "Varbergs Centrum",
      website: "https://varbergscentrum.se"
    }
  }
];

// Helper function för att lägga till test events i utvecklingsläge
export function addTestEventsToState(setEvents: (events: any[]) => void) {
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Adding test multi-category events for development');
    setEvents(testMultiCategoryEvents);
  }
}
