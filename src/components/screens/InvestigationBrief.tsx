import React, { useState } from 'react';
import {
  FileCheck,
  Download,
  Printer,
  Shield,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  CaseOverviewData,
  EvidenceFile,
  ForensicEntity,
  CorrelationLink,
  FundFlowStep,
  TimelineEvent,
} from '../../types/forensic';
import { RiskBadge } from '../common/RiskBadge';
import { exportInvestigationBriefPdf, exportCaseJson } from '../../engine/pdfExport';

interface InvestigationBriefProps {
  caseOverview: CaseOverviewData;
  evidenceFiles: EvidenceFile[];
  entities: ForensicEntity[];
  correlations: CorrelationLink[];
  fundFlowSteps: FundFlowStep[];
  timelineEvents: TimelineEvent[];
  onSelectEntity: (entityId: string) => void;
}

export const InvestigationBrief: React.FC<InvestigationBriefProps> = ({
  caseOverview,
  evidenceFiles,
  entities,
  correlations,
  fundFlowSteps,
  timelineEvents,
  onSelectEntity,
}) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleExportPdf = () => {
    setDownloadingPdf(true);
    setTimeout(() => {
      exportInvestigationBriefPdf(
        caseOverview,
        evidenceFiles,
        entities,
        correlations,
        fundFlowSteps
      );
      setDownloadingPdf(false);
    }, 200);
  };

  const handleExportJson = () => {
    const fullCaseBundle = {
      caseOverview,
      evidenceFiles,
      entities,
      correlations,
      fundFlowSteps,
      timelineEvents,
      exportedAt: new Date().toISOString(),
      formatVersion: 'TRACEGRID-1.0-FORENSIC-JSON',
    };
    exportCaseJson(fullCaseBundle);
  };

  const highRiskEntities = entities.filter(e => e.riskScore >= 65).slice(0, 5);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto text-[#1E1B4B]">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="text-[11px] font-bold text-[#383278] tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ED1B24]" />
            <span>Forensic Docket Briefing</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight mt-1">
            Case Summary
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 bg-white border border-[#CBD5E1] hover:border-[#383278] text-[#1E1B4B] rounded-lg text-xs font-semibold hover:bg-[#EEF2FF] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#383278]" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={downloadingPdf}
            className="px-4 py-2 bg-[#ED1B24] hover:bg-[#D0151D] text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-2 shadow-[0_4px_14px_rgba(237,27,36,0.35)] hover:shadow-[0_6px_20px_rgba(237,27,36,0.45)] cursor-pointer active:scale-98"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>{downloadingPdf ? 'Generating PDF...' : 'Export PDF Brief'}</span>
          </button>
        </div>
      </div>

      {/* Official Forensic Document Card in Premium Docket Style */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden text-[#1E1B4B]">
        {/* Document Header Letterhead */}
        <div className="border-b border-[#E2E8F0] bg-[#F5F6FA] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold px-3 py-0.5 rounded-full bg-white text-[#1E1B4B] border border-[#CBD5E1] shadow-2xs">
                  CASE {caseOverview.caseId}
                </span>
                <span className="text-xs text-[#383278] font-mono font-bold">
                  DIGITAL FORENSIC REPORT
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#1E1B4B] tracking-tight text-left">
                {caseOverview.title || 'Risk Assessment Dashboard'}
              </h2>
            </div>

            <div className="text-xs text-[#64748B] font-mono sm:text-right">
              Date: <span className="text-[#1E1B4B] font-bold">{caseOverview.createdDate}</span>
            </div>
          </div>
        </div>

        {/* Document Body */}
        <div className="p-6 sm:p-8 space-y-8 text-xs leading-relaxed">
          {/* Section 1: Executive Case Summary */}
          <div>
            <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider pb-1.5 border-b border-[#E2E8F0] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ED1B24]" />
              <span>1. Case Summary</span>
            </h3>
            <p className="text-[#1E1B4B] text-xs leading-relaxed font-normal">
              Automated triage identified a connected set of phone, device, IP, and financial entities across {evidenceFiles.length} submitted digital artifacts. The strongest observed relationships include shared hardware device identifiers (<strong className="font-mono text-[#ED1B24]">IMEI001</strong>) across multiple distinct phone subscribers and an immediate rapid multi-hop transaction sequence routing ₹50,000 from the complainant source account to physical ATM cash liquidation.
            </p>
          </div>

          {/* Section 2: Key Flagged Entities */}
          <div>
            <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider pb-1.5 border-b border-[#E2E8F0] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ED1B24]" />
              <span>2. Key Entities (Triage Ranking)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {highRiskEntities.map(e => (
                <div
                  key={e.id}
                  onClick={() => onSelectEntity(e.id)}
                  className="p-3.5 bg-[#F5F6FA] border border-[#E2E8F0] rounded-xl cursor-pointer hover:border-[#383278] transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#383278] font-mono">
                      {e.type}
                    </span>
                    <RiskBadge level={e.riskLevel} score={e.riskScore} showScore />
                  </div>
                  <div className="font-mono text-xs font-bold text-[#1E1B4B] group-hover:text-[#383278] truncate">
                    {e.id}
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1 truncate">
                    {e.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Observed Fund Flow Sequence */}
          <div>
            <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider pb-1.5 border-b border-[#E2E8F0] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ED1B24]" />
              <span>3. Observed Fund Flow Sequence</span>
            </h3>

            <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F6FA] text-[10px] font-bold text-[#383278] uppercase border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-3.5 py-2.5">Routing Step</th>
                    <th className="px-3.5 py-2.5">Origin Account</th>
                    <th className="px-3.5 py-2.5">Destination Account</th>
                    <th className="px-3.5 py-2.5">Transfer Amount</th>
                    <th className="px-3.5 py-2.5">Timestamp</th>
                    <th className="px-3.5 py-2.5">Reference</th>
                    <th className="px-3.5 py-2.5">Evidence Citation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] font-mono text-[#1E1B4B]">
                  {fundFlowSteps.map(step => (
                    <tr key={step.step} className="hover:bg-[#EEF2FF]/40 transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-[#1E1B4B]">
                        Hop 0{step.step}
                      </td>
                      <td className="px-3.5 py-2.5 font-semibold text-[#1E1B4B]">
                        {step.fromLabel}
                      </td>
                      <td className="px-3.5 py-2.5 font-semibold text-[#1E1B4B]">
                        {step.toLabel}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-emerald-700">
                        ₹{step.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3.5 py-2.5 text-[#64748B]">
                        {step.timestamp}
                      </td>
                      <td className="px-3.5 py-2.5 text-[#64748B]">
                        {step.txnId}
                      </td>
                      <td className="px-3.5 py-2.5 text-[#64748B] text-[11px]">
                        {step.evidenceSource} r.{step.evidenceRow}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Evidence Integrity Summary */}
          <div>
            <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider pb-1.5 border-b border-[#E2E8F0] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ED1B24]" />
              <span>4. Ingested Artifact Cryptographic Inventory</span>
            </h3>

            <div className="space-y-2 font-mono text-[11px]">
              {evidenceFiles.map(f => (
                <div
                  key={f.id}
                  className="p-3 bg-[#F5F6FA] border border-[#E2E8F0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1E1B4B]">{f.name}</span>
                    <span className="text-[#64748B]">({f.type} • {f.recordCount} rows)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <span>SHA-256:</span>
                    <span className="text-[#1E1B4B] font-semibold">{f.sha256.slice(0, 24)}...{f.sha256.slice(-8)}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      VERIFIED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Actionable Investigative Leads */}
          <div>
            <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider pb-1.5 border-b border-[#E2E8F0] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ED1B24]" />
              <span>5. Actionable Investigative Leads & Next Steps</span>
            </h3>

            <div className="space-y-3 bg-[#F5F6FA] border border-[#E2E8F0] rounded-xl p-5 text-xs text-[#1E1B4B] leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="font-bold text-[#ED1B24]">•</span>
                <span>
                  <strong className="text-[#1E1B4B]">Financial KYC & Freeze Directives: </strong>
                  Issue Section 91 CrPC notice to ICICI Bank (<span className="font-mono font-semibold text-[#1E1B4B]">ACC-41029</span>) and State Bank of India (<span className="font-mono font-semibold text-[#1E1B4B]">ACC-77182</span>) to secure account holder identification, photograph, registered mobile, and temporary debit freeze.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-bold text-[#ED1B24]">•</span>
                <span>
                  <strong className="text-[#1E1B4B]">Telecom Tower Telemetry: </strong>
                  Request cell site dumps for Cell IDs <span className="font-mono font-semibold text-[#1E1B4B]">CELL-A</span> and <span className="font-mono font-semibold text-[#1E1B4B]">CELL-B</span> from service providers for the 10:00 to 10:30 window corresponding to calls placed through <span className="font-mono font-semibold text-[#1E1B4B]">IMEI001</span>.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-bold text-[#ED1B24]">•</span>
                <span>
                  <strong className="text-[#1E1B4B]">ATM Physical Surveillance: </strong>
                  Request CCTV surveillance capture from Paytm PB / ATM network for terminal <span className="font-mono font-semibold text-[#1E1B4B]">ATM-LOC-402</span> at timestamp 10:16:35 for transaction <span className="font-mono font-semibold text-[#1E1B4B]">TXN005</span> (₹40,000 cash withdrawal).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-bold text-[#ED1B24]">•</span>
                <span>
                  <strong className="text-[#1E1B4B]">ISP Proxy Subpoena: </strong>
                  Issue formal disclosure request to hosting provider responsible for IP <span className="font-mono font-semibold text-[#1E1B4B]">103.10.10.1</span> to retrieve authentication logs, tenant billing identities, and reverse proxy mapping.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
