import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Smartphone, Cpu, CreditCard, Globe, Mail, FileText, ArrowRight } from 'lucide-react';
import { ForensicEntity, CorrelationLink, EvidenceFile } from '../../types/forensic';
import { RiskBadge } from '../common/RiskBadge';
import { MonoText } from '../common/MonoText';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  entities: ForensicEntity[];
  evidenceFiles: EvidenceFile[];
  correlations: CorrelationLink[];
  onSelectEntity: (entityId: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  entities,
  evidenceFiles,
  correlations,
  onSelectEntity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Toggle from outside if handled, or close if open
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const query = searchTerm.trim().toLowerCase();

  const matchingEntities = query
    ? entities.filter(
        e =>
          e.id.toLowerCase().includes(query) ||
          e.label.toLowerCase().includes(query) ||
          e.type.toLowerCase().includes(query)
      )
    : [];

  const matchingFiles = query
    ? evidenceFiles.filter(
        f =>
          f.name.toLowerCase().includes(query) ||
          f.type.toLowerCase().includes(query) ||
          f.sha256.toLowerCase().includes(query)
      )
    : [];

  const matchingCorrelations = query
    ? correlations.filter(
        c =>
          c.sourceEntityId.toLowerCase().includes(query) ||
          c.targetEntityId.toLowerCase().includes(query) ||
          c.relationship.toLowerCase().includes(query) ||
          c.evidenceSource.toLowerCase().includes(query)
      )
    : [];

  const totalResults = matchingEntities.length + matchingFiles.length + matchingCorrelations.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4 animate-mac-fade">
      <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-2xl max-w-xl w-full overflow-hidden animate-mac-pop text-[#1E1B4B]">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-[#E2E8F0] bg-white">
          <Search className="w-4 h-4 text-[#ED1B24] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search phones, IMEIs, UPIs, accounts, IPs, identifiers..."
            className="flex-1 bg-transparent text-sm text-[#1E1B4B] placeholder:text-[#94A3B8] focus:outline-hidden font-sans"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-1.5 py-0.5 text-[11px] text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#F1F5F9] rounded mr-1 transition-all cursor-pointer"
              title="Clear search"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#F1F5F9] transition-all cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-[#E2E8F0]">
          {!query ? (
            <div className="py-8 text-center text-xs text-[#64748B]">
              Type an identifier (e.g. <span className="font-mono font-bold text-[#ED1B24]">IMEI001</span>, <span className="font-mono font-bold text-[#ED1B24]">9123456789</span>, <span className="font-mono font-bold text-[#ED1B24]">103.10.10.1</span>, <span className="font-mono font-bold text-[#ED1B24]">mule2@upi</span>) to search across all case artifacts.
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-xs text-[#64748B]">
              No entities, artifacts, or correlations matched "{searchTerm}".
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Entities */}
              {matchingEntities.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase text-[#64748B] tracking-wider px-2 mb-1.5 flex items-center justify-between">
                    <span>Artifacts & Entities</span>
                    <span className="font-mono text-[#ED1B24] font-bold">{matchingEntities.length}</span>
                  </div>
                  <div className="space-y-1">
                    {matchingEntities.slice(0, 5).map(e => (
                      <button
                        key={e.id}
                        onClick={() => {
                          onSelectEntity(e.id);
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-[#F8FAFC] flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#1E1B4B] border border-[#CBD5E1] font-mono">
                            {e.type}
                          </span>
                          <span className="font-mono text-xs font-bold text-[#1E1B4B] group-hover:text-[#ED1B24] truncate transition-colors">
                            {e.id}
                          </span>
                          <span className="text-xs text-[#64748B] truncate hidden sm:inline">
                            {e.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <RiskBadge level={e.riskLevel} score={e.riskScore} />
                          <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#ED1B24] transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Correlations */}
              {matchingCorrelations.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase text-[#64748B] tracking-wider px-2 mb-1.5 flex items-center justify-between">
                    <span>Correlations</span>
                    <span className="font-mono text-[#ED1B24] font-bold">{matchingCorrelations.length}</span>
                  </div>
                  <div className="space-y-1">
                    {matchingCorrelations.slice(0, 4).map(c => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] text-xs flex items-center justify-between shadow-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-[#1E1B4B] flex items-center gap-1.5">
                            <span className="font-mono font-bold">{c.sourceLabel}</span>
                            <span className="text-[10px] text-[#ED1B24] font-bold uppercase">
                              ↔ {c.relationship} ↔
                            </span>
                            <span className="font-mono font-bold">{c.targetLabel}</span>
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-0.5">
                            Source: {c.evidenceSource} • {c.confidence}% confidence
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onSelectEntity(c.sourceEntityId);
                            onClose();
                          }}
                          className="text-[11px] text-[#ED1B24] hover:underline font-bold shrink-0 cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {matchingFiles.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase text-[#64748B] tracking-wider px-2 mb-1.5 flex items-center justify-between">
                    <span>Evidence Files</span>
                    <span className="font-mono text-[#ED1B24] font-bold">{matchingFiles.length}</span>
                  </div>
                  <div className="space-y-1">
                    {matchingFiles.map(f => (
                      <div
                        key={f.id}
                        className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] text-xs flex items-center justify-between shadow-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-[#ED1B24]" />
                          <span className="font-bold text-[#1E1B4B] font-mono">
                            {f.name}
                          </span>
                          <span className="text-[10px] text-[#64748B]">({f.recordCount} records)</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {f.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC] text-[11px] text-[#64748B] flex items-center justify-between font-medium">
          <span>Global Search across Case CF-2026-001</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
