import { z } from 'zod';

export const PersonalInfoSchema = z.object({
  fullName: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  location: z.string().optional().default(""),
  website: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  github: z.string().optional().default("")
});

export const WorkExperienceSchema = z.object({
  id: z.string(),
  company: z.string().optional().default(""),
  position: z.string().optional().default(""),
  location: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  highlights: z.array(z.string()).optional().default([])
});

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().optional().default(""),
  description: z.string().optional().default(""),
  technologies: z.array(z.string()).optional().default([]),
  highlights: z.array(z.string()).optional().default([]),
  url: z.string().optional().default("")
});

export const EducationSchema = z.object({
  id: z.string(),
  institution: z.string().optional().default(""),
  degree: z.string().optional().default(""),
  fieldOfStudy: z.string().optional().default(""),
  location: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  gpa: z.string().optional().default("")
});

export const SkillsSchema = z.object({
  languages: z.array(z.string()).optional().default([]),
  frameworks: z.array(z.string()).optional().default([]),
  tools: z.array(z.string()).optional().default([]),
  databases: z.array(z.string()).optional().default([]),
  cloud: z.array(z.string()).optional().default([]),
  softSkills: z.array(z.string()).optional().default([])
});

export const ResumeJSONSchema = z.object({
  _id: z.string().optional(),
  fileName: z.string().optional(),
  personalInfo: PersonalInfoSchema,
  summary: z.string(),
  experience: z.array(WorkExperienceSchema),
  projects: z.array(ProjectSchema),
  skills: SkillsSchema,
  education: z.array(EducationSchema),
  certifications: z.array(z.string()),
  achievements: z.array(z.string())
});

export const JDAnalysisSchema = z.object({
  jobTitle: z.string(),
  experienceRequired: z.string(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  technologies: z.array(z.string()),
  softSkills: z.array(z.string()),
  atsKeywords: z.array(z.string()),
  actionVerbs: z.array(z.string()),
  industry: z.string()
});

export const SuggestionItemSchema = z.object({
  id: z.string(),
  category: z.enum(['summary', 'experience', 'skills', 'projects', 'general']),
  targetId: z.string().optional(),
  title: z.string(),
  explanation: z.string(),
  originalText: z.string().optional(),
  proposedText: z.string().optional(),
  impactScore: z.number().min(1).max(10)
});

// API endpoint schemas
export const AnalyzeJDRequestSchema = z.object({
  jdText: z.string().min(10, "Job description must be at least 10 characters long")
});

export const CompareRequestSchema = z.object({
  resume: ResumeJSONSchema,
  jdAnalysis: JDAnalysisSchema
});

export const ApplySuggestionsRequestSchema = z.object({
  resume: ResumeJSONSchema,
  selectedSuggestions: z.array(SuggestionItemSchema)
});
