import { useMemo } from "react";

export type AvatarConfig = {
  skinColor?: string;
  top?: string;
  hairColor?: string;
  eyebrows?: string;
  facialHair?: string;
  facialHairColor?: string;
  eyes?: string;
  mouth?: string;
  clothesColor?: string;
};

const BASE = "https://api.dicebear.com/9.x/avataaars/svg";

export function useAvatarUrl(seed: string, config: AvatarConfig = {}): string {
  return useMemo(() => {
    const params = new URLSearchParams({ seed });

    if (config.skinColor) params.set("skinColor", config.skinColor);
    if (config.top) params.set("top", config.top);
    if (config.hairColor) params.set("hairColor", config.hairColor);
    if (config.eyebrows) params.set("eyebrows", config.eyebrows);
    if (config.facialHair && config.facialHair !== "none") {
      params.set("facialHair", config.facialHair);
      params.set("facialHairProbability", "100");
    } else {
      params.set("facialHairProbability", "0");
    }
    if (config.facialHairColor) params.set("facialHairColor", config.facialHairColor);
    if (config.eyes) params.set("eyes", config.eyes);
    if (config.mouth) params.set("mouth", config.mouth);
    if (config.clothesColor) params.set("clothesColor", config.clothesColor);

    return `${BASE}?${params.toString()}`;
  }, [seed, config]);
}
