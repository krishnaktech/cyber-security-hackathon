import React, { useState } from 'react';
import {
  Clock,
  PhoneCall,
  CreditCard,
  Globe,
  Smartphone,
  MessageSquare,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { TimelineEvent } from '../../types/forensic';
import { RiskBadge } from '../common/RiskBadge';

interface TimelineViewProps {
  events: TimelineEvent[];
  onSelectEntity: (entityId: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  onSelectEntity,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredEvents = events.filter(e => {
    if (filterType === 'ALL') return true;
    if (filterType === 'CALLS') return e.eventType === 'CALL';
    if (filterType === 'TRANSACTIONS') return e.eventType === 'TRANSACTION';
    if (filterType === 'IP') return e.eventType === 'IP_SESSION';
    if (filterType === 'DEVICE') return e.eventType === 'DEVICE_EVENT';
    if (filterType === 'CHAT') return e.eventType === 'CHAT';
    if (filterType === 'EMAIL') return e.eventType === 'EMAIL';
    return true;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <PhoneCall className="w-3.5 h-3.5 text-blue-700" />;
      case 'TRANSACTION':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-700" />;
      case 'IP_SESSION':
        return <Globe className="w-3.5 h-3.5 text-purple-700" />;
      case 'DEVICE_EVENT':
        return <Smartphone className="w-3.5 h-3.5 text-amber-700" />;
      case 'CHAT':
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-700" />;
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-slate-700" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'CALL':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'TRANSACTION':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'IP_SESSION':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'DEVICE_EVENT':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'CHAT':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'EMAIL':
        return 'bg-[#F2F2EF] text-[#737373] border-[#E5E5E2]';
      default:
        return 'bg-[#F2F2EF] text-[#737373] border-[#E5E5E2]';
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto text-[#1E1B4B]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="text-[11px] font-bold text-[#383278] tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ED1B24]" />
            <span>Temporal Forensics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight mt-1">
            Chronology Reconstruction
          </h1>
        </div>

        {/* Filter Pills - single row */}
        <div className="flex items-center gap-1 bg-white border border-[#CBD5E1] p-1 rounded-xl shadow-xs shrink-0">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'CALLS', label: 'Calls' },
            { id: 'TRANSACTIONS', label: 'Transactions' },
            { id: 'IP', label: 'IP Sessions' },
            { id: 'CHAT', label: 'Chat' },
            { id: 'EMAIL', label: 'Email' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterType === f.id
                  ? 'bg-[#1E1B4B] text-white shadow-xs'
                  : 'text-[#4A4A6A] hover:text-[#1E1B4B] hover:bg-[#EEF2FF]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Forensic Timeline */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-[#CBD5E1] space-y-6 my-6">
        {filteredEvents.map(evt => (
          <div key={evt.id} className="relative group">
            {/* Timeline Node Dot */}
            <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-white border-2 border-[#CBD5E1] flex items-center justify-center group-hover:border-[#ED1B24] transition-colors shadow-xs">
              {getEventIcon(evt.eventType)}
            </div>

            {/* Event Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#383278] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#1E1B4B] bg-[#F5F6FA] px-2.5 py-0.5 rounded-full border border-[#CBD5E1]">
                    {evt.displayTime}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-mono ${getEventBadge(
                      evt.eventType
                    )}`}
                  >
                    {evt.eventType}
                  </span>
                  {evt.riskLevel && (
                    <RiskBadge level={evt.riskLevel} />
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-xs sm:text-sm font-bold text-[#1E1B4B] mb-1">
                {evt.title}
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed mb-3">
                {evt.description}
              </p>

              {/* Entity Flow Banner */}
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-[#F5F6FA] border border-[#E2E8F0] text-xs">
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Entities:</span>
                <button
                  onClick={() => onSelectEntity(evt.sourceEntity)}
                  className="font-mono font-bold text-[#383278] hover:text-[#ED1B24] hover:underline cursor-pointer"
                >
                  {evt.sourceEntity}
                </button>

                {evt.targetEntity && (
                  <>
                    <ArrowRight className="w-3 h-3 text-[#64748B]" />
                    <button
                      onClick={() => onSelectEntity(evt.targetEntity!)}
                      className="font-mono font-bold text-[#383278] hover:text-[#ED1B24] hover:underline cursor-pointer"
                    >
                      {evt.targetEntity}
                    </button>
                  </>
                )}

                {evt.amount && (
                  <span className="ml-auto font-mono font-bold text-emerald-700 text-xs">
                    ₹{evt.amount.toLocaleString('en-IN')}
                  </span>
                )}

                {evt.duration && (
                  <span className="ml-auto font-mono text-[#64748B] text-xs font-medium">
                    {evt.duration}s call
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
