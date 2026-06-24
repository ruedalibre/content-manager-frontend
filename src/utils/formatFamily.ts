export type FormatFamily =
  | "short_video"
  | "long_video"
  | "live"
  | "text_post"
  | "carousel"
  | "story"
  | "visual"
  | "newsletter"
  | "article"
  | "default";

type FormatKey = `${string}:${string}`;

const FORMAT_FAMILY_MAP: Record<FormatKey, FormatFamily> = {
  "instagram:reel": "short_video",
  "instagram:story": "story",
  "instagram:post": "visual",
  "instagram:carousel": "carousel",
  "instagram:broadcast": "newsletter",
  "tiktok:video": "short_video",
  "tiktok:live": "live",
  "tiktok:carousel": "carousel",
  "youtube:video": "long_video",
  "youtube:short": "short_video",
  "youtube:live": "live",
  "youtube:community_post": "text_post",
  "linkedin:post": "text_post",
  "linkedin:carousel": "carousel",
  "linkedin:video": "short_video",
  "linkedin:newsletter": "newsletter",
  "x:text": "text_post",
  "x:video": "short_video",
  "x:image": "visual",
  "facebook:video": "long_video",
  "facebook:reel": "short_video",
  "facebook:carousel": "carousel",
  "facebook:story": "story",
  "facebook:post": "text_post",
  "threads:text": "text_post",
  "threads:image": "visual",
  "pinterest:image": "visual",
  "pinterest:video": "short_video",
  "snapchat:story": "story",
  "snapchat:video": "short_video",
  "twitch:live": "live",
  "twitch:clip": "short_video",
  "telegram:text": "text_post",
  "telegram:video": "short_video",
  "telegram:image": "visual",
  "discord:text": "text_post",
  "discord:image": "visual",
  "website:article": "article",
  "website:newsletter": "newsletter",
  "website:landing": "article",
};

export const getFormatFamily = (
  platform: string,
  format: string,
): FormatFamily => FORMAT_FAMILY_MAP[`${platform}:${format}`] ?? "default";
