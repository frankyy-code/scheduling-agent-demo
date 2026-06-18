import type { SymptomEntry } from '../types/patient';
import type { DocumentReviewSession, ReviewStatus } from '../types/compass';
import { getCompassUploadPaths } from './mockDataLoaders';

const USE_REAL = import.meta.env.VITE_COMPASS_USE_REAL_API === 'true';
const BASE_URL = import.meta.env.VITE_COMPASS_BASE_URL || '';
const API_KEY = import.meta.env.VITE_COMPASS_API_KEY || '';

export interface StartReviewInput {
  patientId: string;
  mrn: string;
  symptoms: SymptomEntry[];
  documentRefs?: string[];
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
  return headers;
}

export async function startDocumentReview(
  input: StartReviewInput,
): Promise<DocumentReviewSession> {
  const paths = getCompassUploadPaths(input.patientId);
  const documentRefs = input.documentRefs ?? [
    paths?.existingOrders,
    paths?.existingSymptoms,
    paths?.clinicalSummary,
  ].filter(Boolean) as string[];

  if (USE_REAL && BASE_URL) {
    const res = await fetch(`${BASE_URL}/document-review/start`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ...input, documentRefs }),
    });
    if (!res.ok) throw new Error(`Compass API error: ${res.status}`);
    return res.json();
  }

  await new Promise((r) => setTimeout(r, 800));
  return {
    sessionId: `compass-${input.patientId}-${Date.now()}`,
    patientId: input.patientId,
    mrn: input.mrn,
    status: 'started',
    startedAt: new Date().toISOString(),
    documentRefs,
  };
}

export async function getDocumentReviewStatus(
  sessionId: string,
): Promise<ReviewStatus> {
  if (USE_REAL && BASE_URL) {
    const res = await fetch(`${BASE_URL}/document-review/${sessionId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Compass API error: ${res.status}`);
    return res.json();
  }

  await new Promise((r) => setTimeout(r, 500));
  return {
    sessionId,
    status: 'complete',
    summary: 'Document review complete. Clinical signals extracted for acuity scoring.',
    completedAt: new Date().toISOString(),
  };
}
