import React, { useEffect, useState, useRef } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { ApiService } from '../../services/api';
import { ResumePreview } from './ResumePreview';
import type { ResumeJSON } from '../../types/resume';
import {
  FileDown,
  FolderOpen,
  User,
  Calendar,
  Loader2,
  Sparkles,
  Upload,
  AlertTriangle,
  FileText,
  MousePointerClick,
  Trash2
} from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export const Dashboard: React.FC = () => {
  const {
    storedResumes, 
    fetchStoredResumes, 
    isFetchingStored, 
    setView, 
    loadResumeById,
    setResume,
    deleteResume
  } = useResumeStore();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadType, setDownloadType] = useState<'pdf' | 'docx' | null>(null);
  const [pdfResumeData, setPdfResumeData] = useState<ResumeJSON | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStoredResumes();
  }, [fetchStoredResumes]);

  const handleEditResume = async (id: string) => {
    setView('editor', id);
    await loadResumeById(id);
  };

  const handleDelete = async (id: string, fullName: string) => {
    if (window.confirm(`Are you sure you want to delete ${fullName}'s resume? This cannot be undone.`)) {
      try {
        await deleteResume(id);
      } catch (error: any) {
        alert(`Failed to delete resume: ${error.message || error}`);
      }
    }
  };

  const handleDownloadDocx = async (id: string, fullName: string) => {
    setDownloadingId(id);
    setDownloadType('docx');
    try {
      const fullResume = await ApiService.getResume(id);
      const blob = await ApiService.exportDocx(fullResume);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fullName.replace(/\s+/g, '_')}_Resume.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error exporting DOCX:', error);
      alert(`Failed to generate DOCX: ${error.message || error}`);
    } finally {
      setDownloadingId(null);
      setDownloadType(null);
    }
  };

  const handleDownloadPDF = async (id: string, fullName: string) => {
    setDownloadingId(id);
    setDownloadType('pdf');
    try {
      const fullResume = await ApiService.getResume(id);
      setPdfResumeData(fullResume);

      // Allow time for DOM to render the hidden preview
      setTimeout(() => {
        const element = document.querySelector('#hidden-pdf-container .resume-sheet') as HTMLElement;
        if (!element) {
          throw new Error('Failed to render resume preview element');
        }

        const opt = {
          margin: 0,
          filename: `${fullName.replace(/\s+/g, '_')}_Resume.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2.5, useCORS: true, logging: false },
          jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        html2pdf()
          .set(opt)
          .from(element)
          .save()
          .then(() => {
            setPdfResumeData(null);
            setDownloadingId(null);
            setDownloadType(null);
          })
          .catch((err: any) => {
            console.error('PDF compiler error:', err);
            setPdfResumeData(null);
            setDownloadingId(null);
            setDownloadType(null);
            alert('Failed to generate PDF. Print layout fallback failed.');
          });
      }, 500);

    } catch (error: any) {
      console.error('Error fetching resume for PDF:', error);
      alert(`Failed to load resume: ${error.message || error}`);
      setDownloadingId(null);
      setDownloadType(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    try {
      const parsedResume = await ApiService.importResume(file);
      setResume(parsedResume);
      // Refresh database resumes list
      await fetchStoredResumes();
      // Auto transition to edit workspace for this imported resume
      if (parsedResume._id) {
        setView('editor', parsedResume._id);
      }
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || 'Failed to parse the PDF. Ensure it contains selectable text.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />

      {/* Hidden Container for PDF Rendering */}
      {pdfResumeData && (
        <div id="hidden-pdf-container" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <ResumePreview resume={pdfResumeData} />
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 mb-8 shadow-xl border border-indigo-500/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3" />
            Resume Tailor Studio
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Hi, Welcome to
          </h2>
          <p className="text-slate-300 text-sm md:text-base mt-2 leading-relaxed">
            Upload your resume,AI Resume Studio analyze it against target job descriptions, and apply tailored, AI-powered optimizations to pass ATS screens with ease.
          </p>
        </div>

        {/* Upload Action Card */}
        <div className="w-full md:w-80 shrink-0 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative z-10 flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-4">
            {isImporting ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
          </div>
          <h3 className="font-bold text-base text-center">Import PDF Resume</h3>
          <p className="text-[11px] text-slate-400 text-center mt-1 mb-4">
            Upload selectable PDF to parse details into our editable workspace.
          </p>
          <button
            onClick={triggerFileInput}
            disabled={isImporting}
            className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold text-xs transition shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isImporting ? 'Importing...' : 'Upload PDF'}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {importError && (
        <div className="bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/25 p-4 rounded-2xl mb-8 flex items-start gap-3.5 shadow-md">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">Import Failure</h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{importError}</p>
          </div>
          <button
            onClick={() => setImportError(null)}
            className="text-xs font-bold underline hover:text-foreground cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Resume Catalog Section */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          Your Resumes
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
            {storedResumes.length} total
          </span>
        </h3>
      </div>

      {/* Resumes Grid */}
      {isFetchingStored ? (
        <div className="flex flex-col items-center justify-center min-h-[250px] py-10">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2.5" />
          <p className="text-xs text-muted-foreground">Fetching stored resumes...</p>
        </div>
      ) : storedResumes.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center bg-card">
          <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
          <h4 className="font-bold text-sm text-foreground">No Resumes Stored</h4>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1.5 mb-5 leading-relaxed">
            Get started by importing a PDF resume using the upload box above. Your imported resumes will appear here.
          </p>
          <button
            onClick={triggerFileInput}
            className="px-4.5 py-2.5 rounded-xl border border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/5 font-semibold text-xs transition flex items-center gap-2 mx-auto cursor-pointer"
          >
            <MousePointerClick className="h-4 w-4" />
            Upload First Resume
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {storedResumes.map((resume) => (
            <div 
              key={resume._id}
              className="bg-card hover:bg-card/90 border border-border hover:border-indigo-500/20 hover:shadow-lg rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative group"
            >
              {/* Delete Button */}
              <button
                onClick={() => handleDelete(resume._id, resume.fullName)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
                title="Delete Resume"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-foreground text-sm truncate pr-2">
                      {resume.fullName}
                    </h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Candidate
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 my-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FolderOpen className="h-4 w-4 text-indigo-500/50 shrink-0" />
                    <span className="truncate" title={resume.fileName}>{resume.fileName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-4 w-4 text-indigo-500/50 shrink-0" />
                    <span>Modified: {formatDate(resume.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-border/50">
                {/* PDF compilation download */}
                <button
                  onClick={() => handleDownloadPDF(resume._id, resume.fullName)}
                  disabled={downloadingId !== null || isImporting}
                  className="px-2 py-2 border border-border hover:border-rose-500/50 bg-secondary hover:bg-rose-500/5 hover:text-rose-500 text-foreground font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                  title="Download Compiled PDF"
                >
                  {downloadingId === resume._id && downloadType === 'pdf' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span>PDF</span>
                </button>

                {/* DOCX download */}
                <button
                  onClick={() => handleDownloadDocx(resume._id, resume.fullName)}
                  disabled={downloadingId !== null || isImporting}
                  className="px-2 py-2 border border-border hover:border-blue-500/50 bg-secondary hover:bg-blue-500/5 hover:text-blue-500 text-foreground font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                  title="Download DOCX"
                >
                  {downloadingId === resume._id && downloadType === 'docx' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5 text-blue-500" />
                  )}
                  <span>Word</span>
                </button>

                {/* Edit transitions to /resume/:id workspace */}
                <button
                  onClick={() => handleEditResume(resume._id)}
                  disabled={downloadingId !== null || isImporting}
                  className="px-2 py-2 border border-border bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shadow-sm"
                  title="Open in AI Workspace"
                >
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
