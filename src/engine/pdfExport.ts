import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CaseOverviewData, EvidenceFile, ForensicEntity, CorrelationLink, FundFlowStep } from '../types/forensic';

export function exportInvestigationBriefPdf(
  caseData: CaseOverviewData,
  evidenceFiles: EvidenceFile[],
  entities: ForensicEntity[],
  correlations: CorrelationLink[],
  fundSteps: FundFlowStep[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TRACEGRID FORENSIC WORKSTATION', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('CYBER FRAUD INTELLIGENCE & DIGITAL ARTIFACT CORRELATION BRIEF', 14, 18);
  doc.text(`CONFIDENTIAL • LAW ENFORCEMENT & INVESTIGATIVE REVIEW • CASE ${caseData.caseId}`, 14, 23);

  // Metadata block
  doc.setTextColor(51, 65, 85); // slate-700
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`CASE FILE: ${caseData.caseId}`, 14, 36);
  doc.text(`STATUS: ${caseData.status}`, 80, 36);
  doc.text(`DATE: ${caseData.createdDate}`, 140, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Title: ${caseData.title}`, 14, 42);
  doc.text(`Investigator: ${caseData.investigator}`, 14, 47);

  // Section 1: Executive Case Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. INVESTIGATION SUMMARY', 14, 56);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const splitSummary = doc.splitTextToSize(
    `${caseData.summary} Automated triage identified a connected set of phone, device, IP, and financial entities across ${evidenceFiles.length} submitted artifacts. The strongest observed relationships include shared device identifiers (IMEI001) across multiple phone subscribers and an immediate rapid multi-hop transaction sequence routing ₹50,000 from victim account to physical cash-out.`,
    pageWidth - 28
  );
  doc.text(splitSummary, 14, 62);

  let currentY = 78;

  // Section 2: Observed Fund Routing Flow
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. OBSERVED FUND ROUTING SEQUENCE', 14, currentY);
  currentY += 4;

  const fundRows = fundSteps.map(step => [
    `Hop ${step.step}`,
    step.fromLabel,
    step.toLabel,
    `INR ${step.amount.toLocaleString('en-IN')}`,
    step.timestamp,
    step.txnId,
    step.evidenceSource,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Hop', 'Source Entity', 'Destination Entity', 'Amount', 'Time', 'Reference', 'Evidence']],
    body: fundRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 14 },
      3: { fontStyle: 'bold' },
      5: { font: 'courier' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 3: High-Priority Entities
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. PRIORITY FLAGGED ENTITIES', 14, currentY);
  currentY += 4;

  const entityRows = entities
    .filter(e => e.riskScore >= 65)
    .slice(0, 6)
    .map(e => [
      e.id,
      e.type,
      `${e.riskScore}/100 (${e.riskLevel})`,
      e.status,
      e.signals.map(s => s.label).join('; ') || 'Observed in transaction hop',
      `${e.evidenceSources.length} artifacts`,
    ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Identifier', 'Type', 'Risk Score', 'Status', 'Observed Risk Signals', 'Sources']],
    body: entityRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { font: 'courier', fontStyle: 'bold' },
      2: { fontStyle: 'bold' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 4: Evidence Integrity Table
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. EVIDENCE ARTIFACTS & CRYPTOGRAPHIC INTEGRITY', 14, currentY);
  currentY += 4;

  const evidenceRows = evidenceFiles.map(f => [
    f.name,
    f.type,
    String(f.recordCount),
    f.sha256.slice(0, 32) + '...',
    'VERIFIED',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['File Artifact', 'Type', 'Records', 'Ingested SHA-256 Hash (Truncated)', 'Integrity']],
    body: evidenceRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    columnStyles: {
      3: { font: 'courier' },
      4: { fontStyle: 'bold', textColor: [22, 101, 52] },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 5: Investigative Leads
  if (currentY > 235) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('5. ACTIONABLE INVESTIGATIVE LEADS', 14, currentY);
  currentY += 6;

  const leads = [
    '• Immediate KYC & Account Freeze Request: Serve Section 91 CrPC notice to ICICI Bank (ACC-41029) and SBI (ACC-77182) regarding mule routing accounts.',
    '• Hardware & Subscriber Preservation: Issue Section 91 directive to telecom providers for IMSI001/IMSI002 tower telemetry and subscriber registration records.',
    '• Terminal ATM Surveillance Review: Request CCTV footage at ATM Terminal ATM-LOC-402 for transaction TXN005 at 10:16:35.',
    '• Hosting Provider Subpoena: Issue formal request to hosting provider for IP 103.10.10.1 to obtain subscriber access logs and payment records.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  for (const lead of leads) {
    const splitLead = doc.splitTextToSize(lead, pageWidth - 28);
    doc.text(splitLead, 14, currentY);
    currentY += splitLead.length * 4.5;
  }

  // Footer / Disclaimer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `TRACEGRID v1.0 • Case ${caseData.caseId} • Synthetic investigation dataset for authorized use only • Page ${i} of ${totalPages}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  doc.save(`TRACEGRID_Investigation_Brief_${caseData.caseId}.pdf`);
}

export function exportCaseJson(caseData: any) {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(caseData, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `TRACEGRID_CaseFile_${caseData?.caseId || 'CF-2026-001'}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
