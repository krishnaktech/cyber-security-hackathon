import { CorrelationLink, ForensicEntity, RelationshipType } from '../types/forensic';

export interface ExplanationResult {
  sourceId: string;
  sourceLabel: string;
  targetId: string;
  targetLabel: string;
  relationship: RelationshipType;
  confidence: number;
  reason: string;
  evidenceSource: string;
  evidenceRef: string;
  detailedFindings: string[];
}

export interface LineageStep {
  stepIndex: number;
  type: 'FINDING' | 'SOURCE' | 'ROW' | 'ENTITY' | 'TARGET';
  label: string;
  subtext: string;
  iconType?: string;
  hashOrRef?: string;
}

/**
 * Cross-Artifact Forensic Correlator
 * Correlates extracted identifiers across heterogeneous digital artifacts.
 */
export class ForensicCorrelator {
  /**
   * Generates a natural forensic explanation for why two entities are linked.
   */
  public static explainConnection(
    sourceId: string,
    targetId: string,
    correlations: CorrelationLink[]
  ): ExplanationResult | null {
    // 1. Check direct correlation
    const directLink = this.findDirectLink(sourceId, targetId, correlations);
    if (directLink) {
      return this.buildDirectExplanation(directLink);
    }

    // 2. Check 1-hop intermediary path
    return this.find1HopExplanation(sourceId, targetId, correlations);
  }

  /**
   * Finds a direct bilateral link between two entities.
   */
  private static findDirectLink(idA: string, idB: string, links: CorrelationLink[]): CorrelationLink | undefined {
    return links.find(
      c =>
        (c.sourceEntityId === idA && c.targetEntityId === idB) ||
        (c.sourceEntityId === idB && c.targetEntityId === idA)
    );
  }

  /**
   * Builds an explanation result for a direct correlation link.
   */
  private static buildDirectExplanation(link: CorrelationLink): ExplanationResult {
    const findings: string[] = [
      `Primary relationship: ${link.relationship} identified in ${link.evidenceSource}`,
      `Evidentiary reference: ${link.evidenceRef}`,
      `Observed timestamp: ${link.timestamp}`,
      `Correlation confidence: ${link.confidence}%`,
    ];

    if (link.metadata?.amount) {
      findings.push(`Recorded transfer amount: ₹${link.metadata.amount.toLocaleString('en-IN')}`);
    }
    if (link.metadata?.duration) {
      findings.push(`Recorded call duration: ${link.metadata.duration} seconds`);
    }

    return {
      sourceId: link.sourceEntityId,
      sourceLabel: link.sourceLabel,
      targetId: link.targetEntityId,
      targetLabel: link.targetLabel,
      relationship: link.relationship,
      confidence: link.confidence,
      reason: link.reason,
      evidenceSource: link.evidenceSource,
      evidenceRef: link.evidenceRef,
      detailedFindings: findings,
    };
  }

  /**
   * Explores 1-hop indirect paths between two entities via an intermediary.
   */
  private static find1HopExplanation(
    sourceId: string,
    targetId: string,
    correlations: CorrelationLink[]
  ): ExplanationResult | null {
    const sourceLinks = correlations.filter(
      c => c.sourceEntityId === sourceId || c.targetEntityId === sourceId
    );

    for (const sLink of sourceLinks) {
      const intermediateId = sLink.sourceEntityId === sourceId ? sLink.targetEntityId : sLink.sourceEntityId;
      const targetLink = this.findDirectLink(intermediateId, targetId, correlations);

      if (targetLink) {
        return {
          sourceId,
          sourceLabel: sourceId,
          targetId,
          targetLabel: targetId,
          relationship: 'ASSOCIATED_WITH',
          confidence: Math.round(((sLink.confidence + targetLink.confidence) / 2) * 0.9),
          reason: `Indirect association through intermediate entity "${intermediateId}". Linked via ${sLink.relationship} in ${sLink.evidenceSource}, then ${targetLink.relationship} in ${targetLink.evidenceSource}.`,
          evidenceSource: `${sLink.evidenceSource} & ${targetLink.evidenceSource}`,
          evidenceRef: `${sLink.evidenceRef} → ${targetLink.evidenceRef}`,
          detailedFindings: [
            `Step 1: ${sourceId} connected to ${intermediateId} via ${sLink.relationship} (${sLink.evidenceRef})`,
            `Step 2: ${intermediateId} connected to ${targetId} via ${targetLink.relationship} (${targetLink.evidenceRef})`,
          ],
        };
      }
    }

    return null;
  }

  /**
   * Generates step-by-step evidence lineage chain:
   * Finding → Source Artifact → Record / Row → Extracted Entity → Correlated Entity
   */
  public static buildLineage(
    link: CorrelationLink,
    sourceEntity?: ForensicEntity,
    targetEntity?: ForensicEntity
  ): LineageStep[] {
    const steps: LineageStep[] = [
      {
        stepIndex: 1,
        type: 'FINDING',
        label: `Observed Correlation: ${link.relationship}`,
        subtext: link.reason,
        hashOrRef: `Confidence: ${link.confidence}%`,
      },
      {
        stepIndex: 2,
        type: 'SOURCE',
        label: `Evidence Artifact: ${link.evidenceSource}`,
        subtext: `Submitted forensic evidence file imported into active case`,
        hashOrRef: link.evidenceSource,
      },
      {
        stepIndex: 3,
        type: 'ROW',
        label: `Parsed Record Reference: ${link.evidenceRef}`,
        subtext: `Exact row and column matching canonical schema at timestamp ${link.timestamp}`,
        hashOrRef: link.evidenceRef,
      },
      {
        stepIndex: 4,
        type: 'ENTITY',
        label: `Source Entity: ${link.sourceLabel}`,
        subtext: `Type: ${link.sourceType} • Risk: ${sourceEntity?.riskScore ?? 'N/A'}/100`,
        hashOrRef: link.sourceEntityId,
      },
      {
        stepIndex: 5,
        type: 'TARGET',
        label: `Correlated Entity: ${link.targetLabel}`,
        subtext: `Type: ${link.targetType} • Risk: ${targetEntity?.riskScore ?? 'N/A'}/100`,
        hashOrRef: link.targetEntityId,
      },
    ];

    return steps;
  }
}
