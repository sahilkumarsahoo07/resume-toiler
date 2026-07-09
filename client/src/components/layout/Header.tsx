import { useResumeStore } from '../../store/resumeStore';
import { ThemeToggle } from '../common/ThemeToggle';
import { RotateCcw, Undo2, Redo2, Sparkles, FolderOpen } from 'lucide-react';

export const Header = () => {
  const { 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    resetResume,
    currentView,
    setView,
    resume
  } = useResumeStore();

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset? This will clear your current edits, parsed Job Description, and history.")) {
      resetResume();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent flex items-center gap-2">
            Resume Tailor
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-semibold uppercase tracking-wider">
              AI Studio
            </span>
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">ATS Optimization Platform</p>
        </div>
      </div>

      {/* Navigation Slot */}
      {currentView === 'editor' ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('dashboard')}
            className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary-hover border border-border text-foreground transition-all duration-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FolderOpen className="h-3.5 w-3.5 text-indigo-500" />
            <span>Dashboard</span>
          </button>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Editing: <strong className="font-semibold">{resume.personalInfo.fullName || 'Untitled'}</strong></span>
          </div>
        </div>
      ) : (
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary text-muted-foreground text-xs font-medium border border-border">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          <span>Resume Studio Dashboard</span>
        </div>
      )}

      {/* Control Actions */}
      <div className="flex items-center gap-4">
        {/* Undo/Redo Group */}
        <div className="flex items-center bg-secondary rounded-lg border border-border p-1">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="p-1.5 rounded-md hover:bg-secondary-hover text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1"></div>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="p-1.5 rounded-md hover:bg-secondary-hover text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary-hover text-foreground transition-all duration-200 border border-border text-sm flex items-center gap-2 cursor-pointer"
          title="Reset to default resume"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden md:inline">Reset</span>
        </button>

        {/* Theme Switcher */}
        <ThemeToggle />
      </div>
    </header>
  );
};
