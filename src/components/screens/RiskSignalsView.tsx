import React, { useState } from 'react';
import { ArrowUpDown, ChevronRight } from 'lucide-react';
import { ForensicEntity } from '../../types/forensic';
import { RiskBadge } from '../common/RiskBadge';

interface RiskSignalsViewProps {
  entities: ForensicEntity[];
  onSelectEntity: (entityId: string) => void;
}

export const RiskSignalsView: React.FC<RiskSignalsViewProps> = ({
  entities,
  onSelectEntity,
}) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const scoredEntities = [...entities]
    .filter(e => e.riskScore > 0)
    .sort((a, b) => (sortOrder === 'desc' ? b.riskScore - a.riskScore : a.riskScore - b.riskScore));

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl mx-auto text-[#1E1B4B]">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-4">
        <div className="text-[11px] font-bold text-[#383278] tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ED1B24]" />
          <span>Anomaly & Risk Intelligence</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight mt-1">
          Threat Indicators & Triage Engine
        </h1>
      </div>

      {/* Scored Entities Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F5F6FA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider">
              Flagged Entity Ranking
            </h3>
            <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF1F2] text-[#ED1B24] border border-[#FECDD3]">
              {scoredEntities.length} Flagged
            </span>
          </div>

          <button
            onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#1E1B4B] transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Sort by Score ({sortOrder.toUpperCase()})</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F6FA] text-[10px] font-bold text-[#383278] uppercase tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="w-[22%] px-4 py-3 text-left">Entity</th>
                <th className="w-[10%] px-3 py-3 text-center">Type</th>
                <th className="w-[16%] px-3 py-3 text-center">Risk / Triage Score</th>
                <th className="w-[10%] px-3 py-3 text-center">Level</th>
                <th className="w-[26%] px-4 py-3 text-left">Triggered Signals</th>
                <th className="w-[10%] px-3 py-3 text-center">Evidence Sources</th>
                <th className="w-[6%] px-3 py-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#1E1B4B]">
              {scoredEntities.map(entity => (
                <tr
                  key={entity.id}
                  className="hover:bg-[#EEF2FF]/40 transition-colors cursor-pointer group"
                  onClick={() => onSelectEntity(entity.id)}
                >
                  <td className="px-4 py-3.5 align-middle text-left">
                    <span className="font-mono text-xs font-bold text-[#383278] group-hover:text-[#ED1B24] group-hover:underline">
                      {entity.id}
                    </span>
                    <span className="text-[11px] text-[#64748B] block truncate max-w-xs mt-0.5 font-normal">
                      {entity.label}
                    </span>
                  </td>

                  <td className="px-3 py-3.5 align-middle text-center">
                    <div className="flex justify-center">
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F6FA] text-[#383278] border border-[#CBD5E1] font-mono">
                        {entity.type}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3.5 align-middle text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            entity.riskScore >= 80
                              ? 'bg-[#ED1B24]'
                              : entity.riskScore >= 60
                              ? 'bg-[#D97706]'
                              : entity.riskScore >= 30
                              ? 'bg-[#383278]'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${entity.riskScore}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-xs text-[#1E1B4B]">
                        {entity.riskScore}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3.5 align-middle text-center">
                    <div className="flex justify-center">
                      <RiskBadge level={entity.riskLevel} />
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-middle text-left">
                    <div className="space-y-1">
                      {entity.signals.slice(0, 2).map(sig => (
                        <div
                          key={sig.id}
                          className="text-[11px] text-[#1E1B4B] flex items-center gap-1.5 truncate max-w-xs font-medium"
                        >
                          <span className="text-[#ED1B24] font-bold">•</span>
                          <span>{sig.label}</span>
                        </div>
                      ))}
                      {entity.signals.length > 2 && (
                        <span className="text-[10px] text-[#64748B] font-medium">
                          +{entity.signals.length - 2} more anomalies
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-3.5 align-middle text-center font-mono text-[11px] text-[#64748B]">
                    {entity.evidenceSources.length} artifacts
                  </td>

                  <td className="px-3 py-3.5 align-middle text-center">
                    <div className="flex justify-center">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectEntity(entity.id);
                        }}
                        className="p-1 rounded-lg text-[#64748B] hover:text-[#ED1B24] hover:bg-[#EEF2FF] cursor-pointer transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
