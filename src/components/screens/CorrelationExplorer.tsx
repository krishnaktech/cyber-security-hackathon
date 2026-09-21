import React, { useState } from 'react';
import {
  Share2,
  Filter,
  Search,
  SlidersHorizontal,
  HelpCircle,
  FileText,
  Link2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { CorrelationLink, ForensicEntity, RelationshipType } from '../../types/forensic';
import { MonoText } from '../common/MonoText';

interface CorrelationExplorerProps {
  correlations: CorrelationLink[];
  entities: ForensicEntity[];
  onSelectEntity: (entityId: string) => void;
  onExplainConnection: (sourceId: string, targetId: string) => void;
  onViewLineage: (link: CorrelationLink) => void;
}

export const CorrelationExplorer: React.FC<CorrelationExplorerProps> = ({
  correlations,
  entities,
  onSelectEntity,
  onExplainConnection,
  onViewLineage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelType, setSelectedRelType] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(80);

  // Filter correlations
  const filteredCorrelations = correlations.filter(link => {
    if (selectedRelType !== 'ALL' && link.relationship !== selectedRelType) return false;
    if (selectedSource !== 'ALL' && !link.evidenceSource.toLowerCase().includes(selectedSource.toLowerCase())) return false;
    if (link.confidence < minConfidence) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        link.sourceEntityId.toLowerCase().includes(q) ||
        link.targetEntityId.toLowerCase().includes(q) ||
        link.sourceLabel.toLowerCase().includes(q) ||
        link.targetLabel.toLowerCase().includes(q) ||
        link.reason.toLowerCase().includes(q) ||
        link.evidenceSource.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const getRelBadgeStyle = (rel: RelationshipType) => {
    switch (rel) {
      case 'FUNDS_TRANSFER':
        return 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]';
      case 'SHARED_IMEI':
      case 'SHARED_IMSI':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'SHARED_IP':
      case 'SHARED_ACCOUNT':
        return 'bg-[#ED1B24]/10 text-[#ED1B24] border-[#ED1B24]/20';
      case 'CALL':
        return 'bg-[#383278]/10 text-[#383278] border-[#383278]/20';
      default:
        return 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-[#1E1B4B]">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ED1B24]/10 border border-[#ED1B24]/20 text-[10px] font-bold text-[#ED1B24] uppercase tracking-wider mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ED1B24] animate-pulse" />
          Correlation Engine
        </div>
        <h1 className="text-2xl font-black text-[#1E1B4B] tracking-tight">
          Correlation Explorer
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filter Panel */}
        <div className="lg:col-span-3 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
            <div className="w-6 h-6 rounded-md bg-[#ED1B24]/10 flex items-center justify-center text-[#ED1B24]">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider">
              Filter Correlations
            </h3>
          </div>

          {/* Search Box */}
          <div>
            <label className="text-[11px] font-bold text-[#1E1B4B] block mb-1.5">
              Search Entities or Findings
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter links..."
                className="w-full pl-8 pr-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#1E1B4B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#ED1B24] focus:ring-1 focus:ring-[#ED1B24]"
              />
            </div>
          </div>

          {/* Relationship Type */}
          <div>
            <label className="text-[11px] font-bold text-[#1E1B4B] block mb-1.5">
              Relationship Type
            </label>
            <select
              value={selectedRelType}
              onChange={e => setSelectedRelType(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs font-medium text-[#1E1B4B] focus:outline-none focus:border-[#ED1B24]"
            >
              <option value="ALL">All Relationships ({correlations.length})</option>
              <option value="FUNDS_TRANSFER">FUNDS_TRANSFER</option>
              <option value="SHARED_IMEI">SHARED_IMEI</option>
              <option value="SHARED_IP">SHARED_IP</option>
              <option value="CALL">CALL</option>
              <option value="SHARED_ACCOUNT">SHARED_ACCOUNT</option>
              <option value="USES">USES</option>
              <option value="ASSOCIATED_WITH">ASSOCIATED_WITH</option>
            </select>
          </div>

          {/* Evidence Source */}
          <div>
            <label className="text-[11px] font-bold text-[#1E1B4B] block mb-1.5">
              Evidence Source
            </label>
            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs font-medium text-[#1E1B4B] focus:outline-none focus:border-[#ED1B24]"
            >
              <option value="ALL">All Evidence Artifacts</option>
              <option value="CDR">CDR.csv</option>
              <option value="BANK">Bank_Transactions.xlsx</option>
              <option value="IPDR">IPDR.csv</option>
              <option value="DEVICE">DEVICE_FORENSIC.json</option>
              <option value="CHAT">CHAT_EXPORT.json</option>
              <option value="PHISHING">PHISHING_HEADER.eml</option>
            </select>
          </div>

          {/* Confidence Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-[#1E1B4B]">
                Minimum Confidence
              </label>
              <span className="font-mono text-xs font-bold text-[#ED1B24]">
                {minConfidence}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              value={minConfidence}
              onChange={e => setMinConfidence(Number(e.target.value))}
              className="w-full accent-[#ED1B24] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#64748B] font-mono mt-0.5">
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRelType('ALL');
                setSelectedSource('ALL');
                setMinConfidence(80);
              }}
              className="w-full py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#1E1B4B] border border-[#CBD5E1] text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Main Correlations Table */}
        <div className="lg:col-span-9 bg-white border border-[#E2E8F0] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider">
                Correlation Matrix
              </h3>
              <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#ED1B24] border border-[#ED1B24]/30 shadow-xs">
                {filteredCorrelations.length} Links
              </span>
            </div>
            <span className="text-[11px] text-[#64748B] font-mono">
              Filtered by confidence threshold &ge; {minConfidence}%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[10px] font-bold text-[#1E1B4B] uppercase tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3">Source Entity</th>
                  <th className="px-4 py-3">Relationship</th>
                  <th className="px-4 py-3">Target Entity</th>
                  <th className="px-4 py-3">Evidence Ref</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#1E1B4B]">
                {filteredCorrelations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#64748B]">
                      No correlations match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredCorrelations.map(link => (
                    <tr
                      key={link.id}
                      className="hover:bg-[#F8FAFC] transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onSelectEntity(link.sourceEntityId)}
                          className="font-mono text-xs font-bold text-[#1E1B4B] hover:text-[#ED1B24] text-left block cursor-pointer"
                        >
                          {link.sourceEntityId}
                        </button>
                        <span className="text-[10px] text-[#64748B] block truncate max-w-[140px]">
                          {link.sourceLabel}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider inline-flex items-center gap-1 font-mono ${getRelBadgeStyle(
                            link.relationship
                          )}`}
                        >
                          {link.relationship}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => onSelectEntity(link.targetEntityId)}
                          className="font-mono text-xs font-bold text-[#1E1B4B] hover:text-[#ED1B24] text-left block cursor-pointer"
                        >
                          {link.targetEntityId}
                        </button>
                        <span className="text-[10px] text-[#64748B] block truncate max-w-[140px]">
                          {link.targetLabel}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-[11px] font-bold text-[#1E1B4B] font-mono">
                          {link.evidenceSource}
                        </div>
                        <div className="text-[10px] text-[#64748B] font-mono">
                          {link.evidenceRef}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-xs text-[#ED1B24]">
                          {link.confidence}%
                        </span>
                      </td>

                      <td className="px-4 py-3 text-[11px] font-mono text-[#64748B]">
                        {link.timestamp}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              onExplainConnection(link.sourceEntityId, link.targetEntityId)
                            }
                            className="px-2.5 py-1 bg-white border border-[#CBD5E1] text-[#1E1B4B] hover:bg-[#F1F5F9] rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Why are these connected?"
                          >
                            <HelpCircle className="w-3 h-3 text-[#383278]" />
                            Why?
                          </button>
                          <button
                            onClick={() => onViewLineage(link)}
                            className="px-2.5 py-1 bg-[#ED1B24] text-white hover:bg-[#D9141D] rounded-md text-[11px] font-bold transition-all shadow-[0_2px_8px_rgba(237,27,36,0.2)] cursor-pointer"
                            title="View complete evidence lineage"
                          >
                            Lineage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
