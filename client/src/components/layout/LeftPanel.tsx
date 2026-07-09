import React from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { Sparkles, Trash2, FileText } from 'lucide-react';

export const LeftPanel: React.FC = () => {
  const {
    jdText,
    setJDText,
    clearJD,
    analyzeJD,
    isAnalyzingJD
  } = useResumeStore();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJDText(e.target.value);
  };

  const getWordCount = (text: string) => {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  };

  const getCharCount = (text: string) => {
    return text.length;
  };

  const wordCount = getWordCount(jdText);
  const charCount = getCharCount(jdText);

  return (
    <div className="flex flex-col h-full bg-card border-r border-border p-5">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-bold text-foreground">Job Description</h2>
      </div>

      {/* Editor Panel */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <textarea
          value={jdText}
          onChange={handleTextChange}
          placeholder="Paste the target Job Description (JD) here... E.g.,&#10;&#10;Position: Senior Frontend Engineer&#10;Skills: React, TypeScript, Next.js, Redux, Tailwind CSS&#10;Responsibilities: Design clean layouts, write scalable tests, collaborate with team."
          className="w-full flex-1 p-4 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-sans text-sm leading-relaxed min-h-[300px]"
          disabled={isAnalyzingJD}
        />

        {/* Counter Overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-3 text-xs text-muted-foreground bg-card/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-border">
          <span>{wordCount} words</span>
          <span className="w-px h-3 bg-border"></span>
          <span>{charCount} chars</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={clearJD}
          disabled={!jdText || isAnalyzingJD}
          className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary-hover text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-2 border border-border text-sm cursor-pointer"
          title="Clear input"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </button>

        <button
          onClick={analyzeJD}
          disabled={!jdText.trim() || isAnalyzingJD}
          className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          {isAnalyzingJD ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze JD
            </>
          )}
        </button>
      </div>
    </div>
  );
};
