import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

const Tips = () => {
  const [formData, setFormData] = useState({
    event_name: '',
    event_date: '',
    event_location: '',
    submitter_email: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('event_tips')
        .insert([formData]);

      if (error) {
        console.error('Error submitting tip:', error);
        alert('Ett fel uppstod. Försök igen senare.');
      } else {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ett fel uppstod. Försök igen senare.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>
                Tack för ditt tips!
              </h1>
              <p className="mb-6" style={{ color: '#08075C', opacity: 0.7 }}>
                Vi har tagit emot ditt eventtips och kommer att granska det. 
                Om vi publicerar eventet kommer det att synas på ivarberg.nu inom kort.
              </p>
              <Button
                onClick={() => window.close()}
                style={{
                  backgroundColor: '#4A90E2',
                  color: '#FFFFFF',
                  border: 'none'
                }}
              >
                Stäng fönster
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <MessageCircle className="h-8 w-8" style={{ color: '#4A90E2' }} />
                <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#08075C' }}>
                  Tipsa oss om ett event
                </h1>
              </div>
              <p style={{ color: '#08075C', opacity: 0.7 }}>
                Känner du till ett event som borde vara med på ivarberg.nu? 
                Tipsa oss så granskar vi det och lägger upp det om det passar!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Förenklat formulär */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#08075C' }}>
                    Namn på eventet *
                  </label>
                  <Input
                    required
                    value={formData.event_name}
                    onChange={(e) => handleInputChange('event_name', e.target.value)}
                    placeholder="T.ex. Konsert med lokala artister"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#08075C' }}>
                    När? *
                  </label>
                  <Input
                    required
                    value={formData.event_date}
                    onChange={(e) => handleInputChange('event_date', e.target.value)}
                    placeholder="T.ex. 25 december kl 19:00"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#08075C' }}>
                    Var? *
                  </label>
                  <Input
                    required
                    value={formData.event_location}
                    onChange={(e) => handleInputChange('event_location', e.target.value)}
                    placeholder="T.ex. Varbergs Teater, Teatergatan 1"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#08075C' }}>
                    Din email *
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.submitter_email}
                    onChange={(e) => handleInputChange('submitter_email', e.target.value)}
                    placeholder="din@email.se"
                    className="w-full"
                  />
                  <p className="text-xs mt-1" style={{ color: '#08075C', opacity: 0.6 }}>
                    Vi behöver din email om vi har frågor om eventet
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.event_name || !formData.event_date || !formData.event_location || !formData.submitter_email}
                  className="w-full py-3 text-base font-medium"
                  style={{
                    backgroundColor: '#4A90E2',
                    color: '#FFFFFF',
                    border: 'none',
                    opacity: (isSubmitting || !formData.event_name || !formData.event_date || !formData.event_location || !formData.submitter_email) ? 0.5 : 1
                  }}
                >
                  {isSubmitting ? 'Skickar tips...' : 'Skicka tips'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Tips;
