/* =========================
   CHART DATE UTILITIES
   (Dashboard Safe)
========================= */

export type Granularity = "daily" | "weekly" | "monthly";

/* =========================
   SAFE DATE PARSERS
========================= */

export function parseLocalDate(date: string): Date {
  return new Date(date + "T00:00:00");
}

export function parseLocalMonth(month: string): Date {
  return new Date(month + "-01T00:00:00");
}

/* =========================
   WEEK PARSER
========================= */

export function parseWeek(value: string) {
  const [year, week] = value.split("-W").map(Number);
  return year * 100 + week;
}

/* =========================
   DETECT GRANULARITY
========================= */

export function detectGranularity(value: string): Granularity {
  if (value.includes("W")) return "weekly";
  if (value.length === 10) return "daily";
  return "monthly";
}

/* =========================
   SORT SERIES CORRECTLY
========================= */

export function sortChartData<T extends { month: string }>(data: T[]): T[] {
  if (!data || data.length === 0) return data;

  const granularity = detectGranularity(data[0].month);

  return [...data].sort((a, b) => {
    if (granularity === "weekly") {
      return parseWeek(a.month) - parseWeek(b.month);
    }

    const dateA =
      granularity === "daily"
        ? parseLocalDate(a.month).getTime()
        : parseLocalMonth(a.month).getTime();

    const dateB =
      granularity === "daily"
        ? parseLocalDate(b.month).getTime()
        : parseLocalMonth(b.month).getTime();

    return dateA - dateB;
  });
}

/* =========================
   FORMAT LABEL (X AXIS)
========================= */

export function formatChartLabel(value: string) {
  const granularity = detectGranularity(value);

  if (granularity === "daily") {
    return parseLocalDate(value).toLocaleDateString("en-US", {
      weekday: "short",
    });
  }

  if (granularity === "monthly") {
    return parseLocalMonth(value).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  if (granularity === "weekly") {
    return value.replace("W", "Week ");
  }

  return value;
}

/* =========================
   FORMAT TOOLTIP
========================= */

export function formatChartTooltip(value: string) {
  const granularity = detectGranularity(value);

  if (granularity === "daily") {
    return parseLocalDate(value).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  if (granularity === "monthly") {
    return parseLocalMonth(value).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  if (granularity === "weekly") {
    return value.replace("W", "Week ");
  }

  return value;
}