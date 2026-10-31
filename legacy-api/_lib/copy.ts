// Handskriven svensk prosa för guide-sidorna. Räddad och omarbetad från de
// gamla React-sidorna (EvenemangVarberg/AttGoraVarberg/VarbergKalender) –
// länkarna pekar nu på riktiga landningssidor i stället för döda filter.

import type { FaqItem } from './jsonld';

// ---------- /att-gora-i-varberg ----------

export const ATT_GORA_INTRO =
  'Varberg är en kuststad med oändliga möjligheter – sandstränder och surfvågor, en 700-årig fästning, ' +
  'kallbad året runt och en matscen som vuxit ur sin kostym. Här är våra bästa tips på vad du kan göra i Varberg, ' +
  'tillsammans med det som faktiskt händer just nu.';

export const SEASONS_HTML = `<h2>Säsongsguide – Varberg året runt</h2>
<h3>☀️ Sommar (juni–augusti)</h3>
<p>Sommaren är Varbergs högsäsong: badliv, beachvolley, surfing, utomhuskonserter och en strandpromenad som lever från morgon till kväll. Missa inte torghandeln med lokala producenter.</p>
<h3>🍂 Höst (september–november)</h3>
<p>Perfekt tid för vandringar längs kusten och i <a href="/omrade/ovriga-kommunen">Åkulla bokskogar</a>, svampplockning och skördemarknader. Teatersäsongen drar igång och höststormarna bjuder på spektakulära vågor.</p>
<h3>❄️ Vinter (december–februari)</h3>
<p>Mysig stadskärna med <a href="/kategori/jul">julmarknad och julkonserter</a> i december. Kallbadhuset erbjuder vinterbad och bastu, och museet på fästningen är ett givet regnvädersbesök.</p>
<h3>🌸 Vår (mars–maj)</h3>
<p>Staden vaknar: uteserveringarna öppnar, cykelsäsongen på Kattegattleden börjar och naturen på <a href="/omrade/getteron">Getterön</a> exploderar av fågelliv.</p>`;

export const PLANERA_HTML = `<h2>Planera ditt besök i Varberg</h2>
<ul>
<li><strong>Boka boende i förväg</strong> – särskilt under sommarmånaderna.</li>
<li><strong>Kolla väderprognosen</strong> – och packa en jacka för havsbrisen.</li>
<li><strong>Använd eventkalendern</strong> – se <a href="/idag">vad som händer idag</a> eller <a href="/i-helgen">i helgen</a> under din vistelse.</li>
<li><strong>Parkering</strong> – flera parkeringar nära centrum och stranden.</li>
<li><strong>Hyr cykel</strong> – det perfekta sättet att utforska staden och kusten.</li>
</ul>`;

// FAQ – visas på sidan och emitteras som FAQPage JSON-LD (aText = ren text för schemat)
export const ATT_GORA_FAQ: (FaqItem & { aHtml: string })[] = [
  {
    q: 'Vad kan man göra i Varberg idag?',
    a: 'På ivarberg.nu/idag hittar du en dagsfärsk lista över allt som händer i Varberg idag – konserter, marknader, sport och familjeaktiviteter med tid, plats och pris. Listan uppdateras löpande under dagen.',
    aHtml:
      'På <a href="/idag">sidan Vad händer i Varberg idag</a> hittar du en dagsfärsk lista över allt som händer – konserter, marknader, sport och familjeaktiviteter med tid, plats och pris.',
  },
  {
    q: 'Vad kan man göra i Varberg med barn?',
    a: 'Varberg är mycket familjevänligt: Apelvikens långgrunda strand, lekplatsen i Societetsparken, fästningen med museet och Öströö fårfarm är klassiker. Under lov och helger fylls kalendern med barnteater och familjeaktiviteter.',
    aHtml:
      'Apelvikens långgrunda strand, lekplatsen i Societetsparken, fästningen och Öströö fårfarm är klassiker. Se alla <a href="/kategori/barn-familj">barn- och familjeaktiviteter i Varberg</a>.',
  },
  {
    q: 'Vad är Varberg känt för?',
    a: 'Varberg är känt för Varbergs fästning med Bockstensmannen, Kallbadhuset, surfingen i Apelviken, kurortstraditionen och världsarvet Grimeton radiostation.',
    aHtml:
      'Fästningen med Bockstensmannen, Kallbadhuset, surfingen i Apelviken, kurortstraditionen och världsarvet Grimeton radiostation.',
  },
  {
    q: 'Vad gör man i Varberg när det regnar?',
    a: 'Besök länsmuseet på fästningen, boka in ett kallbad med bastu på Kallbadhuset, gå på bio eller slå dig ner på något av stadskärnans många kaféer. Eventkalendern visar dagens inomhusaktiviteter.',
    aHtml:
      'Länsmuseet på fästningen, kallbad med bastu, bio eller något av stadskärnans kaféer – och <a href="/idag">dagens kalender</a> visar vad mer som händer inomhus.',
  },
];

// ---------- /evenemang-varberg ----------

export const EVENEMANG_INTRO =
  'Varberg är en levande kuststad med ett rikt utbud av evenemang året runt – konserter, teater, sport, marknader ' +
  'och familjeaktiviteter från arrangörer i hela kommunen. Det här är hubben: härifrån når du varje kategori, ' +
  'varje område och det som händer just den här veckan.';

export const VARFOR_HTML = `<h2>Varför ivarberg.nu?</h2>
<p>I stället för att leta på otaliga webbplatser, anslagstavlor och sociala flöden hittar du allt på ett ställe. Vi samlar evenemang från arrangörer i hela Varbergs kommun, uppdaterar listan varje dag och visar alltid tid, plats och pris. Helt gratis, utan konto.</p>
<h2>Tips för att hitta rätt evenemang</h2>
<ul>
<li><strong>Ont om tid?</strong> Börja med <a href="/idag">idag</a> eller <a href="/i-helgen">i helgen</a>.</li>
<li><strong>Vet du vad du gillar?</strong> Gå direkt till en kategori – till exempel <a href="/kategori/scen">scen</a>, <a href="/kategori/sport">sport</a> eller <a href="/kategori/mat-dryck">mat &amp; dryck</a>.</li>
<li><strong>Bor du utanför stan?</strong> Områdessidorna visar det som händer nära dig – från <a href="/omrade/apelviken">Apelviken</a> till <a href="/omrade/bua">Bua</a>.</li>
<li><strong>Arrangerar du själv?</strong> <a href="/tips">Tipsa oss</a> så når du hela Varberg.</li>
</ul>`;

// ---------- /varberg-kalender ----------

export const KALENDER_INTRO =
  'Varbergs eventkalender dag för dag – de kommande två veckorna i ett svep. Kalendern uppdateras varje dag ' +
  'och samlar arrangörer från hela kommunen, så att du kan planera veckan utan att missa något.';

export const KALENDER_HOW_HTML = `<h2>Så använder du kalendern</h2>
<p>Evenemangen nedan är grupperade per dag – scrolla till det datum du är nyfiken på. Varje evenemang har en egen sida med tid, plats, pris och vägbeskrivning. Vill du hellre filtrera själv, på kategori eller plats, använder du <a href="/">hela kalendern på startsidan</a>.</p>
<h2>För arrangörer</h2>
<p>Arrangerar du något i Varberg som inte syns här? <a href="/tips">Tipsa oss</a> – det är gratis, och ditt evenemang når både kalenderns besökare och våra följare på Instagram.</p>`;
