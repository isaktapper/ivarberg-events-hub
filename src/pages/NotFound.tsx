import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-texture">
      <Helmet>
        <title>Sidan hittades inte | ivarberg.nu</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold" style={{ color: '#10214B' }}>404</h1>
        <p className="mb-4 text-xl" style={{ color: '#10214B', opacity: 0.8 }}>Hoppsan! Sidan finns inte.</p>
        <Link to="/" className="text-blue-500 underline hover:text-blue-700">
          Tillbaka till startsidan
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
