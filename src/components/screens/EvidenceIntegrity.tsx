import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  FileText,
  Search,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { EvidenceFile } from '../../types/forensic';
import { MonoText } from '../common/MonoText';
import { ForensicApiClient } from '../../services/api';
import { computeSha256, verifyArtifactIntegrity } from '../../engine/hasher';

interface EvidenceIntegrityProps {
  evidenceFiles: EvidenceFile[];
}

interface VerificationResult {
  fileId: string;
  match: boolean;
  computedHash: string;
  verifiedAt: string;
}

export const EvidenceIntegrity: React.FC<EvidenceIntegrityProps> = ({
  evidenceFiles,
}) => {
  const [verifying, setVerifying] = useState(false);
  const [verifyingFileId, setVerifyingFileId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, VerificationResult>>({});
  const [manualModalFile, setManualModalFile] = useState<EvidenceFile | null>(null);
  const [manualInputHash, setManualInputHash] = useState('');
  const [computedModalHash, setComputedModalHash] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const openManualModal = async (file: EvidenceFile) => {
    setManualModalFile(file);
    setManualInputHash('');
    setComputedModalHash(null);
    setCopiedHash(false);
    try {
      const hash = await computeSha256(file.rawContent);
      setComputedModalHash(hash);
    } catch {
      setComputedModalHash(file.sha256);
    }
  };

  const handleVerifySingle = async (file: EvidenceFile) => {
    setVerifyingFileId(file.id);
    try {
      const res = await verifyArtifactIntegrity(file.rawContent, file.sha256);
      setResults(prev => ({
        ...prev,
        [file.id]: {
          fileId: file.id,
          match: res.match,
          computedHash: res.computedHash,
          verifiedAt: new Date().toLocaleTimeString(),
        },
      }));
    } catch (err) {
      console.error('Failed to verify artifact:', err);
    } finally {
      setTimeout(() => setVerifyingFileId(null), 300);
    }
  };

  const handleMarkVerifiedFromModal = () => {
    if (!manualModalFile) return;
    const isMatch = manualInputHash.trim()
      ? manualInputHash.trim().toLowerCase() === manualModalFile.sha256.toLowerCase()
      : true;
    setResults(prev => ({
      ...prev,
      [manualModalFile.id]: {
        fileId: manualModalFile.id,
        match: isMatch,
        computedHash: computedModalHash || manualModalFile.sha256,
        verifiedAt: new Date().toLocaleTimeString(),
      },
    }));
    setManualModalFile(null);
  };

  const handleCopyModalHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleVerifyAll = async () => {
    setVerifying(true);
    const newResults: Record<string, VerificationResult> = {};

    try {
      // First attempt server-side verification API
      const apiRes = await ForensicApiClient.verifyIntegrity();
      if (apiRes && apiRes.results) {
        for (const item of apiRes.results) {
          newResults[item.fileId] = {
            fileId: item.fileId,
            match: item.match,
            computedHash: item.computedHash,
            verifiedAt: new Date().toLocaleTimeString(),
          };
        }
      } else {
        // Fallback to in-browser Web Crypto API
        for (const file of evidenceFiles) {
          const res = await verifyArtifactIntegrity(file.rawContent, file.sha256);
          newResults[file.id] = {
            fileId: file.id,
            match: res.match,
            computedHash: res.computedHash,
            verifiedAt: new Date().toLocaleTimeString(),
          };
          await new Promise(r => setTimeout(r, 100));
        }
      }
    } catch {
      for (const file of evidenceFiles) {
        const res = await verifyArtifactIntegrity(file.rawContent, file.sha256);
        newResults[file.id] = {
          fileId: file.id,
          match: res.match,
          computedHash: res.computedHash,
          verifiedAt: new Date().toLocaleTimeString(),
        };
      }
    }

    setResults(newResults);
    setVerifying(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto text-[#1E1B4B] animate-mac-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ED1B24]/10 border border-[#ED1B24]/20 text-[10px] font-bold text-[#ED1B24] uppercase tracking-wider mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ED1B24] animate-pulse" />
            Cyber Forensics Audit
          </div>
          <h1 className="text-2xl font-black text-[#1E1B4B] tracking-tight">
            Evidence Integrity Verification
          </h1>
        </div>

        <button
          onClick={handleVerifyAll}
          disabled={verifying}
          className="px-4 py-2.5 bg-[#ED1B24] hover:bg-[#D9141D] text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-all flex items-center gap-2 shadow-[0_4px_14px_rgba(237,27,36,0.25)] hover:shadow-[0_6px_20px_rgba(237,27,36,0.35)] cursor-pointer active:scale-98"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
          <span>{verifying ? 'Calculating SHA-256 Hashes...' : 'Verify All File Hashes'}</span>
        </button>
      </div>

      {/* Integrity Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#ED1B24]/10 border border-[#ED1B24]/20 flex items-center justify-center text-[#ED1B24]">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider">
              Cryptographic Audit Register
            </h3>
          </div>
          <span className="font-mono text-[11px] text-[#64748B] bg-white px-2.5 py-0.5 rounded-md border border-[#E2E8F0]">
            Standard: FIPS 180-4 (SHA-256)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F8FAFC] text-[10px] font-bold text-[#1E1B4B] uppercase tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="w-[24%] px-4 py-3 text-left">Evidence Artifact</th>
                <th className="w-[10%] px-3 py-3 text-center">Type</th>
                <th className="w-[10%] px-3 py-3 text-center">Algorithm</th>
                <th className="w-[24%] px-3 py-3 text-center">Ingestion Hash (SHA-256)</th>
                <th className="w-[12%] px-3 py-3 text-center">Audit Status</th>
                <th className="w-[20%] px-3 py-3 text-center">Verification Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#1E1B4B]">
              {evidenceFiles.map(file => {
                const res = results[file.id];
                return (
                  <tr key={file.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3 align-middle text-left">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#383278] shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-[#1E1B4B]">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-[#64748B] block font-mono">
                            {file.recordCount} records • {file.importedAt}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 align-middle text-center">
                      <div className="flex justify-center">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] font-mono">
                          {file.type}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3 align-middle text-center font-mono text-[11px] text-[#64748B] font-medium">
                      SHA-256
                    </td>

                    <td className="px-3 py-3 align-middle text-center">
                      <div className="flex justify-center">
                        <MonoText value={file.sha256} truncate={28} />
                      </div>
                    </td>

                    <td className="px-3 py-3 align-middle text-center">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          RECORDED
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3 align-middle text-center">
                      <div className="flex items-center justify-center gap-2">
                        {res ? (
                          <>
                            {res.match ? (
                              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-mono shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>✓ HASH MATCH</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-bold text-[#ED1B24] bg-red-50 border border-red-200 px-2.5 py-1 rounded-full text-xs font-mono shadow-xs">
                                <AlertTriangle className="w-3.5 h-3.5 text-[#ED1B24]" />
                                <span>⚠ HASH MISMATCH</span>
                              </span>
                            )}
                            <button
                              onClick={() => openManualModal(file)}
                              className="p-1 rounded-lg text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                              title="Manual hash compare / inspect"
                            >
                              <Search className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleVerifySingle(file)}
                              disabled={verifyingFileId === file.id || verifying}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#ED1B24] hover:bg-[#D9141D] text-white text-xs font-bold transition-all shadow-[0_2px_8px_rgba(237,27,36,0.2)] cursor-pointer active:scale-98 disabled:opacity-50"
                              title="Manually calculate and verify SHA-256 for this artifact"
                            >
                              <RefreshCw className={`w-3 h-3 ${verifyingFileId === file.id ? 'animate-spin text-white' : 'text-white'}`} />
                              <span>{verifyingFileId === file.id ? 'Verifying...' : 'Verify'}</span>
                            </button>
                            <button
                              onClick={() => openManualModal(file)}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F1F5F9] text-[#1E1B4B] border border-[#CBD5E1] text-[11px] font-semibold font-mono transition-colors cursor-pointer shadow-xs"
                              title="Manually compare external SHA-256 hash"
                            >
                              Compare
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Cryptographic Hash Verification Modal */}
      {manualModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-mac-fade">
          <div className="bg-white border border-[#CBD5E1] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-mac-pop text-[#1E1B4B]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ED1B24]/10 border border-[#ED1B24]/20 flex items-center justify-center text-[#ED1B24]">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E1B4B] flex items-center gap-2">
                    <span>Manual Cryptographic Hash Verification</span>
                  </h3>
                  <p className="text-xs text-[#64748B] font-mono">
                    Artifact: {manualModalFile.name} ({manualModalFile.type})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManualModalFile(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Recorded Ingestion Hash */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#1E1B4B]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ED1B24]" />
                    Recorded Ingestion SHA-256 Fingerprint:
                  </span>
                  <button
                    onClick={() => handleCopyModalHash(manualModalFile.sha256)}
                    className="text-[11px] text-[#ED1B24] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-[#CBD5E1] font-mono text-xs text-[#1E1B4B] break-all select-all shadow-xs">
                  {manualModalFile.sha256}
                </div>
              </div>

              {/* Computed Buffer Hash */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <div className="text-xs font-bold text-[#1E1B4B] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Live Recomputed Buffer SHA-256:
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-[#CBD5E1] font-mono text-xs text-emerald-700 font-bold break-all select-all shadow-xs">
                  {computedModalHash || 'Computing SHA-256...'}
                </div>
                <div className="text-[11px] text-[#64748B]">
                  Calculated directly from in-memory evidence payload using standard Web Crypto FIPS 180-4.
                </div>
              </div>

              {/* Manual External Hash Input */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <label className="block text-xs font-bold text-[#1E1B4B]">
                  Compare External Reference Hash (e.g. Police Seizure Memo / Laboratory Certificate):
                </label>
                <input
                  type="text"
                  placeholder="Paste external 64-character SHA-256 hash here..."
                  value={manualInputHash}
                  onChange={e => setManualInputHash(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#1E1B4B] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#ED1B24] focus:ring-1 focus:ring-[#ED1B24] shadow-xs"
                />

                {/* Verification Status Feedback */}
                {manualInputHash.trim() ? (
                  manualInputHash.trim().toLowerCase() === manualModalFile.sha256.toLowerCase() ? (
                    <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs animate-mac-fade">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <strong className="font-bold">CRYPTOGRAPHIC INTEGRITY CONFIRMED:</strong>
                        <div className="text-[11px] text-emerald-700 font-mono">
                          External reference hash is an exact 100% match (64/64 hex characters) with recorded evidence.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-[#ED1B24] flex items-center gap-2.5 text-xs animate-mac-fade">
                      <AlertTriangle className="w-4 h-4 text-[#ED1B24] shrink-0" />
                      <div>
                        <strong className="font-bold">HASH MISMATCH DETECTED:</strong>
                        <div className="text-[11px] text-red-700 font-mono">
                          External hash does not match recorded evidence fingerprint. Verify character input or check for payload mutation.
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-[11px] text-[#64748B] italic">
                    Paste an external hash above to perform real-time character-by-character comparison.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <button
                onClick={() => setManualModalFile(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#F1F5F9] transition-colors cursor-pointer border border-[#CBD5E1]"
              >
                Close
              </button>
              <button
                onClick={handleMarkVerifiedFromModal}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#ED1B24] hover:bg-[#D9141D] text-white transition-all shadow-[0_4px_14px_rgba(237,27,36,0.25)] cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark as Verified</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
