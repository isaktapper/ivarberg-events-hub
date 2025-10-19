import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageGalleryProps {
  images: string[];
  title?: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;

      switch (e.key) {
        case 'Escape':
          setSelectedIndex(null);
          setIsFullscreen(false);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedIndex(prev => prev !== null ? (prev > 0 ? prev - 1 : images.length - 1) : null);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSelectedIndex(prev => prev !== null ? (prev < images.length - 1 ? prev + 1 : 0) : null);
          break;
      }
    };

    if (selectedIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedIndex, images.length]);

  // Prevent body scroll when gallery is open
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [selectedIndex]);

  if (!images || images.length === 0) return null;

  const openGallery = (index: number) => {
    setSelectedIndex(index);
    setIsFullscreen(true);
  };

  const closeGallery = () => {
    setSelectedIndex(null);
    setIsFullscreen(false);
  };

  const goToPrevious = () => {
    setSelectedIndex(prev => prev !== null ? (prev > 0 ? prev - 1 : images.length - 1) : null);
  };

  const goToNext = () => {
    setSelectedIndex(prev => prev !== null ? (prev < images.length - 1 ? prev + 1 : 0) : null);
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative group cursor-pointer"
            onClick={() => openGallery(index)}
          >
            <img
              src={image}
              alt={`${title || 'Galleri'} bild ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Gallery Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Close button */}
          <Button
            onClick={closeGallery}
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white border-none"
            size="icon"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <Button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white border-none"
                size="icon"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white border-none"
                size="icon"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Main image */}
          <div className="relative max-w-7xl max-h-[90vh] mx-4">
            <img
              src={images[selectedIndex]}
              alt={`${title || 'Galleri'} bild ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    index === selectedIndex 
                      ? 'border-white' 
                      : 'border-transparent hover:border-white/50'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
