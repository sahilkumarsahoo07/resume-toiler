export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  highlights: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  highlights: string[];
  url?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface Skills {
  languages: string[];
  frameworks: string[];
  tools: string[];
  databases?: string[];
  cloud?: string[];
  softSkills: string[];
}

export interface ResumeJSON {
  _id?: string;
  fileName?: string;
  personalInfo: PersonalInfo;
  summary: string;
  experience: WorkExperience[];
  projects: Project[];
  skills: Skills;
  education: Education[];
  certifications: string[];
  achievements: string[];
}
