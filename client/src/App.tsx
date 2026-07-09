import { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { LeftPanel } from './components/layout/LeftPanel';
import { MiddlePanel } from './components/layout/MiddlePanel';
import { RightPanel } from './components/layout/RightPanel';
import { Dashboard } from './components/resume/Dashboard';
import { useResumeStore } from './store/resumeStore';

const parseHash = () => {
  const hash = window.location.hash;
  const match = hash.match(/^#\/resume\/([a-f\d]{24})$/i);
  if (match) {
    return { view: 'editor' as const, id: match[1] };
  }
  return { view: 'dashboard' as const, id: null };
};

function App() {
  const { currentView, setView, loadResumeById } = useResumeStore();

  useEffect(() => {
    const handleHashChange = async () => {
      const { view, id } = parseHash();
      const currentStoreState = useResumeStore.getState();
      
      if (view !== currentStoreState.currentView || id !== currentStoreState.activeResumeId) {
        if (view === 'editor' && id) {
          await loadResumeById(id);
        } else {
          setView(view, id);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Initial parse on load
    const initial = parseHash();
    if (initial.view === 'editor' && initial.id) {
      loadResumeById(initial.id);
    } else {
      setView(initial.view, initial.id);
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setView, loadResumeById]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      {/* Premium Header */}
      <Header />

      {/* Main Workspace Layout or Dashboard */}
      {currentView === 'dashboard' ? (
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/10">
          <Dashboard />
        </main>
      ) : (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left Column: Job Description Input */}
          <section className="lg:col-span-3 h-full min-h-0">
            <LeftPanel />
          </section>

          {/* Middle Column: AI Suggestions & ATS metrics */}
          <section className="lg:col-span-4 h-full min-h-0">
            <MiddlePanel />
          </section>

          {/* Right Column: Live A4 PDF Preview */}
          <section className="lg:col-span-5 h-full min-h-0">
            <RightPanel />
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
