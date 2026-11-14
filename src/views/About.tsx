"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Heart, Users, Calendar, MapPin } from "lucide-react";
import { Link } from "@/lib/router";
import { Helmet } from "@/lib/helmet";
import { useSite } from "@/config/SiteProvider";
import { VARBERG_SLUG } from "@/config/site";

const About = () => {
  const site = useSite();
  const city = site.cityName;
  const isVarberg = site.slug === VARBERG_SLUG;
  // Varbergs texter står kvar ordagrant. Andra städer får en kort, neutral text.
  const text = isVarberg
    ? {
        heading: "Om iVarberg.nu",
        intro:
          "Din kompletta guide till allt som händer i Varberg. Vi samlar alla evenemang på ett ställe så att du aldrig missar något spännande i vår vackra kuststad.",
        whatWeDo:
          "Vi samlar alla evenemang i Varberg, från stora konserter och teaterföreställningar till lokala föreningsaktiviteter och marknader. Vårt mål är att göra det enkelt för alla att upptäcka vad som händer i staden.",
        vision:
          "Vi vill att Varberg ska vara en levande stad där alla känner sig välkomna att delta i det kulturella och sociala livet. Genom att samla all information på ett ställe gör vi det lättare för människor att hitta aktiviteter som passar dem.",
        organizers:
          "Arrangerar du evenemang i Varberg? Vi hjälper dig att nå ut till fler människor genom att visa ditt evenemang på vår plattform.",
        contact: ["📧 info@ivarberg.nu", "📍 Varberg, Sverige"],
        cta: "Hjälp oss göra Varberg ännu mer levande!",
      }
    : {
        heading: `Om ${site.name}`,
        intro: `${site.name} samlar evenemang i ${city} på ett ställe, så att det blir lätt att se vad som händer.`,
        whatWeDo: `Vi samlar evenemang i ${city}, både stora och små. Målet är att det ska vara enkelt att hitta något att göra.`,
        vision: `Vi vill att fler ska hitta till det som händer i ${city}. Därför samlar vi allt på ett ställe.`,
        organizers: `Arrangerar du evenemang i ${city}? Tipsa oss så visar vi det här.`,
        contact: [
          site.contact.email ? `📧 ${site.contact.email}` : null,
          site.contact.address ? `📍 ${site.contact.address}` : null,
        ].filter((line): line is string => !!line),
        cta: "Saknar du ett evenemang?",
      };

  return (
    <>
      <Helmet>
        <title>{`Om oss - Evenemang i ${city} | ${site.name}`}</title>
        <meta name="description" content={`${site.name} är din kompletta guide till evenemang i ${city}. Vi samlar alla konserter, teater, sport och aktiviteter på ett ställe. Läs mer om vår vision och kontakta oss!`} />
        <meta name="keywords" content={`om ${isVarberg ? "ivarberg" : site.name}, evenemang ${city}, kontakt, arrangörer ${city}, event kalender ${city}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`Om oss - ${site.name}`} />
        <meta property="og:description" content={`Din kompletta guide till evenemang i ${city}. Vi samlar alla konserter, teater, sport och aktiviteter på ett ställe.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${site.url}/om-oss`} />
        {site.theme.ogImage && <meta property="og:image" content={site.theme.ogImage} />}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Om oss - ${site.name}`} />
        <meta name="twitter:description" content={`Din kompletta guide till evenemang i ${city}`} />
        
        <link rel="canonical" href={`${site.url}/om-oss`} />
      </Helmet>

      <div className="min-h-screen bg-texture">
        <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'hsl(var(--ink))' }}>
              {text.heading}
            </h1>
            <p className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto" style={{ color: 'hsl(var(--ink))', opacity: 0.8 }}>
              {text.intro}
            </p>
          </div>

          {/* Content Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Vad vi gör */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-6 w-6" style={{ color: '#0F5AA6' }} />
                <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--ink))' }}>
                  Vad vi gör
                </h2>
              </div>
              <p className="leading-relaxed" style={{ color: 'hsl(var(--ink))', opacity: 0.7 }}>
                {text.whatWeDo}
              </p>
            </div>

            {/* Vår vision */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="h-6 w-6" style={{ color: '#0F5AA6' }} />
                <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--ink))' }}>
                  Vår vision
                </h2>
              </div>
              <p className="leading-relaxed" style={{ color: 'hsl(var(--ink))', opacity: 0.7 }}>
                {text.vision}
              </p>
            </div>

            {/* För arrangörer */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6" style={{ color: '#0F5AA6' }} />
                <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--ink))' }}>
                  För arrangörer
                </h2>
              </div>
              <p className="leading-relaxed mb-4" style={{ color: 'hsl(var(--ink))', opacity: 0.7 }}>
                {text.organizers}
              </p>
              <Link to="/tips" target="_blank">
                <Button
                  size="sm"
                  style={{
                    backgroundColor: '#0F5AA6',
                    color: '#FFFFFF',
                    border: 'none'
                  }}
                >
                  Tipsa oss om ditt event
                </Button>
              </Link>
            </div>

            {/* Kontakt */}
            {text.contact.length > 0 && <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-6 w-6" style={{ color: '#0F5AA6' }} />
                <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--ink))' }}>
                  Kontakta oss
                </h2>
              </div>
              <div className="space-y-2" style={{ color: 'hsl(var(--ink))', opacity: 0.7 }}>
                {text.contact.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>}
          </div>

          {/* Call to Action */}
          <div className="text-center bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'hsl(var(--ink))' }}>
              {text.cta}
            </h2>
            <p className="mb-6 max-w-2xl mx-auto" style={{ color: 'hsl(var(--ink))', opacity: 0.7 }}>
              Känner du till ett event som saknas? Eller har du förslag på hur vi kan förbättra sidan? 
              Vi uppskattar all feedback och alla tips!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/tips" target="_blank">
                <Button
                  style={{
                    backgroundColor: '#0F5AA6',
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
                    color: 'hsl(var(--ink))',
                    borderColor: 'hsl(var(--ink))'
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
