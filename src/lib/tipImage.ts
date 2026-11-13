// Skalar ner en bild i webbläsaren och laddar upp den via /api/tips/upload-image.
// Mobilfoton är ofta större än vad ett anrop får vara, så nedskalningen görs
// innan uppladdning. Kan webbläsaren inte läsa formatet skickas originalet.

const MAX_DIMENSION = 2000;
const MAX_ORIGINAL_BYTES = 4 * 1024 * 1024;

async function downscale(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  } catch {
    return null;
  }
}

export async function uploadTipImage(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "Välj en bildfil." };
  }

  const scaled = await downscale(file);
  const payload: Blob = scaled ?? file;
  if (!scaled && file.size > MAX_ORIGINAL_BYTES) {
    return { success: false, error: "Bilden är för stor. Välj en mindre bild." };
  }

  try {
    const form = new FormData();
    form.append("file", payload, "bild.jpg");
    const response = await fetch("/api/tips/upload-image", { method: "POST", body: form });
    const result = await response.json();
    if (result.success && result.url) return { success: true, url: result.url };
    return { success: false, error: result.error || "Uppladdningen misslyckades. Försök igen." };
  } catch {
    return { success: false, error: "Uppladdningen misslyckades. Försök igen." };
  }
}
