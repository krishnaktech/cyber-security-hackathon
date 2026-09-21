import {
  CaseOverviewData,
  EvidenceFile,
  ForensicEntity,
  CorrelationLink,
  FundFlowStep,
  TimelineEvent,
  PrioritySignal,
} from '../types/forensic';

const API_BASE_URL = 'http://127.0.0.1:3001/api';

export interface BackendHealth {
  status: string;
  service: string;
  version: string;
  port: number;
  uptimeSeconds: number;
  case: {
    caseId: string;
    status: string;
    evidenceFilesCount: number;
    entitiesCount: number;
    correlationsCount: number;
  };
}

export class ForensicApiClient {
  /**
   * Checks if the backend Express service is online and healthy.
   */
  public static async checkHealth(): Promise<BackendHealth | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fetches active case overview from backend.
   */
  public static async getCaseOverview(): Promise<{
    overview: CaseOverviewData;
    prioritySignals: PrioritySignal[];
    fundFlowSteps: FundFlowStep[];
  } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/case`);
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Ingests a new evidence file to the backend server.
   */
  public static async uploadFile(fileObj: File): Promise<{
    success: boolean;
    file: EvidenceFile;
    extractedEntitiesCount: number;
    totalEntities: number;
  } | null> {
    try {
      const formData = new FormData();
      formData.append('file', fileObj);
      const res = await fetch(`${API_BASE_URL}/evidence/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Queries TRACE ASSIST through the server-side forensic reasoning engine.
   */
  public static async queryTraceAssist(query: string): Promise<{
    answer: string;
    evidenceRefs: string[];
  } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/assistant/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Triggers server-side SHA-256 integrity verification.
   */
  public static async verifyIntegrity(fileId?: string): Promise<{
    results: {
      fileId: string;
      fileName: string;
      recordedHash: string;
      computedHash: string;
      match: boolean;
      algorithm: string;
    }[];
  } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/evidence/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Asks backend "WHY ARE THESE CONNECTED?"
   */
  public static async explainConnection(sourceId: string, targetId: string): Promise<any | null> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/correlations/explain?sourceId=${encodeURIComponent(
          sourceId
        )}&targetId=${encodeURIComponent(targetId)}`
      );
      if (res.ok) {
        const data = await res.json();
        return data.explanation;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Resets case state on the backend.
   */
  public static async resetCase(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/case/reset`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  }
}
