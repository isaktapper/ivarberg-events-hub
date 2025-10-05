import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md shadow-sm" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #08075C', borderOpacity: 0.1 }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold" style={{ color: '#08075C' }}>
              ivarberg.nu
            </h1>
            <nav className="hidden md:flex items-center gap-6">
              <Button 
                variant="ghost" 
                className="transition-colors"
                style={{ color: '#08075C' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#08075C'}
              >
                Alla event
              </Button>
              <a href="/om-oss">
                <Button 
                  variant="ghost" 
                  className="transition-colors"
                  style={{ color: '#08075C' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#08075C'}
                >
                  Om oss
                </Button>
              </a>
              <Button 
                variant="ghost" 
                className="transition-colors"
                style={{ color: '#08075C' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#4A90E2'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#08075C'}
              >
                Lägg till event
              </Button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}