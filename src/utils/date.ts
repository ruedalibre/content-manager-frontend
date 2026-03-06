/* =========================
   DATE UTILITIES
========================= */

/**
 * Convierte una fecha ISO (YYYY-MM-DD)
 * a Date local segura evitando problemas de timezone.
 */
export function parseLocalDate(dateString: string): Date {
  return new Date(dateString + "T00:00:00");
}

/**
 * Convierte YYYY-MM a Date local segura
 */
export function parseLocalMonth(monthString: string): Date {
  return new Date(monthString + "-01T00:00:00");
}

/**
 * Devuelve weekday corto
 */
export function formatWeekday(dateString: string) {
  return parseLocalDate(dateString).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

/**
 * Devuelve weekday largo
 */
export function formatWeekdayLong(dateString: string) {
  return parseLocalDate(dateString).toLocaleDateString("en-US", {
    weekday: "long",
  });
}

/**
 * Formato tooltip para día
 */
export function formatFullDate(dateString: string) {
  return parseLocalDate(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formato mes
 */
export function formatMonth(monthString: string) {
  return parseLocalMonth(monthString).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}