import {
  Document, Packer, Paragraph, TextRun,
  HeadingLevel, BorderStyle, AlignmentType
} from "docx"
import { saveAs } from "file-saver"
import { trackDownload } from "./apiClient"

type CreativeReport = {
  identity: string
  current_state: string
  opportunity: string
  question: string
}

export async function downloadReport(
  report: CreativeReport,
  generatedAt: string
) {
  const textToParagraphs = (text: string, italic = false) => {
    return text.split('\n')
      .filter(p => p.trim().length > 0)
      .map(p => new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({
          text: p.trim(),
          font: "Arial", size: 22,
          italics: italic
        })]
      }))
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22 } }
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1",
          basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 36, bold: true, font: "Arial", color: "1a1a1a" },
          paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 }
        },
        {
          id: "Heading2", name: "Heading 2",
          basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 22, bold: true, font: "Arial", color: "999999" },
          paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 1 }
        }
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1800, right: 1800, bottom: 1800, left: 1800 }
        }
      },
      children: [

        // COVER
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({
            text: "Creator Identity Report",
            font: "Arial", size: 48, bold: true, color: "1a1a1a"
          })]
        }),
        new Paragraph({
          spacing: { after: 480 },
          children: [new TextRun({
            text: `Generated ${new Date(generatedAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })} · Content Intelligence Platform`,
            font: "Arial", size: 18, color: "999999"
          })]
        }),

        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "3C3489", space: 1 } },
          spacing: { after: 480 },
          children: []
        }),

        // SECTION 1
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({
            text: "WHO YOU ARE AS A CREATOR", font: "Arial"
          })]
        }),
        ...textToParagraphs(report.identity),

        // SECTION 2
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({
            text: "WHAT'S HAPPENING IN YOUR CONTENT", font: "Arial"
          })]
        }),
        ...textToParagraphs(report.current_state),

        // SECTION 3
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({
            text: "YOUR BIGGEST UNEXPLORED OPPORTUNITY", font: "Arial"
          })]
        }),
        ...textToParagraphs(report.opportunity),

        // SECTION 4 — question destacada
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({
            text: "WORTH SITTING WITH", font: "Arial"
          })]
        }),
        new Paragraph({
          spacing: { after: 160 },
          shading: { fill: "EEEDFE" },
          children: [new TextRun({
            text: report.question,
            font: "Arial", size: 24,
            italics: true, color: "3C3489"
          })]
        }),

        // DISCLAIMER
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 1 } },
          spacing: { before: 720, after: 80 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            text: `Content Intelligence App · ${new Date(generatedAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}`,
            font: "Arial", size: 16, color: "AAAAAA"
          })]
        }),
        new Paragraph({
          spacing: { after: 0 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            text: "This report is an AI-assisted creative analysis based on your content patterns. " +
                  "AI-generated outputs may not be eligible for copyright protection. " +
                  "Content Intelligence App does not claim intellectual property rights over this output. " +
                  "For questions about IP rights related to AI-assisted content, consult a legal professional.",
            font: "Arial", size: 14, color: "AAAAAA", italics: true
          })]
        }),
      ]
    }]
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `creator_report_${new Date(generatedAt).toISOString().split('T')[0]}.docx`)
  trackDownload('report', {
    generated_at: generatedAt
  })
}
