import { ForensicEntity, RiskLevel, RiskSignalItem } from '../types/forensic';

export interface ScoreBreakdown {
  score: number;
  level: RiskLevel;
  reasons: string[];
  signals: RiskSignalItem[];
  label: string; // "Risk / Triage Score"
}

export type RiskEvaluationContext = {
  hasSharedImei?: boolean;
  hasSharedImsi?: boolean;
  hasSharedIp?: boolean;
  hasRapidRouting?: boolean;
  hasMultipleIncoming?: boolean;
  hasMultipleOutgoing?: boolean;
  hasHighVelocity?: boolean;
  hasSimSwitch?: boolean;
  hasHeaderInconsistency?: boolean;
};

interface RiskRuleConfig {
  contextKey: keyof RiskEvaluationContext;
  rule: string;
  label: string;
  scoreDelta: number;
  reason: string;
  evidenceRef: string;
}

/** Declarative catalog of explainable forensic scoring rules */
const RISK_RULES: RiskRuleConfig[] = [
  {
    contextKey: 'hasSharedImei',
    rule: 'SHARED_IMEI',
    label: 'Shared IMEI',
    scoreDelta: 20,
    reason: 'Shared hardware identifier (IMEI) across distinct subscribers',
    evidenceRef: 'CDR / Device cross-correlation',
  },
  {
    contextKey: 'hasRapidRouting',
    rule: 'RAPID_ROUTING',
    label: 'Rapid transaction routing',
    scoreDelta: 20,
    reason: 'Rapid fund passthrough (< 5 minutes interval between hops)',
    evidenceRef: 'Banking ledger timestamp correlation',
  },
  {
    contextKey: 'hasSharedIp',
    rule: 'SHARED_IP',
    label: 'Shared gateway IP',
    scoreDelta: 15,
    reason: 'Concurrent data traffic routed via common gateway IP',
    evidenceRef: 'IPDR session logs',
  },
  {
    contextKey: 'hasSimSwitch',
    rule: 'PHONE_SWITCHING',
    label: 'Rapid SIM/phone switching',
    scoreDelta: 15,
    reason: 'SIM card switching detected on single hardware terminal',
    evidenceRef: 'CDR IMSI telemetry',
  },
  {
    contextKey: 'hasSharedImsi',
    rule: 'SHARED_IMSI',
    label: 'Shared IMSI',
    scoreDelta: 15,
    reason: 'Subscriber IMSI observed across multiple devices',
    evidenceRef: 'CDR log correlation',
  },
  {
    contextKey: 'hasMultipleIncoming',
    rule: 'MULTI_INCOMING',
    label: 'Multiple incoming accounts',
    scoreDelta: 10,
    reason: 'Multiple incoming mule deposit funnels',
    evidenceRef: 'Banking ledger records',
  },
  {
    contextKey: 'hasMultipleOutgoing',
    rule: 'MULTI_OUTGOING',
    label: 'Multiple outgoing accounts',
    scoreDelta: 10,
    reason: 'Multiple outgoing disbursement channels',
    evidenceRef: 'Banking ledger records',
  },
  {
    contextKey: 'hasHighVelocity',
    rule: 'HIGH_VELOCITY',
    label: 'High temporal velocity',
    scoreDelta: 10,
    reason: 'High transaction/call velocity in compressed timeframe',
    evidenceRef: 'Temporal correlation engine',
  },
  {
    contextKey: 'hasHeaderInconsistency',
    rule: 'HEADER_INCONSISTENCY',
    label: 'Header anomaly / deceptive lure',
    scoreDelta: 10,
    reason: 'Header / metadata inconsistency identified in digital artifact',
    evidenceRef: 'Email header analysis',
  },
];

/**
 * Calculates standardized risk category from numerical score.
 */
export function calculateRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

/**
 * Transparent rule-based forensic risk calculator.
 * Scores are calibrated between 0 and 100 based on observed evidentiary anomalies.
 */
export function evaluateEntityRisk(
  entity: Partial<ForensicEntity> & { id: string },
  _allEntities: ForensicEntity[] = [],
  context?: RiskEvaluationContext
): ScoreBreakdown {
  let score = 0;
  const reasons: string[] = [];
  const signals: RiskSignalItem[] = [];

  // 1. Incorporate pre-recorded signals already on the entity
  if (entity.signals?.length) {
    for (const sig of entity.signals) {
      score += sig.scoreDelta;
      reasons.push(sig.label);
      signals.push(sig);
    }
  }

  // 2. Evaluate contextual forensic rules against declarative table
  if (context) {
    for (const rule of RISK_RULES) {
      const isTriggered = context[rule.contextKey];
      const isAlreadyAdded = signals.some(s => s.rule === rule.rule);

      if (isTriggered && !isAlreadyAdded) {
        score += rule.scoreDelta;
        reasons.push(rule.reason);
        signals.push({
          id: `sig-${rule.rule.toLowerCase()}`,
          rule: rule.rule,
          label: rule.label,
          scoreDelta: rule.scoreDelta,
          evidenceRef: rule.evidenceRef,
        });
      }
    }
  }

  // 3. Keep victim role capped to avoid false positive escalation
  if (entity.role === 'Victim') {
    score = Math.min(score, 10);
  }

  // 4. Bound score strictly between 0 and 100
  const finalScore = Math.min(100, Math.max(0, entity.riskScore ?? score));

  return {
    score: finalScore,
    level: calculateRiskLevel(finalScore),
    reasons: reasons.length > 0 ? reasons : ['No immediate anomalies detected under current evidentiary threshold'],
    signals,
    label: 'Risk / Triage Score',
  };
}
