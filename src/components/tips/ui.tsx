"use client";

import { useRef, useState } from "react";
import { Camera, ImageIcon, Loader2 } from "lucide-react";
import { uploadTipImage } from "@/lib/tipImage";
import { TIP_CATEGORIES } from "@/lib/tipDraft";

// Gemensamma byggstenar för tipsflödet. Stilen följer designen "tipsa med
// länk eller foto": vit sida, ljusgrå kort, marinblå knappar, inga skuggor.

export const primaryButton =
  "h-14 w-full rounded-full bg-[#10214B] text-white text-base font-semibold flex items-center justify-center gap-2.5 transition-colors hover:bg-[#1B2F66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F5AA6] disabled:bg-[#E3E6EC] disabled:text-[#4A5266] disabled:cursor-not-allowed";

export const secondaryButton =
  "h-[52px] w-full rounded-full border-2 border-[#10214B] bg-white text-[#10214B] text-base font-semibold flex items-center justify-center gap-2.5 transition-colors hover:bg-[#F4F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F5AA6] disabled:opacity-60";

export const textButton =
  "min-h-[44px] px-2 text-[15px] font-medium text-[#0F5AA6] underline underline-offset-2 hover:text-[#0B4480] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5AA6] rounded";

export const fieldInput =
  "h-[52px] w-full rounded-xl border border-[#C9CED8] bg-white px-3.5 text-base text-[#10214B] placeholder:text-[#5B6478] focus:outline-none focus:border-[#0F5AA6] focus:ring-2 focus:ring-[#0F5AA6]/30";

export const fieldLabel = "block text-[15px] font-semibold text-[#10214B] mb-1.5";

export function CategoryChips({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const toggle = (category: string) => {
    if (value.includes(category)) onChange(value.filter((c) => c !== category));
    else if (value.length < 3) onChange([...value, category]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {TIP_CATEGORIES.map((category) => {
        const selected = value.includes(category);
        return (
          <button
            key={category}
            type="button"
            aria-pressed={selected}
            disabled={!selected && value.length >= 3}
            onClick={() => toggle(category)}
            className={`h-11 px-4 rounded-full border text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F5AA6] disabled:opacity-50 ${
              selected ? "bg-[#10214B] border-[#10214B] text-white" : "bg-white border-[#C9CED8] text-[#10214B] hover:border-[#10214B]"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

/** Dold filväljare + uppladdning till bucketen. Mobilen erbjuder själv kamera eller bildbibliotek. */
export function useImageUpload(onUploaded: (url: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploading(true);
        setError(null);
        const result = await uploadTipImage(file);
        if (result.success && result.url) onUploaded(result.url);
        else setError(result.error || "Uppladdningen misslyckades. Försök igen.");
        setUploading(false);
      }}
    />
  );

  return { input, open: () => inputRef.current?.click(), uploading, error, clearError: () => setError(null) };
}

/** Bildyta med "Byt bild", eller en streckad ruta för att lägga till en bild. */
export function TipImage({ url, onChange, variant }: { url: string; onChange: (url: string) => void; variant: "card" | "field" }) {
  const upload = useImageUpload(onChange);
  const [broken, setBroken] = useState(false);
  const showImage = !!url && !broken;

  return (
    <div>
      {upload.input}
      {showImage ? (
        <div className={`relative bg-[#EEF1F5] ${variant === "field" ? "rounded-xl overflow-hidden border border-[#E3E6EC]" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Bild för evenemanget" className="w-full h-[190px] object-contain" onError={() => setBroken(true)} />
          <div className="absolute right-2.5 bottom-2.5 flex gap-2">
            {variant === "field" && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="h-9 px-3.5 rounded-full bg-white text-[#10214B] text-sm font-semibold border border-[#E3E6EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5AA6]"
              >
                Ta bort
              </button>
            )}
            <button
              type="button"
              disabled={upload.uploading}
              onClick={upload.open}
              className="h-9 px-3.5 rounded-full bg-white text-[#10214B] text-sm font-semibold border border-[#E3E6EC] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5AA6]"
            >
              {upload.uploading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {upload.uploading ? "Laddar upp" : "Byt bild"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={upload.uploading}
          onClick={() => {
            setBroken(false);
            upload.open();
          }}
          className={`w-full flex flex-col items-center justify-center gap-1.5 text-[#10214B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F5AA6] ${
            variant === "field" ? "min-h-[112px] p-4 rounded-xl border-2 border-dashed border-[#A9B1C0] bg-white hover:border-[#10214B]" : "h-[112px] bg-[#EEF1F5] hover:bg-[#E3E6EC]"
          }`}
        >
          {upload.uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              <span className="text-base font-semibold">Laddar upp</span>
            </>
          ) : (
            <>
              {variant === "field" ? <Camera className="h-6 w-6" aria-hidden="true" /> : <ImageIcon className="h-6 w-6" aria-hidden="true" />}
              <span className="text-base font-semibold">{variant === "field" ? "Ta en bild eller välj en" : "Lägg till bild (valfritt)"}</span>
            </>
          )}
        </button>
      )}
      <div aria-live="polite">{upload.error && <p className="text-sm text-red-700 mt-2 px-1">{upload.error}</p>}</div>
    </div>
  );
}
