"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TipDraft, TipField, formatWhen, missingFields } from "@/lib/tipDraft";
import { CategoryChips, TipImage, fieldInput, fieldLabel, primaryButton, textButton } from "./ui";
import { useSite } from "@/config/SiteProvider";

// Granska-kortet: en rad per uppgift. Trycker man på en rad öppnas ett ark
// nerifrån med bara det fältet.

const SHEET_TITLES: Record<TipField, string> = {
  name: "Vad heter evenemanget?",
  when: "När är det?",
  location: "Var är det?",
  price: "Vad kostar det?",
  categories: "Vad är det för typ?",
  description: "Beskrivning",
};

const ADD_LABELS: Partial<Record<TipField, string>> = {
  name: "Lägg till namn",
  when: "Lägg till datum och tid",
  location: "Lägg till plats",
};

function Row({
  label,
  field,
  missing,
  first,
  onEdit,
  children,
}: {
  label: string;
  field: TipField;
  missing: boolean;
  first?: boolean;
  onEdit: (field: TipField) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onEdit(field)}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F5AA6] ${
        missing ? "bg-[#FFF3D1] text-[#4A3200] border-y border-[#E9C877]" : `bg-white text-ink hover:bg-[#F8F9FB] ${first ? "" : "border-t border-[#E3E6EC]"}`
      }`}
    >
      <span className="min-w-0 flex flex-col items-start gap-0.5">
        <span className={`text-[13px] ${missing ? "text-[#6B4A00]" : "text-[#5B6478]"}`}>{label}</span>
        {missing ? <span className="text-base font-semibold leading-snug">{ADD_LABELS[field]}</span> : children}
      </span>
      {missing ? <Plus className="h-5 w-5 flex-none" aria-hidden="true" /> : <Pencil className="h-[18px] w-[18px] flex-none text-[#5B6478]" aria-hidden="true" />}
    </button>
  );
}

const value = "text-base font-semibold leading-snug break-words";
const empty = "text-base leading-snug text-[#5B6478]";

export function TipReview({ draft, onChange }: { draft: TipDraft; onChange: (next: TipDraft) => void }) {
  const site = useSite();
  const [editing, setEditing] = useState<TipField | null>(null);
  const [temp, setTemp] = useState<TipDraft>(draft);
  const missing = missingFields(draft);

  const edit = (field: TipField) => {
    setTemp(draft);
    setEditing(field);
  };
  const commit = () => {
    onChange({ ...temp, name: temp.name.trim(), location: temp.location.trim(), price: temp.price.trim(), description: temp.description.trim() });
    setEditing(null);
  };

  return (
    <>
      <div className="border border-[#E3E6EC] rounded-2xl overflow-hidden">
        <TipImage variant="card" url={draft.image_url} onChange={(image_url) => onChange({ ...draft, image_url })} />

        <Row label="Namn" field="name" first missing={missing.includes("name")} onEdit={edit}>
          <span className={value}>{draft.name}</span>
        </Row>
        <Row label="När" field="when" missing={missing.includes("when")} onEdit={edit}>
          <span className={value}>{formatWhen(draft)}</span>
        </Row>
        <Row label="Var" field="location" missing={missing.includes("location")} onEdit={edit}>
          <span className={value}>{draft.location}</span>
        </Row>
        <Row label="Pris" field="price" missing={false} onEdit={edit}>
          {draft.price ? <span className={value}>{draft.price}</span> : <span className={empty}>Inget pris hittat (valfritt)</span>}
        </Row>
        <Row label="Kategori" field="categories" missing={false} onEdit={edit}>
          {draft.categories.length > 0 ? (
            <span className="flex flex-wrap gap-1.5 pt-0.5">
              {draft.categories.map((category) => (
                <span key={category} className="px-3 py-0.5 rounded-full bg-ink text-white text-sm font-medium">
                  {category}
                </span>
              ))}
            </span>
          ) : (
            <span className={empty}>Ingen vald (valfritt)</span>
          )}
        </Row>
        <Row label="Beskrivning" field="description" missing={false} onEdit={edit}>
          {draft.description ? (
            <span className="text-[15px] leading-relaxed whitespace-pre-line break-words">{draft.description}</span>
          ) : (
            <span className={empty}>Ingen beskrivning (valfritt)</span>
          )}
        </Row>
      </div>

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent
          side="bottom"
          aria-describedby={undefined}
          className="rounded-t-[20px] border-0 px-5 pt-6 pb-7 max-h-[90vh] overflow-y-auto sm:max-w-md sm:mx-auto text-ink"
        >
          {editing && (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                commit();
              }}
            >
              <SheetTitle className="text-[22px] font-bold text-ink text-left">{SHEET_TITLES[editing]}</SheetTitle>

              {editing === "name" && (
                <div>
                  <label htmlFor="tip-edit-name" className="sr-only">
                    Namn på evenemanget
                  </label>
                  <input id="tip-edit-name" className={fieldInput} maxLength={200} value={temp.name} onChange={(e) => setTemp({ ...temp, name: e.target.value })} />
                </div>
              )}

              {editing === "when" && (
                <>
                  <div>
                    <label htmlFor="tip-edit-date" className={fieldLabel}>
                      Datum
                    </label>
                    <input id="tip-edit-date" type="date" className={fieldInput} value={temp.date} onChange={(e) => setTemp({ ...temp, date: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="tip-edit-time" className={fieldLabel}>
                      Starttid
                    </label>
                    <input id="tip-edit-time" type="time" className={`${fieldInput} max-w-[160px]`} value={temp.time} onChange={(e) => setTemp({ ...temp, time: e.target.value })} />
                    <p className="text-[13px] text-[#5B6478] mt-1.5">Vet du inte tiden? Lämna tomt.</p>
                  </div>
                </>
              )}

              {editing === "location" && (
                <div>
                  <label htmlFor="tip-edit-location" className="sr-only">
                    Plats
                  </label>
                  <input
                    id="tip-edit-location"
                    className={fieldInput}
                    maxLength={200}
                    placeholder={`Till exempel ${site.cityGenitive} Teater`}
                    value={temp.location}
                    onChange={(e) => setTemp({ ...temp, location: e.target.value })}
                  />
                </div>
              )}

              {editing === "price" && (
                <div>
                  <label htmlFor="tip-edit-price" className="sr-only">
                    Pris
                  </label>
                  <input
                    id="tip-edit-price"
                    className={fieldInput}
                    maxLength={100}
                    placeholder="Till exempel 150 kr eller Fri entré"
                    value={temp.price}
                    onChange={(e) => setTemp({ ...temp, price: e.target.value })}
                  />
                </div>
              )}

              {editing === "categories" && (
                <div>
                  <p className="text-[15px] text-[#5B6478] -mt-2 mb-3">Välj upp till tre.</p>
                  <CategoryChips value={temp.categories} onChange={(categories) => setTemp({ ...temp, categories })} />
                </div>
              )}

              {editing === "description" && (
                <div>
                  <label htmlFor="tip-edit-description" className="sr-only">
                    Beskrivning
                  </label>
                  <textarea
                    id="tip-edit-description"
                    rows={5}
                    maxLength={1800}
                    className={`${fieldInput} h-auto py-3 resize-none`}
                    value={temp.description}
                    onChange={(e) => setTemp({ ...temp, description: e.target.value })}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1 pt-1">
                <button type="submit" className={primaryButton}>
                  Klar
                </button>
                <button type="button" className={`${textButton} no-underline self-center`} onClick={() => setEditing(null)}>
                  Avbryt
                </button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
