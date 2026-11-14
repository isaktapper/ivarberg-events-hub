"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Camera, Check, ChevronLeft, ImageIcon, Loader2, Pencil } from "lucide-react";
import { Helmet } from "@/lib/helmet";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePostHog } from "posthog-js/react";
import { uploadTipImage } from "@/lib/tipImage";
import {
  TipDraft,
  emptyDraft,
  extractTip,
  ExtractResult,
  formatWhen,
  isSocialLink,
  linkHost,
  missingFields,
  normalizeUrl,
  saveNotifyEmail,
  submitTip,
} from "@/lib/tipDraft";
import { TipReview } from "@/components/tips/TipReview";
import { CategoryChips, TipImage, fieldInput, fieldLabel, primaryButton, secondaryButton, textButton } from "@/components/tips/ui";
import { useSite } from "@/config/SiteProvider";

// Tipsflödet: länk eller bild först, AI fyller i, tipsaren granskar och skickar.
// "Fyll i själv" finns kvar som en diskret väg. Design: se ritytan
// "ivarberg.nu – tipsa med länk eller foto".

type Step = "start" | "loading" | "review" | "multi" | "social" | "failed" | "manual" | "done";
type Method = "link" | "image" | "manual";

const MISSING_WORDS = { name: "namn", when: "datum", location: "plats" } as const;

const Tips = () => {
  const posthog = usePostHog();
  const site = useSite();
  const city = site.cityName;
  const [step, setStep] = useState<Step>("start");
  const [method, setMethod] = useState<Method>("link");
  const [linkUrl, setLinkUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState(""); // länk som följer med när man går vidare med skärmbild
  const [previewUrl, setPreviewUrl] = useState("");
  const [drafts, setDrafts] = useState<TipDraft[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fromMulti, setFromMulti] = useState(false);
  const [failed, setFailed] = useState<{ kind: "link" | "image"; message?: string }>({ kind: "link" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tipIds, setTipIds] = useState<number[]>([]);
  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<{ status: "idle" | "saving" | "saved"; error?: string }>({ status: "idle" });
  const [isDragging, setIsDragging] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const runRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Ny skärm: börja överst och flytta fokus till rubriken (skärmläsare, tangentbord)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const goToStart = () => {
    abortRef.current?.abort();
    runRef.current++;
    setStep("start");
    setSubmitError(null);
  };

  const resetAll = () => {
    setLinkUrl("");
    setSourceUrl("");
    setPreviewUrl("");
    setDrafts([]);
    setSelected([]);
    setTipIds([]);
    setEmail("");
    setEmailState({ status: "idle" });
    goToStart();
  };

  const handleResult = (result: ExtractResult, kind: "link" | "image", fallback: Partial<TipDraft>) => {
    if (result.ok === true) {
      setDrafts(result.events);
      setSelected(result.events.map(() => true));
      setActiveIndex(0);
      setFromMulti(false);
      setStep(result.events.length > 1 ? "multi" : "review");
      posthog?.capture("tip_extracted", {
        method: kind,
        outcome: "success",
        source: result.source,
        events_count: result.events.length,
        missing_fields: missingFields(result.events[0]),
      });
      return;
    }
    const reason = (result as { reason: string }).reason;
    if (reason === "aborted") return;
    posthog?.capture("tip_extracted", { method: kind, outcome: reason });
    if (reason === "social") {
      setStep("social");
      return;
    }
    // Det vi redan har (länk, uppladdad bild) följer med om man fyller i själv
    setDrafts([emptyDraft(fallback)]);
    setFailed({
      kind,
      message: reason === "rate_limited" ? "Du har gjort många försök på kort tid. Vänta några minuter, eller fyll i uppgifterna själv." : undefined,
    });
    setStep("failed");
  };

  const startLink = async () => {
    const url = normalizeUrl(linkUrl);
    if (!url) return;
    setMethod("link");
    setPreviewUrl("");
    if (isSocialLink(url)) {
      setSourceUrl(url);
      setStep("social");
      posthog?.capture("tip_extracted", { method: "link", outcome: "social", host: linkHost(url) });
      return;
    }
    setSourceUrl("");
    const run = ++runRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setStep("loading");
    const result = await extractTip({ url }, controller.signal);
    if (run !== runRef.current) return;
    handleResult(result, "link", { url });
  };

  const startImage = async (file: File, keepSource = false) => {
    if (!file.type.startsWith("image/")) return;
    const source = keepSource ? sourceUrl : "";
    if (!keepSource) setSourceUrl("");
    setMethod("image");
    const run = ++runRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setPreviewUrl(URL.createObjectURL(file));
    setStep("loading");

    const upload = await uploadTipImage(file);
    if (run !== runRef.current) return;
    if (!upload.success || !upload.url) {
      setDrafts([emptyDraft({ url: source })]);
      setFailed({ kind: "image", message: upload.error });
      setStep("failed");
      posthog?.capture("tip_extracted", { method: "image", outcome: "upload_failed" });
      return;
    }
    const result = await extractTip({ image_url: upload.url, url: source || undefined }, controller.signal);
    if (run !== runRef.current) return;
    handleResult(result, "image", { image_url: upload.url, url: source });
  };

  const openManual = () => {
    setMethod("manual");
    if (step !== "failed" || !drafts[0]) setDrafts([emptyDraft({ url: step === "social" ? sourceUrl : "" })]);
    setSubmitError(null);
    setStep("manual");
  };

  const submit = async (toSend: TipDraft[]) => {
    if (isSubmitting || toSend.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    const ids: number[] = [];
    let error: string | null = null;
    const sent = new Set<TipDraft>();
    for (const draft of toSend) {
      const result = await submitTip(draft);
      if (!result.success) {
        error = result.error || "Det gick inte att skicka in tipset. Försök igen.";
        break;
      }
      sent.add(draft);
      if (typeof result.tip_id === "number") ids.push(result.tip_id);
      posthog?.capture("tip_submitted", {
        method,
        categories: draft.categories,
        categories_count: draft.categories.length,
        has_image: !!draft.image_url,
        has_website: !!draft.url,
        tip_id: result.tip_id,
      });
    }
    setTipIds((prev) => [...prev, ...ids]);
    setIsSubmitting(false);
    if (error) {
      // Ta bort det som redan gått iväg, så att ett nytt försök inte skapar dubbletter
      const keep = drafts.map((draft) => !sent.has(draft));
      setDrafts(drafts.filter((_, index) => keep[index]));
      setSelected(selected.filter((_, index) => keep[index]));
      setSubmitError(error);
      return;
    }
    setStep("done");
  };

  const saveEmail = async () => {
    if (emailState.status === "saving") return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailState({ status: "idle", error: "Kontrollera e-postadressen." });
      return;
    }
    setEmailState({ status: "saving" });
    const result = await saveNotifyEmail(tipIds, email.trim());
    setEmailState(result.success ? { status: "saved" } : { status: "idle", error: result.error });
    if (result.success) posthog?.capture("tip_notify_email_added", { tips_count: tipIds.length });
  };

  const updateDraft = (index: number, next: TipDraft) => setDrafts((prev) => prev.map((draft, i) => (i === index ? next : draft)));

  const active = drafts[activeIndex];
  const activeMissing = active ? missingFields(active) : [];
  const selectedDrafts = drafts.filter((_, index) => selected[index]);
  const selectedIncomplete = selectedDrafts.some((draft) => missingFields(draft).length > 0);

  const heading = "text-[26px] leading-tight font-bold text-ink focus:outline-none";
  const lead = "text-base leading-relaxed text-[#3D4660]";
  const note = "text-[13px] text-[#5B6478] text-center";
  const backLink =
    "min-h-[44px] -ml-1.5 self-start inline-flex items-center gap-1 text-[15px] font-medium text-[#0F5AA6] hover:text-[#0B4480] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5AA6] rounded";

  return (
    <>
      <Helmet>
        <title>{`Tipsa oss om evenemang - ${city} | ${site.name}`}</title>
        <meta
          name="description"
          content={`Tipsa oss om evenemang i ${city}! Klistra in en länk eller ta en bild på affischen, så fyller vi i resten. Kostnadsfritt att lägga till evenemang på ${site.name}.`}
        />
        <meta name="keywords" content={`tipsa evenemang ${city}, lägg till event ${city}, publicera evenemang ${city}, arrangörer ${city}`} />
        <meta property="og:title" content={`Tipsa oss om evenemang - ${site.name}`} />
        <meta property="og:description" content={`Hjälp andra att upptäcka evenemang i ${city}. Kostnadsfritt att lägga till evenemang!`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${site.url}/tips`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`Tipsa oss om evenemang - ${site.name}`} />
        <link rel="canonical" href={`${site.url}/tips`} />
      </Helmet>

      <div className="min-h-screen bg-white text-ink">
        <Header />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) startImage(file, step === "social");
          }}
        />

        <main
          className="container mx-auto px-5 pt-10 pb-20"
          onPaste={(e) => {
            // Klistra in en skärmbild direkt (dator)
            if (step !== "start" && step !== "social") return;
            const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
            if (file) {
              e.preventDefault();
              startImage(file, step === "social");
            }
          }}
        >
          {/* 1. Start */}
          {step === "start" && (
            <div className="max-w-md sm:max-w-3xl mx-auto flex flex-col gap-6 sm:gap-8">
              <div className="flex flex-col gap-2 sm:text-center">
                <h1 ref={headingRef} tabIndex={-1} className={`${heading} sm:text-4xl`}>
                  Tipsa om ett evenemang
                </h1>
                <p className={`${lead} sm:text-lg`}>Klistra in en länk eller ta en bild på affischen. Vi fyller i resten åt dig.</p>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-5">
                <form
                  className="bg-[#F4F5F7] rounded-2xl p-4 sm:p-6 flex flex-col gap-2 justify-center"
                  onSubmit={(e) => {
                    e.preventDefault();
                    startLink();
                  }}
                >
                  <label htmlFor="tips-link" className="text-[15px] sm:text-base font-semibold">
                    Länk till evenemanget
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="tips-link"
                      type="text"
                      inputMode="url"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="Klistra in länken här"
                      className={`${fieldInput} flex-1 min-w-0`}
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                    <button
                      type="submit"
                      aria-label="Hämta uppgifter från länken"
                      disabled={!linkUrl.trim()}
                      className="h-[52px] w-[52px] flex-none rounded-xl bg-ink text-white flex items-center justify-center hover:bg-[#1B2F66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F5AA6] disabled:bg-[#8A93A6]"
                    >
                      <ArrowRight className="h-[22px] w-[22px]" aria-hidden="true" />
                    </button>
                  </div>
                </form>

                <div className="flex sm:hidden items-center gap-3 -my-1" aria-hidden="true">
                  <div className="flex-1 h-px bg-[#E3E6EC]" />
                  <span className="text-sm text-[#5B6478]">eller</span>
                  <div className="flex-1 h-px bg-[#E3E6EC]" />
                </div>

                <div
                  className={`bg-[#F4F5F7] rounded-2xl p-4 sm:p-6 flex flex-col gap-2.5 justify-center ${isDragging ? "outline outline-2 outline-[#0F5AA6]" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
                    if (file) startImage(file);
                  }}
                >
                  <button type="button" className={primaryButton} onClick={() => fileInputRef.current?.click()}>
                    <Camera className="h-[22px] w-[22px]" aria-hidden="true" />
                    Ta en bild eller välj en
                  </button>
                  <p className="text-sm text-[#5B6478] text-center">Affisch, flygblad eller skärmbild går lika bra.</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button type="button" className={textButton} onClick={openManual}>
                  Fyll i uppgifterna själv
                </button>
                <p className={note}>Vi går igenom alla tips innan de publiceras.</p>
              </div>
            </div>
          )}

          {/* 2. Läser av */}
          {step === "loading" && (
            <div className="max-w-md mx-auto flex flex-col items-center gap-7 pt-2">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Bilden du valde" className="max-w-[200px] max-h-[260px] rounded-xl object-contain" />
              ) : (
                <div className="max-w-full px-4 py-3 rounded-xl border border-[#E3E6EC] text-[15px] text-[#3D4660] truncate">{linkHost(linkUrl) || "Länken"}</div>
              )}
              <div className="flex flex-col items-center gap-1.5" role="status">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="h-[22px] w-[22px] animate-spin text-[#0F5AA6]" aria-hidden="true" />
                  <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold focus:outline-none">
                    {previewUrl ? "Läser av bilden" : "Läser sidan"}
                  </h1>
                </div>
                <p className="text-[15px] text-[#5B6478]">Det tar några sekunder.</p>
              </div>
              <div aria-hidden="true" className="w-full border border-[#E3E6EC] rounded-2xl overflow-hidden">
                {[240, 150, 190].map((width, index) => (
                  <div key={width} className={`px-4 py-3.5 flex flex-col gap-2 ${index ? "border-t border-[#E3E6EC]" : ""}`}>
                    <div className="h-2.5 w-10 rounded-full bg-[#E3E6EC] animate-pulse" />
                    <div className="h-4 rounded-full bg-[#E3E6EC] animate-pulse" style={{ width }} />
                  </div>
                ))}
              </div>
              <button type="button" className={textButton} onClick={goToStart}>
                Avbryt
              </button>
            </div>
          )}

          {/* 3. Granska (ett evenemang) */}
          {step === "review" && active && (
            <div className="max-w-md mx-auto flex flex-col gap-4">
              <button type="button" className={backLink} onClick={() => (fromMulti ? setStep("multi") : goToStart())}>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                {fromMulti ? "Tillbaka" : "Börja om"}
              </button>
              <div className="flex flex-col gap-1.5 -mt-2">
                <h1 ref={headingRef} tabIndex={-1} className={heading}>
                  {activeMissing.length > 0 ? "Nästan klart" : "Stämmer det här?"}
                </h1>
                <p className={lead}>
                  {activeMissing.length > 0
                    ? `Vi hittade inte ${activeMissing.map((field) => MISSING_WORDS[field as keyof typeof MISSING_WORDS]).join(" och ")}. Lägg till det som saknas, så kan du ${fromMulti ? "gå vidare" : "skicka in"}.`
                    : "Tryck på en rad om något ska ändras."}
                </p>
              </div>

              <TipReview draft={active} onChange={(next) => updateDraft(activeIndex, next)} />

              <div className="flex flex-col gap-2.5 pt-1">
                {fromMulti ? (
                  <button type="button" className={primaryButton} onClick={() => setStep("multi")}>
                    Klar
                  </button>
                ) : (
                  <>
                    <div aria-live="polite">{submitError && <p className="text-sm text-red-700 text-center mb-1">{submitError}</p>}</div>
                    <button type="button" className={primaryButton} disabled={activeMissing.length > 0 || isSubmitting} onClick={() => submit([active])}>
                      {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
                      {isSubmitting ? "Skickar in" : "Skicka in tipset"}
                    </button>
                    <p className={note}>
                      {activeMissing.length > 0 ? "Namn, datum och plats behövs för att tipset ska kunna skickas." : "Vi går igenom tipset innan det publiceras."}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Flera evenemang på samma affisch eller sida */}
          {step === "multi" && (
            <div className="max-w-md mx-auto flex flex-col gap-4">
              <button type="button" className={backLink} onClick={goToStart}>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                Börja om
              </button>
              <div className="flex flex-col gap-1.5 -mt-2">
                <h1 ref={headingRef} tabIndex={-1} className={heading}>
                  Vi hittade {drafts.length} evenemang
                </h1>
                <p className={lead}>Bocka ur dem du inte vill tipsa om. Tryck på pennan för att ändra.</p>
              </div>

              <div className="border border-[#E3E6EC] rounded-2xl overflow-hidden">
                {drafts.map((draft, index) => {
                  const incomplete = missingFields(draft).length > 0;
                  return (
                    <div key={index} className={`flex items-center gap-1 pl-4 pr-1.5 py-1.5 ${index ? "border-t border-[#E3E6EC]" : ""}`}>
                      <label className="flex-1 min-w-0 min-h-[60px] flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-6 w-6 flex-none accent-ink"
                          checked={!!selected[index]}
                          onChange={(e) => setSelected((prev) => prev.map((value, i) => (i === index ? e.target.checked : value)))}
                        />
                        <span className="min-w-0 flex flex-col gap-0.5">
                          <span className="text-base font-semibold leading-snug break-words">{draft.name}</span>
                          {incomplete ? (
                            <span className="self-start text-sm font-medium px-2 py-0.5 rounded bg-[#FFF3D1] text-[#4A3200]">Uppgifter saknas</span>
                          ) : (
                            <span className="text-sm text-[#5B6478] break-words">{[formatWhen(draft, true), draft.location].filter(Boolean).join(" · ")}</span>
                          )}
                        </span>
                      </label>
                      <button
                        type="button"
                        aria-label={`Ändra ${draft.name}`}
                        className="h-11 w-11 flex-none flex items-center justify-center rounded-full hover:bg-[#F4F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5AA6]"
                        onClick={() => {
                          setActiveIndex(index);
                          setFromMulti(true);
                          setStep("review");
                        }}
                      >
                        <Pencil className="h-[18px] w-[18px] text-[#5B6478]" aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                <div aria-live="polite">{submitError && <p className="text-sm text-red-700 text-center mb-1">{submitError}</p>}</div>
                <button
                  type="button"
                  className={primaryButton}
                  disabled={selectedDrafts.length === 0 || selectedIncomplete || isSubmitting}
                  onClick={() => submit(selectedDrafts)}
                >
                  {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
                  {isSubmitting ? "Skickar in" : `Skicka in ${selectedDrafts.length} tips`}
                </button>
                <p className={note}>
                  {selectedIncomplete ? "Tryck på pennan och lägg till det som saknas, eller bocka ur evenemanget." : "Vi går igenom tipsen innan de publiceras."}
                </p>
              </div>
            </div>
          )}

          {/* Länk från Facebook eller Instagram */}
          {step === "social" && (
            <div className="max-w-md mx-auto flex flex-col gap-5">
              <button type="button" className={backLink} onClick={goToStart}>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                Tillbaka
              </button>
              <div className="flex flex-col gap-1.5 -mt-3">
                <h1 ref={headingRef} tabIndex={-1} className={heading}>
                  Lägg till en skärmbild
                </h1>
                <p className={lead}>Från Facebook och Instagram behöver vi en bild av inlägget för att kunna fylla i uppgifterna åt dig.</p>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-3 border border-[#E3E6EC] rounded-xl">
                <Check className="h-5 w-5 flex-none text-[#0F5AA6]" aria-hidden="true" />
                <div className="min-w-0 flex flex-col">
                  <span className="text-sm font-semibold">Länken följer med tipset</span>
                  <span className="text-[13px] text-[#5B6478] truncate">{sourceUrl.replace(/^https?:\/\/(www\.)?/, "")}</span>
                </div>
              </div>

              <div className="bg-[#F4F5F7] rounded-2xl p-4 flex flex-col gap-3.5">
                <ol className="flex flex-col gap-2.5 text-[15px] leading-snug">
                  {["Öppna inlägget i Facebook eller Instagram.", "Ta en skärmbild där datum och plats syns.", "Kom tillbaka hit och välj bilden."].map((text, index) => (
                    <li key={text} className="flex gap-2.5">
                      <span aria-hidden="true" className="flex-none h-6 w-6 rounded-full bg-ink text-white text-[13px] font-semibold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ol>
                <button type="button" className={primaryButton} onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-[22px] w-[22px]" aria-hidden="true" />
                  Välj skärmbild
                </button>
              </div>

              <button type="button" className={`${textButton} self-center`} onClick={openManual}>
                Fyll i uppgifterna själv
              </button>
            </div>
          )}

          {/* Gick inte att läsa av */}
          {step === "failed" && (
            <div className="max-w-md mx-auto flex flex-col gap-6 pt-2">
              <div className="flex flex-col gap-3.5">
                <div aria-hidden="true" className="h-14 w-14 rounded-full bg-[#FFF3D1] text-[#6B4A00] text-2xl font-bold flex items-center justify-center">
                  !
                </div>
                <div className="flex flex-col gap-1.5">
                  <h1 ref={headingRef} tabIndex={-1} className={heading}>
                    {failed.kind === "image" ? "Vi kunde inte läsa bilden" : "Vi kunde inte läsa länken"}
                  </h1>
                  <p className={lead}>
                    {failed.message ||
                      (failed.kind === "image"
                        ? "Vi hittade inga uppgifter om ett evenemang i bilden. Prova med en ny bild, eller fyll i uppgifterna själv."
                        : "Vi hittade inga uppgifter om ett evenemang på sidan. Prova med en bild på affischen, eller fyll i uppgifterna själv.")}
                  </p>
                </div>
              </div>

              {failed.kind === "image" && (
                <div className="bg-[#F4F5F7] rounded-2xl p-4 flex flex-col gap-2.5">
                  <span className="text-[15px] font-semibold">Så blir bilden lättare att läsa</span>
                  <ul className="flex flex-col gap-2 text-[15px] leading-snug text-[#3D4660]">
                    {["Få med hela affischen i bilden.", "Håll mobilen rakt framför.", "Se till att det är ljust och utan blänk."].map((text) => (
                      <li key={text} className="flex gap-2.5">
                        <Check className="h-[18px] w-[18px] flex-none mt-0.5 text-[#0F5AA6]" aria-hidden="true" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <button type="button" className={primaryButton} onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-[22px] w-[22px]" aria-hidden="true" />
                  {failed.kind === "image" ? "Ta en ny bild" : "Ta en bild eller välj en"}
                </button>
                <button type="button" className={secondaryButton} onClick={openManual}>
                  Fyll i själv
                </button>
                <button type="button" className={`${textButton} self-center`} onClick={goToStart}>
                  Börja om
                </button>
              </div>
            </div>
          )}

          {/* Fyll i själv */}
          {step === "manual" && drafts[0] && (
            <ManualForm
              draft={drafts[0]}
              onChange={(next) => updateDraft(0, next)}
              onBack={goToStart}
              onSubmit={() => submit([drafts[0]])}
              isSubmitting={isSubmitting}
              submitError={submitError}
              headingRef={headingRef}
              classes={{ heading, backLink, note }}
            />
          )}

          {/* 4. Tack */}
          {step === "done" && (
            <div className="max-w-md mx-auto flex flex-col gap-7 pt-2">
              <div className="flex flex-col gap-3.5">
                <div aria-hidden="true" className="h-14 w-14 rounded-full bg-[#DCE8F5] text-[#0F5AA6] flex items-center justify-center">
                  <Check className="h-7 w-7" strokeWidth={2.6} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h1 ref={headingRef} tabIndex={-1} className={heading}>
                    {tipIds.length > 1 ? "Tack för tipsen!" : "Tack för tipset!"}
                  </h1>
                  <p className={lead}>Vi går igenom {tipIds.length > 1 ? "dem och lägger upp dem" : "det och lägger upp det"} så snart vi kan.</p>
                </div>
              </div>

              {tipIds.length > 0 && (
                <div className="bg-[#F4F5F7] rounded-2xl p-4" aria-live="polite">
                  {emailState.status === "saved" ? (
                    <p className="text-base font-semibold flex items-center gap-2">
                      <Check className="h-5 w-5 flex-none text-[#0F5AA6]" aria-hidden="true" />
                      Vi hör av oss när det är publicerat.
                    </p>
                  ) : (
                    <form
                      className="flex flex-col gap-2.5"
                      noValidate
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveEmail();
                      }}
                    >
                      <label htmlFor="tips-email" className="text-base font-semibold leading-snug">
                        Vill du veta när det är publicerat?
                      </label>
                      <input
                        id="tips-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Din e-postadress"
                        className={fieldInput}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailState.error) setEmailState({ status: "idle" });
                        }}
                        aria-describedby="tips-email-note"
                      />
                      {emailState.error && <p className="text-sm text-red-700">{emailState.error}</p>}
                      <button type="submit" className={secondaryButton} disabled={emailState.status === "saving"}>
                        {emailState.status === "saving" ? "Sparar" : "Meddela mig"}
                      </button>
                      <p id="tips-email-note" className="text-[13px] leading-snug text-[#5B6478]">
                        Valfritt. Vi hör bara av oss om det här tipset.
                      </p>
                    </form>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <button type="button" className={primaryButton} onClick={resetAll}>
                  Tipsa om ett till
                </button>
                <a href="/" className={`${textButton} self-center inline-flex items-center h-12`}>
                  Till startsidan
                </a>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

function ManualForm({
  draft,
  onChange,
  onBack,
  onSubmit,
  isSubmitting,
  submitError,
  headingRef,
  classes,
}: {
  draft: TipDraft;
  onChange: (next: TipDraft) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  classes: { heading: string; backLink: string; note: string };
}) {
  const site = useSite();
  const [showErrors, setShowErrors] = useState(false);
  const missing = missingFields(draft);
  const errorFor = (field: "name" | "when" | "location", text: string) =>
    showErrors && missing.includes(field) ? <p className="text-sm text-red-700 mt-1.5">{text}</p> : null;

  return (
    <form
      className="max-w-md mx-auto flex flex-col gap-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (missing.length > 0) {
          setShowErrors(true);
          const ids: Record<string, string> = { name: "tips-m-name", when: "tips-m-date", location: "tips-m-location" };
          document.getElementById(ids[missing[0]])?.focus();
          return;
        }
        onSubmit();
      }}
    >
      <button type="button" className={classes.backLink} onClick={onBack}>
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        Tillbaka
      </button>
      <h1 ref={headingRef} tabIndex={-1} className={`${classes.heading} -mt-3`}>
        Fyll i själv
      </h1>

      <div>
        <label htmlFor="tips-m-name" className={fieldLabel}>
          Vad heter evenemanget?
        </label>
        <input id="tips-m-name" className={fieldInput} maxLength={200} value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} />
        {errorFor("name", "Skriv vad evenemanget heter.")}
      </div>

      <div>
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <label htmlFor="tips-m-date" className={fieldLabel}>
              Datum
            </label>
            <input id="tips-m-date" type="date" className={fieldInput} value={draft.date} onChange={(e) => onChange({ ...draft, date: e.target.value })} />
          </div>
          <div className="w-[130px] flex-none">
            <label htmlFor="tips-m-time" className={fieldLabel}>
              Starttid
            </label>
            <input id="tips-m-time" type="time" className={fieldInput} value={draft.time} onChange={(e) => onChange({ ...draft, time: e.target.value })} />
          </div>
        </div>
        {errorFor("when", "Välj vilket datum det är.")}
      </div>

      <div>
        <label htmlFor="tips-m-location" className={fieldLabel}>
          Var är det?
        </label>
        <input
          id="tips-m-location"
          className={fieldInput}
          maxLength={200}
          placeholder={`Till exempel ${site.cityGenitive} Teater`}
          value={draft.location}
          onChange={(e) => onChange({ ...draft, location: e.target.value })}
        />
        {errorFor("location", "Skriv var evenemanget är.")}
      </div>

      <fieldset>
        <legend className={fieldLabel}>
          Vad är det för typ? <span className="font-normal text-[#5B6478]">Välj upp till tre.</span>
        </legend>
        <CategoryChips value={draft.categories} onChange={(categories) => onChange({ ...draft, categories })} />
      </fieldset>

      <div>
        <span className={fieldLabel}>
          Bild <span className="font-normal text-[#5B6478]">(valfritt)</span>
        </span>
        <TipImage variant="field" url={draft.image_url} onChange={(image_url) => onChange({ ...draft, image_url })} />
        <p className="text-[13px] text-[#5B6478] mt-1.5">Affischen eller ett foto från evenemanget.</p>
      </div>

      <div>
        <label htmlFor="tips-m-description" className={fieldLabel}>
          Beskrivning <span className="font-normal text-[#5B6478]">(valfritt)</span>
        </label>
        <textarea
          id="tips-m-description"
          rows={3}
          maxLength={1800}
          className={`${fieldInput} h-auto py-3 resize-none`}
          value={draft.description}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="tips-m-url" className={fieldLabel}>
          Länk <span className="font-normal text-[#5B6478]">(valfritt)</span>
        </label>
        <input
          id="tips-m-url"
          type="text"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          className={fieldInput}
          value={draft.url}
          onChange={(e) => onChange({ ...draft, url: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2.5 pt-1">
        <div aria-live="polite">{submitError && <p className="text-sm text-red-700 text-center mb-1">{submitError}</p>}</div>
        <button type="submit" className={primaryButton} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {isSubmitting ? "Skickar in" : "Skicka in tipset"}
        </button>
        <p className={classes.note}>Vi går igenom tipset innan det publiceras.</p>
      </div>
    </form>
  );
}

export default Tips;
