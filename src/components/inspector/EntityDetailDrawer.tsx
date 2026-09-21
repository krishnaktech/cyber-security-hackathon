import React from 'react';
import {
  X,
  Shield,
  FileText,
  Link as LinkIcon,
  Clock,
  Layers,
  HelpCircle,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { ForensicEntity, CorrelationLink } from '../../types/forensic';
import { RiskBadge } from '../common/RiskBadge';
import { MonoText } from '../common/MonoText';

interface EntityDetailDrawerProps {
  entity: ForensicEntity | null;
  allEntities: ForensicEntity[];
  correlations: CorrelationLink[];
  isOpen: boolean;
  onClose: () => void;
  onSelectEntity: (entityId: string) => void;
  onExplainConnection: (sourceId: string, targetId: string) => void;
  onViewLineage?: (link: CorrelationLink) => void;
}

export const EntityDetailDrawer: React.FC<EntityDetailDrawerProps> = ({
  entity,
  allEntities,
  correlations,
  isOpen,
  onClose,
  onSelectEntity,
  onExplainConnection,
  onViewLineage,
}) => {
  if (!isOpen || !entity) return null;

  // Find direct connections
  const connectedLinks = correlations.filter(
    c => c.sourceEntityId === entity.id || c.targetEntityId === entity.id
  );

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 md:w-[420px] bg-white border-l border-[#CBD5E1] shadow-2xl flex flex-col animate-mac-sheet rounded-l-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#1E1B4B]/5 text-[#1E1B4B] border border-[#1E1B4B]/15 font-mono shadow-xs">
              {entity.type}
            </span>
            <RiskBadge level={entity.riskLevel} score={entity.riskScore} showScore />
          </div>
          <h2 className="text-sm font-bold text-[#1E1B4B] font-mono break-all">
            {entity.id}
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">{entity.label}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#F1F5F9] transition-all cursor-pointer"
          title="Close inspector (Esc)"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
        {/* Risk / Triage Score Card */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#1E1B4B] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#ED1B24]" />
              Risk / Triage Score
            </span>
            <span className="font-mono text-sm font-bold text-[#1E1B4B]">
              {entity.riskScore} <span className="text-xs text-[#64748B] font-normal">/ 100</span>
            </span>
          </div>

          {/* Score Bar */}
          <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 mb-2.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                entity.riskScore >= 80
                  ? 'bg-[#ED1B24]'
                  : entity.riskScore >= 60
                  ? 'bg-amber-600'
                  : entity.riskScore >= 30
                  ? 'bg-[#383278]'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${entity.riskScore}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Status: <strong className="text-[#1E1B4B] font-bold">{entity.status}</strong></span>
            {entity.role && (
              <span>Role: <strong className="text-[#1E1B4B] font-bold">{entity.role}</strong></span>
            )}
          </div>
        </div>

        {/* Forensic Metadata Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg shadow-xs">
            <span className="text-[10px] font-bold text-[#64748B] block uppercase tracking-wider">Linked Entities</span>
            <span className="font-mono font-bold text-[#1E1B4B] text-sm mt-0.5 block">
              {entity.linkedEntityIds.length}
            </span>
          </div>
          <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg shadow-xs">
            <span className="text-[10px] font-bold text-[#64748B] block uppercase tracking-wider">Evidence Sources</span>
            <span className="font-mono font-bold text-[#1E1B4B] text-sm mt-0.5 block">
              {entity.evidenceSources.length} artifacts
            </span>
          </div>
          <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg shadow-xs">
            <span className="text-[10px] font-bold text-[#64748B] block uppercase tracking-wider">First Observed</span>
            <span className="font-mono text-[#1E1B4B] text-xs mt-0.5 block truncate font-medium">
              {entity.firstObserved}
            </span>
          </div>
          <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg shadow-xs">
            <span className="text-[10px] font-bold text-[#64748B] block uppercase tracking-wider">Last Observed</span>
            <span className="font-mono text-[#1E1B4B] text-xs mt-0.5 block truncate font-medium">
              {entity.lastObserved}
            </span>
          </div>
        </div>

        {/* Correlation Signals (Why this score?) */}
        <div>
          <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#ED1B24]" />
            Correlation Signals & Anomalies
          </h3>
          {entity.signals.length > 0 ? (
            <div className="space-y-2">
              {entity.signals.map(sig => (
                <div
                  key={sig.id}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[#ED1B24] font-black">✓</span>
                      {sig.label}
                    </span>
                    <span className="font-mono font-bold text-[#ED1B24]">
                      +{sig.scoreDelta}
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-800/90 mt-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-amber-700" />
                    <span>Evidence ref: {sig.evidenceRef}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#64748B] italic p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              No anomalous risk signals flagged for this entity.
            </p>
          )}
        </div>

        {/* Evidence References */}
        <div>
          <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#383278]" />
            Evidence References (Row Citations)
          </h3>
          <div className="space-y-2">
            {entity.evidenceSources.map((ref, i) => (
              <div
                key={i}
                className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg text-xs flex items-start justify-between gap-2 shadow-xs"
              >
                <div>
                  <div className="font-bold text-[#1E1B4B] font-mono text-[11.5px]">
                    {ref.file} {ref.row ? `• row ${ref.row}` : ''}
                  </div>
                  {ref.detail && (
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      {ref.detail}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  Verified
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Linked Entities with "Why?" trigger */}
        <div>
          <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-[#383278]" />
            Correlated Entities ({connectedLinks.length})
          </h3>
          <div className="space-y-2">
            {connectedLinks.map(link => {
              const otherId = link.sourceEntityId === entity.id ? link.targetEntityId : link.sourceEntityId;
              const otherLabel = link.sourceEntityId === entity.id ? link.targetLabel : link.sourceLabel;
              const otherEntity = allEntities.find(e => e.id === otherId);

              return (
                <div
                  key={link.id}
                  className="p-3 bg-white border border-[#E2E8F0] rounded-lg hover:border-[#ED1B24] shadow-xs transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectEntity(otherId)}
                      className="font-mono text-xs font-bold text-[#1E1B4B] hover:text-[#ED1B24] hover:underline text-left truncate cursor-pointer"
                    >
                      {otherId}
                    </button>
                    {otherEntity && (
                      <RiskBadge level={otherEntity.riskLevel} score={otherEntity.riskScore} />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-[#64748B]">
                    <span className="font-medium text-[#475569]">
                      {link.relationship} ({link.confidence}%)
                    </span>
                    <button
                      onClick={() => onExplainConnection(entity.id, otherId)}
                      className="inline-flex items-center gap-1 text-[#ED1B24] hover:text-[#D9141D] font-bold cursor-pointer"
                    >
                      <HelpCircle className="w-3 h-3" />
                      Why?
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
        <span className="text-[11px] text-[#64748B] font-medium">
          Source: Forensic Registry
        </span>
        <button
          onClick={onClose}
          className="px-3.5 py-1.5 bg-white border border-[#CBD5E1] text-[#1E1B4B] rounded-lg text-xs font-bold hover:bg-[#F1F5F9] transition-colors shadow-xs cursor-pointer"
        >
          Close Inspector
        </button>
      </div>
    </div>
  );
};
