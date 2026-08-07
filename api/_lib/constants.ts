// Delade konstanter för de serverrenderade sidorna (api/*.ts).
// Katalogen _lib deployas inte som funktioner (understrecksprefix).

export const SITE = 'https://ivarberg.nu';
export const TZ = 'Europe/Stockholm';

// Period-pillren i heron – delas av alla serverrenderade sidor
export const PERIOD_PILLS = [
  { slug: 'idag', pill: 'Idag' },
  { slug: 'imorgon', pill: 'Imorgon' },
  { slug: 'i-helgen', pill: 'I helgen' },
  { slug: 'i-veckan', pill: 'I veckan' },
] as const;

export interface TaxonomyEntry {
  name: string; // exakt DB-värde (events.categories / events.area)
  slug: string;
  h1: string;
  titleLabel: string; // används i <title>
  intro: string; // unik intro-prosa, 2–4 meningar
  emptyNote: string; // ärlig text när inga event finns i fönstret
  relatedSlugs: string[]; // korslänkar till systersidor
  emoji?: string; // används i kategorirutnätet
}

// OBS: egen lista – SPA:ns EventCategory-typ saknar "Konst" och ska inte användas här.
// "Okategoriserad" får ingen egen sida.
export const CATEGORIES: TaxonomyEntry[] = [
  {
    name: 'Scen',
    slug: 'scen',
    emoji: '🎭',
    h1: 'Scen i Varberg – teater, konserter & shower',
    titleLabel: 'Scen i Varberg – teater, konserter & shower',
    intro:
      'Varberg har ett scenliv som är större än stadens storlek antyder. Varbergs Teater bjuder på allt från klassisk teater till stand-up, och sommartid fylls Societetsparken av utomhuskonserter i den anrika societetsmiljön. Här hittar du alla kommande föreställningar, konserter och shower i Varberg med tid, plats och pris.',
    emptyNote:
      'Just nu finns inga publicerade scenevenemang – nya föreställningar och konserter läggs upp löpande, ofta med kort varsel.',
    relatedSlugs: ['nattliv', 'forelasningar', 'film-bio'],
  },
  {
    name: 'Nattliv',
    slug: 'nattliv',
    emoji: '🍸',
    h1: 'Nattliv i Varberg – barer, klubbar & kvällsnöjen',
    titleLabel: 'Nattliv i Varberg – barer, klubbar & kvällsnöjen',
    intro:
      'När solen gått ner över Kattegatt vaknar Varbergs kvällsliv. Krogar och barer kring torget och hamnen bjuder på livemusik, DJ-kvällar, quiz och afterwork – och under sommaren flyttar nattlivet ut mot strandpromenaden. Här ser du vad som händer i Varberg i kväll och i helgen.',
    emptyNote:
      'Inga nattlivsevenemang är publicerade just nu – klubbkvällar och spelningar dyker ofta upp med kort varsel, titta in igen snart.',
    relatedSlugs: ['scen', 'mat-dryck'],
  },
  {
    name: 'Sport',
    slug: 'sport',
    emoji: '🏃',
    h1: 'Sport i Varberg – matcher, lopp & aktiviteter',
    titleLabel: 'Sport i Varberg – matcher, lopp & aktiviteter',
    intro:
      'Från fotbollsmatcher och innebandy till surftävlingar i Apelviken och motionslopp längs kusten – sporten i Varberg lever året runt. Här samlar vi kommande matcher, tävlingar och sportaktiviteter i hela Varbergs kommun, både för dig som vill heja och för dig som vill delta.',
    emptyNote:
      'Inga sportevenemang är publicerade i kalendern just nu – seriematcher och lopp fylls på när spelscheman släpps.',
    relatedSlugs: ['barn-familj', 'djur-natur'],
  },
  {
    name: 'Utställningar',
    slug: 'utstallningar',
    emoji: '🖼️',
    h1: 'Utställningar i Varberg – museer & gallerier',
    titleLabel: 'Utställningar i Varberg – museer & gallerier',
    intro:
      'Hallands Kulturhistoriska Museum på Varbergs fästning – med den världsberömda Bockstensmannen – är navet i Varbergs utställningsliv, men här finns också gallerier och konsthallar som ständigt byter innehåll. Här hittar du aktuella och kommande utställningar i Varberg.',
    emptyNote:
      'Inga utställningar är publicerade just nu – museet och gallerierna uppdaterar sina program säsongsvis.',
    relatedSlugs: ['konst', 'guidade-visningar'],
  },
  {
    name: 'Konst',
    slug: 'konst',
    emoji: '🎨',
    h1: 'Konst i Varberg – vernissager & konstupplevelser',
    titleLabel: 'Konst i Varberg – vernissager & konstupplevelser',
    intro:
      'Varbergs konstscen växer – gallerier, konstrundor och vernissager samsas med offentlig konst och ateljébesök. Här ser du kommande konsthändelser i Varberg, från invigningar till workshops.',
    emptyNote:
      'Inga konstevenemang är publicerade just nu – vernissager annonseras ofta bara någon vecka i förväg.',
    relatedSlugs: ['utstallningar', 'scen'],
  },
  {
    name: 'Föreläsningar',
    slug: 'forelasningar',
    emoji: '🎤',
    h1: 'Föreläsningar i Varberg – föredrag & samtal',
    titleLabel: 'Föreläsningar i Varberg – föredrag & samtal',
    intro:
      'Författarkvällar på biblioteket, populärvetenskap, resföredrag och samtal om samtiden – Varbergs föreläsningsscen är bredare än man tror. Här hittar du kommande föreläsningar och föredrag i Varberg med tid och plats.',
    emptyNote:
      'Inga föreläsningar är publicerade just nu – programmen fylls ofta på inför höst- och vårsäsongen.',
    relatedSlugs: ['scen', 'utstallningar'],
  },
  {
    name: 'Barn & Familj',
    slug: 'barn-familj',
    emoji: '👨‍👩‍👧',
    h1: 'Barn & familj i Varberg – aktiviteter för alla åldrar',
    titleLabel: 'Barn & familj i Varberg – aktiviteter för alla åldrar',
    intro:
      'Varberg är en av västkustens mest familjevänliga städer: barnteater, sagostunder, lekland, strandaktiviteter i Apelviken och familjedagar på fästningen. Här samlar vi allt som händer för barn och familjer i Varberg – uppdaterat varje dag.',
    emptyNote:
      'Inga familjeevenemang är publicerade just nu – under lov och helger brukar kalendern fyllas snabbt.',
    relatedSlugs: ['djur-natur', 'film-bio', 'sport'],
  },
  {
    name: 'Mat & Dryck',
    slug: 'mat-dryck',
    emoji: '🍽️',
    h1: 'Mat & dryck i Varberg – provningar, matkvällar & marknader',
    titleLabel: 'Mat & dryck i Varberg – provningar & matkvällar',
    intro:
      'Varbergs matscen har exploderat de senaste åren – från hamnkrogar med dagsfärsk fisk till vingårdsmiddagar och ölprovningar. Här hittar du kommande provningar, temakvällar och matmarknader, och våra tips på restauranger som är värda ett besök i sig.',
    emptyNote:
      'Inga mat- och dryckesevenemang är publicerade just nu – men restaurangtipsen nedan gäller året runt.',
    relatedSlugs: ['marknader', 'nattliv'],
  },
  {
    name: 'Jul',
    slug: 'jul',
    emoji: '🎄',
    h1: 'Jul i Varberg – julmarknader & julkonserter',
    titleLabel: 'Jul i Varberg – julmarknader & julkonserter',
    intro:
      'När december närmar sig förvandlas Varberg: julmarknad på fästningen, skyltsöndag i stadskärnan, julkonserter i kyrkorna och vinterbad vid Kallbadhuset. Här samlar vi julens alla evenemang i Varberg.',
    emptyNote:
      'Julevenemangen publiceras främst i november och december – fram till dess hittar du annat som händer i Varberg nedan.',
    relatedSlugs: ['marknader', 'barn-familj', 'scen'],
  },
  {
    name: 'Film & bio',
    slug: 'film-bio',
    emoji: '🎬',
    h1: 'Film & bio i Varberg – visningar & filmkvällar',
    titleLabel: 'Film & bio i Varberg – visningar & filmkvällar',
    intro:
      'Biopremiärer, filmklubbar och specialvisningar – här ser du vad som rullar på bioduken i Varberg. Sommartid händer det att filmen flyttar utomhus, med visningar under bar himmel.',
    emptyNote:
      'Inga filmvisningar är publicerade just nu – repertoaren uppdateras löpande.',
    relatedSlugs: ['scen', 'barn-familj'],
  },
  {
    name: 'Djur & Natur',
    slug: 'djur-natur',
    emoji: '🦆',
    h1: 'Djur & natur i Varberg – naturupplevelser & vandringar',
    titleLabel: 'Djur & natur i Varberg – naturupplevelser',
    intro:
      'Getteröns naturreservat är ett av norra Europas främsta fågelområden, och runt Varberg väntar vandringsleder, tångsafaris och naturguidningar. Här hittar du kommande naturupplevelser i Varberg – många av dem gratis.',
    emptyNote:
      'Inga naturevenemang är publicerade just nu – naturum Getterön och lederna är öppna ändå, året runt.',
    relatedSlugs: ['guidade-visningar', 'sport', 'barn-familj'],
  },
  {
    name: 'Guidade visningar',
    slug: 'guidade-visningar',
    emoji: '🧭',
    h1: 'Guidade visningar i Varberg – stadsvandringar & turer',
    titleLabel: 'Guidade visningar i Varberg – stadsvandringar & turer',
    intro:
      'Följ med en guide genom fästningens 700-åriga historia, på spökvandring i fängelsekorridorerna eller stadsvandring genom societetens Varberg. Här hittar du kommande guidade visningar och turer i Varberg.',
    emptyNote:
      'Inga guidade visningar är publicerade just nu – fästningens guidningar går tätast under sommarhalvåret.',
    relatedSlugs: ['utstallningar', 'djur-natur'],
  },
  {
    name: 'Marknader',
    slug: 'marknader',
    emoji: '🛍️',
    h1: 'Marknader i Varberg – loppisar, torgdagar & marknadsliv',
    titleLabel: 'Marknader i Varberg – loppisar & torgdagar',
    intro:
      'Varberg är en marknadsstad av rang – torghandeln på Varbergs torg har anor sedan medeltiden, och runt om i kommunen väntar loppisar, skördemarknader och hantverksmarknader. Här ser du var och när det är marknad nästa gång.',
    emptyNote:
      'Inga marknader är publicerade just nu – torghandeln på Varbergs torg pågår ändå, onsdagar och lördagar året runt.',
    relatedSlugs: ['mat-dryck', 'jul'],
  },
];

export const AREAS: TaxonomyEntry[] = [
  {
    name: 'Centrala Varberg',
    slug: 'centrala-varberg',
    h1: 'Evenemang i centrala Varberg',
    titleLabel: 'Evenemang i centrala Varberg – stadskärnan & fästningen',
    intro:
      'I centrala Varberg är det aldrig långt till något som händer: fästningen tronar över havet, torghandeln lever, Societetsparken bjuder på sommarkonserter och kvarteren runt Kungsgatan är fulla av restauranger och caféer. Här hittar du allt som händer i Varbergs stadskärna.',
    emptyNote:
      'Inga evenemang i centrala Varberg är publicerade i fönstret just nu.',
    relatedSlugs: ['apelviken', 'getteron'],
  },
  {
    name: 'Getterön',
    slug: 'getteron',
    h1: 'Evenemang på Getterön',
    titleLabel: 'Evenemang på Getterön – naturum & fågelreservatet',
    intro:
      'Getterön är Varbergs gröna utpost – ett internationellt känt fågelreservat med naturum, fågeltorn och badvikar bara några minuter från centrum. Här samlar vi guidningar, naturaktiviteter och annat som händer på Getterön.',
    emptyNote:
      'Inga evenemang på Getterön är publicerade just nu – naturum och fågeltornen är öppna att besöka ändå.',
    relatedSlugs: ['centrala-varberg', 'apelviken'],
  },
  {
    name: 'Apelviken',
    slug: 'apelviken',
    h1: 'Evenemang i Apelviken',
    titleLabel: 'Evenemang i Apelviken – surf, strand & strandliv',
    intro:
      'Apelviken är Skandinaviens surfmecka – en långgrund sandstrand söder om stan där surfskolor, beachvolley och strandcaféer sätter tonen hela sommaren. Här ser du vad som händer i Apelviken, från surfkurser till strandevent.',
    emptyNote:
      'Inga evenemang i Apelviken är publicerade just nu – stranden och vågorna finns där ändå.',
    relatedSlugs: ['centrala-varberg', 'traslovslage'],
  },
  {
    name: 'Träslövsläge',
    slug: 'traslovslage',
    h1: 'Evenemang i Träslövsläge',
    titleLabel: 'Evenemang i Träslövsläge – fiskeläget & hamnen',
    intro:
      'Träslövsläge – "Läjet" – är det levande fiskeläget söder om Varberg, känt för sin hamn, sina räkor och sin genuina västkuststämning. Här hittar du hamnfester, marknader och annat som händer i Träslövsläge.',
    emptyNote:
      'Inga evenemang i Träslövsläge är publicerade just nu.',
    relatedSlugs: ['apelviken', 'tvaaker'],
  },
  {
    name: 'Tvååker',
    slug: 'tvaaker',
    h1: 'Evenemang i Tvååker',
    titleLabel: 'Evenemang i Tvååker',
    intro:
      'Tvååker är den största orten i Varbergs inland, med ett rikt föreningsliv, marknader och idrottsevenemang – och närhet till både Ästad och Öströö. Här ser du vad som är på gång i Tvååker med omnejd.',
    emptyNote:
      'Inga evenemang i Tvååker är publicerade just nu.',
    relatedSlugs: ['traslovslage', 'ovriga-kommunen'],
  },
  {
    name: 'Veddige',
    slug: 'veddige',
    h1: 'Evenemang i Veddige',
    titleLabel: 'Evenemang i Veddige – Viskadalen',
    intro:
      'Veddige ligger vackert i Viskadalen i norra kommundelen, med aktivt föreningsliv, loppisar och lokala arrangemang. Här hittar du det som händer i Veddige och Viskadalen.',
    emptyNote:
      'Inga evenemang i Veddige är publicerade just nu.',
    relatedSlugs: ['bua', 'ovriga-kommunen'],
  },
  {
    name: 'Bua',
    slug: 'bua',
    h1: 'Evenemang i Bua',
    titleLabel: 'Evenemang i Bua – fiskeläget i norr',
    intro:
      'Bua är fiskeläget i norra Varbergs kommun, med hamn, badstränder och den klassiska Bua Hamnfest som höjdpunkt på sommaren. Här ser du kommande evenemang i Bua med omnejd.',
    emptyNote:
      'Inga evenemang i Bua är publicerade just nu.',
    relatedSlugs: ['veddige', 'centrala-varberg'],
  },
  {
    name: 'Övriga kommunen',
    slug: 'ovriga-kommunen',
    h1: 'Evenemang i övriga Varbergs kommun',
    titleLabel: 'Evenemang i övriga Varbergs kommun',
    intro:
      'Varbergs kommun är stor – utanför tätorterna väntar vingårdar, fårfarmer, bygdegårdar och naturområden som fylls av marknader, konserter och gårdsbutiksevent. Här samlar vi det som händer på landsbygden runt Varberg.',
    emptyNote:
      'Inga evenemang på landsbygden är publicerade just nu.',
    relatedSlugs: ['tvaaker', 'veddige'],
  },
];

export function categoryBySlug(slug: string): TaxonomyEntry | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function areaBySlug(slug: string): TaxonomyEntry | undefined {
  return AREAS.find((a) => a.slug === slug);
}
