"use client";

import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Samma vy som OrganizerPage visade när arrangören saknades, men nu med riktig 404-status
const OrganizerNotFound = () => {
  const { slug } = useParams<{ slug: string }>();
  return (
    <div className="min-h-screen bg-texture">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#10214B' }}>Arrangör hittades inte</h1>
          <p className="mb-4" style={{ color: '#10214B', opacity: 0.7 }}>Slug: {slug}</p>
          <Link to="/">
            <Button
              variant="outline"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#10214B',
                borderColor: '#10214B'
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka till startsidan
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrganizerNotFound;
