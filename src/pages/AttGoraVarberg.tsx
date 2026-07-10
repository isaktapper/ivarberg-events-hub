import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Compass, Sun, Coffee, Waves, Mountain, Camera } from "lucide-react";

const AttGoraVarberg = () => {
  return (
    <>
      <Helmet>
        <title>{`Att göra i Varberg - Aktiviteter och upplevelser ${new Date().getFullYear()} | ivarberg.nu`}</title>
        <meta name="description" content="Letar du efter saker att göra i Varberg? Här hittar du aktiviteter, upplevelser och evenemang för alla åldrar. Från strandhäng och kultur till mat och nöjen!" />
        <meta name="keywords" content="att göra Varberg, vad göra Varberg, aktiviteter Varberg, upplevelser Varberg, saker att göra Varberg, göra i Varberg" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Att göra i Varberg - Aktiviteter och upplevelser" />
        <meta property="og:description" content="Upptäck de bästa sakerna att göra i Varberg - aktiviteter, upplevelser och evenemang för alla" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ivarberg.nu/att-gora-i-varberg" />
        <meta property="og:image" content="https://ivarberg.nu/og-image.jpg" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Att göra i Varberg - Aktiviteter" />
        
        <link rel="canonical" href="https://ivarberg.nu/att-gora-i-varberg" />
      </Helmet>

      <div className="min-h-screen bg-texture">
        <Header />
        
        <main className="container mx-auto px-4 py-12">
          <article className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#08075C' }}>
                Att göra i Varberg - Aktiviteter för alla
              </h1>
              <p className="text-lg md:text-xl leading-relaxed" style={{ color: '#08075C', opacity: 0.8 }}>
                Varberg är en kuststad med oändliga möjligheter! Från sandstränder och historiska sevärdheter 
                till pulserad kultur och härlig mat. Här hittar du inspiration till ditt nästa äventyr i Varberg.
              </p>
            </div>

            {/* Quick Category Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-sm text-center hover:shadow-md transition-all">
                <Waves className="h-8 w-8 mx-auto mb-3" style={{ color: '#4A90E2' }} />
                <h3 className="font-bold" style={{ color: '#08075C' }}>Strand & Bad</h3>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm text-center hover:shadow-md transition-all">
                <Mountain className="h-8 w-8 mx-auto mb-3" style={{ color: '#4A90E2' }} />
                <h3 className="font-bold" style={{ color: '#08075C' }}>Natur & Friluftsliv</h3>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm text-center hover:shadow-md transition-all">
                <Coffee className="h-8 w-8 mx-auto mb-3" style={{ color: '#4A90E2' }} />
                <h3 className="font-bold" style={{ color: '#08075C' }}>Mat & Dryck</h3>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm text-center hover:shadow-md transition-all">
                <Camera className="h-8 w-8 mx-auto mb-3" style={{ color: '#4A90E2' }} />
                <h3 className="font-bold" style={{ color: '#08075C' }}>Kultur & Historia</h3>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm text-center hover:shadow-md transition-all">
                <Sun className="h-8 w-8 mx-auto mb-3" style={{ color: '#4A90E2' }} />
                <h3 className="font-bold" style={{ color: '#08075C' }}>Shopping & Torg</h3>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm text-center hover:shadow-md transition-all">
                <Compass className="h-8 w-8 mx-auto mb-3" style={{ color: '#4A90E2' }} />
                <h3 className="font-bold" style={{ color: '#08075C' }}>Guidningar</h3>
              </div>
            </div>

            {/* Main Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>
                  Populära saker att göra i Varberg
                </h2>
                
                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  🏖️ Stranden och havet
                </h3>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  Varbergs stränder är kända över hela Sverige! Apelvikens långgrunda sandstrand är perfekt 
                  för barnfamiljer, medan surfarna älskar vågorna vid Träslövsläge och Bua. Under sommaren 
                  pulserar strandpromenaden av liv med restauranger, caféer och evenemang.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  🏰 Varbergs fästning
                </h3>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  Den imponerande fästningen från 1200-talet är stadens landmärke. Här finns länsmuseet 
                  med den berömda "Bockstensmannen" - en 600 år gammal medeltidsman vars kläder bevarats 
                  i en myr. Gratis entré och fantastisk utsikt över havet från fästningsmurarna!
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  🎭 Kultur och nöjen
                </h3>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  Varbergs Teater erbjuder allt från klassisk teater till stand-up och konserter. 
                  Besök Societetsparken för utomhuskonserter under sommaren, eller upptäck stadens 
                  växande konstscen med flera gallerier. Se alla <Link to="/?category=Scen" className="text-blue-600 hover:underline">kultur evenemang här</Link>.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  🍽️ Restauranger och caféer
                </h3>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  Från hamnkrogar med färsk fisk till trendiga restauranger och mysiga caféer - Varbergs 
                  matscen har växt enormt de senaste åren. Missa inte de populära foodtrucks längs 
                  strandpromenaden eller de charmiga cafée i gamla stan. Hitta <Link to="/?category=Mat & Dryck" className="text-blue-600 hover:underline">matevents här</Link>.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  🚴 Cykling och vandring
                </h3>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  Kattegattleden går genom Varberg - Sveriges populäraste cykelväg längs kusten. 
                  För vandrare finns Hallandsleden och massor av natursköna vandrings leder i omgivningarna. 
                  Perfekt för en dagsutflykt eller längre äventyr!
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  👨‍👩‍👧‍👦 För barnfamiljer
                </h3>
                <p style={{ color: '#08075C', opacity: 0.8 }}>
                  Varberg är perfekt för familjer! Utöver stranden finns lekplatser, Äventyrsbadet, 
                  minigolf och olika <Link to="/?category=Barn & Familj" className="text-blue-600 hover:underline">barnaktiviteter och evenemang</Link> 
                  året runt. Societetsparken har stor lekplats och under sommaren anordnas barnaktiviteter.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>
                  Vad göra i Varberg idag?
                </h2>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  Undrar du <strong>vad göra i Varberg</strong> just idag? På ivarberg.nu samlar vi 
                  alla aktiviteter och evenemang på ett ställe. Oavsett om du letar efter något att 
                  göra spontant idag eller planerar din vistelse i förväg hjälper vi dig hitta de 
                  bästa upplevelserna.
                </p>
                <p style={{ color: '#08075C', opacity: 0.8 }}>
                  Använd vårt datumfilter för att se exakt vad som händer idag, i helgen eller under 
                  din semestervecka. Filtrera på kategori för att hitta aktiviteter som passar dina 
                  intressen - från sport och kultur till mat och natur.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>
                  Säsongsaktiviteter i Varberg
                </h2>
                
                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  ☀️ Sommar (juni-augusti)
                </h3>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  Sommaren är Varbergs högsäsong! Badliv, strandvolleyboll, surfing, utomhuskonserter, 
                  foodtrucks och levande strandpromenad. Missa inte sommartorget med lokala producenter.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  🍂 Höst (september-november)
                </h3>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  Perfekt tid för vandringar längs kusten, svampplockning i skogarna och besök på lokala 
                  farmer's markets. Teatersäsongen drar igång och höststormarna ger spektakulära vågor.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  ❄️ Vinter (december-februari)
                </h3>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  Mysig stadskärna med julmarknad i december. Kallbadhuset erbjuder vinterbad och bastu. 
                  Perfekt tid för musebesök och varma caféstunder. Se alla <Link to="/?category=Jul" className="text-blue-600 hover:underline">julevents här</Link>.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  🌸 Vår (mars-maj)
                </h3>
                <p style={{ color: '#08075C', opacity: 0.8 }}>
                  Staden vaknar till liv! Utomhuskaféer öppnar, cykelturerna startar och naturen blommar. 
                  Perfekt tid för vandringar och att utforska omgivningarna innan sommarrushen.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>
                  Planera ditt besök i Varberg
                </h2>
                <ul className="space-y-3" style={{ color: '#08075C', opacity: 0.8 }}>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>Boka boende i förväg</strong> - särskilt under sommarmånaderna</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>Kolla väderprognosen</strong> - packavinden en jacka för havsbris</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>Använd vår eventkalender</strong> - se vad som händer under din vistelse</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>Parkering</strong> - flera parkeringsplatser nära centrum och stranden</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>Cykelhyra</strong> - perfekt sätt att utforska staden och kusten</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>
                Upptäck vad Varberg har att erbjuda!
              </h2>
              <p className="mb-6 text-lg" style={{ color: '#08075C', opacity: 0.7 }}>
                Se alla aktiviteter och evenemang i Varberg - uppdateras dagligen
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button
                    size="lg"
                    style={{
                      backgroundColor: '#4A90E2',
                      color: '#FFFFFF',
                      border: 'none'
                    }}
                  >
                    <Compass className="h-5 w-5 mr-2" />
                    Utforska evenemang
                  </Button>
                </Link>
                <Link to="/evenemang-varberg">
                  <Button
                    size="lg"
                    variant="outline"
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#08075C',
                      borderColor: '#08075C'
                    }}
                  >
                    Läs mer om evenemang
                  </Button>
                </Link>
              </div>
            </div>
          </article>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default AttGoraVarberg;

