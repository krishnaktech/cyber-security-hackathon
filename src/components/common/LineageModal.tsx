import React from 'react';
import { X, ArrowDown, FileText, ShieldAlert, Cpu, Link as LinkIcon, Database } from 'lucide-react';
import { CorrelationLink, ForensicEntity } from '../../types/forensic';
import { ForensicCorrelator } from '../../engine/correlator';
import { MonoText } from './MonoText';

interface LineageModalProps {
  link: CorrelationLink | null;
  sourceEntity?: ForensicEntity;
  targetEntity?: ForensicEntity;
  isOpen: boolean;
  onClose: () => void;
}

export const LineageModal: React.FC<LineageModalProps> = ({
  link,
  sourceEntity,
  targetEntity,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !link) return null;

  const steps = ForensicCorrelator.buildLineage(link, sourceEntity, targetEntity);

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'FINDING':
        return <ShieldAlert className="w-4 h-4 text-[#ED1B24]" />;
      case 'SOURCE':
        return <FileText className="w-4 h-4 text-[#383278]" />;
      case 'ROW':
        return <Database className="w-4 h-4 text-emerald-600" />;
      case 'ENTITY':
        return <Cpu className="w-4 h-4 text-[#ED1B24]" />;
      case 'TARGET':
        return <LinkIcon className="w-4 h-4 text-[#64748B]" />;
      default:
        return <FileText className="w-4 h-4 text-[#64748B]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-mac-fade">
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-mac-pop text-[#1E1B4B]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#ED1B24]/10 text-[#ED1B24] border border-[#ED1B24]/20">
                Evidentiary Lineage
              </span>
              <h3 className="font-bold text-sm text-[#1E1B4B]">
                Deterministic Evidence Chain
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Transparent audit trail connecting raw digital artifacts to correlated investigative findings.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#F1F5F9] transition-all cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lineage Steps */}
        <div className="p-6 overflow-y-auto space-y-3 bg-white">
          {steps.map((step, idx) => (
            <div key={step.stepIndex} className="relative">
              <div className="flex items-start gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 hover:border-[#ED1B24] transition-colors shadow-xs">
                <div className="mt-0.5 p-1.5 rounded-lg bg-white border border-[#CBD5E1] shadow-xs">
                  {getStepIcon(step.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#ED1B24] font-mono">
                        0{step.stepIndex}
                      </span>
                      <span className="text-xs font-bold text-[#1E1B4B]">
                        {step.label}
                      </span>
                    </div>
                    {step.hashOrRef && (
                      <MonoText value={step.hashOrRef} truncate={28} />
                    )}
                  </div>
                  <p className="text-[11.5px] text-[#475569] mt-1 font-medium">
                    {step.subtext}
                  </p>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="w-3.5 h-3.5 text-[#ED1B24]" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#64748B]">
          <span className="font-medium">Verification standard: Strict artifact row-level citation</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-[#CBD5E1] text-[#1E1B4B] rounded-lg text-xs font-bold hover:bg-[#F1F5F9] transition-colors shadow-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
