import { create } from 'zustand';
import type { ResumeJSON } from '../types/resume';
import type { JDAnalysis } from '../types/jd';
import type { ResumeCompareResult } from '../types/suggestions';
import { ApiService } from '../services/api';
import { defaultResume } from '../utils/jsonTemplates';

interface ResumeStore {
  // Data State
  resume: ResumeJSON;
  jdText: string;
  jdAnalysis: JDAnalysis | null;
  comparison: ResumeCompareResult | null;
  selectedSuggestions: Record<string, boolean>; // suggestionId -> boolean
  
  // Routing & DB State
  currentView: 'dashboard' | 'editor';
  activeResumeId: string | null;
  storedResumes: Array<{ _id: string; fileName: string; fullName: string; updatedAt: string }>;
  isFetchingStored: boolean;
  
  // Loading & Error States
  isAnalyzingJD: boolean;
  isComparing: boolean;
  isApplyingChanges: boolean;
  error: string | null;
  
  // History Stack (Undo/Redo)
  history: ResumeJSON[];
  historyIndex: number;
  
  // Actions
  setResume: (resume: ResumeJSON) => void;
  setJDText: (text: string) => void;
  clearJD: () => void;
  
  // Routing & DB Actions
  setView: (view: 'dashboard' | 'editor', resumeId?: string | null) => void;
  fetchStoredResumes: () => Promise<void>;
  loadResumeById: (id: string) => Promise<void>;
  updateActiveResume: (updatedResume: ResumeJSON) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  
  // Async operations
  analyzeJD: () => Promise<void>;
  compareResumeWithJD: () => Promise<void>;
  toggleSuggestion: (suggestionId: string) => void;
  selectAllSuggestions: (select: boolean) => void;
  applySelectedSuggestions: () => Promise<void>;
  
  // Reset & History actions
  resetResume: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  // Initial States
  resume: defaultResume,
  jdText: '',
  jdAnalysis: null,
  comparison: null,
  selectedSuggestions: {},
  
  currentView: 'dashboard',
  activeResumeId: null,
  storedResumes: [],
  isFetchingStored: false,
  
  isAnalyzingJD: false,
  isComparing: false,
  isApplyingChanges: false,
  error: null,
  
  history: [defaultResume],
  historyIndex: 0,

  // Actions
  setResume: (newResume) => {
    const { history, historyIndex } = get();
    // Slice history to remove any redo steps if we make a new edit
    const newHistory = history.slice(0, historyIndex + 1);
    
    set({
      resume: newResume,
      activeResumeId: newResume._id || null,
      history: [...newHistory, newResume],
      historyIndex: newHistory.length,
      error: null
    });
  },

  setJDText: (text) => set({ jdText: text }),

  clearJD: () => set({ jdText: '', jdAnalysis: null, comparison: null, selectedSuggestions: {} }),

  // Routing & DB Actions Implementation
  setView: (view, resumeId = null) => {
    if (view === 'dashboard') {
      window.location.hash = '#/';
    } else if (view === 'editor' && resumeId) {
      window.location.hash = `#/resume/${resumeId}`;
    } else {
      window.location.hash = '#/';
    }
    set({ currentView: view, activeResumeId: resumeId });
  },

  fetchStoredResumes: async () => {
    set({ isFetchingStored: true, error: null });
    try {
      const list = await ApiService.listResumes();
      set({ storedResumes: list, isFetchingStored: false });
    } catch (err: any) {
      set({ isFetchingStored: false, error: err.message || 'Failed to fetch stored resumes' });
    }
  },

  loadResumeById: async (id) => {
    set({ isApplyingChanges: true, error: null });
    try {
      const activeResume = await ApiService.getResume(id);
      set({ 
        resume: activeResume, 
        activeResumeId: id,
        currentView: 'editor',
        history: [activeResume],
        historyIndex: 0,
        isApplyingChanges: false
      });
    } catch (err: any) {
      set({ isApplyingChanges: false, error: err.message || 'Failed to load resume details' });
    }
  },

  updateActiveResume: async (updatedResume) => {
    const { activeResumeId } = get();
    if (!activeResumeId) {
      get().setResume(updatedResume);
      return;
    }
    set({ isApplyingChanges: true, error: null });
    try {
      const savedResume = await ApiService.updateResume(activeResumeId, updatedResume);
      get().setResume(savedResume);
      set({ isApplyingChanges: false });
    } catch (err: any) {
      set({ isApplyingChanges: false, error: err.message || 'Failed to save resume edits' });
    }
  },

  deleteResume: async (id) => {
    set({ isApplyingChanges: true, error: null });
    try {
      await ApiService.deleteResume(id);
      const list = get().storedResumes.filter(r => r._id !== id);
      set({ 
        storedResumes: list, 
        isApplyingChanges: false 
      });
      // If the active resume being edited was deleted, reset editor workspace
      if (get().activeResumeId === id) {
        set({
          activeResumeId: null,
          resume: get().history[0], // fallback or default resume
          history: get().history,
          historyIndex: 0
        });
      }
    } catch (err: any) {
      set({ isApplyingChanges: false, error: err.message || 'Failed to delete resume' });
    }
  },

  analyzeJD: async () => {
    const { jdText } = get();
    if (!jdText.trim()) return;

    set({ isAnalyzingJD: true, error: null });
    try {
      const analysis = await ApiService.analyzeJD(jdText);
      set({ jdAnalysis: analysis, isAnalyzingJD: false });
      
      // Auto-run comparison after JD analysis completes to minimize clicks
      await get().compareResumeWithJD();
    } catch (err: any) {
      set({ isAnalyzingJD: false, error: err.message || 'Error occurred while analyzing JD.' });
    }
  },

  compareResumeWithJD: async () => {
    const { resume, jdAnalysis } = get();
    if (!jdAnalysis) return;

    set({ isComparing: true, error: null });
    try {
      const comparison = await ApiService.compareResume(resume, jdAnalysis);
      
      // Initialize all suggestions as selected (checked) by default for ease of use
      const initialSelection: Record<string, boolean> = {};
      comparison.suggestions.forEach(s => {
        initialSelection[s.id] = true;
      });

      set({ 
        comparison, 
        selectedSuggestions: initialSelection, 
        isComparing: false 
      });
    } catch (err: any) {
      set({ isComparing: false, error: err.message || 'Error occurred while comparing resume.' });
    }
  },

  toggleSuggestion: (suggestionId) => {
    const { selectedSuggestions } = get();
    set({
      selectedSuggestions: {
        ...selectedSuggestions,
        [suggestionId]: !selectedSuggestions[suggestionId]
      }
    });
  },

  selectAllSuggestions: (select) => {
    const { comparison } = get();
    if (!comparison) return;

    const updated: Record<string, boolean> = {};
    comparison.suggestions.forEach(s => {
      updated[s.id] = select;
    });
    set({ selectedSuggestions: updated });
  },

  applySelectedSuggestions: async () => {
    const { resume, comparison, selectedSuggestions } = get();
    if (!comparison) return;

    // Filter to only chosen suggestions
    const chosenSuggestions = comparison.suggestions.filter(s => selectedSuggestions[s.id]);
    if (chosenSuggestions.length === 0) return;

    set({ isApplyingChanges: true, error: null });
    try {
      const updatedResume = await ApiService.applySuggestions(resume, chosenSuggestions);
      
      // Commit updated resume to state & history stack
      get().setResume(updatedResume);

      // Re-compare the updated resume with the same JD to update the match scorecard!
      set({ isApplyingChanges: false });
      await get().compareResumeWithJD();
    } catch (err: any) {
      set({ isApplyingChanges: false, error: err.message || 'Error occurred while merging changes.' });
    }
  },

  resetResume: () => {
    set({
      resume: defaultResume,
      jdText: '',
      jdAnalysis: null,
      comparison: null,
      selectedSuggestions: {},
      error: null,
      history: [defaultResume],
      historyIndex: 0,
      activeResumeId: null,
      currentView: 'dashboard'
    });
    window.location.hash = '#/';
  },

  // History Navigation
  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      set({
        historyIndex: newIdx,
        resume: history[newIdx],
        activeResumeId: history[newIdx]._id || null
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      set({
        historyIndex: newIdx,
        resume: history[newIdx],
        activeResumeId: history[newIdx]._id || null
      });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1
}));
