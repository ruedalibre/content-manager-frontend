export type FormatFamily = "default" | "short_video" | "long_video" | "written" | "audio" | "visual";

const FAMILY_MAP: Record<string, Record<string, FormatFamily>> = {
  youtube: {
    short: "short_video",
    video: "long_video",
    live: "long_video",
  },
  instagram: {
    reel: "short_video",
    story: "short_video",
    post: "visual",
    carousel: "visual",
    live: "long_video",
  },
  tiktok: {
    video: "short_video",
    live: "long_video",
  },
  linkedin: {
    post: "written",
    article: "written",
    newsletter: "written",
    video: "short_video",
    carousel: "visual",
  },
  twitter: {
    tweet: "written",
    thread: "written",
  },
  blog: {
    article: "written",
    post: "written",
  },
  podcast: {
    episode: "audio",
    short: "audio",
  },
  newsletter: {
    edition: "written",
  },
};

export function getFormatFamily(platformSlug: string, format: string): FormatFamily {
  const slug = platformSlug.toLowerCase();
  const fmt = format.toLowerCase();
  return FAMILY_MAP[slug]?.[fmt] ?? "default";
}
