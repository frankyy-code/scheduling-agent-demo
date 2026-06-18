export interface DocumentReviewSession {
  sessionId: string;
  patientId: string;
  mrn: string;
  status: 'started' | 'processing' | 'complete' | 'failed';
  startedAt: string;
  documentRefs: string[];
}

export interface ReviewStatus {
  sessionId: string;
  status: 'processing' | 'complete' | 'failed';
  summary?: string;
  completedAt?: string;
}

export interface CompassManifest {
  patients: Record<
    string,
    {
      mrn: string;
      displayName: string;
      patientId: string;
      compassUploads: {
        existingOrders: string;
        existingSymptoms: string;
        clinicalSummary?: string;
      };
      additionalOrder: string;
    }
  >;
}
