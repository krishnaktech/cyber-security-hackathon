import React from 'react';
import { Search, Sparkles, Shield } from 'lucide-react';
import { CaseOverviewData } from '../../types/forensic';

interface TopbarProps {
  caseOverview?: CaseOverviewData;
  backendOnline?: boolean;
  onOpenSearch: () => void;
  onOpenGoldenHour?: () => void;
  onOpenTraceAssist: () => void;
  onResetDemo?: () => void;
  onUpdateInvestigator?: (name: string) => void;
  onNavigate?: (screen: any) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenSearch,
  onOpenTraceAssist,
  onNavigate,
}) => {
  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-20 text-[#1E1B4B] relative shadow-xs">
      {/* Left: Brand / System Status */}
      <div className="flex-1 min-w-0 flex items-center justify-start">
        <button
          onClick={() => onNavigate?.('overview')}
          className="font-bold text-sm text-[#1E1B4B] tracking-tight flex items-center gap-2 hover:text-[#383278] transition-colors cursor-pointer shrink-0"
          title="Go to Case Overview Dashboard"
        >
          <div className="w-7 h-7 rounded-lg bg-[#1E1B4B] flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4 text-[#ED1B24]" />
          </div>
          <span className="font-extrabold tracking-wide text-xs sm:text-sm">TRACEGRID</span>
        </button>
      </div>

      {/* Middle: Centered Search Bar */}
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-3 sm:mx-6 flex items-center justify-center">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-[#F5F6FA] hover:bg-[#EEF2FF] border border-[#CBD5E1] hover:border-[#383278] rounded-lg text-xs text-[#64748B] hover:text-[#1E1B4B] transition-all group cursor-pointer shadow-xs"
          title="Search case entities (Ctrl+K or ⌘K)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#383278] transition-colors shrink-0" />
            <span className="truncate text-[#64748B] group-hover:text-[#1E1B4B]">Search transactions, accounts, devices...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#64748B] bg-white rounded border border-[#CBD5E1] shrink-0 ml-2 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Trace Assist */}
      <div className="flex-1 min-w-0 flex items-center justify-end">
        <button
          onClick={onOpenTraceAssist}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#ED1B24] hover:bg-[#D0151D] text-white rounded-lg text-xs font-semibold transition-all shadow-[0_4px_14px_rgba(237,27,36,0.35)] hover:shadow-[0_6px_20px_rgba(237,27,36,0.45)] cursor-pointer shrink-0 active:scale-95"
          title="Ask TRACE ASSIST evidence-grounded queries"
        >
          <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
          <span className="hidden sm:inline tracking-wide">Trace Assist</span>
        </button>
      </div>
    </header>
  );
};
