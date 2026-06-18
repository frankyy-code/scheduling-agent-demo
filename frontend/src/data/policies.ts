export interface SchedulingPolicy {
  id: string;
  label: string;
  description: string;
  appliesTo: string[];
}

export const SCHEDULING_POLICIES: SchedulingPolicy[] = [
  { id: 'anticoag-hold', label: 'Anticoagulation hold', description: 'Hold anticoagulation 3-5 days before invasive procedures', appliesTo: ['maria-chen', 'robert-tan'] },
  { id: 'renal-prep', label: 'Renal-safe bowel prep', description: 'CKD stage 3+ requires renal-safe prep selection', appliesTo: ['maria-chen'] },
  { id: 'escort-required', label: 'Discharge escort', description: 'Sedated procedures require confirmed escort for discharge', appliesTo: ['maria-chen', 'robert-tan'] },
  { id: 'heavy-sedation', label: 'Heavy sedation room', description: 'BMI ≥30 + OSA requires anesthesia-supervised MAC facility', appliesTo: ['robert-tan'] },
  { id: 'atomic-or', label: 'Atomic OR booking', description: 'OR slot invalid without confirmed PACU and inpatient bed', appliesTo: ['maria-chen', 'robert-tan'] },
  { id: 'pathology-gate', label: 'Pathology turnaround gate', description: 'Downstream staging/surgery steps blocked until pathology read (3-5 days)', appliesTo: ['maria-chen', 'robert-tan'] },
];

export function getPoliciesForPatient(patientId: string): SchedulingPolicy[] {
  return SCHEDULING_POLICIES.filter((p) => p.appliesTo.includes(patientId));
}
