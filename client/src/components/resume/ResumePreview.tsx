import React from 'react';
import type { ResumeJSON } from '../../types/resume';

interface ResumePreviewProps {
  resume: ResumeJSON;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ resume }) => {
  return (
    <div className="resume-sheet">
      
      {/* Contact Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-wide uppercase text-black leading-none mb-2">
          {resume.personalInfo.fullName}
        </h1>
        <div className="text-xs text-slate-700 flex flex-wrap justify-center gap-x-2 gap-y-1">
          <span>{resume.personalInfo.email}</span>
          <span>•</span>
          <span>{resume.personalInfo.phone}</span>
          <span>•</span>
          <span>{resume.personalInfo.location}</span>
          {resume.personalInfo.website && (
            <>
              <span>•</span>
              <a href={resume.personalInfo.website} target="_blank" rel="noreferrer" className="hover:underline">
                {resume.personalInfo.website.replace(/^https?:\/\//, '')}
              </a>
            </>
          )}
          {resume.personalInfo.linkedin && (
            <>
              <span>•</span>
              <span>{resume.personalInfo.linkedin}</span>
            </>
          )}
          {resume.personalInfo.github && (
            <>
              <span>•</span>
              <span>{resume.personalInfo.github}</span>
            </>
          )}
        </div>
      </div>

      {/* Professional Summary */}
      <div className="mb-5">
        <h2 className="text-xs font-bold tracking-wider text-indigo-700 border-b border-black uppercase pb-0.5 mb-2">
          Professional Summary
        </h2>
        <p className="text-xs text-justify text-slate-800 leading-relaxed font-serif">
          {resume.summary}
        </p>
      </div>

      {/* Work Experience */}
      <div className="mb-5">
        <h2 className="text-xs font-bold tracking-wider text-indigo-700 border-b border-black uppercase pb-0.5 mb-2">
          Work Experience
        </h2>
        <div className="space-y-4">
          {resume.experience.map((exp) => (
            <div key={exp.id}>
              <div className="flex items-center justify-between text-xs font-bold text-black font-serif">
                <div>
                  <span>{exp.company}</span>
                  <span className="font-normal text-slate-600 italic"> — {exp.position}</span>
                </div>
                <div className="text-right text-slate-600 font-normal">
                  {exp.startDate} - {exp.endDate}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 italic mb-1.5 font-serif">
                {exp.location}
              </div>
              <ul className="list-disc pl-4 text-xs text-slate-800 space-y-1 leading-relaxed font-serif">
                {exp.highlights.map((bullet, idx) => (
                  <li key={idx} className="pl-1">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold tracking-wider text-indigo-700 border-b border-black uppercase pb-0.5 mb-2">
            Key Projects
          </h2>
          <div className="space-y-4">
            {resume.projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex items-center justify-between text-xs font-bold text-black font-serif">
                  <div>
                    <span>{proj.name}</span>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <span className="font-normal text-slate-600 text-[10px] italic ml-2">
                        ({proj.technologies.join(', ')})
                      </span>
                    )}
                  </div>
                  {proj.url && (
                    <a href={proj.url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 font-normal hover:underline">
                      Link
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-serif my-1">
                  {proj.description}
                </p>
                {proj.highlights && proj.highlights.length > 0 && (
                  <ul className="list-disc pl-4 text-[11px] text-slate-800 space-y-0.5 leading-relaxed font-serif">
                    {proj.highlights.map((bullet, idx) => (
                      <li key={idx} className="pl-1">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Skills */}
      <div className="mb-5 font-serif">
        <h2 className="text-xs font-bold tracking-wider text-indigo-700 border-b border-black uppercase pb-0.5 mb-2 font-sans">
          Technical Skills
        </h2>
        <div className="text-xs text-slate-800 space-y-1">
          <div>
            <span className="font-bold">Languages:</span> {resume.skills.languages.join(', ')}
          </div>
          <div>
            <span className="font-bold">Frameworks & Libraries:</span> {resume.skills.frameworks.join(', ')}
          </div>
          <div>
            <span className="font-bold">Tools & Systems:</span> {resume.skills.tools.join(', ')}
          </div>
          {resume.skills.databases && resume.skills.databases.length > 0 && (
            <div>
              <span className="font-bold">Databases:</span> {resume.skills.databases.join(', ')}
            </div>
          )}
          {resume.skills.cloud && resume.skills.cloud.length > 0 && (
            <div>
              <span className="font-bold">Cloud Architectures:</span> {resume.skills.cloud.join(', ')}
            </div>
          )}
          <div>
            <span className="font-bold">Soft Skills:</span> {resume.skills.softSkills.join(', ')}
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="mb-5">
        <h2 className="text-xs font-bold tracking-wider text-indigo-700 border-b border-black uppercase pb-0.5 mb-2">
          Education
        </h2>
        <div className="space-y-3">
          {resume.education.map((edu) => (
            <div key={edu.id}>
              <div className="flex items-center justify-between text-xs font-bold text-black font-serif">
                <div>
                  <span>{edu.institution}</span>
                  <span className="font-normal text-slate-600"> — {edu.degree} in {edu.fieldOfStudy}</span>
                </div>
                <div className="text-right text-slate-600 font-normal">
                  {edu.startDate} - {edu.endDate}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 italic font-serif">
                {edu.location} {edu.gpa ? `| GPA: ${edu.gpa}` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications & Achievements */}
      {resume.certifications && resume.certifications.length > 0 && (
        <div>
          <h2 className="text-xs font-bold tracking-wider text-indigo-700 border-b border-black uppercase pb-0.5 mb-2 font-sans">
            Certifications & Achievements
          </h2>
          <ul className="list-disc pl-4 text-xs text-slate-800 space-y-1 font-serif">
            {resume.certifications.map((cert, idx) => (
              <li key={idx} className="pl-1">
                {cert}
              </li>
            ))}
            {resume.achievements && resume.achievements.map((ach, idx) => (
              <li key={`ach-${idx}`} className="pl-1">
                {ach}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
};
