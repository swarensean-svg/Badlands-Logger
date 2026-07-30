import React, { useState, useRef } from 'react';
import { importSugarWODAction } from '../../actions/import';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Database, Sparkles, ArrowRight, Table } from 'lucide-react';
import { WorkoutResult } from '../../types';

interface SugarWODImporterProps {
  userId: string;
  onImportSuccess: (importedResults: WorkoutResult[]) => void;
}

export const SugarWODImporter: React.FC<SugarWODImporterProps> = ({
  userId,
  onImportSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatusMessage(null);
    setPreviewCount(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setStatusMessage({
          type: 'error',
          text: 'Please select a valid CSV file (.csv) exported from SugarWOD.',
        });
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadAndImport = async () => {
    if (!selectedFile) {
      setStatusMessage({
        type: 'error',
        text: 'Please select a SugarWOD CSV file first.',
      });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const csvText = await selectedFile.text();

      // Execute Server Action
      const result = await importSugarWODAction({
        csvContent: csvText,
        userId: userId,
      });

      if (result.success) {
        setPreviewCount(result.count);
        setStatusMessage({
          type: 'success',
          text: result.message || `Successfully imported ${result.count} workout records!`,
        });

        // Pass imported results back to update state
        onImportSuccess(result.importedResults);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Failed to parse CSV file. Please ensure it is a valid SugarWOD export.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'An unexpected error occurred while processing the file.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-xl">
      {/* Component Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg">
              <Database className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              SugarWOD Workout History Importer
            </h3>
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            Migrate your past workouts, scores, PRs, and notes from SugarWOD directly into your Athlete Core profile.
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-1 rounded">
          <Sparkles className="h-3 w-3 text-amber-400" />
          Auto-Benchmark Linking
        </span>
      </div>

      {/* CSV File Input Drag & Drop Area */}
      <div className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-950/80 rounded-xl p-5 text-center transition space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="sugarwod-csv-upload"
        />

        <label
          htmlFor="sugarwod-csv-upload"
          className="cursor-pointer flex flex-col items-center justify-center space-y-2 group"
        >
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition">
            <Upload className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-mono font-bold text-zinc-200 group-hover:text-indigo-400 transition">
              {selectedFile ? selectedFile.name : 'Click to select SugarWOD CSV file'}
            </p>
            <p className="text-[11px] text-zinc-500 font-mono">
              Supports SugarWOD export format (date, title, description, result_display, rx_or_scaled, notes)
            </p>
          </div>
        </label>

        {selectedFile && (
          <div className="inline-flex items-center space-x-2 bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-mono">
            <FileText className="h-3.5 w-3.5" />
            <span className="font-bold">{selectedFile.name}</span>
            <span className="text-[10px] text-indigo-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      {/* Status Alerts */}
      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-mono flex items-start space-x-2.5 animate-fadeIn border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Upload & Import Button */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-1.5 text-[11px] text-zinc-500 font-mono">
          <Table className="h-3.5 w-3.5 text-zinc-400" />
          <span>Automatic mapping to <strong className="text-zinc-300">workout_results</strong> table</span>
        </div>

        <button
          type="button"
          onClick={handleUploadAndImport}
          disabled={!selectedFile || isUploading}
          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-mono text-xs font-bold rounded-lg uppercase tracking-wider transition flex items-center space-x-2 shadow-md shadow-indigo-600/20"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Parsing & Importing...</span>
            </>
          ) : (
            <>
              <span>Upload & Import History</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
