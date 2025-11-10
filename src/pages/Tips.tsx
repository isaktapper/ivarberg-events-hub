import { useState } from "react";
import { MessageCircle, CheckCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/DateTimePicker";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { CategoryMultiSelect } from "@/components/CategoryMultiSelect";
import { submitEventTip } from "@/services/eventService";
import { EventCategory } from "@/types/event";

const Tips = () => {
  const [formData, setFormData] = useState({
    name: '',
    date_time: '',
    location: '',
    description: '',
    categories: [] as EventCategory[],
    image_url: '',
    organizer_event_url: '',
    submitter_email: '',
    submitter_name: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string | EventCategory[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitEventTip({
        event_name: formData.name,
        date_time: formData.date_time,
        event_location: formData.location,
        description: formData.description,
        categories: formData.categories,
        image_url: formData.image_url || undefined,
        website_url: formData.organizer_event_url || undefined,
        venue_name: formData.location,
        submitter_email: formData.submitter_email || undefined,
        submitter_name: formData.submitter_name || undefined
      });

      if (result.success) {
        setIsSubmitted(true);
        console.log('Tip submitted successfully with ID:', result.tip_id);
      } else {
        setError(result.error || 'Ett fel uppstod vid inlämning av tips');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Ett oväntat fel uppstod. Försök igen senare.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <Helmet>
          <title>Tack för ditt tips! - ivarberg.nu</title>
          <meta name="description" content="Ditt evenemangstips har mottagits och kommer granskas innan publicering på ivarberg.nu - Varbergs eventkalender." />
        </Helmet>
        
        <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
          <Header />
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: '#4A90E2' }} />
              <h1 className="text-3xl font-bold mb-4" style={{ color: '#08075C' }}>
                Tack för ditt tips!
              </h1>
              <p className="text-lg" style={{ color: '#08075C' }}>
                Ditt evenemang har skapats och kommer att granskas innan det publiceras.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#08075C' }}>
                Vad händer nu?
              </h2>
              <div className="text-left space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold" style={{ color: '#4A90E2' }}>1</span>
                  </div>
                  <p className="text-sm" style={{ color: '#08075C' }}>
                    Vi granskar ditt evenemang för att säkerställa kvalitet och korrekt information
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold" style={{ color: '#4A90E2' }}>2</span>
                  </div>
                  <p className="text-sm" style={{ color: '#08075C' }}>
                    Om allt ser bra ut publiceras evenemanget på vår sida
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold" style={{ color: '#4A90E2' }}>3</span>
                  </div>
                  <p className="text-sm" style={{ color: '#08075C' }}>
                    Du får en bekräftelse när evenemanget är live
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3"
                style={{ backgroundColor: '#4A90E2', color: 'white' }}
              >
                Tillbaka till startsidan
              </Button>
            </div>
          </div>
        </div>

        <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Tipsa oss om evenemang - Varberg | ivarberg.nu</title>
        <meta name="description" content="Tipsa oss om evenemang i Varberg! Hjälp andra att upptäcka konserter, teater, sport och aktiviteter. Kostnadsfritt att lägga till evenemang på ivarberg.nu." />
        <meta name="keywords" content="tipsa evenemang Varberg, lägg till event Varberg, publicera evenemang Varberg, arrangörer Varberg" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Tipsa oss om evenemang - ivarberg.nu" />
        <meta property="og:description" content="Hjälp andra att upptäcka evenemang i Varberg. Kostnadsfritt att lägga till evenemang!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ivarberg.nu/tips" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Tipsa oss om evenemang - ivarberg.nu" />
        
        <link rel="canonical" href="https://ivarberg.nu/tips" />
      </Helmet>

      <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
        <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#4A90E2' }} />
            <h1 className="text-3xl font-bold mb-4" style={{ color: '#08075C' }}>
              Tipsa oss om ett evenemang
            </h1>
            <p className="text-lg" style={{ color: '#08075C' }}>
              Hjälp oss att hålla Varbergs evenemangskalender uppdaterad!
            </p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm border">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Namn på evenemang */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#08075C' }}>
                  Namn på evenemang *
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="T.ex. Konsert med lokala artister"
                  className="w-full"
                />
              </div>

              {/* Datum och tid */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#08075C' }}>
                  Datum och tid *
                </label>
                <DateTimePicker
                  value={formData.date_time}
                  onChange={(value) => handleInputChange('date_time', value)}
                  required
                />
              </div>

              {/* Plats */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#08075C' }}>
                  Plats *
                </label>
                <AddressAutocomplete
                  value={formData.location}
                  onChange={(value) => handleInputChange('location', value)}
                  onPlaceSelect={(place) => {
                    console.log('Place selected in Tips form:', place);
                    // Place is already handled by onChange above
                  }}
                  placeholder="T.ex. Varbergs Teater, Teatergatan 1"
                  required
                />
              </div>

              {/* Beskrivning */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#08075C' }}>
                  Beskrivning *
                </label>
                <Textarea
                  required
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Beskriv evenemanget så detaljerat som möjligt..."
                  className="w-full min-h-[120px]"
                />
              </div>

              {/* Kategorier */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#08075C' }}>
                  Kategori/er *
                </label>
                <CategoryMultiSelect
                  selectedCategories={formData.categories}
                  onCategoriesChange={(categories) => handleInputChange('categories', categories)}
                />
              </div>

              {/* Bild URL */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#08075C' }}>
                  Bild (via URL)
                </label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  placeholder="https://example.com/bild.jpg"
                  className="w-full"
                  type="url"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Länka till en bild som representerar evenemanget
                </p>
              </div>

              {/* Länk till hemsida */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#08075C' }}>
                  Länk till hemsida
                </label>
                <Input
                  value={formData.organizer_event_url}
                  onChange={(e) => handleInputChange('organizer_event_url', e.target.value)}
                  placeholder="https://example.com/evenemang"
                  className="w-full"
                  type="url"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Länk till arrangörens sida eller biljettförsäljning
                </p>
              </div>

              {/* Din e-postadress */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#08075C' }}>
                  Din e-postadress *
                </label>
                <Input
                  type="email"
                  required
                  value={formData.submitter_email}
                  onChange={(e) => handleInputChange('submitter_email', e.target.value)}
                  placeholder="din@email.se"
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Vi behöver din e-post om vi har frågor om evenemanget
                </p>
              </div>

              {/* Din namn (valfritt) */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#08075C' }}>
                  Ditt namn (valfritt)
                </label>
                <Input
                  value={formData.submitter_name}
                  onChange={(e) => handleInputChange('submitter_name', e.target.value)}
                  placeholder="Ditt namn"
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Hjälp oss kontakta dig om vi har frågor
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3"
                style={{ backgroundColor: '#4A90E2', color: 'white' }}
              >
                {isSubmitting ? 'Skickar in tips...' : 'Skicka in tips'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
      </div>
    </>
  );
};

export default Tips;