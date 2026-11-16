// Kom ihåg vem som redan har anmält sig till Torsdagsbrevet eller stängt
// popupen, så att ingen blir tjatad på. Allt ligger i webbläsaren; utan
// localStorage visas popupen som mest en gång per besök.

const SUBSCRIBED_KEY = "newsletterSubscribed";
const DISMISSED_KEY = "newsletterPopupDismissed";
const SESSION_START_KEY = "newsletterPopupSessionStart";
const SESSION_SHOWN_KEY = "newsletterPopupShown";

const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dagar

export function markNewsletterSubscribed() {
  try {
    localStorage.setItem(SUBSCRIBED_KEY, "1");
  } catch {
    // Ingen localStorage – inget att göra
  }
}

export function markNewsletterPopupDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify({ dismissedAt: Date.now() }));
  } catch {
    // Se ovan
  }
}

/** Har besökaren anmält sig, eller stängt popupen de senaste 30 dagarna? */
export function newsletterPopupSuppressed(): boolean {
  try {
    if (localStorage.getItem(SUBSCRIBED_KEY)) return true;
    if (sessionStorage.getItem(SESSION_SHOWN_KEY)) return true;
    const stored = localStorage.getItem(DISMISSED_KEY);
    if (!stored) return false;
    const data = JSON.parse(stored);
    if (data?.dismissedAt && Date.now() - data.dismissedAt < DISMISS_TTL_MS) return true;
    localStorage.removeItem(DISMISSED_KEY);
    return false;
  } catch {
    return false;
  }
}

export function markNewsletterPopupShown() {
  try {
    sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
  } catch {
    // Se ovan
  }
}

/** När besöket började (första sidan som har popupen), i millisekunder. */
export function sessionStartedAt(): number {
  try {
    const stored = Number(sessionStorage.getItem(SESSION_START_KEY));
    if (stored > 0) return stored;
    const now = Date.now();
    sessionStorage.setItem(SESSION_START_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}
