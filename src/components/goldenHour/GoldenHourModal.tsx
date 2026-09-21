import React, { useState, useEffect } from 'react';
import { X, Clock, Zap, Smartphone, Phone, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { MonoText } from '../common/MonoText';

interface GoldenHourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToNetwork: () => void;
  onNavigateToTimeline: () => void;
  onSelectEntity: (entityId: string) => void;
}

export const GoldenHourModal: React.FC<GoldenHourModalProps> = ({
  isOpen,
  onClose,
  onNavigateToNetwork,
  onNavigateToTimeline,
  onSelectEntity,
}) => {
  if (!isOpen) return null;

  // Live ticking forensic elapsed time simulation starting around 00:18:42
  const [secondsElapsed, setSecondsElapsed] = useState(18 * 60 + 42);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsedTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-mac-fade">
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-2xl w-full overflow-hidden animate-mac-pop text-[#1E1B4B]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#ED1B24]/10 text-[#ED1B24] border border-[#ED1B24]/20 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#ED1B24]/10 text-[#ED1B24] border border-[#ED1B24]/20">
                  Critical Response Protocol
                </span>
                <h2 className="text-base font-black text-[#1E1B4B] tracking-tight">
                  GOLDEN HOUR RAPID TRIAGE
                </h2>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Immediate preservation & intervention window for high-velocity cyber fraud routing.
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

        {/* Metrics Grid */}
        <div className="p-6 space-y-6 bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-[10px] font-bold text-[#ED1B24] uppercase block">Time Since Report</span>
              <span className="font-mono text-base font-bold text-[#ED1B24] block mt-0.5">
                {formatElapsedTime(secondsElapsed)}
              </span>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg shadow-xs">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block">Priority Signals</span>
              <span className="font-mono text-base font-bold text-[#ED1B24] block mt-0.5">
                5 High
              </span>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg shadow-xs">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block">Fastest Route</span>
              <span className="font-mono text-base font-bold text-[#1E1B4B] block mt-0.5">
                4 min
              </span>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg shadow-xs">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block">Linked Devices</span>
              <span className="font-mono text-base font-bold text-[#1E1B4B] block mt-0.5">
                2 Terminals
              </span>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg shadow-xs">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block">Linked Phones</span>
              <span className="font-mono text-base font-bold text-[#1E1B4B] block mt-0.5">
                3 Numbers
              </span>
            </div>
          </div>

          {/* Top 3 Actionable Investigative Leads */}
          <div>
            <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#ED1B24]" />
              Top 3 Immediate Preservation & Interception Leads
            </h3>

            <div className="space-y-3">
              {/* Lead 1 */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start gap-3.5 hover:border-[#ED1B24] transition-colors shadow-xs">
                <span className="w-6 h-6 rounded-md bg-[#1E1B4B] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  1
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#1E1B4B]">
                      Mule B Layer 2 Intercept:
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onSelectEntity('mule2@upi');
                      }}
                      className="font-mono text-xs text-[#ED1B24] font-bold hover:underline cursor-pointer"
                    >
                      mule2@upi / ACC-77182
                    </button>
                  </div>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                    Received ₹48,000 via TXN002 and transferred ₹45,000 onward within 161 seconds. Immediate Sec 91 CrPC account freeze request recommended to State Bank of India.
                  </p>
                </div>
              </div>

              {/* Lead 2 */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start gap-3.5 hover:border-[#ED1B24] transition-colors shadow-xs">
                <span className="w-6 h-6 rounded-md bg-[#1E1B4B] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  2
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#1E1B4B]">
                      Shared Hardware Identifier Anchor:
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onSelectEntity('IMEI001');
                      }}
                      className="font-mono text-xs text-[#ED1B24] font-bold hover:underline cursor-pointer"
                    >
                      IMEI001
                    </button>
                  </div>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                    Correlates caller +919876543210 and receiver +919123456789. Cellular tower dumps and telecom subscription records should be preserved through Section 91 notice.
                  </p>
                </div>
              </div>

              {/* Lead 3 */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start gap-3.5 hover:border-[#ED1B24] transition-colors shadow-xs">
                <span className="w-6 h-6 rounded-md bg-[#1E1B4B] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  3
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#1E1B4B]">
                      Co-Located Network Proxy Infrastructure:
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onSelectEntity('103.10.10.1');
                      }}
                      className="font-mono text-xs text-[#ED1B24] font-bold hover:underline cursor-pointer"
                    >
                      103.10.10.1
                    </button>
                  </div>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                    Host IP observed in phishing email header X-Originating-IP and concurrent IPDR sessions. Subpoena ISP for static lease records and upstream routing telemetry.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Quick Jumps */}
        <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                onClose();
                onNavigateToNetwork();
              }}
              className="text-xs font-bold text-[#ED1B24] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              Trace Funds on Graph <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigateToTimeline();
              }}
              className="text-xs font-bold text-[#475569] hover:text-[#1E1B4B] flex items-center gap-1.5 cursor-pointer"
            >
              Open Forensic Chronology <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-[#CBD5E1] text-[#1E1B4B] rounded-lg text-xs font-bold hover:bg-[#F1F5F9] transition-colors shadow-xs cursor-pointer"
          >
            Dismiss Golden Hour
          </button>
        </div>
      </div>
    </div>
  );
};
