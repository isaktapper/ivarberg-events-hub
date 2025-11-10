import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import EventDetail from "./pages/EventDetail";
import OrganizerPage from "./pages/OrganizerPage";
import Tips from "./pages/Tips";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import EvenemangVarberg from "./pages/EvenemangVarberg";
import AttGoraVarberg from "./pages/AttGoraVarberg";
import VarbergKalender from "./pages/VarbergKalender";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/arrangor/:slug" element={<OrganizerPage />} />
            <Route path="/tips" element={<Tips />} />
            <Route path="/om-oss" element={<About />} />
            <Route path="/evenemang-varberg" element={<EvenemangVarberg />} />
            <Route path="/att-gora-i-varberg" element={<AttGoraVarberg />} />
            <Route path="/varberg-kalender" element={<VarbergKalender />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
