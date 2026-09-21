import React from 'react';
import {
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Users,
  Clock,
  Layers,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import {
  CaseOverviewData,
  PrioritySignal,
  FundFlowStep,
  ForensicEntity,
} from '../../types/forensic';
import { RiskBadge } from '../common/RiskBadge';
import { MonoText } from '../common/MonoText';
import { HighRiskTransactionGraph } from '../dashboard/HighRiskTransactionGraph';

interface CaseOverviewProps {
  overview: CaseOverviewData;
  prioritySignals: PrioritySignal[];
  fundFlowSteps: FundFlowStep[];
  entities: ForensicEntity[];
  onSelectEntity: (entityId: string) => void;
  onNavigateToNetwork?: () => void;
  onNavigateToEvidence: () => void;
  onNavigateToTimeline: () => void;
  onNavigateToBrief?: () => void;
  onNavigateToEntities?: () => void;
  onNavigateToRisk?: () => void;
}

export const CaseOverview: React.FC<CaseOverviewProps> = ({
  overview,
  prioritySignals,
  fundFlowSteps,
  entities,
  onSelectEntity,
  onNavigateToNetwork,
  onNavigateToEvidence,
  onNavigateToTimeline,
  onNavigateToBrief,
  onNavigateToEntities,
  onNavigateToRisk,
}) => {
  return (
    <div className="p-5 sm:p-8 space-y-6 max-w-7xl mx-auto text-[#1E1B4B]">
      {/* Editorial Financial Header */}
      <div className="border-b border-[#E2E8F0] pb-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold text-[#383278] tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ED1B24]" />
              <span>Transaction Intelligence</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight mt-1">
              Case {overview.caseId}: Asset Routing & Correlation
            </h1>
          </div>
          <div className="text-xs text-[#4A4A6A] flex items-center gap-1.5 font-medium">
            <span>{overview.createdDate || '21 September 2026'}</span>
            <span>•</span>
            <span>Status:</span>
            <span className="font-bold text-[#1E1B4B] bg-[#EEF2FF] text-[#383278] px-2 py-0.5 rounded-full border border-[#C7D2FE]">
              {overview.status}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time High-Risk Transaction Velocity Graph */}
      <HighRiskTransactionGraph
        fundFlowSteps={fundFlowSteps}
        onInspectEntity={onSelectEntity}
      />

      {/* KPI Dashboard Row: 5 interactive cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Evidence Files */}
        <button
          onClick={onNavigateToEvidence}
          className="bg-white border border-[#E2E8F0] hover:border-[#383278] rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md text-left transition-all duration-150 group cursor-pointer"
          title="Click to inspect ingested evidence files & artifacts"
        >
          <div className="flex items-center justify-between text-[#64748B] text-xs mb-1.5">
            <span className="group-hover:text-[#1E1B4B] transition-colors font-semibold">Ingested Data</span>
            <div className="w-6 h-6 rounded-md bg-[#EEF2FF] flex items-center justify-center group-hover:bg-[#383278] transition-colors">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#383278] group-hover:text-white transition-colors" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1E1B4B] font-mono">
            {overview.kpis.evidenceFiles}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1.5 flex items-center justify-between font-medium">
            <span>6 ingested artifacts</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#ED1B24]" />
          </div>
        </button>

        {/* Card 2: Entities */}
        <button
          onClick={onNavigateToEntities || onNavigateToEvidence}
          className="bg-white border border-[#E2E8F0] hover:border-[#383278] rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md text-left transition-all duration-150 group cursor-pointer"
          title="Click to view extracted entity registry"
        >
          <div className="flex items-center justify-between text-[#64748B] text-xs mb-1.5">
            <span className="group-hover:text-[#1E1B4B] transition-colors font-semibold">Artifacts</span>
            <div className="w-6 h-6 rounded-md bg-[#EEF2FF] flex items-center justify-center group-hover:bg-[#383278] transition-colors">
              <Users className="w-3.5 h-3.5 text-[#383278] group-hover:text-white transition-colors" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1E1B4B] font-mono">
            {overview.kpis.entities}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1.5 flex items-center justify-between font-medium">
            <span>10 entity types</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#ED1B24]" />
          </div>
        </button>

        {/* Card 3: Transactions */}
        <button
          onClick={onNavigateToTimeline}
          className="bg-white border border-[#E2E8F0] hover:border-[#383278] rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md text-left transition-all duration-150 group cursor-pointer"
          title="Click to reconstruct chronological transaction timeline"
        >
          <div className="flex items-center justify-between text-[#64748B] text-xs mb-1.5">
            <span className="group-hover:text-[#1E1B4B] transition-colors font-semibold">Transactions</span>
            <div className="w-6 h-6 rounded-md bg-[#EEF2FF] flex items-center justify-center group-hover:bg-[#383278] transition-colors">
              <TrendingUp className="w-3.5 h-3.5 text-[#383278] group-hover:text-white transition-colors" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1E1B4B] font-mono">
            {overview.kpis.transactions}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1.5 flex items-center justify-between font-medium">
            <span>Total observed events</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#ED1B24]" />
          </div>
        </button>

        {/* Card 5: Threat Indicators */}
        <button
          onClick={onNavigateToRisk || onNavigateToNetwork}
          className="bg-white border border-[#E2E8F0] hover:border-[#D97706] rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md text-left transition-all duration-150 group cursor-pointer"
          title="Click to view risk signals & anomaly scoring catalog"
        >
          <div className="flex items-center justify-between text-[#64748B] text-xs mb-1.5">
            <span className="group-hover:text-[#B45309] transition-colors font-semibold">Threat Indicators</span>
            <div className="w-6 h-6 rounded-md bg-[#FFFBEB] flex items-center justify-center group-hover:bg-[#D97706] transition-colors">
              <ShieldAlert className="w-3.5 h-3.5 text-[#D97706] group-hover:text-white transition-colors" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#B45309] font-mono">
            {overview.kpis.riskSignals}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1.5 flex items-center justify-between font-medium">
            <span>Active anomalies</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#D97706]" />
          </div>
        </button>

        {/* Card 6: High-Risk Entities */}
        <button
          onClick={onNavigateToRisk || onNavigateToNetwork}
          className="bg-white border border-[#E2E8F0] hover:border-[#ED1B24] rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md text-left transition-all duration-150 group cursor-pointer"
          title="Click to triage high-risk entities (Score ≥ 60/100)"
        >
          <div className="flex items-center justify-between text-[#64748B] text-xs mb-1.5">
            <span className="group-hover:text-[#ED1B24] transition-colors font-semibold">High-Risk Entities</span>
            <div className="w-6 h-6 rounded-md bg-[#FFF1F2] flex items-center justify-center group-hover:bg-[#ED1B24] transition-colors">
              <ShieldAlert className="w-3.5 h-3.5 text-[#ED1B24] group-hover:text-white transition-colors" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#ED1B24] font-mono">
            {overview.kpis.highRiskEntities}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1.5 flex items-center justify-between font-medium">
            <span>Score &ge; 60/100</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#ED1B24]" />
          </div>
        </button>
      </div>

      {/* Two Major Sections: Investigation Snapshot (Left) + Priority Signals (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Investigation Snapshot */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-extrabold text-[#1E1B4B] uppercase tracking-wider">
                  Investigation Snapshot
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Visual fund routing chain and observed forensic metrics
                </p>
              </div>
              <button
                onClick={onNavigateToNetwork}
                className="text-xs font-bold text-[#ED1B24] hover:text-[#D0151D] flex items-center gap-1 cursor-pointer transition-colors"
              >
                Inspect on Graph <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fund Flow Chain Visual */}
            <div className="bg-[#F5F6FA] border border-[#E2E8F0] rounded-xl p-4 mb-5">
              <div className="text-[10px] font-bold uppercase text-[#383278] tracking-wider mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ED1B24]" />
                <span>Identified Fund Dispersal Funnel</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-center">
                {/* Victim */}
                <button
                  onClick={() => onSelectEntity('victim@okhdfc')}
                  className="p-3 bg-white border border-[#CBD5E1] hover:border-[#383278] rounded-lg text-left sm:text-center transition-all cursor-pointer group shadow-2xs"
                  title="Inspect Victim Account in Forensic Inspector"
                >
                  <span className="text-[10px] font-bold text-[#64748B] group-hover:text-[#383278] block uppercase transition-colors">Source</span>
                  <span className="font-bold text-xs text-[#1E1B4B] block truncate">Victim Account</span>
                  <span className="font-mono text-[11px] text-[#64748B] block">victim@okhdfc</span>
                </button>

                {/* Arrow 1 */}
                <div className="flex flex-col items-center py-1 sm:py-0">
                  <span className="font-mono font-bold text-[11px] text-emerald-700">
                    ₹50,000
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#64748B] rotate-90 sm:rotate-0" />
                  <span className="text-[10px] text-[#64748B] font-mono">10:05</span>
                </div>

                {/* Mule A */}
                <button
                  onClick={() => onSelectEntity('mule1@upi')}
                  className="p-3 bg-white border border-[#FDE68A] hover:border-[#D97706] rounded-lg text-left sm:text-center transition-all cursor-pointer group shadow-2xs"
                  title="Inspect Mule A in Forensic Inspector"
                >
                  <span className="text-[10px] font-bold text-[#B45309] block uppercase">Hop 1</span>
                  <span className="font-bold text-xs text-[#1E1B4B] block truncate">Mule A (ICICI)</span>
                  <span className="font-mono text-[11px] text-[#B45309] block">mule1@upi</span>
                </button>

                {/* Arrow 2 */}
                <div className="flex flex-col items-center py-1 sm:py-0">
                  <span className="font-mono font-bold text-[11px] text-[#B45309]">
                    ₹48,000
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#64748B] rotate-90 sm:rotate-0" />
                  <span className="text-[10px] text-[#64748B] font-mono">10:07 (+102s)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-center mt-3 pt-3 border-t border-[#E2E8F0]">
                {/* Mule B */}
                <button
                  onClick={() => onSelectEntity('mule2@upi')}
                  className="p-3 bg-white border border-[#FECDD3] hover:border-[#ED1B24] rounded-lg text-left sm:text-center transition-all cursor-pointer group shadow-2xs"
                  title="Inspect Mule B in Forensic Inspector"
                >
                  <span className="text-[10px] font-bold text-[#ED1B24] block uppercase">Hop 2</span>
                  <span className="font-bold text-xs text-[#1E1B4B] block truncate">Mule B (SBI)</span>
                  <span className="font-mono text-[11px] text-[#ED1B24] block">mule2@upi</span>
                </button>

                {/* Arrow 3 */}
                <div className="flex flex-col items-center py-1 sm:py-0">
                  <span className="font-mono font-bold text-[11px] text-[#ED1B24]">
                    ₹45,000
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#64748B] rotate-90 sm:rotate-0" />
                  <span className="text-[10px] text-[#64748B] font-mono">10:09 (+161s)</span>
                </div>

                {/* Cash-out */}
                <button
                  onClick={() => onSelectEntity('cashout@paytm')}
                  className="p-3 bg-white border border-[#CBD5E1] hover:border-[#383278] rounded-lg text-left sm:text-center transition-all cursor-pointer group shadow-2xs"
                  title="Inspect Cash-out Terminal in Forensic Inspector"
                >
                  <span className="text-[10px] font-bold text-[#64748B] group-hover:text-[#383278] block uppercase transition-colors">Terminal</span>
                  <span className="font-bold text-xs text-[#1E1B4B] block truncate">Cash-out C</span>
                  <span className="font-mono text-[11px] text-[#64748B] block">cashout@paytm</span>
                </button>

                {/* Arrow 4 */}
                <div className="flex flex-col items-center py-1 sm:py-0">
                  <span className="font-mono font-bold text-[11px] text-[#1E1B4B]">
                    ₹40,000
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#64748B] rotate-90 sm:rotate-0" />
                  <span className="text-[10px] text-[#64748B] font-mono">ATM Terminal</span>
                </div>
              </div>
            </div>

            {/* Dynamic Metric Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-[#F5F6FA] border border-[#E2E8F0] rounded-lg">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Observed Amount</span>
                <span className="font-mono text-sm font-black text-[#1E1B4B]">
                  ₹{overview.snapshot.observedAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <button
                onClick={onNavigateToNetwork}
                className="p-3 bg-[#F5F6FA] border border-[#E2E8F0] hover:border-[#383278] rounded-lg text-left transition-all cursor-pointer group shadow-2xs"
                title="View fund routing on graph"
              >
                <span className="text-[10px] font-bold text-[#64748B] group-hover:text-[#383278] uppercase block transition-colors">Routing Hops</span>
                <span className="font-mono text-sm font-bold text-[#1E1B4B] flex items-center justify-between">
                  <span>{overview.snapshot.routingHops} hops</span>
                  <span className="text-[#ED1B24]">→</span>
                </span>
              </button>
              <button
                onClick={onNavigateToTimeline}
                className="p-3 bg-[#F5F6FA] border border-[#E2E8F0] hover:border-[#ED1B24] rounded-lg text-left transition-all cursor-pointer group shadow-2xs"
                title="View event timeline"
              >
                <span className="text-[10px] font-bold text-[#64748B] group-hover:text-[#ED1B24] uppercase block transition-colors">Shortest Interval</span>
                <span className="font-mono text-sm font-bold text-[#ED1B24] flex items-center justify-between">
                  <span>{overview.snapshot.shortestInterval}</span>
                  <span>→</span>
                </span>
              </button>
              <button
                onClick={onNavigateToEntities || onNavigateToEvidence}
                className="p-3 bg-[#F5F6FA] border border-[#E2E8F0] hover:border-[#383278] rounded-lg text-left transition-all cursor-pointer group shadow-2xs"
                title="View linked phone numbers"
              >
                <span className="text-[10px] font-bold text-[#64748B] group-hover:text-[#383278] uppercase block transition-colors">Linked Phone Numbers</span>
                <span className="font-mono text-sm font-bold text-[#1E1B4B] flex items-center justify-between">
                  <span>{overview.snapshot.linkedPhones} numbers</span>
                  <span className="text-[#383278]">→</span>
                </span>
              </button>
              <button
                onClick={() => onSelectEntity('IMEI001')}
                className="p-3 bg-[#F5F6FA] border border-[#E2E8F0] hover:border-[#B45309] rounded-lg text-left transition-all cursor-pointer group shadow-2xs"
                title="Inspect hardware anchor IMEI001"
              >
                <span className="text-[10px] font-bold text-[#64748B] group-hover:text-[#B45309] uppercase block transition-colors">Shared IMEI</span>
                <span className="font-mono text-sm font-bold text-[#B45309] flex items-center justify-between">
                  <span>{overview.snapshot.sharedImeiCount} anchor</span>
                  <span>→</span>
                </span>
              </button>
              <button
                onClick={() => onSelectEntity('103.10.10.1')}
                className="p-3 bg-[#F5F6FA] border border-[#E2E8F0] hover:border-[#383278] rounded-lg text-left transition-all cursor-pointer group shadow-2xs"
                title="Inspect gateway IP 103.10.10.1"
              >
                <span className="text-[10px] font-bold text-[#64748B] group-hover:text-[#383278] uppercase block transition-colors">Shared IP</span>
                <span className="font-mono text-sm font-bold text-[#1E1B4B] flex items-center justify-between">
                  <span>{overview.snapshot.sharedIpCount} gateways</span>
                  <span className="text-[#383278]">→</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Priority Signals */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-extrabold text-[#1E1B4B] uppercase tracking-wider">
                  Priority Signals
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Key evidentiary anomalies requiring investigator verification
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#ED1B24] bg-[#FFF1F2] px-2.5 py-0.5 rounded-full border border-[#FECDD3]">
                {prioritySignals.length} Flagged
              </span>
            </div>

            <div className="space-y-2.5">
              {prioritySignals.map(sig => (
                <button
                  key={sig.id}
                  onClick={() => {
                    if (sig.targetEntityId) {
                      onSelectEntity(sig.targetEntityId);
                    }
                  }}
                  className="w-full text-left p-3.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#EEF2FF]/40 hover:border-[#383278] transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <RiskBadge level={sig.level} />
                    <span className="font-mono text-[10.5px] text-[#64748B] flex items-center gap-1 font-medium">
                      {sig.evidenceSource}
                      {sig.evidenceRow ? ` • r.${sig.evidenceRow}` : ''}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-[#1E1B4B] group-hover:text-[#383278] transition-colors">
                    {sig.title}
                  </h4>

                  <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                    {sig.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span>Click any signal to inspect linked entity</span>
            <button
              onClick={onNavigateToTimeline}
              className="text-[#ED1B24] hover:text-[#D0151D] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              Forensic Chronology <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
