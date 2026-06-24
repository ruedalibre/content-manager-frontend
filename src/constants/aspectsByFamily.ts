import { type FormatFamily } from "../utils/formatFamily";

export type AspectDefinition = {
  key: string;
  labelKey: string;
  isList: boolean;
  requiresGoodRating: boolean;
};

export const ASPECTS_BY_FAMILY: Record<FormatFamily, AspectDefinition[]> = {
  default: [
    { key: "angle", labelKey: "recipe.angle", isList: false, requiresGoodRating: true },
    { key: "hook", labelKey: "recipe.hook", isList: false, requiresGoodRating: true },
    { key: "tone", labelKey: "recipe.tone", isList: false, requiresGoodRating: true },
    { key: "structure", labelKey: "recipe.structure", isList: true, requiresGoodRating: true },
  ],
  short_video: [
    { key: "angle", labelKey: "recipe.angle", isList: false, requiresGoodRating: true },
    { key: "hook", labelKey: "recipe.hook", isList: false, requiresGoodRating: true },
    { key: "tone", labelKey: "recipe.tone", isList: false, requiresGoodRating: true },
    { key: "structure", labelKey: "recipe.structure", isList: true, requiresGoodRating: true },
  ],
  long_video: [
    { key: "angle", labelKey: "recipe.angle", isList: false, requiresGoodRating: true },
    { key: "hook", labelKey: "recipe.hook", isList: false, requiresGoodRating: true },
    { key: "tone", labelKey: "recipe.tone", isList: false, requiresGoodRating: true },
    { key: "structure", labelKey: "recipe.structure", isList: true, requiresGoodRating: true },
  ],
  written: [
    { key: "angle", labelKey: "recipe.angle", isList: false, requiresGoodRating: true },
    { key: "hook", labelKey: "recipe.hook", isList: false, requiresGoodRating: true },
    { key: "tone", labelKey: "recipe.tone", isList: false, requiresGoodRating: true },
    { key: "structure", labelKey: "recipe.structure", isList: true, requiresGoodRating: true },
  ],
  audio: [
    { key: "angle", labelKey: "recipe.angle", isList: false, requiresGoodRating: true },
    { key: "hook", labelKey: "recipe.hook", isList: false, requiresGoodRating: true },
    { key: "tone", labelKey: "recipe.tone", isList: false, requiresGoodRating: true },
    { key: "structure", labelKey: "recipe.structure", isList: true, requiresGoodRating: true },
  ],
  visual: [
    { key: "angle", labelKey: "recipe.angle", isList: false, requiresGoodRating: true },
    { key: "hook", labelKey: "recipe.hook", isList: false, requiresGoodRating: true },
    { key: "tone", labelKey: "recipe.tone", isList: false, requiresGoodRating: true },
    { key: "structure", labelKey: "recipe.structure", isList: true, requiresGoodRating: true },
  ],
};
