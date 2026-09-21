import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {
  EvidenceFile,
  EvidenceType,
  ForensicEntity,
  CorrelationLink,
  EntityType,
  TimelineEvent,
  PrioritySignal,
  FundFlowStep,
  CaseOverviewData,
  RiskLevel,
  RelationshipType,
} from '../types/forensic';
import {
  normalizePhone,
  normalizeUpi,
  normalizeIp,
  normalizeImei,
  normalizeBankAccount,
} from './normalizer';
import { computeSha256 } from './hasher';

export interface ParseResult {
  file: EvidenceFile;
  extractedEntities: Partial<ForensicEntity>[];
  detectedCorrelations: Partial<CorrelationLink>[];
  detectedEvents?: Partial<TimelineEvent>[];
  errors?: string[];
}

export interface ForensicCalculationResult {
  updatedFiles: EvidenceFile[];
  updatedEntities: ForensicEntity[];
  updatedCorrelations: CorrelationLink[];
  updatedTimeline: TimelineEvent[];
  updatedSignals: PrioritySignal[];
  updatedFundSteps: FundFlowStep[];
  updatedKpis: CaseOverviewData['kpis'];
  summaryMessage: string;
}

// Regex patterns for forensic entity detection
const PHONE_REGEX = /(\+?91[\-\s]?)?[6-9]\d{9}/g;
const UPI_REGEX = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
const IP_REGEX = /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g;
const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const IMEI_REGEX = /\b\d{15}\b/g;
const BANK_ACC_REGEX = /\b(?:ACC-[\w\d]+|[A-Z]{4}0[A-Z0-9]{6}|\d{9,18})\b/g;

/**
 * Creates a normalized forensic entity candidate object.
 */
function createEntityCandidate(
  id: string,
  rawId: string,
  type: EntityType,
  fileName: string,
  rowNumber: number,
  timestamp?: string
): Partial<ForensicEntity> {
  const baseScores: Partial<Record<EntityType, number>> = {
    PHONE: 45,
    UPI: 50,
    IP: 40,
    DEVICE: 55,
    BANK_ACCOUNT: 60,
    EMAIL: 35,
    IMEI: 65,
    IMSI: 55,
  };

  const initialScore = baseScores[type] ?? 35;
  const riskLevel: RiskLevel =
    initialScore >= 70 ? 'HIGH' : initialScore >= 45 ? 'MEDIUM' : 'LOW';

  return {
    id,
    rawId,
    type,
    label: id,
    riskScore: initialScore,
    riskLevel,
    status: 'Under observation',
    firstObserved: timestamp || 'Ingested artifact',
    lastObserved: timestamp || 'Ingested artifact',
    linkedEntityIds: [],
    evidenceSources: [{ file: fileName, row: rowNumber, detail: `Discovered in row ${rowNumber}` }],
    signals: [],
  };
}

/**
 * Parses XLSX / XLS workbook array buffer into rows across all sheets.
 */
function parseExcel(buffer: ArrayBuffer): { rows: Record<string, any>[]; error?: string } {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const allRows: Record<string, any>[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      const sheetRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      allRows.push(...sheetRows);
    }
    return { rows: allRows };
  } catch (err: any) {
    return { rows: [], error: `Excel parsing error: ${err.message || String(err)}` };
  }
}

/**
 * Parses JSON text content into array of record objects.
 */
function parseJson(text: string): { rows: Record<string, any>[]; error?: string } {
  try {
    const parsed = JSON.parse(text);
    return { rows: Array.isArray(parsed) ? parsed : [parsed] };
  } catch (err: any) {
    return { rows: [], error: `JSON parsing error: ${err.message || String(err)}` };
  }
}

/**
 * Parses delimited text (CSV) into row objects with trimmed headers.
 */
function parseCsv(text: string): { rows: Record<string, any>[]; errors: string[] } {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
  });
  const errors = parsed.errors.slice(0, 3).map(e => `Row ${e.row}: ${e.message}`);
  return { rows: parsed.data as Record<string, any>[], errors };
}

/**
 * Parses RFC 822 / EML email messages into structured key-value rows.
 */
function parseEml(text: string): { rows: Record<string, any>[]; error?: string } {
  try {
    const lines = text.split(/\r?\n/);
    const headers: Record<string, string> = {};
    let isHeader = true;
    const bodyLines: string[] = [];

    for (const line of lines) {
      if (isHeader) {
        if (line.trim() === '') {
          isHeader = false;
          continue;
        }
        const match = line.match(/^([A-Za-z0-9\-]+):\s*(.*)$/);
        if (match) {
          headers[match[1].toLowerCase()] = match[2].trim();
        }
      } else {
        bodyLines.push(line);
      }
    }

    const rows: Record<string, any>[] = [
      {
        field: 'HEADER_METADATA',
        from: headers['from'] || 'Unknown',
        to: headers['to'] || 'Unknown',
        subject: headers['subject'] || 'No subject',
        date: headers['date'] || 'Unknown',
        messageId: headers['message-id'] || 'N/A',
        originatingIp: headers['x-originating-ip'] || headers['received'] || 'N/A',
        timestamp: headers['date'] || '',
      },
      {
        field: 'EMAIL_BODY_PREVIEW',
        contentSnippet: bodyLines.slice(0, 30).join(' ').slice(0, 300),
      },
    ];

    return { rows };
  } catch (err: any) {
    return { rows: [], error: `EML parsing error: ${err.message || String(err)}` };
  }
}

/**
 * Parses raw text (.txt) files into line-by-line structured records.
 */
function parseTxt(text: string): { rows: Record<string, any>[]; errors: string[] } {
  const rawLines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const rows: Record<string, any>[] = rawLines.map((line, idx) => {
    const tsMatch = line.match(/(?:\[|\b)(\d{1,2}:\d{2}(?::\d{2})?|\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2})?)(?:\]|\b)/);
    return {
      line: idx + 1,
      content: line,
      timestamp: tsMatch ? tsMatch[1] : undefined,
    };
  });
  return { rows, errors: [] };
}

export class ForensicExtractor {
  /**
   * Detects the type of evidence file based on filename or column contents.
   */
  public static detectType(fileName: string, sampleRow?: Record<string, any>): EvidenceType {
    const lower = fileName.toLowerCase();
    if (lower.includes('cdr') || lower.includes('call')) return 'CDR';
    if (lower.includes('bank') || lower.includes('txn') || lower.includes('transfer') || lower.includes('upi') || lower.includes('stmt') || lower.includes('ledger')) return 'Financial';
    if (lower.includes('ipdr') || lower.includes('ip') || lower.includes('session') || lower.includes('gateway')) return 'IPDR';
    if (lower.includes('device') || lower.includes('apk') || lower.includes('handset') || lower.includes('terminal')) return 'Device';
    if (lower.includes('chat') || lower.includes('msg') || lower.includes('whatsapp') || lower.includes('telegram')) return 'Chat';
    if (lower.includes('email') || lower.includes('eml') || lower.includes('header') || lower.includes('phish')) return 'Email';

    if (sampleRow) {
      const keys = Object.keys(sampleRow).map(k => k.toLowerCase());
      if (keys.some(k => k.includes('caller') || k.includes('calling') || k.includes('imei') || k.includes('imsi') || k.includes('duration'))) return 'CDR';
      if (keys.some(k => k.includes('transaction') || k.includes('amount') || k.includes('balance') || k.includes('debit') || k.includes('credit') || k.includes('account'))) return 'Financial';
      if (keys.some(k => k.includes('ip') || k.includes('port') || k.includes('bytes') || k.includes('session'))) return 'IPDR';
      if (keys.some(k => k.includes('from') && (keys.includes('subject') || keys.includes('to')))) return 'Email';
    }

    if (lower.endsWith('.eml')) return 'Email';
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'Financial';
    return 'Financial';
  }

  /**
   * Dual-pass extraction: extracts phone, UPI, IP, IMEI, Bank Account, and Email
   * using both column headers and regex pattern matching.
   */
  public static extractEntitiesFromRows(rows: Record<string, any>[], fileName: string): Partial<ForensicEntity>[] {
    const extracted: Partial<ForensicEntity>[] = [];
    const seenIds = new Set<string>();

    const addEntity = (normId: string, rawId: string, type: EntityType, rowNum: number, ts?: string) => {
      if (normId && !seenIds.has(normId)) {
        seenIds.add(normId);
        extracted.push(createEntityCandidate(normId, rawId, type, fileName, rowNum, ts));
      }
    };

    rows.forEach((row, idx) => {
      const rowNum = idx + 1;
      const rowStr = JSON.stringify(row);
      const ts = row.timestamp || row.date || row.Date || row.time || row.Time || undefined;

      // Pass 1: Column-based extraction
      for (const [key, rawVal] of Object.entries(row)) {
        if (rawVal === null || rawVal === undefined || rawVal === '') continue;
        const val = String(rawVal).trim();
        const k = key.toLowerCase();

        if (k.includes('phone') || k.includes('caller') || k.includes('receiver') || k.includes('mobile')) {
          const norm = normalizePhone(val);
          if (norm) addEntity(norm, val, 'PHONE', rowNum, ts);
        } else if (k.includes('upi') || k.includes('vpa')) {
          const norm = normalizeUpi(val);
          if (norm) addEntity(norm, val, 'UPI', rowNum, ts);
        } else if (k.includes('ip') || k.includes('gateway') || k.includes('host')) {
          const norm = normalizeIp(val);
          if (norm) addEntity(norm, val, 'IP', rowNum, ts);
        } else if (k.includes('imei') || k.includes('hardware')) {
          const norm = normalizeImei(val);
          if (norm) addEntity(norm, val, 'IMEI', rowNum, ts);
        } else if (k.includes('account') || k.includes('acc') || k.includes('source') || k.includes('destination') || k.includes('target')) {
          if (val.includes('@')) {
            const norm = normalizeUpi(val);
            if (norm) addEntity(norm, val, 'UPI', rowNum, ts);
          } else {
            const norm = normalizeBankAccount(val);
            if (norm) addEntity(norm, val, 'BANK_ACCOUNT', rowNum, ts);
          }
        } else if (k.includes('email') || k.includes('mail') || k.includes('from') || k.includes('to')) {
          if (val.includes('@') && !val.endsWith('@upi') && !val.endsWith('@okaxis')) {
            addEntity(val.toLowerCase(), val, 'EMAIL', rowNum, ts);
          }
        } else if (k.includes('device') || k.includes('handset') || k.includes('model')) {
          addEntity(val, val, 'DEVICE', rowNum, ts);
        }
      }

      // Pass 2: Global regex extraction across stringified record
      // Phones
      const phones = rowStr.match(PHONE_REGEX) || [];
      phones.forEach(p => {
        const norm = normalizePhone(p);
        if (norm && norm.length >= 10) addEntity(norm, p, 'PHONE', rowNum, ts);
      });

      // UPI Handles
      const upis = rowStr.match(UPI_REGEX) || [];
      upis.forEach(u => {
        const norm = normalizeUpi(u);
        if (norm) addEntity(norm, u, 'UPI', rowNum, ts);
      });

      // IPs
      const ips = rowStr.match(IP_REGEX) || [];
      ips.forEach(ip => {
        const norm = normalizeIp(ip);
        if (norm && !norm.startsWith('0.') && norm !== '255.255.255.255') {
          addEntity(norm, ip, 'IP', rowNum, ts);
        }
      });

      // IMEIs
      const imeis = rowStr.match(IMEI_REGEX) || [];
      imeis.forEach(imei => {
        const norm = normalizeImei(imei);
        if (norm && norm.length === 15) addEntity(norm, imei, 'IMEI', rowNum, ts);
      });

      // Bank Accounts
      const accounts = rowStr.match(BANK_ACC_REGEX) || [];
      accounts.forEach(acc => {
        if (!acc.includes('@') && !acc.includes('.')) {
          const norm = normalizeBankAccount(acc);
          if (norm && norm.length >= 8) addEntity(norm, acc, 'BANK_ACCOUNT', rowNum, ts);
        }
      });

      // Emails
      const emails = rowStr.match(EMAIL_REGEX) || [];
      emails.forEach(email => {
        const lower = email.toLowerCase();
        if (
          !lower.endsWith('@upi') &&
          !lower.endsWith('@okaxis') &&
          !lower.endsWith('@icici') &&
          !lower.endsWith('@paytm') &&
          !lower.endsWith('@sbi') &&
          !lower.endsWith('@okhdfcbank')
        ) {
          addEntity(lower, email, 'EMAIL', rowNum, ts);
        }
      });
    });

    return extracted;
  }

  /**
   * Extracts candidate timeline events from parsed rows.
   */
  public static extractEventsFromRows(
    rows: Record<string, any>[],
    fileName: string,
    fileType: EvidenceType
  ): Partial<TimelineEvent>[] {
    const events: Partial<TimelineEvent>[] = [];

    rows.forEach((row, idx) => {
      const ts =
        row.timestamp ||
        row.Date ||
        row.date ||
        row.time ||
        row.Time ||
        row.Timestamp ||
        row.datetime ||
        row.DateTime;
      if (!ts) return;

      const rowNum = idx + 1;
      const amount = Number(row.amount || row.Amount || row.amt || row.Amt || row.txnAmount || 0);

      const source =
        row.source ||
        row.Source ||
        row['Source Account'] ||
        row.from ||
        row.From ||
        row.caller ||
        row.Caller ||
        row.sender ||
        row.Sender ||
        'Account';

      const target =
        row.target ||
        row.Target ||
        row['Destination UPI'] ||
        row.destination ||
        row.Destination ||
        row.to ||
        row.To ||
        row.receiver ||
        row.Receiver ||
        undefined;

      let eventType: TimelineEvent['eventType'] = 'TRANSACTION';
      let title = `Observed event in ${fileName}`;
      let description = JSON.stringify(row);

      if (fileType === 'CDR') {
        eventType = 'CALL';
        title = `Voice Call: ${source} → ${target || 'Receiver'}`;
        description = `Call duration: ${row.duration || row.Duration || 'N/A'}s on cell ${row.cellId || row.CellID || 'N/A'}`;
      } else if (fileType === 'Financial') {
        eventType = 'TRANSACTION';
        title = `Financial Transfer: ₹${amount.toLocaleString('en-IN')}`;
        description = `Txn ${row.txnId || row.id || row['Transaction ID'] || `TXN-${rowNum}`}: ${source} → ${target || 'Account'}`;
      } else if (fileType === 'IPDR') {
        eventType = 'IP_SESSION';
        title = `IP Gateway Session: ${row.ip || row.publicIp || source}`;
        description = `Session active on port ${row.port || '80'} (${row.bytes || 0} bytes)`;
      } else if (fileType === 'Email') {
        eventType = 'EMAIL';
        title = `Email: ${row.subject || 'Lure Communication'}`;
        description = `From: ${source} | To: ${target || 'Recipient'} | Subject: ${row.subject || 'N/A'}`;
      } else if (fileType === 'Chat') {
        eventType = 'CHAT';
        title = `Chat Message: ${source}`;
        description = `${row.text || row.content || row.message || 'Encrypted conversation'}`;
      }

      events.push({
        id: `TL-NEW-${Date.now()}-${idx}`,
        timestamp: String(ts),
        displayTime: String(ts),
        eventType,
        title,
        description,
        sourceEntity: String(source),
        targetEntity: target ? String(target) : undefined,
        amount: amount > 0 ? amount : undefined,
        evidenceSource: fileName,
        evidenceRow: rowNum,
        riskLevel: amount >= 40000 ? 'HIGH' : amount > 0 ? 'MEDIUM' : 'LOW',
        tags: [fileType, 'Ingested'],
      });
    });

    return events;
  }

  /**
   * Ingests a single artifact file buffer/content.
   */
  public static async ingestFileContent(
    fileName: string,
    buffer: ArrayBuffer,
    textContent: string
  ): Promise<ParseResult> {
    const sha256 = await computeSha256(buffer);
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    let parsedRows: Record<string, any>[] = [];
    const errors: string[] = [];

    if (ext === 'xlsx' || ext === 'xls') {
      const result = parseExcel(buffer);
      parsedRows = result.rows;
      if (result.error) errors.push(result.error);
    } else if (ext === 'json') {
      const result = parseJson(textContent);
      parsedRows = result.rows;
      if (result.error) errors.push(result.error);
    } else if (ext === 'eml') {
      const result = parseEml(textContent);
      parsedRows = result.rows;
      if (result.error) errors.push(result.error);
    } else if (ext === 'txt') {
      const result = parseTxt(textContent);
      parsedRows = result.rows;
      if (result.errors.length) errors.push(...result.errors);
    } else {
      const result = parseCsv(textContent);
      parsedRows = result.rows;
      if (result.errors.length) errors.push(...result.errors);
    }

    const detectedType = this.detectType(fileName, parsedRows[0]);
    const extractedEntities = this.extractEntitiesFromRows(parsedRows, fileName);
    const detectedEvents = this.extractEventsFromRows(parsedRows, fileName, detectedType);

    let displayContent = textContent;
    if (ext === 'xlsx' || ext === 'xls') {
      displayContent = parsedRows.length > 0
        ? parsedRows.slice(0, 50).map(r => JSON.stringify(r, null, 2)).join('\n---\n')
        : 'Binary Excel spreadsheet. ' + parsedRows.length + ' records parsed.';
    }

    const evidenceFile: EvidenceFile = {
      id: `EV-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
      name: fileName,
      type: detectedType,
      recordCount: parsedRows.length,
      sha256,
      status: errors.length > 0 ? 'Error' : 'Parsed',
      importedAt: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      rawContent: displayContent,
      parsedRows,
    };

    return {
      file: evidenceFile,
      extractedEntities,
      detectedCorrelations: [],
      detectedEvents,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Ingests a raw browser File object (CSV, XLSX, EML, TXT, JSON, or ZIP).
   */
  public static async ingestFile(fileObj: File): Promise<ParseResult[]> {
    const isZip = fileObj.name.toLowerCase().endsWith('.zip') || fileObj.type.includes('zip');
    if (isZip) {
      return this.unpackAndIngestZip(fileObj);
    }

    const arrayBuffer = await fileObj.arrayBuffer();
    const ext = fileObj.name.split('.').pop()?.toLowerCase() || '';
    let textContent = '';
    if (ext !== 'xlsx' && ext !== 'xls') {
      textContent = new TextDecoder('utf-8').decode(arrayBuffer);
    }
    const result = await this.ingestFileContent(fileObj.name, arrayBuffer, textContent);
    return [result];
  }

  /**
   * Unpacks a ZIP archive and parses each nested CSV, Excel, EML, TXT, and JSON file.
   * Handles Windows backslashes and filters OS metadata.
   */
  public static async unpackAndIngestZip(zipSource: File | ArrayBuffer): Promise<ParseResult[]> {
    const zipData = zipSource instanceof File ? await zipSource.arrayBuffer() : zipSource;
    const zip = await JSZip.loadAsync(zipData);
    const results: ParseResult[] = [];

    const allowedExtensions = ['csv', 'xlsx', 'xls', 'eml', 'txt', 'json'];
    const entryPromises: Promise<void>[] = [];

    zip.forEach((relativePath, entry) => {
      if (entry.dir) return;

      const cleanPath = relativePath.replace(/\\/g, '/');
      if (
        cleanPath.startsWith('__MACOSX') ||
        cleanPath.includes('/.') ||
        cleanPath.startsWith('.') ||
        cleanPath.endsWith('.DS_Store') ||
        cleanPath.endsWith('Thumbs.db')
      ) {
        return;
      }

      const ext = cleanPath.split('.').pop()?.toLowerCase() || '';
      if (!allowedExtensions.includes(ext)) {
        return;
      }

      const p = (async () => {
        try {
          const fileName = cleanPath.split('/').pop() || cleanPath;
          const arrayBuffer = await entry.async('arraybuffer');
          let textContent = '';
          if (ext !== 'xlsx' && ext !== 'xls') {
            textContent = new TextDecoder('utf-8').decode(arrayBuffer);
          }
          const parseResult = await this.ingestFileContent(fileName, arrayBuffer, textContent);
          results.push(parseResult);
        } catch (err) {
          console.error(`Error parsing file ${cleanPath} in zip:`, err);
        }
      })();

      entryPromises.push(p);
    });

    await Promise.all(entryPromises);
    return results;
  }

  /**
   * Master Forensic Calculation Engine:
   * Merges all newly parsed files, extracts entities, calculates cross-artifact correlations,
   * updates risk scores, synthesizes timeline events, and updates case KPIs.
   */
  public static calculateForensicUpdates(
    existingFiles: EvidenceFile[],
    existingEntities: ForensicEntity[],
    existingTimeline: TimelineEvent[],
    existingSignals: PrioritySignal[],
    existingFundSteps: FundFlowStep[],
    existingKpis: CaseOverviewData['kpis'],
    newResults: ParseResult[],
    existingCorrelations: CorrelationLink[] = []
  ): ForensicCalculationResult {
    const updatedFiles = [...existingFiles];
    const entityMap = new Map<string, ForensicEntity>();

    // Seed with existing entities
    existingEntities.forEach(e =>
      entityMap.set(e.id, { ...e, evidenceSources: [...e.evidenceSources], linkedEntityIds: [...e.linkedEntityIds] })
    );

    let newArtifactCount = 0;
    let newEntitiesExtractedCount = 0;
    const newTimelineEvents: TimelineEvent[] = [];

    newResults.forEach(result => {
      // 1. Add file if not already present
      const alreadyExists = updatedFiles.some(
        f => f.name === result.file.name && f.sha256 === result.file.sha256
      );
      if (!alreadyExists) {
        updatedFiles.unshift(result.file);
        newArtifactCount++;
      }

      // 2. Process extracted entities
      result.extractedEntities.forEach(cand => {
        if (!cand.id) return;
        const normId = cand.id;

        if (entityMap.has(normId)) {
          const existing = entityMap.get(normId)!;
          cand.evidenceSources?.forEach(ref => {
            if (!existing.evidenceSources.some(s => s.file === ref.file && s.row === ref.row)) {
              existing.evidenceSources.push(ref);
            }
          });

          // Multi-artifact corroboration boost
          const distinctFiles = new Set(existing.evidenceSources.map(s => s.file));
          if (distinctFiles.size >= 3) {
            existing.riskScore = Math.min(96, Math.max(existing.riskScore, 85));
            existing.riskLevel = 'HIGH';
            existing.status = 'Flagged for review';
          } else if (distinctFiles.size === 2) {
            existing.riskScore = Math.min(90, Math.max(existing.riskScore, 70));
            existing.riskLevel = 'HIGH';
          }
        } else {
          const newEntity: ForensicEntity = {
            id: normId,
            rawId: cand.rawId || normId,
            type: cand.type || 'PHONE',
            label: cand.label || normId,
            riskScore: cand.riskScore || 45,
            riskLevel: cand.riskLevel || 'MEDIUM',
            status: 'Under observation',
            firstObserved: cand.firstObserved || result.file.name,
            lastObserved: cand.lastObserved || result.file.name,
            linkedEntityIds: [],
            evidenceSources: cand.evidenceSources || [{ file: result.file.name, row: 1 }],
            signals: [],
          };
          entityMap.set(normId, newEntity);
          newEntitiesExtractedCount++;
        }
      });

      // 3. Process candidate timeline events
      if (result.detectedEvents) {
        result.detectedEvents.forEach(evt => {
          if (evt.title && evt.timestamp) {
            newTimelineEvents.push(evt as TimelineEvent);
          }
        });
      }
    });

    // 4. Calculate Cross-Artifact & Financial Correlations
    const correlationMap = new Map<string, CorrelationLink>();
    existingCorrelations.forEach(c => correlationMap.set(c.id, { ...c }));

    // A. Financial Transfer Correlations from detected events
    const updatedFundSteps: FundFlowStep[] = [...existingFundSteps];
    let hopCounter = updatedFundSteps.length;

    newTimelineEvents.forEach(evt => {
      if (evt.eventType === 'TRANSACTION' && evt.sourceEntity && evt.targetEntity) {
        const s = normalizeUpi(evt.sourceEntity) || normalizeBankAccount(evt.sourceEntity) || evt.sourceEntity;
        const t = normalizeUpi(evt.targetEntity) || normalizeBankAccount(evt.targetEntity) || evt.targetEntity;
        if (s && t && s !== t) {
          hopCounter++;
          const linkId = `CORR-FUNDS-${s}-${t}`;
          const existing = correlationMap.get(linkId);
          if (existing) {
            if (evt.amount) {
              existing.metadata = {
                ...existing.metadata,
                amount: (existing.metadata?.amount || 0) + evt.amount,
              };
            }
          } else {
            correlationMap.set(linkId, {
              id: linkId,
              sourceEntityId: s,
              sourceLabel: s,
              sourceType: (entityMap.get(s)?.type || 'BANK_ACCOUNT') as EntityType,
              targetEntityId: t,
              targetLabel: t,
              targetType: (entityMap.get(t)?.type || 'UPI') as EntityType,
              relationship: 'FUNDS_TRANSFER',
              evidenceSource: evt.evidenceSource || 'Financial Record',
              evidenceRef: `${evt.evidenceSource || 'Financial Record'} (Row ${evt.evidenceRow || 1})`,
              timestamp: evt.timestamp,
              confidence: 95,
              reason: `Fund transfer of ₹${evt.amount || 0} from ${s} to ${t}`,
              metadata: { amount: evt.amount },
            });
          }

          // Append to fundFlowSteps
          if (!updatedFundSteps.some(step => step.fromAccount === s && step.toAccount === t)) {
            updatedFundSteps.push({
              step: hopCounter,
              fromAccount: s,
              fromLabel: s,
              toAccount: t,
              toLabel: t,
              amount: evt.amount || 0,
              timestamp: evt.timestamp,
              txnId: `TXN-CALC-${hopCounter}`,
              evidenceSource: evt.evidenceSource || 'Financial Statement',
              evidenceRow: evt.evidenceRow || 1,
            });
          }
        }
      }
    });

    // B. Co-occurrence correlations from within parsed files
    newResults.forEach(r => {
      const fileEntities = r.extractedEntities.map(e => e.id).filter(Boolean) as string[];
      if (fileEntities.length >= 2) {
        const sampleLimit = Math.min(fileEntities.length, 8);
        for (let i = 0; i < sampleLimit; i++) {
          for (let j = i + 1; j < sampleLimit; j++) {
            const idA = fileEntities[i];
            const idB = fileEntities[j];
            const linkId = `CORR-LINK-${idA}-${idB}`;
            if (!correlationMap.has(linkId)) {
              const typeA = entityMap.get(idA)?.type;
              const typeB = entityMap.get(idB)?.type;

              let rel: RelationshipType = 'ASSOCIATED_WITH';
              if (r.file.type === 'CDR') rel = 'CALL';
              else if (r.file.type === 'IPDR' || typeA === 'IP' || typeB === 'IP') rel = 'SHARED_IP';
              else if (typeA === 'IMEI' || typeB === 'IMEI') rel = 'SHARED_IMEI';

              correlationMap.set(linkId, {
                id: linkId,
                sourceEntityId: idA,
                sourceLabel: idA,
                sourceType: (typeA || 'PHONE') as EntityType,
                targetEntityId: idB,
                targetLabel: idB,
                targetType: (typeB || 'PHONE') as EntityType,
                relationship: rel,
                evidenceSource: r.file.name,
                evidenceRef: `${r.file.name} (Row 1)`,
                timestamp: r.file.importedAt,
                confidence: 88,
                reason: `Entities co-extracted from artifact ${r.file.name}`,
              });
            }
          }
        }
      }
    });

    // C. Link connected entities together in entityMap
    correlationMap.forEach(link => {
      const eSource = entityMap.get(link.sourceEntityId);
      const eTarget = entityMap.get(link.targetEntityId);
      if (eSource && !eSource.linkedEntityIds.includes(link.targetEntityId)) {
        eSource.linkedEntityIds.push(link.targetEntityId);
      }
      if (eTarget && !eTarget.linkedEntityIds.includes(link.sourceEntityId)) {
        eTarget.linkedEntityIds.push(link.sourceEntityId);
      }
    });

    const updatedEntities = Array.from(entityMap.values());
    const updatedCorrelations = Array.from(correlationMap.values());
    const updatedTimeline = [...newTimelineEvents, ...existingTimeline];

    // Calculate High Risk Entities
    const highRiskCount = updatedEntities.filter(e => e.riskScore >= 70).length;

    // Calculate new priority signals for entities found across multiple artifacts
    const updatedSignals = [...existingSignals];
    updatedEntities.forEach(entity => {
      const distinctSources = Array.from(new Set(entity.evidenceSources.map(s => s.file)));
      if (distinctSources.length >= 2) {
        const signalId = `SIG-CROSS-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
        if (!updatedSignals.some(s => s.id === signalId)) {
          updatedSignals.unshift({
            id: signalId,
            level: 'HIGH',
            title: `Cross-Artifact Corroboration: ${entity.id}`,
            description: `Entity observed across ${distinctSources.length} distinct artifacts (${distinctSources.join(', ')}).`,
            targetEntityId: entity.id,
            evidenceSource: distinctSources[0],
          });
        }
      }
    });

    // Updated KPIs
    const updatedKpis: CaseOverviewData['kpis'] = {
      ...existingKpis,
      evidenceFiles: updatedFiles.length,
      entities: updatedEntities.length,
      correlations: updatedCorrelations.length,
      transactions: existingKpis.transactions + newTimelineEvents.length,
      riskSignals: updatedSignals.length,
      highRiskEntities: highRiskCount,
    };

    const summaryMessage = `Calculated ${newResults.length} artifact(s): Extracted ${newEntitiesExtractedCount} new entities, ${newTimelineEvents.length} transactions, and ${updatedCorrelations.length} cross-artifact linkages.`;

    return {
      updatedFiles,
      updatedEntities,
      updatedCorrelations,
      updatedTimeline,
      updatedSignals,
      updatedFundSteps,
      updatedKpis,
      summaryMessage,
    };
  }
}
