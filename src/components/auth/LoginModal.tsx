import React, { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (userId: string) => void;
  canDismiss?: boolean;
  onDismiss?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  canDismiss = false,
  onDismiss,
}) => {
  const [userId, setUserId] = useState('avnish');
  const [password, setPassword] = useState('agrawal');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedId = userId.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedId || !trimmedPass) {
      setError('Please provide both Investigator ID and Password');
      return;
    }

    if (trimmedId === 'avnish' && trimmedPass === 'agrawal') {
      setIsAuthenticating(true);
      setTimeout(() => {
        setIsAuthenticating(false);
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          onLoginSuccess('avnish');
        }, 500);
      }, 400);
    } else {
      setError('Incorrect ID or password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-mac-fade">
      <div className="bg-white border border-[#CBD5E1] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-mac-pop text-[#1E1B4B] relative">
        {/* Cyberdome Scarlet Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#ED1B24]" />

        {/* Modal Header */}
        <div className="px-6 pt-7 pb-4 border-b border-[#E2E8F0] bg-[#F8FAFC] text-center relative">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#1E1B4B] border-2 border-[#ED1B24] flex items-center justify-center text-white shadow-md mb-3">
            <Shield className="w-7 h-7 text-[#ED1B24]" />
          </div>
          <h2 className="text-base font-black text-[#1E1B4B] tracking-wider uppercase">
            TRACEGRID WORKSTATION
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Law Enforcement & Cyber Crime Intelligence Portal
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-[#ED1B24] text-xs flex items-start gap-2.5 animate-mac-fade">
              <AlertCircle className="w-4 h-4 text-[#ED1B24] shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-mac-fade">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">Access Granted. Initializing forensic environment...</span>
            </div>
          )}

          {/* User ID Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1E1B4B]">
              Investigator ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="Enter ID"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#1E1B4B] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#ED1B24] focus:ring-1 focus:ring-[#ED1B24] transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1E1B4B]">
              Security Passcode
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full pl-9 pr-10 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#1E1B4B] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#ED1B24] focus:ring-1 focus:ring-[#ED1B24] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#1E1B4B] cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isAuthenticating || isSuccess}
            className="w-full py-2.5 px-4 bg-[#ED1B24] hover:bg-[#D9141D] text-white rounded-lg text-xs font-bold transition-all shadow-[0_4px_14px_rgba(237,27,36,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isAuthenticating ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying Identity...</span>
              </span>
            ) : isSuccess ? (
              <span className="inline-flex items-center gap-1.5 text-white">
                <CheckCircle2 className="w-4 h-4" />
                <span>Authorized</span>
              </span>
            ) : (
              <>
                <span>Log In to Workstation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {canDismiss && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="w-full py-1.5 text-[11px] text-[#64748B] hover:text-[#1E1B4B] transition-colors cursor-pointer font-bold"
            >
              Cancel
            </button>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] text-[10px] text-[#64748B] text-center font-mono">
          Authorized personnel only. All access attempts cryptographically audited.
        </div>
      </div>
    </div>
  );
};
