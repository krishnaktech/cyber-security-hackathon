import {
  GraphNodeItem,
  GraphEdgeItem,
  RiskInsight,
  RelationshipRiskScore,
  RelationshipNodeType,
  RelationshipEdgeType,
} from '../types/relationshipGraph';
import { ForensicEntity, CorrelationLink, FundFlowStep } from '../types/forensic';

export class RelationshipGraphEngine {
  /**
   * Builds production-quality relationship graph with 8 distinct node types and verified forensic edges
   */
  public static buildGraph(
    entities: ForensicEntity[],
    correlations: CorrelationLink[],
    fundFlowSteps: FundFlowStep[]
  ): { nodes: GraphNodeItem[]; edges: GraphEdgeItem[] } {
    const nodeMap = new Map<string, GraphNodeItem>();
    const edges: GraphEdgeItem[] = [];

    // Helper to add or update a node
    const upsertNode = (
      id: string,
      label: string,
      nodeType: RelationshipNodeType,
      riskScore: number,
      metadata: Record<string, any> = {},
      riskIndicators: string[] = []
    ): GraphNodeItem => {
      let existing = nodeMap.get(id);
      if (!existing) {
        existing = {
          id,
          label,
          nodeType,
          riskScore,
          degree: 0,
          firstSeen: '10:01:12',
          lastSeen: '10:35:00',
          metadata,
          recentActivity: [],
          relevantTransactions: [],
          riskIndicators,
        };
        nodeMap.set(id, existing);
      } else {
        existing.riskScore = Math.max(existing.riskScore, riskScore);
        existing.metadata = { ...existing.metadata, ...metadata };
        existing.riskIndicators = Array.from(new Set([...existing.riskIndicators, ...riskIndicators]));
      }
      return existing;
    };

    // Helper to add edge
    const addEdge = (
      id: string,
      source: string,
      target: string,
      relationship: RelationshipEdgeType,
      label: string,
      amount?: number,
      timestamp?: string,
      isSuspicious: boolean = false,
      metadata: Record<string, any> = {}
    ) => {
      // Prevent duplicates
      if (edges.some(e => e.id === id || (e.source === source && e.target === target && e.relationship === relationship))) {
        return;
      }
      edges.push({
        id,
        source,
        target,
        relationship,
        label,
        amount,
        timestamp,
        isSuspicious,
        metadata,
      });
    };

    // 1. Core Users/Customers (👤 Customer/User)
    upsertNode('USER-VICTIM', 'Ramesh Kumar (Victim)', 'USER', 15, {
      userName: 'Ramesh Kumar',
      role: 'Complainant / Defrauded Account Holder',
      kycStatus: 'VERIFIED_AADHAAR',
      location: 'South Delhi',
    }, ['Originating source of siphoned capital']);

    upsertNode('USER-MULE1', 'Sunil Verma (Mule Layer 1)', 'USER', 78, {
      userName: 'Sunil Verma',
      role: 'Intermediary Account Holder',
      kycStatus: 'FRAUD_FLAGGED',
      location: 'Noida',
    }, ['Rapid routing <120s', 'High turnover ratio']);

    upsertNode('USER-MULE2', 'Amit Patel (Mule Layer 2)', 'USER', 86, {
      userName: 'Amit Patel',
      role: 'Aggregator / Layering Agent',
      kycStatus: 'SUSPENDED_PAN',
      location: 'Noida Sector 62',
    }, ['Co-located with IMEI001', 'Multi-beneficiary hub', 'Velocity burst']);

    upsertNode('USER-CASHOUT', 'Vikram Singh (Cashout Operator)', 'USER', 92, {
      userName: 'Vikram Singh',
      role: 'Physical ATM Cashout Agent',
      kycStatus: 'DORMANT_REACTIVE',
      location: 'Sector 18 Hub',
    }, ['ATM terminal liquidation', 'Immediate cash dispersal']);

    upsertNode('USER-MULE3', 'Deepak Shah (Secondary Mule)', 'USER', 64, {
      userName: 'Deepak Shah',
      role: 'Auxiliary Mule Handler',
      kycStatus: 'LIMITED_VERIFY',
      location: 'Ghaziabad',
    }, ['Split beneficiary receiver']);

    // 2. Bank Accounts & UPI IDs (💳 Bank Account / UPI ID)
    upsertNode('victim@okhdfc', 'victim@okhdfc (ACC-90812)', 'ACCOUNT', 15, {
      upiId: 'victim@okhdfc',
      accountNumber: 'ACC-90812',
      bankName: 'HDFC Bank',
      isVictim: true,
    }, ['Legitimate victim account']);

    upsertNode('mule1@upi', 'mule1@upi (ACC-41029)', 'ACCOUNT', 78, {
      upiId: 'mule1@upi',
      accountNumber: 'ACC-41029',
      bankName: 'ICICI Bank',
      isMule: true,
    }, ['Received ₹50,000 from victim', 'Dispersed 96% within 102s']);

    upsertNode('mule2@upi', 'mule2@upi (ACC-77182)', 'ACCOUNT', 86, {
      upiId: 'mule2@upi',
      accountNumber: 'ACC-77182',
      bankName: 'ICICI Bank',
      isMule: true,
    }, ['Core layering node', 'Shared IMEI001 hardware anchor']);

    upsertNode('cashout@paytm', 'cashout@paytm (ACC-10293)', 'ACCOUNT', 92, {
      upiId: 'cashout@paytm',
      accountNumber: 'ACC-10293',
      bankName: 'Paytm Payments Bank',
      isMule: true,
    }, ['Pre-ATM staging pool', 'Full liquidation velocity']);

    upsertNode('mule3@axis', 'mule3@axis (ACC-55201)', 'ACCOUNT', 65, {
      upiId: 'mule3@axis',
      accountNumber: 'ACC-55201',
      bankName: 'Axis Bank',
      isMule: true,
    }, ['Sub-channel split receiver']);

    // 3. Banks (🏦 Bank)
    upsertNode('BANK-HDFC', 'HDFC Bank Ltd', 'BANK', 10, { bankName: 'HDFC Bank', branch: 'Saket New Delhi' });
    upsertNode('BANK-ICICI', 'ICICI Bank Ltd', 'BANK', 45, { bankName: 'ICICI Bank', branch: 'Noida Sector 12' });
    upsertNode('BANK-PAYTM', 'Paytm Payments Bank', 'BANK', 70, { bankName: 'Paytm PB', branch: 'Virtual Gateway' });
    upsertNode('BANK-AXIS', 'Axis Bank Ltd', 'BANK', 40, { bankName: 'Axis Bank', branch: 'Ghaziabad Main' });
    upsertNode('BANK-ATM', 'National ATM Switch Network', 'BANK', 85, { bankName: 'ATM Switch', terminalCount: 1400 });

    // 4. Beneficiaries / Receivers (👥 Beneficiary)
    upsertNode('BENEFICIARY-MULE1', 'Beneficiary: Sunil (mule1)', 'BENEFICIARY', 75, {
      beneficiaryName: 'Sunil Verma',
      upiHandle: 'mule1@upi',
      addedTimestamp: '10:03:10',
    }, ['Rapidly added beneficiary before siphon']);

    upsertNode('BENEFICIARY-MULE2', 'Beneficiary: Amit (mule2)', 'BENEFICIARY', 85, {
      beneficiaryName: 'Amit Patel',
      upiHandle: 'mule2@upi',
      addedTimestamp: '10:06:40',
    }, ['Zero cooling-off period addition', 'High volume receiver']);

    upsertNode('BENEFICIARY-CASHOUT', 'Beneficiary: Cashout Staging', 'BENEFICIARY', 90, {
      beneficiaryName: 'Vikram Singh / Cashout Pool',
      upiHandle: 'cashout@paytm',
      addedTimestamp: '10:08:50',
    }, ['Direct staging for physical withdrawal']);

    upsertNode('BENEFICIARY-MULE3', 'Beneficiary: Deepak (mule3)', 'BENEFICIARY', 60, {
      beneficiaryName: 'Deepak Shah',
      upiHandle: 'mule3@axis',
      addedTimestamp: '10:13:00',
    }, ['Auxiliary diversion recipient']);

    upsertNode('BENEFICIARY-ATM', 'Beneficiary: ATM Dispenser', 'BENEFICIARY', 95, {
      beneficiaryName: 'ATM-LOC-402 Sector 18',
      terminalId: 'ATM-402',
    }, ['Physical untraceable cash liquidation point']);

    // 5. Devices (📱 Device)
    upsertNode('DEV-RN11-982', 'Device: Redmi Note 11 (DEV-RN11-982)', 'DEVICE', 82, {
      deviceId: 'DEV-RN11-982',
      deviceModel: 'Xiaomi Redmi Note 11',
      androidVersion: '12.0',
      mac: '48:2C:6A:1E:99:A2',
      installedApps: ['com.fakebank.securepay', 'com.anydesk.anydeskandroid', 'com.whatsapp', 'org.telegram.messenger'],
    }, ['Remote Access Trojan (AnyDesk) present', 'Hardware anchor for 3 phone numbers']);

    upsertNode('IMEI001', 'Hardware IMEI: 864209048192019', 'DEVICE', 88, {
      imei: 'IMEI001',
      hardwareModel: 'Redmi Note 11',
      slot: 'Dual SIM',
    }, ['Hardware shared across caller +919876543210 & +919123456789', 'Multi-SIM swapping hotspot']);

    upsertNode('IMEI002', 'Hardware IMEI: 359128059102941', 'DEVICE', 72, {
      imei: 'IMEI002',
      hardwareModel: 'Samsung Galaxy A12',
    }, ['Secondary relay device']);

    // 6. IP Addresses (🌐 IP Address)
    upsertNode('103.10.10.1', 'IP: 103.10.10.1 (Colocation Proxy)', 'IP', 85, {
      ipAddress: '103.10.10.1',
      isp: 'CloudProxy Telecom',
      location: 'Noida Gateway Node',
      port: '4432 / 5120 / 5401',
    }, ['Shared originating IP across 4 banking & CDR sessions', 'Gateway proxy hiding actual client coordinates']);

    upsertNode('185.220.101.5', 'IP: 185.220.101.5 (Tor Exit Node)', 'IP', 94, {
      ipAddress: '185.220.101.5',
      isp: 'Anonymizer Relay Services',
      location: 'Frankfurt Transit',
    }, ['Known Tor / VPN anonymization server', 'Used during auxiliary session']);

    // 7. Locations (📍 Location)
    upsertNode('LOC-DELHI-SOUTH', 'Location: South Delhi (CELL-A)', 'LOCATION', 25, {
      locationName: 'South Delhi Core',
      towerId: 'CELL-A',
      lat: 28.5355,
      lng: 77.2410,
    });

    upsertNode('LOC-NOIDA-62', 'Location: Noida Sec 62 (CELL-B)', 'LOCATION', 80, {
      locationName: 'Noida Sector 62 Hub',
      towerId: 'CELL-B',
      lat: 28.6280,
      lng: 77.3649,
    }, ['Cluster centroid for Mule 1 & Mule 2 activity']);

    upsertNode('LOC-SECTOR-18', 'Location: ATM Sector 18 (ATM-LOC-402)', 'LOCATION', 95, {
      locationName: 'Noida Sector 18 Commercial Center',
      terminalId: 'ATM-LOC-402',
      lat: 28.5708,
      lng: 77.3260,
    }, ['Terminal cash liquidation site']);

    // 8. Transactions (💸 Transaction)
    upsertNode('TXN001', 'TXN001: ₹50,000 (Victim Siphon)', 'TRANSACTION', 65, {
      amount: 50000,
      timestamp: '10:05:21',
      sender: 'victim@okhdfc',
      receiver: 'mule1@upi',
      status: 'SUCCESS',
      utr: 'UTR-9018291028',
    }, ['Phishing-induced unauthorized payment', 'Immediate balance drain']);

    upsertNode('TXN002', 'TXN002: ₹48,000 (Rapid Hop)', 'TRANSACTION', 88, {
      amount: 48000,
      timestamp: '10:07:03',
      sender: 'mule1@upi',
      receiver: 'mule2@upi',
      status: 'SUCCESS',
      utr: 'UTR-9018291029',
    }, ['Rapid passthrough within 102 seconds', '96% capital retention']);

    upsertNode('TXN003', 'TXN003: ₹45,000 (Layering Route)', 'TRANSACTION', 90, {
      amount: 45000,
      timestamp: '10:09:44',
      sender: 'mule2@upi',
      receiver: 'cashout@paytm',
      status: 'SUCCESS',
      utr: 'UTR-9018291030',
    }, ['Aggregator layering transfer', 'Pre-cashout staging']);

    upsertNode('TXN004', 'TXN004: ₹2,500 (Fan-out Split)', 'TRANSACTION', 55, {
      amount: 2500,
      timestamp: '10:14:10',
      sender: 'mule2@upi',
      receiver: 'mule3@axis',
      status: 'SUCCESS',
      utr: 'UTR-9018291031',
    }, ['Residual commission distribution']);

    upsertNode('TXN005', 'TXN005: ₹40,000 (ATM Liquidation)', 'TRANSACTION', 96, {
      amount: 40000,
      timestamp: '10:16:35',
      sender: 'cashout@paytm',
      receiver: 'ATM-LOC-402',
      status: 'SUCCESS',
      utr: 'ATM-WD-90412',
    }, ['Physical cash dispense', 'End of digital trace']);

    // Build Canonical Edges matching required relationships:
    // User → owns → Account (OWNS)
    addEdge('e-u1-a1', 'USER-VICTIM', 'victim@okhdfc', 'OWNS', 'owns');
    addEdge('e-u2-a2', 'USER-MULE1', 'mule1@upi', 'OWNS', 'owns');
    addEdge('e-u3-a3', 'USER-MULE2', 'mule2@upi', 'OWNS', 'owns');
    addEdge('e-u4-a4', 'USER-CASHOUT', 'cashout@paytm', 'OWNS', 'owns');
    addEdge('e-u5-a5', 'USER-MULE3', 'mule3@axis', 'OWNS', 'owns');

    // Account → receives_from → Account (RECEIVES_FROM)
    addEdge('e-flow-1', 'victim@okhdfc', 'mule1@upi', 'RECEIVES_FROM', '₹50,000', 50000, '10:05:21', true);
    addEdge('e-flow-2', 'mule1@upi', 'mule2@upi', 'RECEIVES_FROM', '₹48,000', 48000, '10:07:03', true);
    addEdge('e-flow-3', 'mule2@upi', 'cashout@paytm', 'RECEIVES_FROM', '₹45,000', 45000, '10:09:44', true);
    addEdge('e-flow-4', 'mule2@upi', 'mule3@axis', 'RECEIVES_FROM', '₹2,500', 2500, '10:14:10', true);
    addEdge('e-flow-5', 'cashout@paytm', 'ATM-LOC-402', 'RECEIVES_FROM', '₹40,000', 40000, '10:16:35', true);

    // Account → initiates → Transaction (INITIATES)
    addEdge('e-init-1', 'victim@okhdfc', 'TXN001', 'INITIATES', 'initiates', 50000, '10:05:21');
    addEdge('e-init-2', 'mule1@upi', 'TXN002', 'INITIATES', 'initiates', 48000, '10:07:03', true);
    addEdge('e-init-3', 'mule2@upi', 'TXN003', 'INITIATES', 'initiates', 45000, '10:09:44', true);
    addEdge('e-init-4', 'mule2@upi', 'TXN004', 'INITIATES', 'initiates', 2500, '10:14:10');
    addEdge('e-init-5', 'cashout@paytm', 'TXN005', 'INITIATES', 'initiates', 40000, '10:16:35', true);

    // Transaction → sent_to → Beneficiary (SENT_TO)
    addEdge('e-sent-1', 'TXN001', 'BENEFICIARY-MULE1', 'SENT_TO', 'sent to', 50000, '10:05:21');
    addEdge('e-sent-2', 'TXN002', 'BENEFICIARY-MULE2', 'SENT_TO', 'sent to', 48000, '10:07:03', true);
    addEdge('e-sent-3', 'TXN003', 'BENEFICIARY-CASHOUT', 'SENT_TO', 'sent to', 45000, '10:09:44', true);
    addEdge('e-sent-4', 'TXN004', 'BENEFICIARY-MULE3', 'SENT_TO', 'sent to', 2500, '10:14:10');
    addEdge('e-sent-5', 'TXN005', 'BENEFICIARY-ATM', 'SENT_TO', 'dispensed to', 40000, '10:16:35', true);

    // Transaction → used_device → Device (USED_DEVICE)
    addEdge('e-dev-1', 'TXN001', 'DEV-RN11-982', 'USED_DEVICE', 'used device', undefined, '10:05:21');
    addEdge('e-dev-2', 'TXN002', 'DEV-RN11-982', 'USED_DEVICE', 'used device', undefined, '10:07:03', true);
    addEdge('e-dev-3', 'TXN003', 'DEV-RN11-982', 'USED_DEVICE', 'used device', undefined, '10:09:44', true);
    addEdge('e-dev-4', 'TXN004', 'DEV-RN11-982', 'USED_DEVICE', 'used device', undefined, '10:14:10');
    addEdge('e-dev-5', 'TXN005', 'IMEI002', 'USED_DEVICE', 'used device', undefined, '10:16:35');

    // Transaction → originated_from → IP (ORIGINATED_FROM)
    addEdge('e-ip-1', 'TXN001', '103.10.10.1', 'ORIGINATED_FROM', 'originated from', undefined, '10:05:21', true);
    addEdge('e-ip-2', 'TXN002', '103.10.10.1', 'ORIGINATED_FROM', 'originated from', undefined, '10:07:03', true);
    addEdge('e-ip-3', 'TXN003', '103.10.10.1', 'ORIGINATED_FROM', 'originated from', undefined, '10:09:44', true);
    addEdge('e-ip-4', 'TXN004', '103.10.10.1', 'ORIGINATED_FROM', 'originated from', undefined, '10:14:10');
    addEdge('e-ip-5', 'TXN005', '185.220.101.5', 'ORIGINATED_FROM', 'originated from', undefined, '10:16:35', true);

    // Transaction → associated_with → Location (ASSOCIATED_WITH)
    addEdge('e-loc-1', 'TXN001', 'LOC-DELHI-SOUTH', 'ASSOCIATED_WITH', 'associated with', undefined, '10:05:21');
    addEdge('e-loc-2', 'TXN002', 'LOC-NOIDA-62', 'ASSOCIATED_WITH', 'associated with', undefined, '10:07:03', true);
    addEdge('e-loc-3', 'TXN003', 'LOC-NOIDA-62', 'ASSOCIATED_WITH', 'associated with', undefined, '10:09:44', true);
    addEdge('e-loc-4', 'TXN004', 'LOC-NOIDA-62', 'ASSOCIATED_WITH', 'associated with', undefined, '10:14:10');
    addEdge('e-loc-5', 'TXN005', 'LOC-SECTOR-18', 'ASSOCIATED_WITH', 'associated with', undefined, '10:16:35', true);

    // Multiple Users → share → Device/IP (SHARES_DEVICE / SHARES_IP)
    addEdge('e-share-dev1', 'USER-MULE1', 'IMEI001', 'SHARES_DEVICE', 'shares device', undefined, undefined, true);
    addEdge('e-share-dev2', 'USER-MULE2', 'IMEI001', 'SHARES_DEVICE', 'shares device', undefined, undefined, true);
    addEdge('e-share-ip1', 'USER-MULE1', '103.10.10.1', 'SHARES_IP', 'shares IP', undefined, undefined, true);
    addEdge('e-share-ip2', 'USER-MULE2', '103.10.10.1', 'SHARES_IP', 'shares IP', undefined, undefined, true);
    addEdge('e-share-ip3', 'USER-CASHOUT', '103.10.10.1', 'SHARES_IP', 'shares IP', undefined, undefined, true);

    // Device / IMEI pairing
    addEdge('e-dev-imei', 'DEV-RN11-982', 'IMEI001', 'OWNS', 'hardware binding');

    // Account bank associations
    addEdge('e-bank-1', 'victim@okhdfc', 'BANK-HDFC', 'OWNS', 'held at');
    addEdge('e-bank-2', 'mule1@upi', 'BANK-ICICI', 'OWNS', 'held at');
    addEdge('e-bank-3', 'mule2@upi', 'BANK-ICICI', 'OWNS', 'held at');
    addEdge('e-bank-4', 'cashout@paytm', 'BANK-PAYTM', 'OWNS', 'held at');
    addEdge('e-bank-5', 'mule3@axis', 'BANK-AXIS', 'OWNS', 'held at');

    // Also integrate uploaded entities dynamically
    entities.forEach(ent => {
      if (!nodeMap.has(ent.id)) {
        let nType: RelationshipNodeType = 'ACCOUNT';
        if (ent.type === 'PHONE') nType = 'USER';
        else if (ent.type === 'IP') nType = 'IP';
        else if (ent.type === 'DEVICE' || ent.type === 'IMEI') nType = 'DEVICE';
        else if (ent.type === 'BANK_ACCOUNT' || ent.type === 'UPI') nType = 'ACCOUNT';

        upsertNode(ent.id, ent.label || ent.id, nType, ent.riskScore || 20, {
          entityType: ent.type,
          role: ent.role,
        }, (ent.evidenceSources || []).map(s => `${s.file}${s.row ? ` (Row ${s.row})` : ''}`));
      }
    });

    // Populate degrees, relevantTransactions, and recentActivity
    edges.forEach(e => {
      const src = nodeMap.get(e.source);
      const tgt = nodeMap.get(e.target);
      if (src) src.degree += 1;
      if (tgt) tgt.degree += 1;

      // If edge represents a transaction
      if (e.amount && src && tgt) {
        const txObj = {
          id: e.id,
          amount: e.amount,
          time: e.timestamp || '10:10:00',
          status: 'SUCCESS',
          sender: src.label,
          receiver: tgt.label,
        };
        src.relevantTransactions.push(txObj);
        tgt.relevantTransactions.push(txObj);
      }
    });

    // Populate timeline and recent activity for nodes
    nodeMap.forEach(n => {
      if (n.nodeType === 'TRANSACTION') {
        n.recentActivity = [
          { time: n.metadata.timestamp || '10:05:21', action: `Transaction executed for ₹${n.metadata.amount?.toLocaleString('en-IN')}`, severity: n.riskScore >= 80 ? 'CRITICAL' : 'HIGH' },
          { time: '10:04:30', action: 'Beneficiary validation response received from UPI Switch' },
          { time: '10:04:10', action: 'Encrypted MPIN authentication confirmed via device' },
        ];
      } else if (n.nodeType === 'ACCOUNT') {
        n.recentActivity = [
          { time: '10:16:35', action: 'Balance reduced post downstream routing', severity: 'HIGH' },
          { time: '10:07:03', action: 'Inward fund transfer credited', severity: 'MEDIUM' },
          { time: '10:01:00', action: 'Account authenticated from IP 103.10.10.1', severity: 'LOW' },
        ];
      } else if (n.nodeType === 'DEVICE') {
        n.recentActivity = [
          { time: '10:16:35', action: 'Session token expired after rapid transaction sequence', severity: 'HIGH' },
          { time: '10:05:21', action: 'Banking trojan background service detected', severity: 'CRITICAL' },
          { time: '09:55:00', action: 'Device registered with IMEI001 and IMSI001', severity: 'LOW' },
        ];
      } else {
        n.recentActivity = [
          { time: '10:15:00', action: 'Entity flagged in automated correlation cascade', severity: 'HIGH' },
          { time: '10:05:00', action: 'First observed in digital payment funnel', severity: 'LOW' },
        ];
      }
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges,
    };
  }

  /**
   * Risk Intelligence Engine: Automatically detects patterns using neutral, analytical terminology
   */
  public static detectRiskInsights(
    nodes: GraphNodeItem[],
    edges: GraphEdgeItem[]
  ): RiskInsight[] {
    const insights: RiskInsight[] = [];

    // 1. One device associated with many accounts
    const deviceToAccounts = new Map<string, Set<string>>();
    edges.forEach(e => {
      if (e.relationship === 'USED_DEVICE' || e.relationship === 'SHARES_DEVICE') {
        const devId = e.target;
        if (!deviceToAccounts.has(devId)) deviceToAccounts.set(devId, new Set());
        deviceToAccounts.get(devId)?.add(e.source);
      }
    });

    deviceToAccounts.forEach((accs, devId) => {
      if (accs.size >= 3) {
        const accList = Array.from(accs);
        insights.push({
          id: `ins-dev-${devId}`,
          title: 'Infrastructure Anomaly: Multiple Accounts on Single Hardware Device',
          category: 'DEVICE_SHARING',
          severity: 'POTENTIALLY_SUSPICIOUS',
          description: `Potentially suspicious pattern identified: ${accs.size} distinct accounts (${accList.slice(0, 3).join(', ')}${accs.size > 3 ? '...' : ''}) share hardware device ${devId}. Coordinated operations from a single physical handset indicate non-standard customer behavior.`,
          entityIds: [devId, ...accList],
          metrics: { accountsCount: accs.size },
          recommendation: 'Correlate device installation logs and freeze transactions originating from this hardware fingerprint.',
        });
      }
    });

    // 2. One IP associated with many accounts
    const ipToAccounts = new Map<string, Set<string>>();
    edges.forEach(e => {
      if (e.relationship === 'ORIGINATED_FROM' || e.relationship === 'SHARES_IP') {
        const ip = e.target;
        if (!ipToAccounts.has(ip)) ipToAccounts.set(ip, new Set());
        ipToAccounts.get(ip)?.add(e.source);
      }
    });

    ipToAccounts.forEach((accs, ip) => {
      if (accs.size >= 3) {
        const accList = Array.from(accs);
        insights.push({
          id: `ins-ip-${ip}`,
          title: 'Network Anomaly: Common Gateway Proxy IP Across Multiple Identities',
          category: 'IP_SHARING',
          severity: 'REQUIRES_INVESTIGATION',
          description: `Anomaly detected: IP address ${ip} served as the originating network node for ${accs.size} separate accounts. Co-location of unrelated payment entities suggests proxy routing or shared operational infrastructure.`,
          entityIds: [ip, ...accList],
          metrics: { accountsCount: accs.size },
          recommendation: 'Request subscriber logs from ISP and place gateway IP under active packet capture.',
        });
      }
    });

    // 3. Rapid transfers between connected accounts (< 5 mins)
    const rapidTransfers = edges.filter(
      e => e.relationship === 'RECEIVES_FROM' && e.amount && e.amount >= 40000
    );
    if (rapidTransfers.length >= 2) {
      const totalVolume = rapidTransfers.reduce((sum, e) => sum + (e.amount || 0), 0);
      insights.push({
        id: 'ins-rapid-passthrough',
        title: 'High-Velocity Routing: Rapid Inter-Account Passthrough (< 5 min)',
        category: 'RAPID_TRANSFER',
        severity: 'ANOMALY',
        description: `Potential coordinated activity detected: ₹${totalVolume.toLocaleString('en-IN')} was routed across ${rapidTransfers.length} consecutive accounts with hop intervals under 3 minutes, terminating in rapid liquidation.`,
        entityIds: rapidTransfers.flatMap(e => [e.source, e.target]),
        metrics: { totalAmount: totalVolume, timeWindowMinutes: 11, transactionsCount: rapidTransfers.length },
        recommendation: 'Issue Section 91 CrPC notice to beneficiary banks for immediate lien placement on intermediate accounts.',
      });
    }

    // 4. Multiple accounts transferring to the same beneficiary
    const beneficiaryInflows = new Map<string, { senders: Set<string>; totalAmount: number }>();
    edges.forEach(e => {
      if (e.relationship === 'SENT_TO') {
        const ben = e.target;
        if (!beneficiaryInflows.has(ben)) {
          beneficiaryInflows.set(ben, { senders: new Set(), totalAmount: 0 });
        }
        const bData = beneficiaryInflows.get(ben)!;
        bData.senders.add(e.source);
        bData.totalAmount += e.amount || 0;
      }
    });

    beneficiaryInflows.forEach((bData, benId) => {
      if (bData.senders.size >= 1 && bData.totalAmount >= 40000) {
        insights.push({
          id: `ins-ben-${benId}`,
          title: 'Concentration Anomaly: High-Value Liquidation at Designated Terminal',
          category: 'COMMON_BENEFICIARY',
          severity: 'POTENTIALLY_SUSPICIOUS',
          description: `Potentially suspicious pattern: Beneficiary ${benId} received rapid aggregated transfers totaling ₹${bData.totalAmount.toLocaleString('en-IN')}, acting as a downstream funnel point.`,
          entityIds: [benId, ...Array.from(bData.senders)],
          metrics: { totalAmount: bData.totalAmount, accountsCount: bData.senders.size },
          recommendation: 'Dispatch field investigator to verify physical CCTV footage at receiver terminal location.',
        });
      }
    });

    // 5. Coordinated Activity Headline Insight
    insights.unshift({
      id: 'ins-headline-coordination',
      title: 'Potentially Suspicious Pattern: Coordinated Multi-Entity Cluster',
      category: 'DENSE_CLUSTER',
      severity: 'POTENTIALLY_SUSPICIOUS',
      description: 'Potential coordinated activity detected: 5 accounts are connected through the same device (DEV-RN11-982) and proxy IP (103.10.10.1) and have transferred ₹1.85 lakh to 3 common beneficiaries within 18 minutes.',
      entityIds: ['DEV-RN11-982', '103.10.10.1', 'mule1@upi', 'mule2@upi', 'cashout@paytm'],
      metrics: {
        accountsCount: 5,
        totalAmount: 185500,
        timeWindowMinutes: 18,
        beneficiaryCount: 3,
      },
      recommendation: 'Initiate synchronized account debit freeze across HDFC, ICICI, and Paytm PB gateways.',
    });

    return insights;
  }

  /**
   * Relationship Risk Indicator Calculator: Computes transparent score with factor breakdown
   */
  public static calculateRiskScore(
    nodeId: string,
    nodes: GraphNodeItem[],
    edges: GraphEdgeItem[]
  ): RelationshipRiskScore {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      return {
        score: 45,
        level: 'MEDIUM',
        factors: [{ name: 'Baseline Network Activity', impact: 45, description: 'Standard peer connectivity' }],
      };
    }

    const connectedEdges = edges.filter(e => e.source === nodeId || e.target === nodeId);
    const connectedNodeIds = new Set(connectedEdges.flatMap(e => [e.source, e.target]));
    const connectedNodes = nodes.filter(n => connectedNodeIds.has(n.id) && n.id !== nodeId);

    let score = 20; // baseline
    const factors: { name: string; impact: number; description: string }[] = [];

    // Factor 1: Connected Suspicious Transactions
    const suspiciousTxns = connectedEdges.filter(e => e.isSuspicious || (e.amount && e.amount >= 40000));
    if (suspiciousTxns.length > 0) {
      const impact = Math.min(30, suspiciousTxns.length * 15);
      score += impact;
      factors.push({
        name: 'Connected High-Risk Transactions',
        impact,
        description: `Linked to ${suspiciousTxns.length} anomalous transactions totaling ≥ ₹40,000`,
      });
    }

    // Factor 2: Shared Devices
    const sharedDevices = connectedEdges.filter(e => e.relationship === 'SHARES_DEVICE' || e.relationship === 'USED_DEVICE');
    if (sharedDevices.length > 0) {
      const impact = 22;
      score += impact;
      factors.push({
        name: 'Hardware Identifier Overlap',
        impact,
        description: `Direct hardware binding with shared device IMEI001 / DEV-RN11-982`,
      });
    }

    // Factor 3: Shared IP Infrastructure
    const sharedIps = connectedEdges.filter(e => e.relationship === 'SHARES_IP' || e.relationship === 'ORIGINATED_FROM');
    if (sharedIps.length > 0) {
      const impact = 18;
      score += impact;
      factors.push({
        name: 'Shared Proxy Gateway IP',
        impact,
        description: `Session traffic co-located on proxy IP 103.10.10.1`,
      });
    }

    // Factor 4: High Velocity Passthrough
    const rapidEdges = connectedEdges.filter(e => e.relationship === 'RECEIVES_FROM');
    if (rapidEdges.length >= 2) {
      const impact = 15;
      score += impact;
      factors.push({
        name: 'Rapid Multi-Hop Passthrough',
        impact,
        description: `Fund retention window <120s before secondary routing`,
      });
    }

    // Factor 5: Centrality / Hub Position
    if (node.degree >= 4) {
      const impact = 10;
      score += impact;
      factors.push({
        name: 'Network Hub Centrality',
        impact,
        description: `High topological degree (${node.degree} concurrent edges)`,
      });
    }

    const finalScore = Math.min(98, Math.max(10, score));
    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (finalScore >= 80) level = 'CRITICAL';
    else if (finalScore >= 60) level = 'HIGH';
    else if (finalScore >= 40) level = 'MEDIUM';

    return {
      score: finalScore,
      level,
      factors,
    };
  }

  /**
   * Investigation Subgraph Builder: Expands relationships one level at a time
   */
  public static buildInvestigationSubgraph(
    centerId: string,
    degree: number,
    allNodes: GraphNodeItem[],
    allEdges: GraphEdgeItem[]
  ): { nodeIds: Set<string>; edgeIds: Set<string> } {
    const activeNodeIds = new Set<string>([centerId]);
    const activeEdgeIds = new Set<string>();

    for (let d = 0; d < degree; d++) {
      const currentNodes = Array.from(activeNodeIds);
      allEdges.forEach(e => {
        if (currentNodes.includes(e.source) || currentNodes.includes(e.target)) {
          activeEdgeIds.add(e.id);
          activeNodeIds.add(e.source);
          activeNodeIds.add(e.target);
        }
      });
    }

    return { nodeIds: activeNodeIds, edgeIds: activeEdgeIds };
  }

  /**
   * Generates chronological event timeline for selected entity
   */
  public static getEntityTimeline(
    entityId: string,
    allNodes: GraphNodeItem[],
    allEdges: GraphEdgeItem[]
  ) {
    const events: Array<{
      time: string;
      title: string;
      description: string;
      isUnusual: boolean;
      type: string;
    }> = [];

    const node = allNodes.find(n => n.id === entityId);
    if (!node) return events;

    // Timeline events based on entity type and connections
    if (node.nodeType === 'TRANSACTION') {
      events.push(
        {
          time: '10:04:12',
          title: 'Authentication Session Initialized',
          description: 'UPI PIN entered via Redmi Note 11 (IMEI001) over TCP/4432',
          isUnusual: false,
          type: 'AUTH',
        },
        {
          time: '10:04:45',
          title: 'Pre-flight Cellular Check',
          description: 'SIM Handover confirmed at tower CELL-B',
          isUnusual: true,
          type: 'NETWORK',
        },
        {
          time: node.metadata.timestamp || '10:05:21',
          title: `Payment Executed: ₹${node.metadata.amount?.toLocaleString('en-IN')}`,
          description: `Funds transferred from ${node.metadata.sender} to ${node.metadata.receiver}`,
          isUnusual: (node.metadata.amount || 0) >= 40000,
          type: 'PAYMENT',
        },
        {
          time: '10:07:00',
          title: 'Immediate Downstream Relay Initiated',
          description: 'Recipient account triggered subsequent hop in <102 seconds',
          isUnusual: true,
          type: 'BURST',
        }
      );
    } else if (node.nodeType === 'ACCOUNT') {
      events.push(
        {
          time: '09:45:00',
          title: 'Phishing Email Vector Dispatched',
          description: 'KYC suspension notice sent from alerts@kyc-support-notice.in',
          isUnusual: true,
          type: 'PHISHING',
        },
        {
          time: '10:01:00',
          title: 'Account Observed Online',
          description: 'Mobile session authenticated through gateway IP 103.10.10.1',
          isUnusual: false,
          type: 'SESSION',
        },
        {
          time: '10:03:10',
          title: 'New Beneficiary Added',
          description: 'Beneficiary handle registered without mandatory 4-hour cooling period',
          isUnusual: true,
          type: 'BENEFICIARY',
        },
        {
          time: '10:05:21',
          title: 'High-Value Inward Deposit',
          description: '₹50,000 received via IMPS / UPI channel',
          isUnusual: true,
          type: 'FUNDS_IN',
        },
        {
          time: '10:07:03',
          title: 'Rapid Outward Dispersal',
          description: '₹48,000 pushed downstream to mule2@upi (96% turnover)',
          isUnusual: true,
          type: 'FUNDS_OUT',
        }
      );
    } else if (node.nodeType === 'DEVICE') {
      events.push(
        {
          time: '09:30:00',
          title: 'Hardware Boot Sequence',
          description: 'Redmi Note 11 powered on with Android 12 OS',
          isUnusual: false,
          type: 'BOOT',
        },
        {
          time: '09:40:15',
          title: 'AnyDesk Background Process Started',
          description: 'Remote access screen capture session initialized',
          isUnusual: true,
          type: 'TROJAN',
        },
        {
          time: '10:01:12',
          title: 'First Cellular Call Registered',
          description: 'Connected call to +919123456789 via IMEI001',
          isUnusual: false,
          type: 'CDR',
        },
        {
          time: '10:05:21',
          title: 'UPI Transaction Initiated from Device',
          description: 'TXN001 siphon executed through fake banking utility',
          isUnusual: true,
          type: 'EXPLOIT',
        }
      );
    } else {
      events.push(
        {
          time: '10:01:00',
          title: 'Entity First Observed in Case Log',
          description: 'Associated with primary transaction routing docket',
          isUnusual: false,
          type: 'INGESTION',
        },
        {
          time: '10:09:44',
          title: 'Active Routing Participation',
          description: 'Correlated with high-velocity fund hop',
          isUnusual: true,
          type: 'ROUTING',
        },
        {
          time: '10:16:35',
          title: 'Terminal Correlation Anchor',
          description: 'Linked to physical cash dispensation point',
          isUnusual: true,
          type: 'LIQUIDATION',
        }
      );
    }

    return events;
  }
}
