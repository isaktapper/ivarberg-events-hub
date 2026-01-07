import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Sparkles, Music, Theater, Heart } from "lucide-react";

const EvenemangVarberg = () => {
  return (
    <>
      <Helmet>
        <title>Evenemang Varberg - Komplett guide till events i Varberg 2025 | ivarberg.nu</title>
        <meta name="description" content="Upptäck alla evenemang i Varberg! Från konserter och teater till sport och marknader. Din kompletta guide till vad som händer i Varberg - uppdateras dagligen." />
        <meta name="keywords" content="evenemang Varberg, Varberg evenemang, events Varberg, Varberg events, konserter Varberg, teater Varberg, sport Varberg" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Evenemang Varberg - Komplett guide till events" />
        <meta property="og:description" content="Upptäck alla evenemang i Varberg - från konserter och teater till sport och marknader" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ivarberg.nu/evenemang-varberg" />
        <meta property="og:image" content="https://ivarberg.nu/hero_vinter_crop.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Evenemang Varberg - Komplett guide" />
        
        <link rel="canonical" href="https://ivarberg.nu/evenemang-varberg" />
      </Helmet>

      <div className="min-h-screen bg-texture">
        <Header />
        
        <main className="container mx-auto px-4 py-12">
          <article className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#08075C' }}>
                Evenemang i Varberg - Din kompletta guide
              </h1>
              <p className="text-lg md:text-xl leading-relaxed" style={{ color: '#08075C', opacity: 0.8 }}>
                Varberg är en levande kuststad med ett rikt utbud av evenemang året runt. 
                Här hittar du allt från storslagna konserter och teaterföreställningar till 
                lokala marknader och familjeaktiviteter.
              </p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Link to="/?category=Scen" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <Theater className="h-6 w-6" style={{ color: '#4A90E2' }} />
                  <h3 className="font-bold text-lg" style={{ color: '#08075C' }}>Scen & Teater</h3>
                </div>
                <p className="text-sm" style={{ color: '#08075C', opacity: 0.7 }}>
                  Upptäck föreställningar på Varbergs Teater och andra scener
                </p>
              </Link>

              <Link to="/?category=Sport" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-6 w-6" style={{ color: '#4A90E2' }} />
                  <h3 className="font-bold text-lg" style={{ color: '#08075C' }}>Sport & Idrott</h3>
                </div>
                <p className="text-sm" style={{ color: '#08075C', opacity: 0.7 }}>
                  Fotboll, handboll och andra sportevenemang i Varberg
                </p>
              </Link>

              <Link to="/?category=Barn & Familj" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="h-6 w-6" style={{ color: '#4A90E2' }} />
                  <h3 className="font-bold text-lg" style={{ color: '#08075C' }}>Barn & Familj</h3>
                </div>
                <p className="text-sm" style={{ color: '#08075C', opacity: 0.7 }}>
                  Aktiviteter för hela familjen i Varberg
                </p>
              </Link>
            </div>

            {/* Main Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>
                  Varför välja ivarberg.nu för evenemang i Varberg?
                </h2>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  <strong>ivarberg.nu</strong> är den kompletta guiden till evenemang i Varberg. Vi samlar 
                  alla konserter, teaterföreställningar, sportevents, konstutställningar, restaurangupplevelser 
                  och familjeaktiviteter på ett och samma ställe. Istället för att leta på otaliga olika 
                  webbplatser hittar du allt här.
                </p>
                <p style={{ color: '#08075C', opacity: 0.8 }}>
                  Vi uppdaterar vår eventkalender dagligen med nya evenemang, så att du aldrig missar något 
                  spännande som händer i vår vackra kuststad. Oavsett om du är varbergbo eller besökare 
                  hjälper vi dig att hitta de bästa upplevelserna.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>
                  Populära evenemangskategorier i Varberg
                </h2>
                
                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  🎭 Konserter och musik i Varberg
                </h3>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  Varberg har en rik musikscen med allt från stora konserter på Varberg Arena till 
                  intimare spelningar på lokala pubar och restauranger. Under sommaren äger flera 
                  musikfestivaler rum längs kusten. Hitta alla <Link to="/?category=Scen" className="text-blue-600 hover:underline">konserter och musikevenemang här</Link>.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  🎬 Teater och scenkonst i Varberg
                </h3>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  Varbergs Teater är stadens kulturella hjärta med ett varierat program av föreställningar, 
                  från klassisk teater till modern scenkonst. Här hittar du också barnteater och familjeföreställningar 
                  som passar alla åldrar.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  ⚽ Sport och idrott i Varberg
                </h3>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  Följ Varbergs BoIS i fotboll, upplev spännande handbollsmatcher eller delta i lokala 
                  löparlopp. Varberg är en aktiv stad med många sportevenemang genom hela året. 
                  Se alla <Link to="/?category=Sport" className="text-blue-600 hover:underline">sportevents här</Link>.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  🍽️ Mat och dryck i Varberg
                </h3>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  Upptäck matfestivaler, vinprovningar och restaurangevenemang. Varbergs restaurangscen 
                  växer och här finns allt från hamnkrogar till gourmetrestauranger. Missa inte de 
                  populära食 eventen längs strandpromenaden.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3" style={{ color: '#08075C' }}>
                  👨‍👩‍👧‍👦 Barn och familj i Varberg
                </h3>
                <p style={{ color: '#08075C', opacity: 0.8 }}>
                  Varberg är perfekt för familjer med många aktiviteter för barn. Från barnteater och 
                  sagostunder på biblioteket till utomhusaktiviteter och lekplatser. Hitta alla 
                  <Link to="/?category=Barn & Familj" className="text-blue-600 hover:underline"> familjevänliga evenemang här</Link>.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>
                  Vad händer i Varberg just nu?
                </h2>
                <p className="mb-4" style={{ color: '#08075C', opacity: 0.8 }}>
                  Varberg erbjuder evenemang för alla smaker och intressen. Vare sig du söker efter 
                  <strong> konserter i Varberg</strong>, <strong>teater i Varberg</strong>, 
                  <strong> sportevents</strong> eller <strong>familjeaktiviteter</strong> hittar du 
                  allt samlat här på ivarberg.nu.
                </p>
                <p style={{ color: '#08075C', opacity: 0.8 }}>
                  Använd våra smarta filter för att hitta evenemang efter datum, kategori eller plats. 
                  Du kan enkelt se vad som händer idag, i helgen eller under en specifik period. 
                  Perfekt för både spontana utflykter och planerad underhållning!
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>
                  Tips för att hitta bra evenemang i Varberg
                </h2>
                <ul className="space-y-3" style={{ color: '#08075C', opacity: 0.8 }}>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>Prenumerera på vårt nyhetsbrev</strong> - få nya evenemang direkt i din inkorg</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>Använd kategorifilter</strong> - hitta snabbt evenemang som passar dina intressen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>Kolla "I helgen"</strong> - se vad som händer kommande fredag-söndag</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>Spara favoriter</strong> - dela intressanta event med vänner och familj</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>Tipsa oss</strong> - hjälp andra upptäcka event genom att dela med dig</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>
                Redo att upptäcka evenemang i Varberg?
              </h2>
              <p className="mb-6 text-lg" style={{ color: '#08075C', opacity: 0.7 }}>
                Börja utforska hundratals evenemang i Varberg - uppdateras dagligen!
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
                    <Calendar className="h-5 w-5 mr-2" />
                    Se alla evenemang
                  </Button>
                </Link>
                <Link to="/tips">
                  <Button
                    size="lg"
                    variant="outline"
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#08075C',
                      borderColor: '#08075C'
                    }}
                  >
                    <MapPin className="h-5 w-5 mr-2" />
                    Tipsa om evenemang
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

export default EvenemangVarberg;

