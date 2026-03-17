type ContentDNA = {
  primary_topic: string | null;
  primary_format: string | null;
  primary_role: string | null;
};

export function generateIdeasFromDNA(dna: ContentDNA): string[] {
  if (!dna) return [];

  const { primary_topic, primary_role } = dna;

  if (!primary_topic) return [];

  const topic = primary_topic;

  const templates = [
    `3 things you should know about ${topic}`,
    `Common mistakes in ${topic}`,
    `How I improved my ${topic} workflow`,
    `Beginner guide to ${topic}`,
    `Advanced strategies for ${topic}`,
    `What nobody tells you about ${topic}`,
  ];

  // opcional: personalizar por rol
  if (primary_role === "educational") {
    return templates.map((t) => `Explained: ${t}`);
  }

  if (primary_role === "inspirational") {
    return templates.map((t) => `Why ${t}`);
  }

  return templates;
}