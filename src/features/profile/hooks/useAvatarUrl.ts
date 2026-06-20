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
  clothes?: string;
  clothesColor?: string;
  clothesGraphic?: string;
  accessories?: string;
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
    if (config.clothes) params.set("clothes", config.clothes);
    if (config.clothesColor) params.set("clothesColor", config.clothesColor);
    if (config.clothesGraphic && config.clothesGraphic !== "none") {
      params.set("clothesGraphic", config.clothesGraphic);
    }
    if (config.accessories && config.accessories !== "none") {
      params.set("accessories", config.accessories);
      params.set("accessoriesProbability", "100");
    } else {
      params.set("accessoriesProbability", "0");
    }

    const url = `${BASE}?${params.toString()}`;
    console.log('DiceBear URL:', url);
    return url;
  }, [seed, JSON.stringify(config)]);
}
