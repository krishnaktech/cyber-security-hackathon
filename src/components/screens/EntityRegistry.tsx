import React, { useState } from 'react';
import { Users, Search, ArrowUpDown, ChevronRight } from 'lucide-react';
import { ForensicEntity } from '../../types/forensic';
import { RiskBadge } from '../common/RiskBadge';

interface EntityRegistryProps {
  entities: ForensicEntity[];
  onSelectEntity: (entityId: string) => void;
}

export const EntityRegistry: React.FC<EntityRegistryProps> = ({
  entities,
  onSelectEntity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'risk' | 'id' | 'links'>('risk');

  const filteredEntities = entities
    .filter(e => {
      if (typeFilter !== 'ALL' && e.type !== typeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          e.id.toLowerCase().includes(q) ||
          e.label.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'risk') return b.riskScore - a.riskScore;
      if (sortBy === 'links') return b.linkedEntityIds.length - a.linkedEntityIds.length;
      return a.id.localeCompare(b.id);
    });

  const entityTypes: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Types' },
    { id: 'PHONE', label: 'Phone' },
    { id: 'UPI', label: 'UPI' },
    { id: 'BANK_ACCOUNT', label: 'Bank Account' },
    { id: 'IMEI', label: 'IMEI' },
    { id: 'IMSI', label: 'IMSI' },
    { id: 'IP', label: 'IP Address' },
    { id: 'DEVICE', label: 'Device' },
    { id: 'EMAIL', label: 'Email' },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto text-[#1E1B4B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="text-[11px] font-bold text-[#383278] tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ED1B24]" />
            <span>Forensic Artifacts Database</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight mt-1">
            Artifacts Registry
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-white text-[#383278] border border-[#CBD5E1] shadow-xs">
            {entities.length} Extracted Entities
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {entityTypes.map(t => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                typeFilter === t.id
                  ? 'bg-[#1E1B4B] text-white shadow-xs'
                  : 'text-[#4A4A6A] hover:text-[#1E1B4B] hover:bg-[#EEF2FF]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search registry..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#F5F6FA] border border-[#CBD5E1] rounded-lg text-xs text-[#1E1B4B] placeholder:text-[#64748B] focus:outline-hidden focus:border-[#383278] focus:ring-1 focus:ring-[#383278]"
            />
          </div>

          <button
            onClick={() =>
              setSortBy(prev => (prev === 'risk' ? 'links' : prev === 'links' ? 'id' : 'risk'))
            }
            className="px-3 py-1.5 bg-white border border-[#CBD5E1] hover:border-[#383278] hover:bg-[#EEF2FF] rounded-lg text-xs text-[#1E1B4B] font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs transition-all"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="capitalize">{sortBy}</span>
          </button>
        </div>
      </div>

      {/* Entities Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F6FA] text-[10px] font-bold text-[#383278] uppercase tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3">Identifier</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Role / Context</th>
                <th className="px-4 py-3">Risk / Triage Score</th>
                <th className="px-4 py-3">Linked Entities</th>
                <th className="px-4 py-3">Artifacts</th>
                <th className="px-4 py-3">Observed Window</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#1E1B4B]">
              {filteredEntities.map(entity => (
                <tr
                  key={entity.id}
                  className="hover:bg-[#EEF2FF]/40 transition-colors cursor-pointer group"
                  onClick={() => onSelectEntity(entity.id)}
                >
                  <td className="px-4 py-3.5 font-semibold text-[#1E1B4B]">
                    <span className="font-mono text-xs font-bold text-[#383278] group-hover:text-[#ED1B24] group-hover:underline">
                      {entity.id}
                    </span>
                    <span className="text-[11px] text-[#64748B] block truncate max-w-xs mt-0.5 font-normal">
                      {entity.label}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F6FA] text-[#383278] border border-[#CBD5E1] font-mono">
                      {entity.type}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="text-xs text-[#1E1B4B] font-semibold">
                      {entity.role || 'Unspecified'}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
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
                      <RiskBadge level={entity.riskLevel} score={entity.riskScore} showScore />
                    </div>
                  </td>

                  <td className="px-4 py-3.5 font-mono font-bold text-[#1E1B4B]">
                    {entity.linkedEntityIds.length} connected
                  </td>

                  <td className="px-4 py-3.5 text-[#64748B] text-[11px] font-mono">
                    {entity.evidenceSources.length} sources
                  </td>

                  <td className="px-4 py-3.5 text-[11px] font-mono text-[#64748B]">
                    {entity.firstObserved} – {entity.lastObserved}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSelectEntity(entity.id);
                      }}
                      className="px-3 py-1 bg-white hover:bg-[#EEF2FF] border border-[#CBD5E1] hover:border-[#383278] text-[#1E1B4B] rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 shadow-2xs cursor-pointer group-hover:border-[#383278]"
                    >
                      <span>Profile</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#ED1B24] group-hover:translate-x-0.5 transition-transform" />
                    </button>
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
