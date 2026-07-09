export interface SuggestionItem {
  id: string;
  category: 'summary' | 'experience' | 'skills' | 'projects' | 'general';
  targetId?: string;
  title: string;
  explanation: string;
  originalText?: string;
  proposedText?: string;
  impactScore: number;
}

export interface ResumeCompareResult {
  matchedSkills: string[];
  missingSkills: string[];
  weakSections: string[];
  keywordCoverage: number;
  atsScore: number;
  suggestions: SuggestionItem[];
}
