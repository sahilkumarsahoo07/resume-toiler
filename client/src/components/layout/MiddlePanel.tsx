import React from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { Loader } from '../common/Loader';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Bookmark, 
  CheckSquare, 
  Square,
  ArrowRight,
  ShieldCheck,
  Percent
} from 'lucide-react';

export const MiddlePanel: React.FC = () => {
  const {
    jdAnalysis,
    comparison,
    selectedSuggestions,
    toggleSuggestion,
    selectAllSuggestions,
    applySelectedSuggestions,
    isAnalyzingJD,
    isComparing,
    isApplyingChanges,
    error
  } = useResumeStore();

  const allSuggestionsSelected = comparison 
    ? comparison.suggestions.length > 0 && comparison.suggestions.every(s => selectedSuggestions[s.id])
    : false;

  const handleSelectAllToggle = () => {
    selectAllSuggestions(!allSuggestionsSelected);
  };

  const getImpactColor = (score: number) => {
    if (score >= 8) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (score >= 5) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  };

  if (isAnalyzingJD || isComparing) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-card p-5 border-r border-border min-h-[300px]">
        <Loader message={isAnalyzingJD ? "Extracting structure from job description..." : "Running ATS audit and mapping skills..."} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-card p-5 border-r border-border text-center">
        <XCircle className="h-10 w-10 text-error mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-1">Analysis Failed</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{error}</p>
        <button 
          onClick={applySelectedSuggestions}
          className="px-4 py-2 bg-secondary hover:bg-secondary-hover border border-border text-foreground rounded-xl text-sm transition-all cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!jdAnalysis || !comparison) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-card p-8 border-r border-border text-center">
        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-4 border border-indigo-500/20">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">AI Tailor Workspace</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Paste a Job Description on the left panel and click <b>Analyze JD</b> to extract key metrics and generate tailored ATS recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border min-h-0">
      {/* Scrollable Workspace Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Header Summary */}
        <div className="border-b border-border pb-4">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Target Position</span>
          <h2 className="text-xl font-extrabold text-foreground mt-0.5">{jdAnalysis.jobTitle}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-foreground border border-border font-medium">
              {jdAnalysis.industry}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-foreground border border-border font-medium">
              Exp: {jdAnalysis.experienceRequired}
            </span>
          </div>
        </div>

        {/* ATS Scorecard Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-card to-secondary flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Percent className="h-4 w-4 text-indigo-500" />
              <span>Keyword Match</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-extrabold text-foreground leading-none">{comparison.keywordCoverage}%</span>
              <span className="text-xs text-emerald-500 font-semibold mb-0.5">coverage</span>
            </div>
            {/* Simple Match Progress Bar */}
            <div className="w-full bg-secondary-hover h-1.5 rounded-full mt-3 overflow-hidden border border-border">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${comparison.keywordCoverage}%` }}
              ></div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-card to-secondary flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>ATS Score (Est.)</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-extrabold text-foreground leading-none">{comparison.atsScore}</span>
              <span className="text-xs text-muted-foreground mb-0.5">/ 100</span>
            </div>
            <div className="w-full bg-secondary-hover h-1.5 rounded-full mt-3 overflow-hidden border border-border">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${comparison.atsScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Skills Alignment */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Skills Alignment</h3>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Matched Skills ({comparison.matchedSkills.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {comparison.matchedSkills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-medium">
                    {skill}
                  </span>
                ))}
                {comparison.matchedSkills.length === 0 && (
                  <span className="text-xs italic text-muted-foreground">None matched yet.</span>
                )}
              </div>
            </div>

            <div className="pt-1">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mb-1.5">
                <XCircle className="h-3.5 w-3.5 text-amber-500" />
                Missing Skills ({comparison.missingSkills.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {comparison.missingSkills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-medium">
                    {skill}
                  </span>
                ))}
                {comparison.missingSkills.length === 0 && (
                  <span className="text-xs italic text-muted-foreground">All skills covered!</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation Suggestions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-sm font-bold text-foreground">AI Optimization Suggestions</h3>
            <button
              onClick={handleSelectAllToggle}
              className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {allSuggestionsSelected ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="space-y-3">
            {comparison.suggestions.map((suggestion) => {
              const isSelected = !!selectedSuggestions[suggestion.id];
              return (
                <div 
                  key={suggestion.id}
                  onClick={() => toggleSuggestion(suggestion.id)}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'bg-card border-indigo-500 shadow-md shadow-indigo-500/5' 
                      : 'bg-card/50 border-border hover:border-muted'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox Icon */}
                    <div className="mt-0.5 text-indigo-500 flex-shrink-0">
                      {isSelected ? (
                        <CheckSquare className="h-4.5 w-4.5 fill-indigo-500 text-card" />
                      ) : (
                        <Square className="h-4.5 w-4.5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      {/* Suggestion Header info */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{suggestion.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-secondary text-foreground border border-border">
                          {suggestion.category}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${getImpactColor(suggestion.impactScore)}`}>
                          ATS Priority {suggestion.impactScore}
                        </span>
                      </div>
                      
                      {/* Explanatory text */}
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {suggestion.explanation}
                      </p>

                      {/* Code Diff Display (VS Code Style) */}
                      {suggestion.originalText && suggestion.proposedText && (
                        <div className="mt-2.5 text-xs border border-border rounded-lg overflow-hidden font-mono bg-input">
                          <div className="bg-rose-500/10 text-rose-500 dark:text-rose-400 p-2 border-b border-border/40 line-through whitespace-pre-wrap leading-relaxed">
                            - {suggestion.originalText}
                          </div>
                          <div className="bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 p-2 whitespace-pre-wrap leading-relaxed">
                            + {suggestion.proposedText}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {comparison.suggestions.length === 0 && (
              <div className="text-center py-6 border border-dashed border-border rounded-xl">
                <Bookmark className="h-8 w-8 text-muted mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No suggestions required. Resume matches JD skills!</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Floating Action Merge Bar */}
      {comparison.suggestions.length > 0 && (
        <div className="p-4 border-t border-border bg-card/90 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            {Object.values(selectedSuggestions).filter(Boolean).length} of {comparison.suggestions.length} selected
          </div>
          <button
            onClick={applySelectedSuggestions}
            disabled={Object.values(selectedSuggestions).filter(Boolean).length === 0 || isApplyingChanges}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 flex items-center gap-2 text-sm shadow-md shadow-indigo-500/10 cursor-pointer"
          >
            {isApplyingChanges ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Merging changes...
              </>
            ) : (
              <>
                <span>Merge Selected Changes</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
