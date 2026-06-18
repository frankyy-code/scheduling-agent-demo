import type { PathReadinessResult } from './pathReadiness';

export interface PatientInfo {
  patientId: string;
  name: string;
  firstName: string;
  dob: string;
  sex: string;
  mrn: string;
  age: number;
}

export interface ClinicalOrder {
  id: string;
  procedureType: string;
  indication: string;
  orderingProvider: string;
  diagnoses: string[];
  priorityFlags: string[];
  requestedWindow: string;
  status: string;
  placedAt: string;
}

export interface Encounter {
  id: string;
  date: string;
  type: string;
  provider: string;
  summary: string;
}

export interface ExistingOrdersBundle {
  patient: PatientInfo;
  orders: ClinicalOrder[];
  encounters: Encounter[];
}

export interface SymptomEntry {
  name: string;
  onset: string;
  severity: string;
  duration: string;
  icd10?: string;
  source: string;
}

export interface ExistingSymptomsBundle {
  patientId: string;
  mrn: string;
  symptoms: SymptomEntry[];
  activeConditions: string[];
  medications: string[];
  allergies: string[];
  schedulingConstraints: string[];
}

export type QueueStatus =
  | 'Pending Review'
  | 'In Agent Review'
  | 'Awaiting Scheduler'
  | 'Accepted'
  | 'Overridden'
  | 'Manual Review';

export type AcuityTier = 'High' | 'Routine';

export interface QueuePatient {
  patientId: string;
  displayName: string;
  mrn: string;
  preScoreAcuity?: AcuityTier;
  status: QueueStatus;
  urgent: boolean;
  ordersBundle: ExistingOrdersBundle;
  symptomsBundle: ExistingSymptomsBundle;
  addonOrders: ClinicalOrder[];
  pathReadiness?: PathReadinessResult | null;
  rank?: number;
}

export type SchedulingPath =
  | 'standard'
  | 'procedure-access'
  | 'clarification';
