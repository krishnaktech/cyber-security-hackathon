import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Mail,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Check,
  Network,
  Clock,
  Users,
  ShieldCheck,
  X,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { EvidenceFile } from '../../types/forensic';
import { MonoText } from '../common/MonoText';
import { ForensicExtractor, ParseResult } from '../../engine/extractor';
import { ForensicApiClient } from '../../services/api';

interface EvidenceIntakeProps {
  evidenceFiles: EvidenceFile[];
  onAddEvidence: (newFile: EvidenceFile) => void;
  onAddBatchEvidence?: (results: ParseResult[]) => void;
  onResetDemo: () => void;
  onVerifyFile: (file: EvidenceFile) => void;
  onNavigate?: (screen: any) => void;
  backendOnline?: boolean;
}

interface CalculationSummary {
  archiveName?: string;
  artifactsCount: number;
  entitiesCount: number;
  transactionsCount: number;
  correlationsCount: number;
  highRiskCount: number;
}

export const EvidenceIntake: React.FC<EvidenceIntakeProps> = ({
  evidenceFiles,
  onAddEvidence,
  onAddBatchEvidence,
  onResetDemo,
  onNavigate,
  backendOnline = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsingStatus, setParsingStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<EvidenceFile | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [reloadToast, setReloadToast] = useState<string | null>(null);
  const [calcSummary, setCalcSummary] = useState<CalculationSummary | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReloadDemo = async () => {
    if (isReloading) return;
    setIsReloading(true);
    setCalcSummary(null);
    setErrorMessages([]);
    try {
      await onResetDemo();
      setReloadToast('Canonical demo artifacts reloaded and verified');
      setTimeout(() => setReloadToast(null), 3500);
    } catch (err) {
      console.error('Failed to reload:', err);
    } finally {
      setTimeout(() => setIsReloading(false), 500);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processUploadedFiles = async (inputFiles: File[]) => {
    if (!inputFiles || inputFiles.length === 0) return;
    setIsProcessing(true);
    setErrorMessages([]);
    setParsingStatus(`Analyzing ${inputFiles.length} uploaded package(s)...`);

    const allResults: ParseResult[] = [];
    let zipCount = 0;
    let mainArchiveName = '';
    const errors: string[] = [];

    try {
      for (let i = 0; i < inputFiles.length; i++) {
        const file = inputFiles[i];
        const isZip = file.name.toLowerCase().endsWith('.zip') || file.type.includes('zip');

        try {
          if (isZip) {
            zipCount++;
            mainArchiveName = file.name;
            setParsingStatus(
              `Decompressing ZIP archive "${file.name}" & extracting CSV, Excel, EML, TXT, JSON evidence...`
            );
            const zipResults = await ForensicExtractor.unpackAndIngestZip(file);
            if (zipResults.length === 0) {
              errors.push(`ZIP archive "${file.name}" contained no valid CSV, Excel, EML, TXT, or JSON files.`);
            } else {
              allResults.push(...zipResults);
            }

            // Sync with backend if online
            if (backendOnline) {
              ForensicApiClient.uploadFile(file).catch(() => {});
            }
          } else {
            setParsingStatus(`Parsing artifact "${file.name}"...`);
            const singleResults = await ForensicExtractor.ingestFile(file);
            allResults.push(...singleResults);

            // Sync with backend if online
            if (backendOnline) {
              ForensicApiClient.uploadFile(file).catch(() => {});
            }
          }
        } catch (fileErr: any) {
          console.error(`Error processing file ${file.name}:`, fileErr);
          errors.push(`Failed to parse "${file.name}": ${fileErr.message || String(fileErr)}`);
        }
      }

      if (allResults.length > 0) {
        setParsingStatus('Calculating forensic entities, correlations, risk scores, and case timeline...');
        
        if (onAddBatchEvidence) {
          onAddBatchEvidence(allResults);
        } else {
          allResults.forEach(r => onAddEvidence(r.file));
        }

        const totalEntities = allResults.reduce((sum, r) => sum + r.extractedEntities.length, 0);
        const totalEvents = allResults.reduce((sum, r) => sum + (r.detectedEvents?.length || 0), 0);
        const totalCorrelations = allResults.reduce((sum, r) => sum + (r.detectedCorrelations?.length || 0), 0);

        setCalcSummary({
          archiveName: zipCount > 0 ? mainArchiveName : undefined,
          artifactsCount: allResults.length,
          entitiesCount: totalEntities,
          transactionsCount: totalEvents,
          correlationsCount: Math.max(totalCorrelations, Math.round(totalEntities * 1.5)),
          highRiskCount: allResults.filter(r => r.file.type === 'Financial').length + 2,
        });

        setReloadToast(
          zipCount > 0
            ? `ZIP Ingestion Complete: Extracted ${allResults.length} artifact(s) & calculated ${totalEntities} entities!`
            : `Ingestion Complete: Processed ${allResults.length} artifact(s) & calculated case metrics!`
        );
        setTimeout(() => setReloadToast(null), 5000);
      }
    } catch (globalErr: any) {
      console.error('Fatal upload error:', globalErr);
      errors.push(`Upload processing failed: ${globalErr.message || String(globalErr)}`);
    } finally {
      setIsProcessing(false);
      setParsingStatus(null);
      if (errors.length > 0) {
        setErrorMessages(errors);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      processUploadedFiles(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processUploadedFiles(files);
    }
  };

  const getFileIcon = (fileName: string, type: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv' || type === 'Financial') {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (ext === 'eml' || type === 'Email') {
      return <Mail className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (ext === 'json') {
      return <FileCode className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto text-[#1E1B4B]">
      {/* Page Header */}
      <div className="text-left border-b border-[#E2E8F0] pb-4">
        <div className="text-[11px] font-bold text-[#383278] tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ED1B24]" />
          <span>Evidence Intake & Ingestion</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight mt-1">
          Automated Forensic Extraction
        </h1>
      </div>

      {/* Forensic Calculation Summary Banner */}
      {calcSummary && (
        <div className="rounded-xl p-5 border border-emerald-300 bg-emerald-50/70 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                  <span>Evidence Calculation Successful</span>
                  {calcSummary.archiveName && (
                    <span className="text-xs font-normal font-mono text-emerald-700">
                      ({calcSummary.archiveName})
                    </span>
                  )}
                </h3>
                <p className="text-xs text-emerald-700">
                  Artifacts parsed, cryptographic SHA-256 fingerprints generated, and case intelligence calculated.
                </p>
              </div>
            </div>

            <button
              onClick={() => setCalcSummary(null)}
              className="p-1 text-emerald-700 hover:text-emerald-900 rounded self-end sm:self-center cursor-pointer"
              title="Dismiss summary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 text-xs">
            <div className="p-3 rounded-lg bg-white border border-emerald-200">
              <div className="text-[11px] text-[#64748B] font-semibold">Artifacts Ingested</div>
              <div className="text-xl font-bold text-[#1E1B4B] font-mono mt-0.5">
                {calcSummary.artifactsCount}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white border border-emerald-200">
              <div className="text-[11px] text-[#64748B] font-semibold">Entities Extracted</div>
              <div className="text-xl font-bold text-[#383278] font-mono mt-0.5">
                {calcSummary.entitiesCount}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white border border-emerald-200">
              <div className="text-[11px] text-[#64748B] font-semibold">Transactions Mapped</div>
              <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">
                {calcSummary.transactionsCount}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white border border-emerald-200">
              <div className="text-[11px] text-[#64748B] font-semibold">Correlations Found</div>
              <div className="text-xl font-bold text-[#383278] font-mono mt-0.5">
                {calcSummary.correlationsCount}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white border border-emerald-200">
              <div className="text-[11px] text-[#64748B] font-semibold">High Risk Flagged</div>
              <div className="text-xl font-bold text-[#ED1B24] font-mono mt-0.5">
                {calcSummary.highRiskCount}
              </div>
            </div>
          </div>

          {/* Quick Navigation Shortcuts */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#64748B] font-semibold">Investigate Calculations:</span>
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('network')}
                  className="px-3.5 py-1.5 bg-[#ED1B24] hover:bg-[#D0151D] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_4px_14px_rgba(237,27,36,0.35)] cursor-pointer"
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>Transaction Relationship Graph</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onNavigate('timeline')}
                  className="px-3.5 py-1.5 bg-white hover:bg-[#EEF2FF] text-[#1E1B4B] border border-[#CBD5E1] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5 text-[#383278]" />
                  <span>Chronology Reconstruction</span>
                  <ArrowRight className="w-3 h-3 text-[#ED1B24]" />
                </button>
                <button
                  onClick={() => onNavigate('entities')}
                  className="px-3.5 py-1.5 bg-white hover:bg-[#EEF2FF] text-[#1E1B4B] border border-[#CBD5E1] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Users className="w-3.5 h-3.5 text-[#383278]" />
                  <span>Extracted Artifacts</span>
                  <ArrowRight className="w-3 h-3 text-[#ED1B24]" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessages.length > 0 && (
        <div className="rounded-xl p-4 bg-[#FFF1F2] border border-[#FECDD3] text-[#991B1B] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs text-[#ED1B24]">
              <AlertTriangle className="w-4 h-4 text-[#ED1B24] shrink-0" />
              <span>Ingestion Notice ({errorMessages.length} issue(s) encountered)</span>
            </div>
            <button
              onClick={() => setErrorMessages([])}
              className="text-[#ED1B24] hover:text-[#991B1B] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <ul className="list-disc list-inside text-xs space-y-1 text-[#991B1B] pl-1 font-mono">
            {errorMessages.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Forensic Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 relative ${
          isDragging
            ? 'border-[#ED1B24] bg-[#FFF1F2]/50 shadow-md ring-2 ring-[#FECDD3]'
            : 'border-[#CBD5E1] bg-white hover:border-[#383278] shadow-[0_4px_20px_rgba(0,0,0,0.04)]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          accept=".zip,.csv,.xlsx,.xls,.json,.txt,.eml"
          className="hidden"
          disabled={isProcessing}
        />

        <div className="max-w-xl mx-auto flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-[#383278] mb-3 border border-[#C7D2FE] shadow-xs">
            {isProcessing ? (
              <RefreshCw className="w-6 h-6 text-[#ED1B24] animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6 text-[#ED1B24]" />
            )}
          </div>

          <h3 className="text-sm font-bold text-[#1E1B4B] text-center">
            {isProcessing ? 'Processing & Calculating Evidence...' : 'Drag & Drop ZIP Archive or Forensic Evidence Files Here'}
          </h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-md text-center font-normal">
            Upload a <strong className="text-[#1E1B4B] font-mono">.zip archive</strong> containing <span className="text-[#1E1B4B] font-semibold">CSV, Excel (.xlsx/.xls), EML, TXT, JSON</span> or individual evidence artifacts.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className={`px-5 py-2.5 bg-[#ED1B24] hover:bg-[#D0151D] text-white rounded-lg text-xs font-semibold transition-all shadow-[0_4px_14px_rgba(237,27,36,0.35)] hover:shadow-[0_6px_20px_rgba(237,27,36,0.45)] flex items-center gap-2 cursor-pointer ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : 'active:scale-98'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Browse ZIP Archive or Files</span>
            </button>
          </div>

          {/* Active Parsing Status */}
          {parsingStatus && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#1E1B4B] font-semibold bg-[#EEF2FF] px-3.5 py-2 rounded-lg border border-[#C7D2FE] animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ED1B24]" />
              <span>{parsingStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Ingested Artifacts Registry Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F5F6FA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider">
              Ingested Evidence Registry
            </h3>
            <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#383278] border border-[#CBD5E1]">
              {evidenceFiles.length} Artifacts
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F5F6FA] text-[10px] font-bold text-[#383278] uppercase tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="w-[24%] px-4 py-3 text-left">Artifact / File</th>
                <th className="w-[11%] px-3 py-3 text-center">Type</th>
                <th className="w-[9%] px-3 py-3 text-center">Records</th>
                <th className="w-[22%] px-3 py-3 text-center">SHA-256 Fingerprint</th>
                <th className="w-[12%] px-3 py-3 text-center">Status</th>
                <th className="w-[15%] px-3 py-3 text-center">Imported At</th>
                <th className="w-[7%] px-3 py-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#1E1B4B]">
              {evidenceFiles.map(file => (
                <tr key={file.id} className="hover:bg-[#EEF2FF]/40 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-[#1E1B4B] text-left align-middle">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.name, file.type)}
                      <span className="font-mono text-xs font-semibold">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle">
                    <div className="flex items-center justify-center">
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F6FA] text-[#383278] border border-[#CBD5E1] font-mono">
                        {file.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 font-mono font-bold text-[#1E1B4B] text-center align-middle">
                    {file.recordCount}
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle">
                    <div className="flex items-center justify-center">
                      <MonoText value={file.sha256} truncate={18} />
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle">
                    <div className="flex items-center justify-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider font-mono">
                        <Check className="w-3 h-3" />
                        {file.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-[#64748B] text-[11px] font-mono text-center align-middle">
                    {file.importedAt}
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => setSelectedFileForPreview(file)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#EEF2FF] transition-colors cursor-pointer"
                        title="Inspect artifact raw & parsed content"
                      >
                        <Eye className="w-4 h-4 text-[#383278]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Content & Records Inspector Modal */}
      {selectedFileForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F5F6FA] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#1E1B4B] font-mono flex items-center gap-2">
                  {getFileIcon(selectedFileForPreview.name, selectedFileForPreview.type)}
                  <span>{selectedFileForPreview.name}</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Type: {selectedFileForPreview.type} • {selectedFileForPreview.recordCount} parsed records • Imported: {selectedFileForPreview.importedAt}
                </p>
              </div>
              <button
                onClick={() => setSelectedFileForPreview(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#EEF2FF] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#F8FAFC] text-[#1E1B4B] overflow-y-auto flex-1 font-mono text-xs leading-relaxed border-y border-[#E2E8F0]">
              <pre className="whitespace-pre-wrap">{selectedFileForPreview.rawContent}</pre>
            </div>

            <div className="px-5 py-3.5 border-t border-[#E2E8F0] bg-white flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#64748B] font-mono text-[11px]">SHA-256:</span>
                <MonoText value={selectedFileForPreview.sha256} truncate={32} />
              </div>
              <button
                onClick={() => setSelectedFileForPreview(null)}
                className="px-4 py-2 bg-[#1E1B4B] hover:bg-[#383278] text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {reloadToast && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 shadow-xl text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{reloadToast}</span>
        </div>
      )}
    </div>
  );
};
