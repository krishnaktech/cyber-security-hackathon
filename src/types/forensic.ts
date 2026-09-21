export type EntityType =
  | 'PHONE'
  | 'IMEI'
  | 'IMSI'
  | 'UPI'
  | 'BANK_ACCOUNT'
  | 'IP'
  | 'MAC'
  | 'EMAIL'
  | 'TRANSACTION_ID'
  | 'DEVICE';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RelationshipType =
  | 'SHARED_IMEI'
  | 'SHARED_IMSI'
  | 'SHARED_IP'
  | 'SHARED_UPI'
  | 'SHARED_ACCOUNT'
  | 'FUNDS_TRANSFER'
  | 'CALL'
  | 'TEMPORAL_LINK'
  | 'USES'
  | 'ASSOCIATED_WITH';

export type EvidenceType = 'CDR' | 'Financial' | 'IPDR' | 'Device' | 'Chat' | 'Email';

export interface EvidenceReference {
  file: string;
  row?: number;
  column?: string;
  detail?: string;
  rawSnippet?: string;
}

export interface RiskSignalItem {
  id: string;
  rule: string;
  label: string;
  scoreDelta: number;
  evidenceRef: string;
  observedValue?: string;
}

export interface ForensicEntity {
  id: string; // normalized identifier e.g. "+919876543210", "mule1@upi"
  rawId: string;
  type: EntityType;
  label: string;
  role?: 'Victim' | 'Mule' | 'Cash-out' | 'Infrastructure' | 'Device';
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  status: 'Flagged for review' | 'Under observation' | 'Correlated' | 'Unverified';
  firstObserved: string;
  lastObserved: string;
  linkedEntityIds: string[];
  evidenceSources: EvidenceReference[];
  signals: RiskSignalItem[];
  metadata?: Record<string, string | number | boolean>;
}

export interface CorrelationLink {
  id: string;
  sourceEntityId: string;
  sourceLabel: string;
  sourceType: EntityType;
  targetEntityId: string;
  targetLabel: string;
  targetType: EntityType;
  relationship: RelationshipType;
  evidenceSource: string;
  evidenceRef: string;
  timestamp: string;
  confidence: number; // 0 - 100 percentage
  reason: string;
  metadata?: {
    amount?: number;
    duration?: number;
    protocol?: string;
    cellId?: string;
  };
}

export interface TimelineEvent {
  id: string;
  timestamp: string; // e.g. "10:01:12" or "2026-09-18T10:01:12"
  displayTime: string;
  eventType: 'CALL' | 'TRANSACTION' | 'IP_SESSION' | 'DEVICE_EVENT' | 'CHAT' | 'EMAIL';
  title: string;
  description: string;
  sourceEntity: string;
  targetEntity?: string;
  amount?: number;
  duration?: number;
  evidenceSource: string;
  evidenceRow: number;
  riskLevel?: RiskLevel;
  tags: string[];
}

export interface EvidenceFile {
  id: string;
  name: string;
  type: EvidenceType;
  recordCount: number;
  sha256: string;
  status: 'Parsed' | 'Verified' | 'Mismatch' | 'Error';
  importedAt: string;
  rawContent: string;
  parsedRows?: Record<string, any>[];
}

export interface CaseOverviewData {
  caseId: string;
  title: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'PENDING_REVIEW';
  createdDate: string;
  investigator: string;
  summary: string;
  kpis: {
    evidenceFiles: number;
    entities: number;
    correlations: number;
    transactions: number;
    riskSignals: number;
    highRiskEntities: number;
  };
  snapshot: {
    observedAmount: number;
    routingHops: number;
    shortestInterval: string;
    linkedPhones: number;
    sharedImeiCount: number;
    sharedIpCount: number;
  };
}

export interface PrioritySignal {
  id: string;
  level: RiskLevel;
  title: string;
  description: string;
  targetEntityId?: string;
  evidenceSource: string;
  evidenceRow?: number;
}

export interface FundFlowStep {
  step: number;
  fromAccount: string;
  fromLabel: string;
  toAccount: string;
  toLabel: string;
  amount: number;
  timestamp: string;
  txnId: string;
  evidenceSource: string;
  evidenceRow: number;
  intervalMinutes?: number;
}
