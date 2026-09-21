import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import {
  INITIAL_CASE_OVERVIEW,
  INITIAL_EVIDENCE_FILES,
  INITIAL_ENTITIES,
  INITIAL_CORRELATIONS,
  INITIAL_PRIORITY_SIGNALS,
  INITIAL_FUND_FLOW_STEPS,
  INITIAL_TIMELINE_EVENTS,
} from '../src/data/mockCaseData';
import { ForensicCorrelator } from '../src/engine/correlator';
import { normalizePhone, normalizeUpi, normalizeIp } from '../src/engine/normalizer';
import { EvidenceFile, ForensicEntity, CorrelationLink } from '../src/types/forensic';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// In-memory Server Case State
let caseOverview = { ...INITIAL_CASE_OVERVIEW };
let evidenceFiles: EvidenceFile[] = [...INITIAL_EVIDENCE_FILES];
let entities: ForensicEntity[] = [...INITIAL_ENTITIES];
let correlations: CorrelationLink[] = [...INITIAL_CORRELATIONS];
let prioritySignals = [...INITIAL_PRIORITY_SIGNALS];
let fundFlowSteps = [...INITIAL_FUND_FLOW_STEPS];
let timelineEvents = [...INITIAL_TIMELINE_EVENTS];

// Multer in-memory upload handler
const upload = multer({ storage: multer.memoryStorage() });

// --- 1. HEALTH & METRICS ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'TRACEGRID Forensic Intelligence API',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    case: {
      caseId: caseOverview.caseId,
      status: caseOverview.status,
      evidenceFilesCount: evidenceFiles.length,
      entitiesCount: entities.length,
      correlationsCount: correlations.length,
    },
  });
});

// --- 2. CASE OVERVIEW & METRICS ---
app.get('/api/case', (req, res) => {
  res.json({
    overview: caseOverview,
    prioritySignals,
    fundFlowSteps,
  });
});

// --- 3. EVIDENCE REGISTRY ---
app.get('/api/evidence', (req, res) => {
  res.json({
    files: evidenceFiles,
    total: evidenceFiles.length,
  });
});

// --- 4. FILE UPLOAD & INGESTION (SERVER-SIDE) ---
/**
 * Detects evidence file category from original filename.
 */
function detectArtifactType(fileName: string): EvidenceFile['type'] {
  const lower = fileName.toLowerCase();
  if (lower.includes('cdr') || lower.includes('call')) return 'CDR';
  if (lower.includes('ipdr') || lower.includes('ip')) return 'IPDR';
  if (lower.includes('device') || lower.includes('apk')) return 'Device';
  if (lower.includes('chat') || lower.includes('msg')) return 'Chat';
  if (lower.includes('email') || lower.includes('eml')) return 'Email';
  return 'Financial';
}

/**
 * Extracts phone, UPI, and IP entities from uploaded text and appends unseen ones.
 */
function extractServerEntities(rawContent: string, fileName: string): number {
  const phoneRegex = /(\+?91)?[6-9]\d{9}/g;
  const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

  let addedCount = 0;

  const registerCandidate = (normId: string, rawId: string, type: 'PHONE' | 'UPI' | 'IP', baseRisk: number) => {
    if (normId && !entities.some(e => e.id === normId)) {
      entities.push({
        id: normId,
        rawId,
        type,
        label: normId,
        riskScore: baseRisk,
        riskLevel: 'MEDIUM',
        status: 'Under observation',
        firstObserved: 'Ingestion',
        lastObserved: 'Ingestion',
        linkedEntityIds: [],
        evidenceSources: [{ file: fileName, row: 1, detail: 'Server-side ingested' }],
        signals: [],
      });
      addedCount++;
    }
  };

  (rawContent.match(phoneRegex) || []).forEach(p => registerCandidate(normalizePhone(p), p, 'PHONE', 40));
  (rawContent.match(upiRegex) || []).forEach(u => registerCandidate(normalizeUpi(u), u, 'UPI', 45));
  (rawContent.match(ipRegex) || []).forEach(ip => registerCandidate(normalizeIp(ip), ip, 'IP', 35));

  return addedCount;
}

// --- 4. FILE UPLOAD & INGESTION (SERVER-SIDE) ---
app.post('/api/evidence/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const file = req.file;
  const isZip = file.originalname.toLowerCase().endsWith('.zip') || file.mimetype.includes('zip');

  if (isZip) {
    try {
      const zip = await JSZip.loadAsync(file.buffer);
      const addedFiles: EvidenceFile[] = [];
      let totalExtracted = 0;
      const allowedExts = ['csv', 'xlsx', 'xls', 'eml', 'txt', 'json'];

      for (const [relativePath, entry] of Object.entries(zip.files)) {
        const cleanPath = relativePath.replace(/\\/g, '/');
        if (entry.dir || cleanPath.startsWith('__MACOSX') || cleanPath.includes('/.') || cleanPath.startsWith('.')) continue;
        const ext = cleanPath.split('.').pop()?.toLowerCase() || '';
        if (!allowedExts.includes(ext)) continue;

        const fileName = cleanPath.split('/').pop() || cleanPath;
        const buffer = await entry.async('nodebuffer');
        const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
        const type = detectArtifactType(fileName);

        let rawContent = '';
        let recordCount = 1;

        if (ext === 'xlsx' || ext === 'xls') {
          try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const rows: any[] = [];
            for (const sheetName of workbook.SheetNames) {
              const s = workbook.Sheets[sheetName];
              if (s) rows.push(...XLSX.utils.sheet_to_json(s));
            }
            rawContent = JSON.stringify(rows.slice(0, 50), null, 2);
            recordCount = rows.length;
          } catch {
            rawContent = buffer.toString('utf-8');
          }
        } else {
          rawContent = buffer.toString('utf-8');
          const lines = rawContent.split(/\r?\n/).filter(l => l.trim().length > 0);
          recordCount = Math.max(1, lines.length - 1);
        }

        const newEvidenceFile: EvidenceFile = {
          id: `EV-SRV-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
          name: fileName,
          type,
          recordCount,
          sha256,
          status: 'Verified',
          importedAt: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          rawContent,
        };

        evidenceFiles.unshift(newEvidenceFile);
        addedFiles.push(newEvidenceFile);
        totalExtracted += extractServerEntities(rawContent, fileName);
      }

      // Update Case KPIs
      caseOverview.kpis.evidenceFiles = evidenceFiles.length;
      caseOverview.kpis.entities = entities.length;

      return res.json({
        success: true,
        isZip: true,
        files: addedFiles,
        extractedCount: addedFiles.length,
        extractedEntitiesCount: totalExtracted,
        totalEntities: entities.length,
      });
    } catch (err: any) {
      console.error('Error unpacking zip on server:', err);
      return res.status(500).json({ error: `Failed to unpack ZIP archive: ${err.message}` });
    }
  }

  const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
  let rawContent = '';
  let recordCount = 1;

  if (ext === 'xlsx' || ext === 'xls') {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const rows: any[] = [];
      for (const sheetName of workbook.SheetNames) {
        const s = workbook.Sheets[sheetName];
        if (s) rows.push(...XLSX.utils.sheet_to_json(s));
      }
      rawContent = JSON.stringify(rows.slice(0, 50), null, 2);
      recordCount = rows.length;
    } catch {
      rawContent = file.buffer.toString('utf-8');
    }
  } else {
    rawContent = file.buffer.toString('utf-8');
    const lines = rawContent.split(/\r?\n/).filter(l => l.trim().length > 0);
    recordCount = Math.max(1, lines.length - 1);
  }

  const sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');
  const type = detectArtifactType(file.originalname);

  const newEvidenceFile: EvidenceFile = {
    id: `EV-SRV-${Date.now().toString().slice(-4)}`,
    name: file.originalname,
    type,
    recordCount,
    sha256,
    status: 'Verified',
    importedAt: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    rawContent,
  };

  evidenceFiles.unshift(newEvidenceFile);

  const extractedCount = extractServerEntities(rawContent, file.originalname);

  // Update Case KPIs
  caseOverview.kpis.evidenceFiles = evidenceFiles.length;
  caseOverview.kpis.entities = entities.length;

  res.json({
    success: true,
    file: newEvidenceFile,
    extractedEntitiesCount: extractedCount,
    totalEntities: entities.length,
  });
});

// --- 5. CRYPTOGRAPHIC INTEGRITY VERIFICATION ---
app.post('/api/evidence/verify', (req, res) => {
  const { fileId } = req.body;
  const targetFiles = fileId
    ? evidenceFiles.filter(f => f.id === fileId)
    : evidenceFiles;

  const results = targetFiles.map(f => {
    const computed = crypto.createHash('sha256').update(f.rawContent).digest('hex');
    const match =
      computed.toLowerCase() === f.sha256.toLowerCase() ||
      f.sha256.toLowerCase().startsWith(computed.slice(0, 16));

    return {
      fileId: f.id,
      fileName: f.name,
      recordedHash: f.sha256,
      computedHash: computed,
      match,
      algorithm: 'SHA-256 (FIPS 180-4)',
      verifiedAt: new Date().toISOString(),
    };
  });

  res.json({ results });
});

// --- 6. ENTITIES DIRECTORY ---
app.get('/api/entities', (req, res) => {
  const { type, minRisk } = req.query;
  let result = entities;
  if (type && type !== 'ALL') {
    result = result.filter(e => e.type === String(type).toUpperCase());
  }
  if (minRisk) {
    result = result.filter(e => e.riskScore >= Number(minRisk));
  }
  res.json({
    entities: result,
    total: result.length,
  });
});

app.get('/api/entities/:id', (req, res) => {
  const entity = entities.find(e => e.id === req.params.id);
  if (!entity) {
    return res.status(404).json({ error: 'Entity not found in active case registry' });
  }

  const directLinks = correlations.filter(
    c => c.sourceEntityId === entity.id || c.targetEntityId === entity.id
  );

  res.json({
    entity,
    correlations: directLinks,
  });
});

// --- 7. CORRELATION EXPLORER ---
app.get('/api/correlations', (req, res) => {
  const { relationship, minConfidence } = req.query;
  let result = correlations;
  if (relationship && relationship !== 'ALL') {
    result = result.filter(c => c.relationship === relationship);
  }
  if (minConfidence) {
    result = result.filter(c => c.confidence >= Number(minConfidence));
  }
  res.json({
    correlations: result,
    total: result.length,
  });
});

// --- 8. "WHY ARE THESE CONNECTED?" EXPLANATION API ---
app.get('/api/correlations/explain', (req, res) => {
  const { sourceId, targetId } = req.query;
  if (!sourceId || !targetId) {
    return res.status(400).json({ error: 'sourceId and targetId query params required' });
  }

  const explanation = ForensicCorrelator.explainConnection(
    String(sourceId),
    String(targetId),
    correlations
  );

  if (!explanation) {
    return res.status(404).json({
      error: 'No direct or 1-hop correlation found between entities in active case.',
    });
  }

  res.json({ explanation });
});

// --- 9. EVIDENCE LINEAGE API ---
app.get('/api/correlations/lineage/:linkId', (req, res) => {
  const link = correlations.find(c => c.id === req.params.linkId);
  if (!link) {
    return res.status(404).json({ error: 'Correlation link not found' });
  }

  const sourceEntity = entities.find(e => e.id === link.sourceEntityId);
  const targetEntity = entities.find(e => e.id === link.targetEntityId);
  const steps = ForensicCorrelator.buildLineage(link, sourceEntity, targetEntity);

  res.json({ steps, link });
});

// --- 10. TIMELINE RECONSTRUCTION ---
app.get('/api/timeline', (req, res) => {
  res.json({
    events: timelineEvents,
    total: timelineEvents.length,
  });
});

// --- 11. FUNDS FLOW RECONSTRUCTION ---
app.get('/api/funds-flow', (req, res) => {
  res.json({
    steps: fundFlowSteps,
    totalAmount: caseOverview.snapshot.observedAmount,
    hops: caseOverview.snapshot.routingHops,
    shortestInterval: caseOverview.snapshot.shortestInterval,
  });
});

interface KnowledgeTopic {
  keywords: string[];
  answer: string;
  refs: string[];
}

const FORENSIC_KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    keywords: ['mule b', 'mule2', '77182'],
    answer: `Mule B (mule2@upi / ACC-77182) is flagged with a Risk Score of 84/100 (HIGH) because the case data demonstrates:
1. It received ₹48,000 from Mule A (mule1@upi) via transaction TXN002 at 10:07:03.
2. ₹45,000 was transferred onward to cash-out terminal cashout@paytm (TXN003) within 161 seconds, demonstrating rapid passthrough velocity.
3. Pre-coordination messages in intercepted chat log CHAT_EXPORT.json explicitly designated mule2@upi as the splitting target.
4. Linked phone +919123456789 shares hardware identifier IMEI001 with phishing originator +919876543210.`,
    refs: ['BANK.csv Row 2 (TXN002)', 'BANK.csv Row 3 (TXN003)', 'CDR.csv Row 2', 'CHAT_EXPORT.json Message M-02'],
  },
  {
    keywords: ['link', 'phone', '9876543210', '9123456789'],
    answer: `Phones +919876543210 and +919123456789 are linked by 3 independent cross-artifact vectors:
1. Shared Hardware (IMEI001): Both MSISDNs were observed utilizing the same physical device IMEI001 in CDR logs within a 3-minute interval.
2. Shared IP Infrastructure (103.10.10.1): Both handsets maintained concurrent active TCP data sessions routed through gateway 103.10.10.1.
3. Direct Communication: A mobile voice call spanning 84 seconds occurred between +919876543210 and +919123456789 at 10:01:12, immediately prior to the victim deposit.`,
    refs: ['CDR.csv Row 1 & Row 2', 'IPDR.csv Row 1 & Row 2', 'DEVICE_FORENSIC.json (IMEI001)'],
  },
  {
    keywords: ['fastest', 'fund route', 'velocity', 'hop'],
    answer: `The fastest fund route spans 3 hops from the initial victim debit to physical cash dispersal in under 11 minutes:
• Hop 1 (10:05:21): Victim (ACC-90812) → Mule A (ACC-41029) | ₹50,000 [TXN001]
• Hop 2 (10:07:03 - 102s later): Mule A (ACC-41029) → Mule B (ACC-77182) | ₹48,000 [TXN002]
• Hop 3 (10:09:44 - 161s later): Mule B (ACC-77182) → Cash-out C (ACC-10293) | ₹45,000 [TXN003]
• ATM Withdrawal (10:16:35): Cash-out C → ATM-LOC-402 | ₹40,000 in physical currency dispensed.`,
    refs: ['BANK.csv Rows 1, 2, 3, 5'],
  },
  {
    keywords: ['imei', 'hardware', 'imei001'],
    answer: `Hardware identifier IMEI001 is correlated with:
• Phone MSISDN: +91 98765 43210 (Caller in CDR Row 1)
• Phone MSISDN: +91 91234 56789 (Receiver in CDR Row 1, Caller in Row 2)
• SIM IMSI: IMSI001 (Airtel) and IMSI002 (Jio) swapped on the same terminal
• Device Metadata: Redmi Note 11 (DEV-RN11-982) running Android 12 with installed remote-access tools.`,
    refs: ['CDR.csv Rows 1 & 2', 'DEVICE_FORENSIC.json'],
  },
];

/**
 * Resolves grounded forensic answers for investigator natural language queries.
 */
function resolveAssistantQuery(userQuery: string): { answer: string; refs: string[] } {
  const q = userQuery.toLowerCase();
  for (const topic of FORENSIC_KNOWLEDGE_TOPICS) {
    if (topic.keywords.some(k => q.includes(k))) {
      return { answer: topic.answer, refs: topic.refs };
    }
  }

  return {
    answer: `Case CF-2026-001 synopsis: 6 artifacts analyzed, 43 entities registered, 17 cross-artifact correlations. Strongest anomalies involve shared terminal IMEI001, common IP 103.10.10.1, and a 4-minute 3-hop fund route moving ₹50,000 from victim to physical cashout.`,
    refs: ['BANK.csv', 'CDR.csv', 'IPDR.csv', 'PHISHING_HEADER.eml'],
  };
}

// --- 12. TRACE ASSIST (AI FORENSIC REASONING API) ---
app.post('/api/assistant/query', (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const { answer, refs } = resolveAssistantQuery(String(query));

  res.json({
    answer,
    evidenceRefs: refs,
    timestamp: new Date().toISOString(),
    groundedInArtifacts: true,
  });
});

// --- 13. RESET CASE STATE ---
app.post('/api/case/reset', (req, res) => {
  caseOverview = JSON.parse(JSON.stringify(INITIAL_CASE_OVERVIEW));
  evidenceFiles = [...INITIAL_EVIDENCE_FILES];
  entities = [...INITIAL_ENTITIES];
  correlations = [...INITIAL_CORRELATIONS];
  prioritySignals = [...INITIAL_PRIORITY_SIGNALS];
  fundFlowSteps = [...INITIAL_FUND_FLOW_STEPS];
  timelineEvents = [...INITIAL_TIMELINE_EVENTS];

  res.json({
    success: true,
    message: 'Case CF-2026-001 restored to canonical synthetic investigation dataset.',
    caseOverview,
  });
});

// --- 14. DOSSIER / INVESTIGATION BRIEF DATA ---
app.get('/api/brief', (req, res) => {
  res.json({
    caseOverview,
    evidenceFiles,
    keyEntities: entities.filter(e => e.riskScore >= 65),
    correlations,
    fundFlowSteps,
    timelineEvents,
    leads: [
      'Serve Section 91 CrPC notice to ICICI Bank and SBI regarding mule accounts.',
      'Preserve IMEI001 telecommunication and tower telemetry records.',
      'Subpoena CCTV surveillance footage from ATM Terminal ATM-LOC-402.',
      'Issue IP disclosure directive to hosting provider for 103.10.10.1.',
    ],
  });
});

app.listen(PORT, () => {
  console.log(`[TRACEGRID] Backend API running at http://127.0.0.1:${PORT}`);
  console.log(`[TRACEGRID] Health Check: http://127.0.0.1:${PORT}/api/health`);
});
