import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  required?: boolean;
}

export function AddressAutocomplete({ value, onChange, onPlaceSelect, placeholder, required }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    // Load Google Maps Places API
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        isLoaded.current = true;
        initializeAutocomplete();
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('VITE_GOOGLE_MAPS_API_KEY environment variable is not set');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=sv&region=SE`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        isLoaded.current = true;
        initializeAutocomplete();
      };
      script.onerror = () => console.error('Failed to load Google Maps script');
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    // Initialize Google Places Autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment', 'geocode'],
      componentRestrictions: { country: 'se' }, // Restrict to Sweden
      fields: ['formatted_address', 'name', 'address_components', 'geometry', 'place_id']
    });

    // Listen for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();

      if (place && place.formatted_address) {
        // If place has a name (like a venue), include it
        const fullAddress = place.name && place.name !== place.formatted_address
          ? `${place.name}, ${place.formatted_address}`
          : place.formatted_address;

        console.log('Google Places selected:', { place, fullAddress });

        // Update external value and input field
        onChange(fullAddress);

        // Update input field value directly
        if (inputRef.current) {
          inputRef.current.value = fullAddress;
        }

        // Call onPlaceSelect callback if provided
        if (onPlaceSelect) {
          onPlaceSelect(place);
        }
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow manual input - Google Places will handle its own updates
    onChange(e.target.value);
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
      required={required}
      className="w-full"
      autoComplete="off"
    />
  );
}
