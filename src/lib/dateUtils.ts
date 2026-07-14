const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Formaterar ett datum relativt idag: "Idag", "Imorgon", "Lör 18 juli",
 * eller "18 juli 2027" om datumet ligger i ett annat år.
 */
export function formatRelativeDate(date: Date, now: Date = new Date()): string {
  const diffDays = Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / MS_PER_DAY
  );

  if (diffDays === 0) return "Idag";
  if (diffDays === 1) return "Imorgon";

  const dayMonth = date.toLocaleDateString("sv-SE", { day: "numeric", month: "long" });

  if (date.getFullYear() !== now.getFullYear()) {
    return `${dayMonth} ${date.getFullYear()}`;
  }

  const weekday = date.toLocaleDateString("sv-SE", { weekday: "short" }).replace(".", "");
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalizedWeekday} ${dayMonth}`;
}
