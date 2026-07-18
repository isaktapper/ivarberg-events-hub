import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Bell, Filter, Star } from "lucide-react";

const VarbergKalender = () => {
  return (
    <>
      <Helmet>
        <title>{`Varberg Kalender - Eventkalender för Varberg ${new Date().getFullYear()} | ivarberg.nu`}</title>
        <meta name="description" content="Din kompletta eventkalender för Varberg. Se alla konserter, teater, sport och aktiviteter i en kalender. Filtrera efter datum och kategori - missa aldrig ett evenemang!" />
        <meta name="keywords" content="Varberg kalender, eventkalender Varberg, kalender Varberg, events kalender, Varberg händelsekalender, vad händer Varberg" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Varberg Kalender - Eventkalender för Varberg" />
        <meta property="og:description" content="Se alla evenemang i Varberg i en kalender - konserter, teater, sport och mycket mer" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ivarberg.nu/varberg-kalender" />
        <meta property="og:image" content="https://ivarberg.nu/og-image.jpg" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Varberg Kalender - Eventkalender" />
        
        <link rel="canonical" href="https://ivarberg.nu/varberg-kalender" />
      </Helmet>

      <div className="min-h-screen bg-texture">
        <Header />
        
        <main className="container mx-auto px-4 py-12">
          <article className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#10214B' }}>
                Varberg Kalender - Din kompletta eventkalender
              </h1>
              <p className="text-lg md:text-xl leading-relaxed" style={{ color: '#10214B', opacity: 0.8 }}>
                Håll koll på alla evenemang i Varberg med vår smarta eventkalender. 
                Filtrera, planera och upptäck - allt samlat på ett ställe!
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="h-8 w-8" style={{ color: '#0F5AA6' }} />
                  <h3 className="font-bold text-lg" style={{ color: '#10214B' }}>Komplett översikt</h3>
                </div>
                <p className="text-sm" style={{ color: '#10214B', opacity: 0.7 }}>
                  Se alla evenemang i Varberg i en och samma kalender - från konserter och teater 
                  till sport och familjeaktiviteter
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Filter className="h-8 w-8" style={{ color: '#0F5AA6' }} />
                  <h3 className="font-bold text-lg" style={{ color: '#10214B' }}>Smarta filter</h3>
                </div>
                <p className="text-sm" style={{ color: '#10214B', opacity: 0.7 }}>
                  Filtrera efter datum, kategori och plats för att snabbt hitta evenemang 
                  som passar dig och din familj
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Bell className="h-8 w-8" style={{ color: '#0F5AA6' }} />
                  <h3 className="font-bold text-lg" style={{ color: '#10214B' }}>Dagliga uppdateringar</h3>
                </div>
                <p className="text-sm" style={{ color: '#10214B', opacity: 0.7 }}>
                  Vi uppdaterar kalendern dagligen med nya evenemang så att du alltid har 
                  den senaste informationen
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Star className="h-8 w-8" style={{ color: '#0F5AA6' }} />
                  <h3 className="font-bold text-lg" style={{ color: '#10214B' }}>För alla</h3>
                </div>
                <p className="text-sm" style={{ color: '#10214B', opacity: 0.7 }}>
                  Oavsett om du är 8 eller 80, singel eller barnfamilj - här hittar du 
                  aktiviteter för alla intressen och åldrar
                </p>
              </div>
            </div>

            {/* Main Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#10214B' }}>
                  Varför använda iVarbergs eventkalender?
                </h2>
                <p className="mb-4" style={{ color: '#10214B', opacity: 0.8 }}>
                  Letar du efter en <strong>eventkalender för Varberg</strong>? ivarberg.nu är den mest 
                  kompletta kalendern över evenemang i Varberg. Vi samlar allt från stora konserter och 
                  fotbollsmatcher till lokala marknader och barnaktiviteter - allt i en enda kalender.
                </p>
                <p className="mb-4" style={{ color: '#10214B', opacity: 0.8 }}>
                  Istället för att behöva besöka otaliga olika webbplatser, titta i flera kalendrar och 
                  riskera att missa saker hittar du allt här. Vår kalender uppdateras kontinuerligt när 
                  nya evenemang läggs till, så du ser alltid det senaste som händer i Varberg.
                </p>
                <p style={{ color: '#10214B', opacity: 0.8 }}>
                  Det bästa? Det är helt gratis att använda! Inga konton att skapa, inga avgifter - 
                  bara en enkel och överskådlig kalender över allt som händer i vår vackra kuststad.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#10214B' }}>
                  Så använder du Varbergs eventkalender
                </h2>
                
                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#10214B' }}>
                  📅 Välj datum
                </h3>
                <p className="mb-4" style={{ color: '#10214B', opacity: 0.8 }}>
                  Använd vårt datumfilter för att se vad som händer en specifik dag, i helgen eller 
                  under en hel vecka. Du kan också använda snabbfiltren "Idag" eller "I helgen" för 
                  att snabbt se aktuella evenemang.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#10214B' }}>
                  🎭 Filtrera efter kategori
                </h3>
                <p className="mb-4" style={{ color: '#10214B', opacity: 0.8 }}>
                  Intresserad av musik? Välj <Link to="/?category=Scen" className="text-blue-600 hover:underline">Scen och teater</Link>. 
                  Söker familjeaktiviteter? Filtrera på <Link to="/?category=Barn & Familj" className="text-blue-600 hover:underline">Barn & Familj</Link>. 
                  Vi har 13 olika kategorier att välja mellan.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#10214B' }}>
                  📍 Välj plats
                </h3>
                <p className="mb-4" style={{ color: '#10214B', opacity: 0.8 }}>
                  Filtrera evenemang efter var i Varberg de äger rum. Kanske vill du bara se vad som 
                  händer i centrum, eller kanske du letar efter events längs strandpromenaden?
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#10214B' }}>
                  💾 Spara favoriter
                </h3>
                <p style={{ color: '#10214B', opacity: 0.8 }}>
                  När du hittar ett intressant evenemang kan du enkelt dela det med vänner och familj, 
                  eller lägga till det i din egen kalender med vår "Lägg till"-funktion.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#10214B' }}>
                  Vad finns i kalendern?
                </h2>
                <p className="mb-4" style={{ color: '#10214B', opacity: 0.8 }}>
                  Varbergs eventkalender innehåller alla typer av evenemang:
                </p>
                <ul className="space-y-2 mb-4" style={{ color: '#10214B', opacity: 0.8 }}>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>Konserter och musik</strong> - från stora artister till lokala band</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>Teater och föreställningar</strong> - Varbergs Teater och gästspel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>Sport och idrott</strong> - fotboll, handboll, löplopp och mer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>Utställningar och konst</strong> - gallerier och konstvisningar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>Mat och dryck</strong> - restaurangevenemang och matfestivaler</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>Barn och familj</strong> - barnteater, lekaktiviteter och familjedagar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>Marknader och torg</strong> - lokala producenter och hantverk</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>Nattliv</strong> - klubbar, pubar och barer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>Guidade visningar</strong> - lär känna Varbergs historia</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>Föreläsningar</strong> - inspirerande talare och diskussioner</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#10214B' }}>
                  Planera din vecka i Varberg
                </h2>
                <p className="mb-4" style={{ color: '#10214B', opacity: 0.8 }}>
                  Med Varbergs eventkalender blir det enkelt att planera din vecka eller semester. 
                  Kanske vill du se en teaterföreställning på fredag, gå på en marknad på lördag och 
                  ta familjen på en aktivitet på söndag? Använd vår kalender för att få en översikt 
                  och boka in dina favoritevenemang.
                </p>
                <p style={{ color: '#10214B', opacity: 0.8 }}>
                  Kalendern visar även information om tider, platser och priser (när tillgängligt), 
                  så du kan planera din dag effektivt. Många evenemang har också direktlänkar till 
                  arrangörens webbplats där du kan köpa biljetter eller läsa mer.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#10214B' }}>
                  För arrangörer
                </h2>
                <p className="mb-4" style={{ color: '#10214B', opacity: 0.8 }}>
                  Arrangerar du evenemang i Varberg? Lägg till ditt event i vår kalender så når du 
                  tusentals potentiella besökare! Det är helt <strong>kostnadsfritt</strong> att lägga 
                  till evenemang på ivarberg.nu.
                </p>
                <p className="mb-4" style={{ color: '#10214B', opacity: 0.8 }}>
                  När du skickar in ditt evenemang granskar vi informationen och publicerar det i 
                  vår kalender. Ditt evenemang blir då synligt för alla som söker efter aktiviteter 
                  i Varberg - perfekt för att nå ut till både lokala varbergsbor och besökare.
                </p>
                <div className="mt-6">
                  <Link to="/tips">
                    <Button
                      style={{
                        backgroundColor: '#0F5AA6',
                        color: '#FFFFFF',
                        border: 'none'
                      }}
                    >
                      Lägg till ditt evenemang
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#10214B' }}>
                Utforska Varbergs eventkalender nu!
              </h2>
              <p className="mb-6 text-lg" style={{ color: '#10214B', opacity: 0.7 }}>
                Se alla evenemang i en kalender - uppdateras dagligen med nya aktiviteter
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button
                    size="lg"
                    style={{
                      backgroundColor: '#0F5AA6',
                      color: '#FFFFFF',
                      border: 'none'
                    }}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Till eventkalendern
                  </Button>
                </Link>
                <Link to="/att-gora-i-varberg">
                  <Button
                    size="lg"
                    variant="outline"
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#10214B',
                      borderColor: '#10214B'
                    }}
                  >
                    Läs mer om Varberg
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

export default VarbergKalender;

