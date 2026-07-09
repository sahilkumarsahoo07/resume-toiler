import PDFDocument from 'pdfkit';
import { ResumeJSON } from '../types/resume';

export class PdfService {
  /**
   * Helper to calculate the predicted height of a work experience entry
   */
  private static getExperienceHeight(doc: any, exp: any): number {
    let height = 0;
    
    // Company & Position
    doc.font('Helvetica-Bold').fontSize(9.5);
    height += doc.heightOfString(`${exp.company} — ${exp.position}`, { width: 515 });
    
    // Location & Dates
    doc.font('Helvetica-Oblique').fontSize(8);
    height += doc.heightOfString(`${exp.location}  |  ${exp.startDate} - ${exp.endDate}`, { width: 515 });
    
    // Spacer
    height += 3; // doc.moveDown(0.2) approx

    // Highlights
    doc.font('Helvetica').fontSize(9);
    exp.highlights.forEach((hl: string) => {
      height += doc.heightOfString(`•  ${hl}`, { width: 515, indent: 10, lineGap: 2 }) + 2.5;
    });
    
    height += 6; // doc.moveDown(0.4) approx
    return height;
  }

  /**
   * Helper to calculate the predicted height of a project entry
   */
  private static getProjectHeight(doc: any, proj: any): number {
    let height = 0;
    
    // Project Name & Technologies
    doc.font('Helvetica-Bold').fontSize(9.5);
    const projHeader = proj.technologies && proj.technologies.length > 0 
      ? `${proj.name} (${proj.technologies.join(', ')})`
      : proj.name;
    height += doc.heightOfString(projHeader, { width: 515 });
    
    // Description
    doc.font('Helvetica').fontSize(9);
    height += doc.heightOfString(proj.description, { width: 515, lineGap: 2 });
    
    // Highlights
    if (proj.highlights && proj.highlights.length > 0) {
      proj.highlights.forEach((hl: string) => {
        height += doc.heightOfString(`•  ${hl}`, { width: 515, indent: 10, lineGap: 2 }) + 2.5;
      });
    }
    
    height += 6; // doc.moveDown(0.4) approx
    return height;
  }

  /**
   * Helper to calculate the predicted height of an education entry
   */
  private static getEducationHeight(doc: any, edu: any): number {
    let height = 0;
    
    // Institution & Degree
    doc.font('Helvetica-Bold').fontSize(9.5);
    height += doc.heightOfString(`${edu.institution} — ${edu.degree} in ${edu.fieldOfStudy}`, { width: 515 });
    
    // Location & Dates
    doc.font('Helvetica-Oblique').fontSize(8);
    let eduDetail = `${edu.location}  |  Graduation: ${edu.endDate}`;
    if (edu.gpa) eduDetail += `  |  GPA: ${edu.gpa}`;
    height += doc.heightOfString(eduDetail, { width: 515 });
    
    height += 6; // doc.moveDown(0.4) approx
    return height;
  }

  /**
   * Helper to calculate the predicted height of the skills section
   */
  private static getSkillsHeight(doc: any, skills: any): number {
    let height = 0;
    doc.font('Helvetica').fontSize(9);
    
    if (skills.languages && skills.languages.length > 0) {
      doc.font('Helvetica-Bold');
      const w1 = doc.widthOfString('Languages: ');
      doc.font('Helvetica');
      height += doc.heightOfString(skills.languages.join(', '), { width: 515 - w1 }) + 3;
    }
    if (skills.frameworks && skills.frameworks.length > 0) {
      doc.font('Helvetica-Bold');
      const w2 = doc.widthOfString('Frameworks & Libraries: ');
      doc.font('Helvetica');
      height += doc.heightOfString(skills.frameworks.join(', '), { width: 515 - w2 }) + 3;
    }
    if (skills.tools && skills.tools.length > 0) {
      doc.font('Helvetica-Bold');
      const w3 = doc.widthOfString('Tools & DevOps: ');
      doc.font('Helvetica');
      height += doc.heightOfString(skills.tools.join(', '), { width: 515 - w3 }) + 3;
    }
    if (skills.databases && skills.databases.length > 0) {
      doc.font('Helvetica-Bold');
      const w4 = doc.widthOfString('Databases: ');
      doc.font('Helvetica');
      height += doc.heightOfString(skills.databases.join(', '), { width: 515 - w4 }) + 3;
    }
    if (skills.softSkills && skills.softSkills.length > 0) {
      doc.font('Helvetica-Bold');
      const w5 = doc.widthOfString('Soft Skills: ');
      doc.font('Helvetica');
      height += doc.heightOfString(skills.softSkills.join(', '), { width: 515 - w5 }) + 3;
    }
    return height;
  }

  /**
   * Helper to calculate the predicted height of the certifications section
   */
  private static getCertificationsHeight(doc: any, certifications: string[]): number {
    let height = 0;
    doc.font('Helvetica').fontSize(9);
    certifications.forEach(cert => {
      height += doc.heightOfString(`•  ${cert}`, { width: 515, indent: 10 }) + 2.5;
    });
    return height;
  }

  /**
   * Generates a PDF file buffer from Resume JSON using pdfkit
   */
  static async generate(resume: ResumeJSON): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40
        });
        
        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', err => reject(err));

        const headerHeight = 35;
        const bottomLimit = 802; // 842 (A4 height) - 40 (bottom margin)

        // 1. Name
        doc.font('Helvetica-Bold')
           .fontSize(22)
           .fillColor('#0F172A')
           .text(resume.personalInfo.fullName, { align: 'center' });
        
        // 2. Contact Info
        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#475569');
           
        let contactParts = [
          resume.personalInfo.email,
          resume.personalInfo.phone,
          resume.personalInfo.location
        ].filter(Boolean);
        
        if (resume.personalInfo.website) contactParts.push(resume.personalInfo.website);
        if (resume.personalInfo.linkedin) contactParts.push(resume.personalInfo.linkedin);
        
        const contactStr = contactParts.join('  |  ');
        doc.text(contactStr, { align: 'center' });
        doc.moveDown(1.2);

        const addHeader = (title: string) => {
          doc.moveDown(0.8);
          doc.font('Helvetica-Bold')
             .fontSize(10.5)
             .fillColor('#4F46E5')
             .text(title.toUpperCase());
             
          // Draw horizontal line below title
          const y = doc.y + 2;
          doc.moveTo(40, y)
             .lineTo(555, y)
             .strokeColor('#E2E8F0')
             .lineWidth(1)
             .stroke();
             
          doc.moveDown(0.5);
        };

        // 3. Summary
        if (resume.summary) {
          doc.font('Helvetica').fontSize(9.5);
          const summaryHeight = doc.heightOfString(resume.summary, { align: 'justify', width: 515, lineGap: 2.5 });
          if (doc.y + headerHeight + summaryHeight > bottomLimit && doc.y > 50) {
            doc.addPage();
          }
          addHeader('Professional Summary');
          doc.font('Helvetica')
             .fontSize(9.5)
             .fillColor('#334155')
             .text(resume.summary, { align: 'justify', lineGap: 2.5 });
        }

        // 4. Experience
        if (resume.experience && resume.experience.length > 0) {
          const firstExpHeight = PdfService.getExperienceHeight(doc, resume.experience[0]);
          if (doc.y + headerHeight + firstExpHeight > bottomLimit && doc.y > 50) {
            doc.addPage();
          }
          addHeader('Work Experience');

          resume.experience.forEach((exp, idx) => {
            if (idx > 0) {
              const expHeight = PdfService.getExperienceHeight(doc, exp);
              if (doc.y + expHeight > bottomLimit && doc.y > 50) {
                doc.addPage();
              }
            }

            doc.font('Helvetica-Bold')
               .fontSize(9.5)
               .fillColor('#0F172A')
               .text(`${exp.company} — `, { continued: true });
               
            doc.font('Helvetica-Bold')
               .fillColor('#4F46E5')
               .text(exp.position);
            
            doc.font('Helvetica-Oblique')
               .fontSize(8)
               .fillColor('#64748B')
               .text(`${exp.location}  |  ${exp.startDate} - ${exp.endDate}`);
               
            doc.moveDown(0.2);

            doc.font('Helvetica')
               .fontSize(9)
               .fillColor('#334155');
               
            exp.highlights.forEach(hl => {
              doc.text(`•  ${hl}`, { indent: 10, paragraphGap: 2.5, lineGap: 2 });
            });
            doc.moveDown(0.4);
          });
        }

        // 5. Projects
        if (resume.projects && resume.projects.length > 0) {
          const firstProjHeight = PdfService.getProjectHeight(doc, resume.projects[0]);
          if (doc.y + headerHeight + firstProjHeight > bottomLimit && doc.y > 50) {
            doc.addPage();
          }
          addHeader('Projects');

          resume.projects.forEach((proj, idx) => {
            if (idx > 0) {
              const projHeight = PdfService.getProjectHeight(doc, proj);
              if (doc.y + projHeight > bottomLimit && doc.y > 50) {
                doc.addPage();
              }
            }

            doc.font('Helvetica-Bold')
               .fontSize(9.5)
               .fillColor('#0F172A')
               .text(proj.name, { continued: proj.technologies && proj.technologies.length > 0 });
               
            if (proj.technologies && proj.technologies.length > 0) {
              doc.font('Helvetica-Oblique')
                 .fontSize(8.5)
                 .fillColor('#64748B')
                 .text(` (${proj.technologies.join(', ')})`);
            } else {
              doc.text('');
            }
            
            doc.font('Helvetica')
               .fontSize(9)
               .fillColor('#334155')
               .text(proj.description, { lineGap: 2 });
            
            if (proj.highlights && proj.highlights.length > 0) {
              proj.highlights.forEach(hl => {
                doc.text(`•  ${hl}`, { indent: 10, paragraphGap: 2.5, lineGap: 2 });
              });
            }
            doc.moveDown(0.4);
          });
        }

        // 6. Skills
        if (resume.skills) {
          const skillsHeight = PdfService.getSkillsHeight(doc, resume.skills);
          if (doc.y + headerHeight + skillsHeight > bottomLimit && doc.y > 50) {
            doc.addPage();
          }
          addHeader('Technical Skills');

          doc.font('Helvetica')
             .fontSize(9)
             .fillColor('#0F172A');
             
          if (resume.skills.languages && resume.skills.languages.length > 0) {
            doc.font('Helvetica-Bold').text('Languages: ', { continued: true });
            doc.font('Helvetica').fillColor('#334155').text(resume.skills.languages.join(', '), { paragraphGap: 3 });
          }
          
          if (resume.skills.frameworks && resume.skills.frameworks.length > 0) {
            doc.font('Helvetica-Bold').fillColor('#0F172A').text('Frameworks & Libraries: ', { continued: true });
            doc.font('Helvetica').fillColor('#334155').text(resume.skills.frameworks.join(', '), { paragraphGap: 3 });
          }

          if (resume.skills.tools && resume.skills.tools.length > 0) {
            doc.font('Helvetica-Bold').fillColor('#0F172A').text('Tools & DevOps: ', { continued: true });
            doc.font('Helvetica').fillColor('#334155').text(resume.skills.tools.join(', '), { paragraphGap: 3 });
          }

          if (resume.skills.databases && resume.skills.databases.length > 0) {
            doc.font('Helvetica-Bold').fillColor('#0F172A').text('Databases: ', { continued: true });
            doc.font('Helvetica').fillColor('#334155').text(resume.skills.databases.join(', '), { paragraphGap: 3 });
          }

          if (resume.skills.softSkills && resume.skills.softSkills.length > 0) {
            doc.font('Helvetica-Bold').fillColor('#0F172A').text('Soft Skills: ', { continued: true });
            doc.font('Helvetica').fillColor('#334155').text(resume.skills.softSkills.join(', '), { paragraphGap: 3 });
          }
        }

        // 7. Education
        if (resume.education && resume.education.length > 0) {
          const firstEduHeight = PdfService.getEducationHeight(doc, resume.education[0]);
          if (doc.y + headerHeight + firstEduHeight > bottomLimit && doc.y > 50) {
            doc.addPage();
          }
          addHeader('Education');

          resume.education.forEach((edu, idx) => {
            if (idx > 0) {
              const eduHeight = PdfService.getEducationHeight(doc, edu);
              if (doc.y + eduHeight > bottomLimit && doc.y > 50) {
                doc.addPage();
              }
            }

            doc.font('Helvetica-Bold')
               .fontSize(9.5)
               .fillColor('#0F172A')
               .text(edu.institution, { continued: true });
               
            doc.font('Helvetica')
               .fillColor('#334155')
               .text(` — ${edu.degree} in ${edu.fieldOfStudy}`);
            
            let eduDetail = `${edu.location}  |  Graduation: ${edu.endDate}`;
            if (edu.gpa) eduDetail += `  |  GPA: ${edu.gpa}`;
            doc.font('Helvetica-Oblique')
               .fontSize(8)
               .fillColor('#64748B')
               .text(eduDetail);
            doc.moveDown(0.4);
          });
        }

        // 8. Certifications
        if (resume.certifications && resume.certifications.length > 0) {
          const certsHeight = PdfService.getCertificationsHeight(doc, resume.certifications);
          if (doc.y + headerHeight + certsHeight > bottomLimit && doc.y > 50) {
            doc.addPage();
          }
          addHeader('Certifications');
          doc.font('Helvetica')
             .fontSize(9)
             .fillColor('#334155');
          resume.certifications.forEach(cert => {
            doc.text(`•  ${cert}`, { indent: 10, paragraphGap: 2.5 });
          });
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
