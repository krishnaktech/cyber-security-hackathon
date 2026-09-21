export type RelationshipNodeType =
  | 'USER'
  | 'ACCOUNT'
  | 'TRANSACTION'
  | 'DEVICE'
  | 'IP'
  | 'BENEFICIARY'
  | 'BANK'
  | 'LOCATION';

export type RelationshipEdgeType =
  | 'OWNS'
  | 'INITIATES'
  | 'SENT_TO'
  | 'USED_DEVICE'
  | 'ORIGINATED_FROM'
  | 'ASSOCIATED_WITH'
  | 'SHARES_DEVICE'
  | 'SHARES_IP'
  | 'USES_BENEFICIARY'
  | 'RECEIVES_FROM';

export interface GraphNodeItem {
  id: string;
  label: string;
  nodeType: RelationshipNodeType;
  subType?: string;
  riskScore: number;
  degree: number;
  firstSeen: string;
  lastSeen: string;
  metadata: {
    accountNumber?: string;
    upiId?: string;
    amount?: number;
    bankName?: string;
    ipAddress?: string;
    deviceId?: string;
    deviceModel?: string;
    userName?: string;
    beneficiaryName?: string;
    locationName?: string;
    status?: string;
    isMule?: boolean;
    isVictim?: boolean;
    [key: string]: any;
  };
  recentActivity: Array<{
    time: string;
    action: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    detail?: string;
  }>;
  relevantTransactions: Array<{
    id: string;
    amount: number;
    time: string;
    status: string;
    sender: string;
    receiver: string;
  }>;
  riskIndicators: string[];
}

export interface GraphEdgeItem {
  id: string;
  source: string;
  target: string;
  relationship: RelationshipEdgeType;
  label: string;
  amount?: number;
  timestamp?: string;
  isSuspicious?: boolean;
  metadata?: Record<string, any>;
}

export interface RiskInsight {
  id: string;
  title: string;
  category:
    | 'DEVICE_SHARING'
    | 'IP_SHARING'
    | 'RAPID_TRANSFER'
    | 'COMMON_BENEFICIARY'
    | 'CIRCULAR_MOVEMENT'
    | 'DENSE_CLUSTER'
    | 'NEW_BENEFICIARY_SPIKE';
  severity: 'ANOMALY' | 'REQUIRES_INVESTIGATION' | 'POTENTIALLY_SUSPICIOUS';
  description: string;
  entityIds: string[];
  metrics: {
    accountsCount?: number;
    totalAmount?: number;
    timeWindowMinutes?: number;
    beneficiaryCount?: number;
    transactionsCount?: number;
  };
  recommendation: string;
}

export interface RelationshipRiskFactor {
  name: string;
  impact: number;
  description: string;
}

export interface RelationshipRiskScore {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RelationshipRiskFactor[];
}
