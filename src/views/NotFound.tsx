"use client";

import { useLocation, Link } from "@/lib/router";
import { useEffect } from "react";
import { Helmet } from "@/lib/helmet";
import { useSite } from "@/config/SiteProvider";

const NotFound = () => {
  const location = useLocation();
  const site = useSite();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-texture">
      <Helmet>
        <title>{`Sidan hittades inte | ${site.name}`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold" style={{ color: 'hsl(var(--ink))' }}>404</h1>
        <p className="mb-4 text-xl" style={{ color: 'hsl(var(--ink))', opacity: 0.8 }}>Hoppsan! Sidan finns inte.</p>
        <Link to="/" className="text-blue-500 underline hover:text-blue-700">
          Tillbaka till startsidan
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
