export type AspectDefinition = {
  key: string;
  labelKey: string;
  isList: boolean;
  requiresGoodRating: boolean;
};

export const ASPECTS_BY_FAMILY: Record<string, AspectDefinition[]> = {
  short_video: [
    {
      key: "angle",
      labelKey: "recipe.angle",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "hook",
      labelKey: "recipe.hook",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "tone",
      labelKey: "recipe.tone",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "structure",
      labelKey: "recipe.structure",
      isList: true,
      requiresGoodRating: true,
    },
  ],
  long_video: [
    {
      key: "angle",
      labelKey: "recipe.angle",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "structure",
      labelKey: "recipe.structure",
      isList: true,
      requiresGoodRating: true,
    },
    {
      key: "tone",
      labelKey: "recipe.tone",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "retention",
      labelKey: "recipe.retention",
      isList: true,
      requiresGoodRating: true,
    },
    {
      key: "seo",
      labelKey: "recipe.seo",
      isList: false,
      requiresGoodRating: false,
    },
  ],
  live: [
    {
      key: "angle",
      labelKey: "recipe.angle",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "structure",
      labelKey: "recipe.structure",
      isList: true,
      requiresGoodRating: true,
    },
    {
      key: "tone",
      labelKey: "recipe.tone",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "engagement",
      labelKey: "recipe.engagement",
      isList: true,
      requiresGoodRating: true,
    },
  ],
  text_post: [
    {
      key: "hook",
      labelKey: "recipe.hook",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "argument",
      labelKey: "recipe.argument",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "tone",
      labelKey: "recipe.tone",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "cta",
      labelKey: "recipe.cta",
      isList: false,
      requiresGoodRating: true,
    },
  ],
  carousel: [
    {
      key: "hook",
      labelKey: "recipe.hook",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "structure",
      labelKey: "recipe.structure",
      isList: true,
      requiresGoodRating: true,
    },
    {
      key: "tone",
      labelKey: "recipe.tone",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "cta",
      labelKey: "recipe.cta",
      isList: false,
      requiresGoodRating: true,
    },
  ],
  story: [
    {
      key: "hook",
      labelKey: "recipe.hook",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "structure",
      labelKey: "recipe.structure",
      isList: true,
      requiresGoodRating: true,
    },
    {
      key: "tone",
      labelKey: "recipe.tone",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "cta",
      labelKey: "recipe.cta",
      isList: false,
      requiresGoodRating: true,
    },
  ],
  visual: [
    {
      key: "angle",
      labelKey: "recipe.angle",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "hook",
      labelKey: "recipe.hook",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "tone",
      labelKey: "recipe.tone",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "cta",
      labelKey: "recipe.cta",
      isList: false,
      requiresGoodRating: true,
    },
  ],
  newsletter: [
    {
      key: "angle",
      labelKey: "recipe.angle",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "structure",
      labelKey: "recipe.structure",
      isList: true,
      requiresGoodRating: true,
    },
    {
      key: "tone",
      labelKey: "recipe.tone",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "cta",
      labelKey: "recipe.cta",
      isList: false,
      requiresGoodRating: true,
    },
  ],
  article: [
    {
      key: "angle",
      labelKey: "recipe.angle",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "structure",
      labelKey: "recipe.structure",
      isList: true,
      requiresGoodRating: true,
    },
    {
      key: "tone",
      labelKey: "recipe.tone",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "seo",
      labelKey: "recipe.seo",
      isList: false,
      requiresGoodRating: false,
    },
  ],
  default: [
    {
      key: "angle",
      labelKey: "recipe.angle",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "hook",
      labelKey: "recipe.hook",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "tone",
      labelKey: "recipe.tone",
      isList: false,
      requiresGoodRating: true,
    },
    {
      key: "structure",
      labelKey: "recipe.structure",
      isList: true,
      requiresGoodRating: true,
    },
  ],
};
