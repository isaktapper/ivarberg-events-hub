import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumbs component with Schema.org BreadcrumbList
 * Improves navigation and SEO
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  // Generate BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Hem",
        "item": "https://ivarberg.nu"
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.label,
        "item": `https://ivarberg.nu${item.href}`
      }))
    ]
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <nav 
        className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm mb-4 sm:mb-6 overflow-hidden" 
        aria-label="Breadcrumb"
        style={{ color: '#08075C' }}
      >
        <Link 
          to="/" 
          className="flex items-center gap-1 hover:text-blue-600 transition-colors flex-shrink-0"
          style={{ opacity: 0.7 }}
        >
          <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Hem</span>
        </Link>
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isMiddle = !isLast && index > 0;
          
          return (
            <div key={index} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" style={{ opacity: 0.4 }} />
              {isLast ? (
                <span 
                  className="font-medium truncate max-w-[200px] sm:max-w-none" 
                  style={{ color: '#08075C' }}
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : isMiddle && items.length > 2 ? (
                // Dölj mitten-breadcrumbs på mobil om det finns fler än 2 items
                <>
                  <span className="hidden sm:inline">
                    <Link 
                      to={item.href} 
                      className="hover:text-blue-600 transition-colors"
                      style={{ opacity: 0.7 }}
                    >
                      {item.label}
                    </Link>
                  </span>
                  <span className="sm:hidden" style={{ opacity: 0.4 }}>...</span>
                </>
              ) : (
                <Link 
                  to={item.href} 
                  className="hover:text-blue-600 transition-colors truncate max-w-[120px] sm:max-w-none"
                  style={{ opacity: 0.7 }}
                  title={item.label}
                >
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}

