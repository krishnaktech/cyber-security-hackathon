import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Network,
  Clock,
  Users,
  ShieldAlert,
  FileCheck,
  ShieldCheck,
  Settings,
  ArrowRightLeft,
} from 'lucide-react';

export type ScreenId =
  | 'overview'
  | 'evidence'
  | 'network'
  | 'timeline'
  | 'entities'
  | 'risk'
  | 'brief'
  | 'integrity'
  | 'settings';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  caseId?: string;
  caseStatus?: string;
  currentUser?: string;
  isAuthenticated?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  currentUser,
  isAuthenticated,
}) => {
  const navItem = (id: ScreenId, label: string, icon: React.ReactNode) => {
    const isActive = currentScreen === id;
    return (
      <button
        type="button"
        onClick={() => onNavigate(id)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left group cursor-pointer relative ${
          isActive
            ? 'bg-[#1E1B4B] text-white font-semibold shadow-xs'
            : 'text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#EEF2FF]/60 font-medium'
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#ED1B24] rounded-r-full" />
        )}
        <div className="flex items-center gap-2.5 min-w-0 pl-1">
          <span className={`shrink-0 transition-colors ${isActive ? 'text-[#ED1B24]' : 'text-[#64748B] group-hover:text-[#383278]'}`}>
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </div>
      </button>
    );
  };

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 select-none text-[#1E1B4B]">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1E1B4B] flex items-center justify-center text-white font-black text-xs tracking-wider shrink-0 shadow-xs border border-[#383278]">
            <span className="text-[#ED1B24] font-black">T</span>G
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-xs tracking-wider text-[#1E1B4B] leading-none">
              TRACEGRID
            </h1>
            <p className="text-[9px] text-[#383278] font-bold tracking-wider uppercase mt-1 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ED1B24] inline-block animate-pulse" />
              Cyber Risk Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* CASE SECTION */}
        <div>
          <div className="text-[10px] font-bold text-[#383278] uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
            <span>Case</span>
            <span className="w-4 h-0.5 bg-[#ED1B24]/40 rounded-full" />
          </div>
          <div className="space-y-1">
            {navItem('overview', 'Overview', <LayoutDashboard className="w-4 h-4" />)}
            {navItem('evidence', 'Ingested Data', <FileSpreadsheet className="w-4 h-4" />)}
            {navItem('network', 'Transaction Relationship Graph', <ArrowRightLeft className="w-4 h-4" />)}
            {navItem('timeline', 'Chronology', <Clock className="w-4 h-4" />)}
          </div>
        </div>

        {/* ANALYSIS SECTION */}
        <div>
          <div className="text-[10px] font-bold text-[#383278] uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
            <span>Analysis</span>
            <span className="w-4 h-0.5 bg-[#ED1B24]/40 rounded-full" />
          </div>
          <div className="space-y-1">
            {navItem('entities', 'Artifacts', <Users className="w-4 h-4" />)}
            {navItem('risk', 'Threat Indicators', <ShieldAlert className="w-4 h-4" />)}
            {navItem('brief', 'Case Summary', <FileCheck className="w-4 h-4" />)}
          </div>
        </div>

        {/* SYSTEM SECTION */}
        <div>
          <div className="text-[10px] font-bold text-[#383278] uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
            <span>System</span>
            <span className="w-4 h-0.5 bg-[#ED1B24]/40 rounded-full" />
          </div>
          <div className="space-y-1">
            {navItem('integrity', 'Evidence Integrity', <ShieldCheck className="w-4 h-4" />)}
            {navItem('settings', 'Settings', <Settings className="w-4 h-4" />)}
          </div>
        </div>
      </div>

      {/* Active Session Footer */}
      <div className="p-3.5 border-t border-[#E2E8F0] bg-white">
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#F5F6FA] hover:bg-[#EEF2FF] border border-[#E2E8F0] hover:border-[#383278]/40 transition-all text-left group cursor-pointer shadow-xs"
          title="Account & Session Settings"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#1E1B4B] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              AA
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-[#1E1B4B] truncate">
                {currentUser || 'avnish'}
              </span>
              <span className={`block text-[10px] font-medium flex items-center gap-1.5 ${isAuthenticated ? 'text-emerald-700' : 'text-[#64748B]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isAuthenticated ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-slate-400'}`} />
                {isAuthenticated ? 'Authorized' : 'Logged Out'}
              </span>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
};
