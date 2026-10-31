// Kurerade tips som ger landningssidorna redaktionellt innehåll utöver
// eventlistorna. Bilderna är handplockade Unsplash-foton (fria att använda,
// hotlänkas via images.unsplash.com) – byt URL:er fritt, eller sätt null för
// ett gradient-kort med emoji. Länkar går alltid internt (aldrig till externa
// webbplatser) – korten pekar på områdes-/kategorisidor via slugs.

export interface Recommendation {
  name: string;
  blurb: string; // 1–3 tidlösa meningar – inga öppettider eller priser
  imageUrl: string | null;
  emoji: string; // fallback-kort när imageUrl är null
  areaSlug?: string; // koppling till /omrade/:slug
  categorySlug?: string; // koppling till /kategori/:slug
}

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=60`;

export const RESTAURANTS: Recommendation[] = [
  {
    name: 'Ästad Vingård',
    blurb:
      'Vingård, spa och prisbelönt gastronomi mitt bland Åkulla bokskogar. En av Sveriges mest omtalade mat- och vinupplevelser – väl värd utflykten från kusten.',
    imageUrl: unsplash('1506377247377-2a5b3b417ebb'),
    emoji: '🍷',
    areaSlug: 'tvaaker',
    categorySlug: 'mat-dryck',
  },
  {
    name: 'Johns Place',
    blurb:
      'Klassisk kvarterskrog i centrala Varberg, älskad för sina burgare och sin avslappnade stämning. En trotjänare som sällan gör någon besviken.',
    imageUrl: unsplash('1568901346375-23c9450c58cd'),
    emoji: '🍔',
    areaSlug: 'centrala-varberg',
    categorySlug: 'mat-dryck',
  },
  {
    name: 'Nami',
    blurb:
      'Sushi och asiatiska smaker mitt i stan – färska råvaror och ett självklart val när suget efter något lättare slår till.',
    imageUrl: unsplash('1579871494447-9811cf80d66c'),
    emoji: '🍣',
    areaSlug: 'centrala-varberg',
    categorySlug: 'mat-dryck',
  },
  {
    name: 'Societén',
    blurb:
      'Anrik restaurang i Societetsparkens paviljong med sommarkvällar, dans och uteservering under lövkronorna – Varbergs badortshistoria på tallrik.',
    imageUrl: unsplash('1414235077428-338989a2e8c0'),
    emoji: '🥂',
    areaSlug: 'centrala-varberg',
    categorySlug: 'mat-dryck',
  },
  {
    name: 'Grappa',
    blurb:
      'Italiensk matbar i genuin kvartersmiljö – pasta, småvarmt och en vinlista som imponerar.',
    imageUrl: unsplash('1551183053-bf91a1d81141'),
    emoji: '🍝',
    areaSlug: 'centrala-varberg',
    categorySlug: 'mat-dryck',
  },
  {
    name: 'Kaféerna i stadskärnan',
    blurb:
      'Varbergs kaféliv är tätt: klassiska konditorier vid torget, surdegsbagerier och kafferosterier i gränderna. Fikapausen är aldrig långt borta.',
    imageUrl: unsplash('1509042239860-f550ce710b93'),
    emoji: '☕',
    areaSlug: 'centrala-varberg',
    categorySlug: 'mat-dryck',
  },
];

export const BEACHES: Recommendation[] = [
  {
    name: 'Apelviken',
    blurb:
      'Skandinaviens surfmecka – en långgrund sandstrand söder om stan med surfskolor, beachvolley och strandliv hela sommaren.',
    imageUrl: unsplash('1476673160081-cf065607f449'),
    emoji: '🏄',
    areaSlug: 'apelviken',
  },
  {
    name: 'Kallbadhuset',
    blurb:
      'Varbergs ikon ute i havet – kallbad och vedeldad bastu i moriskt inspirerad träarkitektur, vinter som sommar.',
    imageUrl: null,
    emoji: '♨️',
    areaSlug: 'centrala-varberg',
  },
  {
    name: 'Getteröns badvikar',
    blurb:
      'Barnvänliga vikar och klippbad bara några minuter från centrum, med fågelreservatet som granne.',
    imageUrl: unsplash('1471922694854-ff1b63b20054'),
    emoji: '🌊',
    areaSlug: 'getteron',
  },
  {
    name: 'Stränderna söder om stan',
    blurb:
      'Milslång kust ner mot Träslövsläge – lugnare än Apelviken och perfekt för långa strandpromenader året om.',
    imageUrl: unsplash('1503756234508-e32369269deb'),
    emoji: '🐚',
    areaSlug: 'traslovslage',
  },
];

export const SIGHTS: Recommendation[] = [
  {
    name: 'Varbergs fästning & Bockstensmannen',
    blurb:
      'Den 700-åriga fästningen är stadens landmärke. Inne på museet väntar Bockstensmannen – medeltidsmannen vars kläder bevarats intakta i en myr – och från murarna har du fri utsikt över Kattegatt.',
    imageUrl: null,
    emoji: '🏰',
    areaSlug: 'centrala-varberg',
    categorySlug: 'guidade-visningar',
  },
  {
    name: 'Grimeton radiostation',
    blurb:
      'UNESCO-världsarv utanför Varberg – världens enda bevarade och fungerande långvågssändare från 1920-talet. Både tekniskt vallfärdsmål och fin utflykt.',
    imageUrl: null,
    emoji: '📡',
    areaSlug: 'ovriga-kommunen',
    categorySlug: 'guidade-visningar',
  },
  {
    name: 'Societetsparken',
    blurb:
      'Badortsepokens gröna vardagsrum vid havet – paviljong, stor lekplats och utomhuskonserter om somrarna.',
    imageUrl: null,
    emoji: '🌳',
    areaSlug: 'centrala-varberg',
  },
  {
    name: 'Naturum Getterön',
    blurb:
      'Porten till ett av norra Europas främsta fågelområden – utställningar, fågeltorn och guidningar i våtmarkslandskapet.',
    imageUrl: unsplash('1444464666168-49d633b86797'),
    emoji: '🐦',
    areaSlug: 'getteron',
    categorySlug: 'djur-natur',
  },
];

export const ACTIVITIES: Recommendation[] = [
  {
    name: 'Surfing i Apelviken',
    blurb:
      'Vågorna i Apelviken har gjort Varberg till Sveriges surfhuvudstad – här finns skolor och uthyrning för både nybörjare och vana surfare.',
    imageUrl: unsplash('1502680390469-be75c86b636f'),
    emoji: '🏄',
    areaSlug: 'apelviken',
    categorySlug: 'sport',
  },
  {
    name: 'Kattegattleden',
    blurb:
      'Sveriges första nationella cykelled passerar rakt genom Varberg – trampa längs kusten norrut mot Bua eller söderut mot Falkenberg.',
    imageUrl: unsplash('1485965120184-e220f721d03e'),
    emoji: '🚴',
    categorySlug: 'sport',
  },
  {
    name: 'Åkulla bokskogar',
    blurb:
      'Vandringsleder genom Hallands mäktigaste bokskogar, med badsjöar och rastplatser – som klippt ur en saga, en halvtimme från kusten.',
    imageUrl: unsplash('1441974231531-c6227db76b6e'),
    emoji: '🌲',
    areaSlug: 'ovriga-kommunen',
    categorySlug: 'djur-natur',
  },
  {
    name: 'Torghandeln på Varbergs torg',
    blurb:
      'Torghandel med anor sedan medeltiden – onsdagar och lördagar fylls torget av blommor, grönsaker och lokala delikatesser.',
    imageUrl: unsplash('1488459716781-31db52582fe9'),
    emoji: '🛍️',
    areaSlug: 'centrala-varberg',
    categorySlug: 'marknader',
  },
];

// Extra områdesbundna tips så att varje områdessida bär sig även med få event
const AREA_EXTRAS: Recommendation[] = [
  {
    name: 'Läjets hamn',
    blurb:
      'Träslövsläges levande fiskehamn – köp räkor direkt från båten och känn den genuina västkuststämningen i "Läjet".',
    imageUrl: null,
    emoji: '⚓',
    areaSlug: 'traslovslage',
  },
  {
    name: 'Öströö Fårfarm',
    blurb:
      'Fårfarm i rullande hallandsbygd med gårdsbutik, café och lammsafari – en klassisk familjeutflykt utanför Tvååker.',
    imageUrl: null,
    emoji: '🐑',
    areaSlug: 'tvaaker',
  },
  {
    name: 'Bua hamn',
    blurb:
      'Fiskeläget i norr med hamn, rökeri och badklippor – och hamnfesten som sommarens självklara höjdpunkt.',
    imageUrl: null,
    emoji: '🦞',
    areaSlug: 'bua',
  },
  {
    name: 'Viskadalen',
    blurb:
      'Viskan slingrar sig genom dalgången vid Veddige – paddling, fiske och stilla natur i kommunens gröna inland.',
    imageUrl: null,
    emoji: '🛶',
    areaSlug: 'veddige',
  },
];

const ALL: Recommendation[] = [...RESTAURANTS, ...BEACHES, ...SIGHTS, ...ACTIVITIES, ...AREA_EXTRAS];

// Handplockade tips per kategorisida (mat-dryck får hela restauranglistan)
const CATEGORY_RECS: Record<string, Recommendation[]> = {
  'mat-dryck': RESTAURANTS,
  'djur-natur': [SIGHTS[3], ACTIVITIES[2], BEACHES[2]],
  sport: [ACTIVITIES[0], ACTIVITIES[1], BEACHES[0]],
  marknader: [ACTIVITIES[3], AREA_EXTRAS[0]],
  'guidade-visningar': [SIGHTS[0], SIGHTS[1], SIGHTS[3]],
  utstallningar: [SIGHTS[0], SIGHTS[3]],
  'barn-familj': [BEACHES[0], SIGHTS[2], AREA_EXTRAS[1]],
};

export function recsForCategory(slug: string): Recommendation[] {
  return CATEGORY_RECS[slug] || [];
}

export function recsForArea(slug: string): Recommendation[] {
  return ALL.filter((r) => r.areaSlug === slug);
}
