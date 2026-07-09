export interface SuggestionItem {
  id: string;
  category: 'summary' | 'experience' | 'skills' | 'projects' | 'general';
  targetId?: string; // Links to specific experience id or project id
  title: string;
  explanation: string;
  originalText?: string;
  proposedText?: string;
  impactScore: number; // 1-10 priority/impact metric
}

export interface ResumeCompareResult {
  matchedSkills: string[];
  missingSkills: string[];
  weakSections: string[];
  keywordCoverage: number; // 0-100 percentage
  atsScore: number; // Estimated 0-100 score
  suggestions: SuggestionItem[];
}
