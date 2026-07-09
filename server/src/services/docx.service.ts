import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  HeadingLevel, 
  ExternalHyperlink,
  BorderStyle
} from 'docx';
import { ResumeJSON } from '../types/resume';

export class DocxService {
  
  /**
   * Generates a DOCX file buffer from Resume JSON
   */
  static async generate(resume: ResumeJSON): Promise<Buffer> {
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch
                bottom: 1440,
                left: 1440,
                right: 1440,
              },
            },
          },
          children: [
            // Name
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: resume.personalInfo.fullName,
                  bold: true,
                  size: 32, // 16pt
                  font: 'Arial',
                  color: '0F172A', // Slate 900
                }),
              ],
            }),
            
            // Contact Info
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 120, after: 240 },
              children: [
                new TextRun({
                  text: `${resume.personalInfo.email}  |  ${resume.personalInfo.phone}  |  ${resume.personalInfo.location}`,
                  size: 20, // 10pt
                  font: 'Arial',
                  color: '475569', // Slate 600
                }),
                ...(resume.personalInfo.website ? [
                  new TextRun({
                    text: `  |  ${resume.personalInfo.website}`,
                    size: 20,
                    font: 'Arial',
                    color: '475569',
                  })
                ] : []),
                ...(resume.personalInfo.linkedin ? [
                  new TextRun({
                    text: `  |  ${resume.personalInfo.linkedin}`,
                    size: 20,
                    font: 'Arial',
                    color: '475569',
                  })
                ] : []),
              ],
            }),

            // ----------------------------------------------------
            // PROFESSIONAL SUMMARY
            // ----------------------------------------------------
            ...this.createSectionHeader('PROFESSIONAL SUMMARY'),
            new Paragraph({
              spacing: { before: 120, after: 240 },
              children: [
                new TextRun({
                  text: resume.summary,
                  size: 22, // 11pt
                  font: 'Arial',
                  color: '334155', // Slate 700
                }),
              ],
            }),

            // ----------------------------------------------------
            // WORK EXPERIENCE
            // ----------------------------------------------------
            ...this.createSectionHeader('WORK EXPERIENCE'),
            ...resume.experience.flatMap(exp => [
              new Paragraph({
                spacing: { before: 180, after: 40 },
                children: [
                  new TextRun({
                    text: exp.company,
                    bold: true,
                    size: 24, // 12pt
                    font: 'Arial',
                    color: '0F172A',
                  }),
                  new TextRun({
                    text: `  —  ${exp.position}`,
                    bold: true,
                    size: 22, // 11pt
                    font: 'Arial',
                    color: '4F46E5', // Indigo 600 Accent
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: `${exp.location}  |  ${exp.startDate} - ${exp.endDate}`,
                    italics: true,
                    size: 18, // 9pt
                    font: 'Arial',
                    color: '64748B', // Slate 500
                  }),
                ],
              }),
              ...exp.highlights.map(hl => 
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { before: 60, after: 60 },
                  children: [
                    new TextRun({
                      text: hl,
                      size: 20, // 10pt
                      font: 'Arial',
                      color: '334155',
                    }),
                  ],
                })
              )
            ]),

            // ----------------------------------------------------
            // PROJECTS
            // ----------------------------------------------------
            ...(resume.projects && resume.projects.length > 0 ? [
              ...this.createSectionHeader('PROJECTS'),
              ...resume.projects.flatMap(proj => [
                new Paragraph({
                  spacing: { before: 180, after: 40 },
                  children: [
                    new TextRun({
                      text: proj.name,
                      bold: true,
                      size: 24,
                      font: 'Arial',
                      color: '0F172A',
                    }),
                    ...(proj.technologies && proj.technologies.length > 0 ? [
                      new TextRun({
                        text: ` (${proj.technologies.join(', ')})`,
                        italics: true,
                        size: 20,
                        font: 'Arial',
                        color: '64748B',
                      })
                    ] : [])
                  ],
                }),
                new Paragraph({
                  spacing: { after: 100 },
                  children: [
                    new TextRun({
                      text: proj.description,
                      size: 20,
                      font: 'Arial',
                      color: '334155',
                    }),
                  ],
                }),
                ...(proj.highlights || []).map(hl => 
                  new Paragraph({
                    bullet: { level: 0 },
                    spacing: { before: 40, after: 40 },
                    children: [
                      new TextRun({
                        text: hl,
                        size: 20,
                        font: 'Arial',
                        color: '334155',
                      }),
                    ],
                  })
                )
              ])
            ] : []),

            // ----------------------------------------------------
            // SKILLS PROFILE
            // ----------------------------------------------------
            ...this.createSectionHeader('TECHNICAL SKILLS'),
            new Paragraph({
              spacing: { before: 120, after: 60 },
              children: [
                new TextRun({ text: 'Languages: ', bold: true, size: 20, font: 'Arial' }),
                new TextRun({ text: resume.skills.languages.join(', '), size: 20, font: 'Arial', color: '334155' }),
              ],
            }),
            new Paragraph({
              spacing: { before: 60, after: 60 },
              children: [
                new TextRun({ text: 'Frameworks & Libraries: ', bold: true, size: 20, font: 'Arial' }),
                new TextRun({ text: resume.skills.frameworks.join(', '), size: 20, font: 'Arial', color: '334155' }),
              ],
            }),
            new Paragraph({
              spacing: { before: 60, after: 60 },
              children: [
                new TextRun({ text: 'Tools & DevOps: ', bold: true, size: 20, font: 'Arial' }),
                new TextRun({ text: resume.skills.tools.join(', '), size: 20, font: 'Arial', color: '334155' }),
              ],
            }),
            ...(resume.skills.databases && resume.skills.databases.length > 0 ? [
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({ text: 'Databases: ', bold: true, size: 20, font: 'Arial' }),
                  new TextRun({ text: resume.skills.databases.join(', '), size: 20, font: 'Arial', color: '334155' }),
                ],
              })
            ] : []),
            new Paragraph({
              spacing: { before: 60, after: 240 },
              children: [
                new TextRun({ text: 'Soft Skills: ', bold: true, size: 20, font: 'Arial' }),
                new TextRun({ text: resume.skills.softSkills.join(', '), size: 20, font: 'Arial', color: '334155' }),
              ],
            }),

            // ----------------------------------------------------
            // EDUCATION
            // ----------------------------------------------------
            ...this.createSectionHeader('EDUCATION'),
            ...resume.education.flatMap(edu => [
              new Paragraph({
                spacing: { before: 120, after: 40 },
                children: [
                  new TextRun({
                    text: edu.institution,
                    bold: true,
                    size: 22,
                    font: 'Arial',
                    color: '0F172A',
                  }),
                  new TextRun({
                    text: `  —  ${edu.degree} in ${edu.fieldOfStudy}`,
                    size: 20,
                    font: 'Arial',
                    color: '334155',
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: `${edu.location}  |  Graduation: ${edu.endDate}${edu.gpa ? `  |  GPA: ${edu.gpa}` : ''}`,
                    italics: true,
                    size: 18,
                    font: 'Arial',
                    color: '64748B',
                  }),
                ],
              })
            ]),

            // ----------------------------------------------------
            // CERTIFICATIONS & ACHIEVEMENTS
            // ----------------------------------------------------
            ...(resume.certifications && resume.certifications.length > 0 ? [
              ...this.createSectionHeader('CERTIFICATIONS'),
              ...resume.certifications.map(cert => 
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { before: 60, after: 60 },
                  children: [
                    new TextRun({
                      text: cert,
                      size: 20,
                      font: 'Arial',
                      color: '334155',
                    }),
                  ],
                })
              )
            ] : []),
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Helper to create a section header with horizontal bottom border
   */
  private static createSectionHeader(title: string): Paragraph[] {
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 60 },
        border: {
          bottom: {
            color: '6366F1', // Indigo border line
            size: 6,
            space: 4,
            style: BorderStyle.SINGLE,
          },
        },
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 20, // 10pt
            font: 'Arial',
            color: '4F46E5',
          }),
        ],
      })
    ];
  }
}
