import React from 'react';
import { X, HelpCircle, FileText, CheckCircle2, Link2 } from 'lucide-react';
import { CorrelationLink, ForensicEntity } from '../../types/forensic';
import { ForensicCorrelator } from '../../engine/correlator';
import { MonoText } from '../common/MonoText';

interface WhyConnectedModalProps {
  sourceId: string | null;
  targetId: string | null;
  correlations: CorrelationLink[];
  entities: ForensicEntity[];
  isOpen: boolean;
  onClose: () => void;
  onViewLineage?: (link: CorrelationLink) => void;
}

export const WhyConnectedModal: React.FC<WhyConnectedModalProps> = ({
  sourceId,
  targetId,
  correlations,
  entities,
  isOpen,
  onClose,
  onViewLineage,
}) => {
  if (!isOpen || !sourceId || !targetId) return null;

  const explanation = ForensicCorrelator.explainConnection(sourceId, targetId, correlations);
  const directLink = correlations.find(
    c =>
      (c.sourceEntityId === sourceId && c.targetEntityId === targetId) ||
      (c.sourceEntityId === targetId && c.targetEntityId === sourceId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-mac-fade">
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-lg w-full overflow-hidden animate-mac-pop text-[#1E1B4B]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#ED1B24]/10 text-[#ED1B24] border border-[#ED1B24]/20 shadow-xs">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1E1B4B]">
                Connection Explanation
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Evidentiary rationale linking these two digital entities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#F1F5F9] transition-all cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 bg-white">
          {/* Entity Pair */}
          <div className="flex items-center justify-between gap-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">Entity A</span>
              <MonoText value={sourceId} />
            </div>
            <div className="flex flex-col items-center">
              <Link2 className="w-4 h-4 text-[#ED1B24] my-0.5" />
              <span className="text-[10px] font-bold text-[#ED1B24] uppercase font-mono">
                {explanation?.relationship || 'LINK'}
              </span>
            </div>
            <div className="min-w-0 text-right">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">Entity B</span>
              <MonoText value={targetId} />
            </div>
          </div>

          {explanation ? (
            <>
              {/* Primary Narrative */}
              <div className="bg-[#ED1B24]/5 border border-[#ED1B24]/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-[#ED1B24] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#ED1B24]" />
                  Forensic Determination
                </h4>
                <p className="text-xs text-[#1E1B4B] font-medium leading-relaxed">
                  "{explanation.reason}"
                </p>
              </div>

              {/* Evidentiary Details */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider">
                  Supporting Evidentiary Findings
                </h5>
                <ul className="space-y-1.5">
                  {explanation.detailedFindings.map((finding, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-[#334155] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#ED1B24] mt-0.5 shrink-0" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confidence Metric */}
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs">
                <span className="text-[#64748B] font-medium">Correlation Confidence:</span>
                <span className="font-mono font-bold text-[#ED1B24]">
                  {explanation.confidence}% Deterministic Match
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-[#64748B] text-xs">
              No direct correlation path recorded between these two entities in the active case.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          {directLink && onViewLineage ? (
            <button
              onClick={() => {
                onClose();
                onViewLineage(directLink);
              }}
              className="text-xs font-bold text-[#ED1B24] hover:underline underline-offset-2 cursor-pointer"
            >
              View Full Evidence Lineage →
            </button>
          ) : (
            <span className="text-[11px] text-[#64748B] font-medium">Deterministic forensic correlation</span>
          )}
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-[#CBD5E1] text-[#1E1B4B] rounded-lg text-xs font-bold hover:bg-[#F1F5F9] transition-colors shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
