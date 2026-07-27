import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  LevelFormat,
} from "docx";
import { saveAs } from "file-saver";
import { trackDownload } from "./apiClient";
import { getFormatFamily } from "./formatFamily";
import { ASPECTS_BY_FAMILY } from "../constants/aspectsByFamily";

type Session = {
  recipe: Record<string, string | string[]>;
  format: string;
  content_role: string | null;
  created_at: string;
};

type Idea = {
  title: string;
  description?: string | null;
  topics?: { name: string }[];
};

// Labels legibles en inglés para el .docx — independientes de i18n,
// ya que el documento se genera en el idioma base del brief
const LABEL_MAP: Record<string, string> = {
  angle: "Angle",
  hook: "Hook",
  tone: "Tone",
  structure: "Structure",
  argument: "Argument",
  cta: "Call to action",
  retention: "Retention",
  engagement: "Engagement",
  seo: "SEO",
};

export async function downloadBrief(
  session: Session,
  idea: Idea,
  platformSlug: string = "",
) {
  const family = getFormatFamily(platformSlug, session.format);
  const aspects = ASPECTS_BY_FAMILY[family] ?? ASPECTS_BY_FAMILY.default;

  const aspectParagraphs = aspects.flatMap((aspect) => {
    const value = session.recipe[aspect.key];
    if (value === undefined || value === null) return [];

    const label = LABEL_MAP[aspect.key] ?? aspect.key;

    if (aspect.isList) {
      const items = Array.isArray(value) ? value : [value as string];
      if (items.length === 0) return [];
      return [
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: label, font: "Arial" })],
        }),
        ...items.map(
          (step) =>
            new Paragraph({
              numbering: { reference: "structure-list", level: 0 },
              spacing: { after: 80 },
              children: [
                new TextRun({ text: step as string, font: "Arial", size: 22 }),
              ],
            }),
        ),
      ];
    }

    const text = value as string;
    if (!text) return [];

    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: label, font: "Arial" })],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text, font: "Arial", size: 22 })],
      }),
    ];
  });

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "structure-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22 } },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, font: "Arial", color: "3C3489" },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, font: "Arial", color: "534AB7" },
          paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          // TÍTULO
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: idea.title, font: "Arial" })],
          }),

          // SUBTÍTULO — descripción si existe
          ...(idea.description
            ? [
                new Paragraph({
                  spacing: { after: 200 },
                  children: [
                    new TextRun({
                      text: idea.description,
                      font: "Arial",
                      size: 20,
                      color: "666666",
                      italics: true,
                    }),
                  ],
                }),
              ]
            : []),

          // META
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: "Format: ",
                bold: true,
                font: "Arial",
                size: 20,
              }),
              new TextRun({ text: session.format, font: "Arial", size: 20 }),
            ],
          }),
          ...(session.content_role
            ? [
                new Paragraph({
                  spacing: { after: 80 },
                  children: [
                    new TextRun({
                      text: "Role: ",
                      bold: true,
                      font: "Arial",
                      size: 20,
                    }),
                    new TextRun({
                      text: session.content_role,
                      font: "Arial",
                      size: 20,
                    }),
                  ],
                }),
              ]
            : []),
          ...(idea.topics && idea.topics.length > 0
            ? [
                new Paragraph({
                  spacing: { after: 240 },
                  children: [
                    new TextRun({
                      text: "Topics: ",
                      bold: true,
                      font: "Arial",
                      size: 20,
                    }),
                    new TextRun({
                      text: idea.topics.map((t) => t.name).join(", "),
                      font: "Arial",
                      size: 20,
                    }),
                  ],
                }),
              ]
            : []),

          // SEPARADOR
          new Paragraph({
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: "AFA9EC",
                space: 1,
              },
            },
            spacing: { after: 240 },
            children: [],
          }),

          // ASPECTOS DINÁMICOS — solo los que aplican a esta familia
          ...aspectParagraphs,

          // STRATEGIC NOTE
          ...(session.recipe.strategic_note
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200 },
                  children: [
                    new TextRun({ text: "Strategic note", font: "Arial" }),
                  ],
                }),
                new Paragraph({
                  spacing: { after: 200 },
                  children: [
                    new TextRun({
                      text: session.recipe.strategic_note as string,
                      font: "Arial",
                      size: 22,
                      italics: true,
                    }),
                  ],
                }),
              ]
            : []),

          // DISCLAIMER
          new Paragraph({
            border: {
              top: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: "CCCCCC",
                space: 1,
              },
            },
            spacing: { before: 480, after: 80 },
            children: [
              new TextRun({
                text: `Generated by Creadora · ${new Date(session.created_at).toLocaleDateString()}`,
                font: "Arial",
                size: 16,
                color: "999999",
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 0 },
            children: [
              new TextRun({
                text:
                  "This brief is an AI-assisted creative guide based on your content patterns. " +
                  "AI-generated outputs may not be eligible for copyright protection. " +
                  "The original content you create using this brief as a reference is your own work. " +
                  "Creadora does not claim intellectual property rights over this output.",
                font: "Arial",
                size: 14,
                color: "AAAAAA",
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = idea.title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .substring(0, 50);
  saveAs(blob, `brief_${filename}.docx`);
  trackDownload("brief", {
    idea_title: idea.title,
    format: session.format,
    content_role: session.content_role,
  });
}
