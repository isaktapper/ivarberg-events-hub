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
 * Schema-only variant: BreadcrumbList JSON-LD utan synligt UI.
 * Används på sidor (t.ex. eventdetalj på mobil) där synliga brödsmulor
 * tagits bort men SEO-schemat ska behållas.
 */
export function BreadcrumbSchema({ items }: BreadcrumbsProps) {
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
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
}

/**
 * Breadcrumbs component with Schema.org BreadcrumbList
 * Improves navigation and SEO
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <>
      <BreadcrumbSchema items={items} />

      <nav 
        className="flex items-center gap-2 text-sm mb-6 flex-wrap" 
        aria-label="Breadcrumb"
        style={{ color: '#10214B' }}
      >
        <Link 
          to="/" 
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          style={{ opacity: 0.7 }}
        >
          <Home className="h-4 w-4" />
          <span>Hem</span>
        </Link>
        
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" style={{ opacity: 0.4 }} />
            {index === items.length - 1 ? (
              <span className="font-medium" style={{ color: '#10214B' }}>
                {item.label}
              </span>
            ) : (
              <Link 
                to={item.href} 
                className="hover:text-blue-600 transition-colors"
                style={{ opacity: 0.7 }}
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </>
  );
}

