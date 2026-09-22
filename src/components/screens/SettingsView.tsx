import React from 'react';
import {
  Shield,
  User,
  LogOut,
  LogIn,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Laptop,
  Clock,
} from 'lucide-react';
import { ScreenId } from '../layout/Sidebar';

interface SettingsViewProps {
  isAuthenticated: boolean;
  currentUser: string;
  onOpenLogin: () => void;
  onLogout: () => void;
  onNavigate?: (screen: ScreenId) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isAuthenticated,
  currentUser,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto text-[#1E1B4B] animate-mac-fade">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ED1B24]/10 border border-[#ED1B24]/20 text-[10px] font-bold text-[#ED1B24] uppercase tracking-wider mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ED1B24] animate-pulse" />
          Investigator Administration
        </div>
        <h1 className="text-2xl font-black text-[#1E1B4B] tracking-tight">
          Workstation Settings
        </h1>
      </div>

      {/* Main Authentication & Session Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-[#E2E8F0]">
        {/* Card Header */}
        <div className="px-6 py-4 bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ED1B24]/10 border border-[#ED1B24]/20 flex items-center justify-center text-[#ED1B24]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#1E1B4B] tracking-wide uppercase">
                INVESTIGATOR SESSION & AUTHENTICATION
              </h2>
              <span className="text-[11px] text-[#64748B]">
                Chain of Custody Access Control
              </span>
            </div>
          </div>

          <div>
            {isAuthenticated ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 font-mono shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>AUTHENTICATED</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[11px] font-bold text-[#ED1B24] font-mono shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#ED1B24]" />
                <span>UNAUTHENTICATED</span>
              </span>
            )}
          </div>
        </div>

        {/* User Identity Details */}
        <div className="p-6 space-y-5">
          {isAuthenticated ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#1E1B4B] border-2 border-[#ED1B24] flex items-center justify-center text-white font-bold text-base shadow-sm font-mono">
                    AA
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1E1B4B] flex items-center gap-2">
                      <span>Avnish Agrawal</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ED1B24]/10 border border-[#ED1B24]/20 text-[#ED1B24] font-bold font-mono">
                        Lead Investigator
                      </span>
                    </h3>
                    <div className="text-xs text-[#64748B] font-mono mt-0.5">
                      Investigator ID: <strong className="text-[#ED1B24] font-bold">{currentUser || 'avnish'}</strong>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right text-[11px] font-mono text-[#64748B] space-y-0.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E2E8F0]">
                  <div className="flex items-center sm:justify-end gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>WS-DELHI-04 (#2043)</span>
                  </div>
                  <div className="flex items-center sm:justify-end gap-1.5 text-[#64748B]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Active Session</span>
                  </div>
                </div>
              </div>

              {/* Security Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-[#1E1B4B] block text-[11px]">Clearance Level 5</span>
                    <span className="text-[10px] text-[#64748B]">Full forensic audit & case docket access</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 text-[#383278] shrink-0" />
                  <div>
                    <span className="font-bold text-[#1E1B4B] block text-[11px]">FIPS 140-3 Compliance</span>
                    <span className="text-[10px] text-[#64748B]">Cryptographic audit logging enabled</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-5 rounded-xl bg-red-50 border border-red-200 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-[#ED1B24] mx-auto" />
              <h3 className="font-bold text-sm text-[#ED1B24]">No Active Investigator Session</h3>
              <p className="text-xs text-red-800 max-w-md mx-auto">
                Please log in with your authorized investigator credentials (ID: <code className="text-[#1E1B4B] font-bold">avnish</code>) to access forensic case operations.
              </p>
            </div>
          )}
        </div>

        {/* Action Controls: Login & Logout */}
        <div className="px-6 py-4 bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-3">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={onOpenLogin}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white hover:bg-[#F1F5F9] text-[#1E1B4B] border border-[#CBD5E1] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                title="Switch account or re-enter credentials"
              >
                <LogIn className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Switch User / Re-authenticate</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#ED1B24]/10 hover:bg-[#ED1B24]/20 border border-[#ED1B24]/30 text-[#ED1B24] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
                title="Log out of YUKTAM workstation"
              >
                <LogOut className="w-3.5 h-3.5 text-[#ED1B24]" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <button
                type="button"
                onClick={onOpenLogin}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#ED1B24] hover:bg-[#D9141D] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(237,27,36,0.3)] cursor-pointer active:scale-98"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In to Workstation</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
