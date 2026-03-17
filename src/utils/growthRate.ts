type GrowthRateData = {
  month: string;
  total_contents: number;
  growth_rate: number | null;
};

type GrowthVisual = {
  label: string;
  className: string;
  arrow: string;
};

export function getGrowthVisual(
  growthRateData: GrowthRateData[]
): GrowthVisual {
  const latest =
    growthRateData.length > 0
      ? growthRateData.at(-1)?.growth_rate ?? null
      : null;

  const rounded =
    latest !== null && latest !== undefined
      ? Math.round(latest)
      : null;

  if (rounded === null)
    return { label: "—", className: "neutral", arrow: "" };

  if (rounded > 0)
    return { label: `+${rounded}%`, className: "positive", arrow: "↑" };

  if (rounded < 0)
    return { label: `${rounded}%`, className: "negative", arrow: "↓" };

  return { label: "0%", className: "neutral", arrow: "→" };
}