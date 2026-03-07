import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Heart, Users, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const About = () => {
  return (
    <>
      <Helmet>
        <title>Om oss - Evenemang i Varberg | ivarberg.nu</title>
        <meta name="description" content="ivarberg.nu är din kompletta guide till evenemang i Varberg. Vi samlar alla konserter, teater, sport och aktiviteter på ett ställe. Läs mer om vår vision och kontakta oss!" />
        <meta name="keywords" content="om ivarberg, evenemang Varberg, kontakt, arrangörer Varberg, event kalender Varberg" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Om oss - ivarberg.nu" />
        <meta property="og:description" content="Din kompletta guide till evenemang i Varberg. Vi samlar alla konserter, teater, sport och aktiviteter på ett ställe." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ivarberg.nu/om-oss" />
        <meta property="og:image" content="https://ivarberg.nu/hero_spring.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Om oss - ivarberg.nu" />
        <meta name="twitter:description" content="Din kompletta guide till evenemang i Varberg" />
        
        <link rel="canonical" href="https://ivarberg.nu/om-oss" />
      </Helmet>

      <div className="min-h-screen bg-texture">
        <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#08075C' }}>
              Om iVarberg.nu
            </h1>
            <p className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto" style={{ color: '#08075C', opacity: 0.8 }}>
              Din kompletta guide till allt som händer i Varberg. Vi samlar alla evenemang på ett ställe 
              så att du aldrig missar något spännande i vår vackra kuststad.
            </p>
          </div>

          {/* Content Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Vad vi gör */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-6 w-6" style={{ color: '#4A90E2' }} />
                <h2 className="text-xl font-bold" style={{ color: '#08075C' }}>
                  Vad vi gör
                </h2>
              </div>
              <p className="leading-relaxed" style={{ color: '#08075C', opacity: 0.7 }}>
                Vi samlar alla evenemang i Varberg, från stora konserter och teaterföreställningar 
                till lokala föreningsaktiviteter och marknader. Vårt mål är att göra det enkelt 
                för alla att upptäcka vad som händer i staden.
              </p>
            </div>

            {/* Vår vision */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="h-6 w-6" style={{ color: '#4A90E2' }} />
                <h2 className="text-xl font-bold" style={{ color: '#08075C' }}>
                  Vår vision
                </h2>
              </div>
              <p className="leading-relaxed" style={{ color: '#08075C', opacity: 0.7 }}>
                Vi vill att Varberg ska vara en levande stad där alla känner sig välkomna att delta 
                i det kulturella och sociala livet. Genom att samla all information på ett ställe 
                gör vi det lättare för människor att hitta aktiviteter som passar dem.
              </p>
            </div>

            {/* För arrangörer */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6" style={{ color: '#4A90E2' }} />
                <h2 className="text-xl font-bold" style={{ color: '#08075C' }}>
                  För arrangörer
                </h2>
              </div>
              <p className="leading-relaxed mb-4" style={{ color: '#08075C', opacity: 0.7 }}>
                Arrangerar du evenemang i Varberg? Vi hjälper dig att nå ut till fler människor 
                genom att visa ditt evenemang på vår plattform.
              </p>
              <Link to="/tips" target="_blank">
                <Button
                  size="sm"
                  style={{
                    backgroundColor: '#4A90E2',
                    color: '#FFFFFF',
                    border: 'none'
                  }}
                >
                  Tipsa oss om ditt event
                </Button>
              </Link>
            </div>

            {/* Kontakt */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-6 w-6" style={{ color: '#4A90E2' }} />
                <h2 className="text-xl font-bold" style={{ color: '#08075C' }}>
                  Kontakta oss
                </h2>
              </div>
              <div className="space-y-2" style={{ color: '#08075C', opacity: 0.7 }}>
                <p>📧 info@ivarberg.nu</p>
                <p>📍 Varberg, Sverige</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>
              Hjälp oss göra Varberg ännu mer levande!
            </h2>
            <p className="mb-6 max-w-2xl mx-auto" style={{ color: '#08075C', opacity: 0.7 }}>
              Känner du till ett event som saknas? Eller har du förslag på hur vi kan förbättra sidan? 
              Vi uppskattar all feedback och alla tips!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/tips" target="_blank">
                <Button
                  style={{
                    backgroundColor: '#4A90E2',
                    color: '#FFFFFF',
                    border: 'none'
                  }}
                >
                  Tipsa oss om ett event
                </Button>
              </Link>
              <Link to="/">
                <Button
                  variant="outline"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#08075C',
                    borderColor: '#08075C'
                  }}
                >
                  Tillbaka till evenemang
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      </div>
    </>
  );
};

export default About;
