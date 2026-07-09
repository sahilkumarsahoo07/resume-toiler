import React, { useState, useRef } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { ResumePreview } from '../resume/ResumePreview';
import { ApiService } from '../../services/api';
import { 
  FileDown, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw,
  Upload,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export const RightPanel: React.FC = () => {
  const { resume, setResume } = useResumeStore();
  const [zoom, setZoom] = useState<number>(85); // 85% default fits nicely in 1080p width
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(150, prev + 10));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(50, prev - 10));
  };

  const handleZoomSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(Number(e.target.value));
  };

  const handleDownloadPDF = async () => {
    setIsExportingPdf(true);
    try {
      const blob = await ApiService.exportPdf(resume);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resume.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to export PDF:', error);
      alert(`Failed to download PDF: ${error.message || error}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    try {
      const blob = await ApiService.exportDocx(resume);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resume.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Failed to generate DOCX. Is the backend server running?');
    } finally {
      setIsExportingDocx(false);
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
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || 'Failed to parse the PDF. Ensure it contains selectable text.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900/40">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf" 
        className="hidden" 
      />

      {/* Toolbar */}
      <div className="bg-card border-b border-border px-5 py-3 flex items-center justify-between gap-4 flex-wrap no-print">
        {/* Title */}
        <div className="flex items-center gap-2">
          <Printer className="h-5 w-5 text-indigo-500" />
          <h2 className="text-sm font-bold text-foreground">Live Preview</h2>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 bg-secondary border border-border px-2.5 py-1 rounded-lg">
          <button 
            onClick={handleZoomOut} 
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary-hover rounded transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          
          <input 
            type="range" 
            min="50" 
            max="150" 
            value={zoom} 
            onChange={handleZoomSliderChange} 
            className="w-20 md:w-28 accent-indigo-500 cursor-pointer"
          />
          
          <span className="text-xs font-semibold text-foreground w-10 text-center">
            {zoom}%
          </span>

          <button 
            onClick={handleZoomIn} 
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary-hover rounded transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Import Resume */}
          <button
            onClick={triggerFileInput}
            disabled={isImporting}
            className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary-hover border border-border text-foreground transition-all duration-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            title="Upload PDF Resume"
          >
            {isImporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
            ) : (
              <Upload className="h-3.5 w-3.5 text-indigo-500" />
            )}
            <span>Import PDF</span>
          </button>

          {/* DOCX Export */}
          <button
            onClick={handleDownloadDocx}
            disabled={isExportingDocx || isImporting}
            className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary-hover border border-border text-foreground transition-all duration-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            title="Download Word Document"
          >
            {isExportingDocx ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="h-3.5 w-3.5 text-indigo-500" />
            )}
            <span>DOCX</span>
          </button>

          {/* PDF Direct Save */}
          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPdf || isImporting}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all duration-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10 disabled:opacity-40"
            title="Download PDF directly"
          >
            {isExportingPdf ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <Printer className="h-3.5 w-3.5 text-white" />
            )}
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Canvas Paper scroll area */}
      <div className="flex-1 overflow-auto p-8 bg-slate-800 dark:bg-slate-900/60 flex justify-center items-start relative select-none">
        
        {/* Loading Overlay */}
        {isImporting && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white p-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold">Importing Resume</h3>
            <p className="text-sm text-slate-400 max-w-xs mt-1">
              Extracting text and structure. This may take up to a minute if running on AI...
            </p>
          </div>
        )}

        {/* Error Overlay */}
        {importError && !isImporting && (
          <div className="absolute top-4 left-4 right-4 bg-rose-500/90 text-white p-3.5 rounded-xl border border-rose-600 z-40 shadow-lg flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-sm">Import Error</span>
              <p className="text-xs text-rose-100 mt-0.5">{importError}</p>
            </div>
            <button 
              onClick={() => setImportError(null)} 
              className="text-xs font-bold hover:underline hover:text-slate-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scale translation wrapper */}
        <div 
          style={{ 
            transform: `scale(${zoom / 100})`, 
            transformOrigin: 'top center',
            width: '210mm',
            // Calibrate wrapper size based on zoom scale to avoid bounds collapse
            marginBottom: `${-297 * (1 - zoom / 100)}mm`
          }}
          className={`transition-all duration-150 ease-out origin-top shrink-0 ${isImporting ? 'opacity-30 blur-[2px]' : ''}`}
        >
          <ResumePreview resume={resume} />
        </div>
        
      </div>
      
    </div>
  );
};
