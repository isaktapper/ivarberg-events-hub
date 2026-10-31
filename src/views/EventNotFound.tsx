"use client";

import { ArrowLeft } from "lucide-react";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Samma vy som EventDetail visade när eventet saknades, men nu med riktig 404-status
const EventNotFound = () => (
  <div className="min-h-screen bg-texture">
    <Header />
    <main className="container mx-auto px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-ink">Evenemang hittades inte</h1>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka till startsidan
          </Button>
        </Link>
      </div>
    </main>
    <Footer />
  </div>
);

export default EventNotFound;
