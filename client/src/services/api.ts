import type { ResumeJSON } from '../types/resume';
import type { JDAnalysis } from '../types/jd';
import type { ResumeCompareResult, SuggestionItem } from '../types/suggestions';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiService {
  private static async handleError(res: Response, defaultMessage: string): Promise<never> {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const err = await res.json();
        throw new Error(err.error || defaultMessage);
      } catch (e: any) {
        throw new Error(e.message || defaultMessage);
      }
    }
    
    // If response is HTML or text (e.g. Render 502/504 Gateway pages)
    const text = await res.text();
    // Simple HTML tags removal to get a readable string
    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    throw new Error(cleanText.substring(0, 150) || `Server error (${res.status}): ${defaultMessage}`);
  }

  /**
   * Request structured extraction of Job Description
   */
  static async analyzeJD(jdText: string, modelId?: string): Promise<JDAnalysis> {
    const res = await fetch(`${API_BASE}/analyze-jd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jdText, modelId })
    });
    
    if (!res.ok) {
      await this.handleError(res, 'Failed to analyze Job Description');
    }
    
    return await res.json();
  }

  /**
   * Compare Resume JSON with JD Analysis
   */
  static async compareResume(resume: ResumeJSON, jdAnalysis: JDAnalysis, modelId?: string): Promise<ResumeCompareResult> {
    const res = await fetch(`${API_BASE}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, jdAnalysis, modelId })
    });

    if (!res.ok) {
      await this.handleError(res, 'Failed to compare resume');
    }

    return await res.json();
  }

  /**
   * Merge selected suggestions into Resume JSON
   */
  static async applySuggestions(resume: ResumeJSON, selectedSuggestions: SuggestionItem[], modelId?: string): Promise<ResumeJSON> {
    const res = await fetch(`${API_BASE}/apply-suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, selectedSuggestions, modelId })
    });

    if (!res.ok) {
      await this.handleError(res, 'Failed to apply suggestions');
    }

    const data = await res.json();
    return data.updatedResume;
  }

  /**
   * List all stored resumes
   */
  static async listResumes(): Promise<Array<{ _id: string; fileName: string; fullName: string; updatedAt: string }>> {
    const res = await fetch(`${API_BASE}/resumes`);
    if (!res.ok) {
      await this.handleError(res, 'Failed to list resumes');
    }
    return await res.json();
  }

  /**
   * Get specific stored resume
   */
  static async getResume(id: string): Promise<ResumeJSON> {
    const res = await fetch(`${API_BASE}/resumes/${id}`);
    if (!res.ok) {
      await this.handleError(res, 'Failed to fetch resume');
    }
    return await res.json();
  }

  /**
   * Update stored resume details
   */
  static async updateResume(id: string, resume: ResumeJSON): Promise<ResumeJSON> {
    const res = await fetch(`${API_BASE}/resumes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resume)
    });
    if (!res.ok) {
      await this.handleError(res, 'Failed to update resume');
    }
    const data = await res.json();
    return data.updatedResume;
  }

  /**
   * Delete stored resume from MongoDB
   */
  static async deleteResume(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/resumes/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      await this.handleError(res, 'Failed to delete resume');
    }
  }

  /**
   * Export resume as DOCX binary Blob
   */
  static async exportDocx(resume: ResumeJSON): Promise<Blob> {
    const res = await fetch(`${API_BASE}/export/docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resume)
    });

    if (!res.ok) {
      await this.handleError(res, 'Failed to generate DOCX');
    }

    return await res.blob();
  }

  /**
   * Export resume as PDF binary Blob
   */
  static async exportPdf(resume: ResumeJSON): Promise<Blob> {
    const res = await fetch(`${API_BASE}/export/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resume)
    });

    if (!res.ok) {
      await this.handleError(res, 'Failed to generate PDF');
    }

    return await res.blob();
  }

  /**
   * Upload PDF resume to parse it into structured JSON
   */
  static async importResume(file: File, modelId?: string): Promise<ResumeJSON> {
    const formData = new FormData();
    formData.append('file', file);
    if (modelId) {
      formData.append('modelId', modelId);
    }

    const res = await fetch(`${API_BASE}/import-resume`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      await this.handleError(res, 'Failed to import and parse PDF resume');
    }

    return await res.json();
  }
}
