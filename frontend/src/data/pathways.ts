export type PathwayResourceTarget =
  | 'clinic'
  | 'endoscopy-moderate'
  | 'endoscopy-mac'
  | 'operating-room'
  | 'imaging'
  | 'recovery'
  | 'blocked'
  | 'non-bookable';

export interface PathwayStep {
  id: number;
  operation: string;
  dependency: string;
  provider: string;
  facility: string;
  constraints: string;
  resourceTarget: PathwayResourceTarget;
  status?: 'pending' | 'ready' | 'blocked' | 'complete';
}

export const MARIA_PATHWAY: PathwayStep[] = [
  { id: 1, operation: 'GI evaluation', dependency: 'Referral received', provider: 'GI specialist', facility: 'Clinic / telehealth', constraints: 'Review labs and imaging', resourceTarget: 'clinic' },
  { id: 2, operation: 'Pre-op clearance', dependency: 'GI evaluation complete', provider: 'Anesthesia, cardiology', facility: 'Pre-op clinic', constraints: 'Anticoagulation plan', resourceTarget: 'blocked' },
  { id: 3, operation: 'Bowel prep education', dependency: 'Colonoscopy ordered', provider: 'GI nurse', facility: 'Phone / clinic', constraints: 'Renal-safe prep, escort required', resourceTarget: 'non-bookable' },
  { id: 4, operation: 'Colonoscopy + biopsy', dependency: 'Clearance + prep complete', provider: 'GI endoscopist, anesthesia', facility: 'Endoscopy + recovery', constraints: 'Sedation, fasting, escort', resourceTarget: 'endoscopy-moderate' },
  { id: 5, operation: 'Pathology review', dependency: 'Biopsy complete', provider: 'Pathologist, GI', facility: 'Pathology workflow', constraints: '2-5 day turnaround', resourceTarget: 'non-bookable' },
  { id: 6, operation: 'Surgery consult', dependency: 'Pathology available', provider: 'Colorectal surgeon', facility: 'Surgery clinic', constraints: 'Cancer priority', resourceTarget: 'clinic' },
  { id: 7, operation: 'Surgical clearance', dependency: 'Surgery recommended', provider: 'Anesthesia, cardiology', facility: 'Pre-op clinic', constraints: 'Diabetes, anticoagulation', resourceTarget: 'blocked' },
  { id: 8, operation: 'Colorectal surgery', dependency: 'Clearance complete', provider: 'Surgeon, OR team', facility: 'OR + PACU + bed', constraints: 'Equipment, bed availability', resourceTarget: 'operating-room' },
  { id: 9, operation: 'Recovery', dependency: 'Surgery complete', provider: 'Inpatient team', facility: 'PACU + inpatient', constraints: 'Length-of-stay planning', resourceTarget: 'recovery' },
  { id: 10, operation: 'Follow-up', dependency: 'Discharge complete', provider: 'Surgeon, GI, oncology', facility: 'Clinic', constraints: 'Final pathology review', resourceTarget: 'clinic' },
];

export const ROBERT_PATHWAY: PathwayStep[] = [
  { id: 1, operation: 'GI consult', dependency: 'Referral + labs', provider: 'Gastroenterologist', facility: 'Clinic room', constraints: '—', resourceTarget: 'clinic' },
  { id: 2, operation: 'Colonoscopy + biopsy', dependency: 'Step 1; anticoag held', provider: 'Endoscopist', facility: 'Endoscopy suite (MAC)', constraints: 'Apixaban hold, escort booked', resourceTarget: 'endoscopy-mac' },
  { id: 3, operation: 'Pathology read', dependency: 'Step 2 specimen', provider: 'Pathologist', facility: 'Histology lab', constraints: '3-5 business day gate', resourceTarget: 'non-bookable' },
  { id: 4, operation: 'Local staging (EUS)', dependency: 'Malignant read', provider: 'GI with EUS', facility: 'Endoscopy suite', constraints: 'Bundle opportunity with Step 2', resourceTarget: 'endoscopy-mac' },
  { id: 5, operation: 'Systemic staging (CT/MRI)', dependency: 'Step 3', provider: 'Radiology', facility: 'CT / MRI suite', constraints: 'Renal function check', resourceTarget: 'imaging' },
  { id: 6, operation: 'Surgical consult + tumor board', dependency: 'Steps 3-5', provider: 'Surgeon + oncologist', facility: 'Clinic / conference', constraints: 'Weekly board cadence', resourceTarget: 'clinic' },
  { id: 7, operation: 'Pre-anesthesia + cardiac clearance', dependency: 'Step 6 decision', provider: 'Anesthesiologist + cardiologist', facility: 'Pre-op clinic', constraints: 'AFib + OSA clearance', resourceTarget: 'blocked' },
  { id: 8, operation: 'Resection (lap colectomy)', dependency: 'Step 7 cleared', provider: 'Surgeon + OR team', facility: 'OR + PACU + bed', constraints: 'Atomic multi-resource booking', resourceTarget: 'operating-room' },
  { id: 9, operation: 'Post-anesthesia recovery', dependency: 'Step 8', provider: 'PACU → ward nursing', facility: 'Monitored bed', constraints: 'Bed class by comorbidity', resourceTarget: 'recovery' },
  { id: 10, operation: 'Discharge + follow-up', dependency: 'Step 9', provider: 'Surgeon, oncology', facility: 'Clinic', constraints: 'Margin pathology timing', resourceTarget: 'clinic' },
];

export const JAMES_PATHWAY: PathwayStep[] = [
  { id: 1, operation: 'Surveillance colonoscopy', dependency: 'Routine referral', provider: 'GI endoscopist', facility: 'Endoscopy suite', constraints: 'Standard moderate sedation', resourceTarget: 'endoscopy-moderate' },
  { id: 2, operation: 'Follow-up if polyp found', dependency: 'Procedure complete', provider: 'GI physician', facility: 'Clinic', constraints: 'Per findings', resourceTarget: 'clinic' },
];

export const ANYA_PATHWAY: PathwayStep[] = [
  { id: 1, operation: 'Referral clarification', dependency: 'Incomplete package received', provider: 'Access center + PCP', facility: 'Phone / fax', constraints: 'Hold all scheduling', resourceTarget: 'blocked' },
  { id: 2, operation: 'Re-run agent readiness', dependency: 'Corrected orders received', provider: 'Scheduling agent', facility: 'Work queue', constraints: 'Must pass completeness checks', resourceTarget: 'non-bookable' },
];

export const DAVID_PATHWAY: PathwayStep[] = [
  { id: 1, operation: 'Diagnostic colonoscopy', dependency: 'Positive FIT referral', provider: 'GI endoscopist', facility: 'Endoscopy suite', constraints: 'Standard moderate sedation', resourceTarget: 'endoscopy-moderate' },
  { id: 2, operation: 'Results follow-up', dependency: 'Procedure complete', provider: 'GI physician', facility: 'Clinic or phone', constraints: 'Per findings', resourceTarget: 'clinic' },
];

export const SOFIA_PATHWAY: PathwayStep[] = [
  { id: 1, operation: 'Oncology restaging consult', dependency: 'Referral received', provider: 'Medical oncology', facility: 'Clinic', constraints: 'Treatment calendar alignment', resourceTarget: 'clinic' },
  { id: 2, operation: 'EUS + colonoscopy bundle', dependency: 'Anticoagulation held', provider: 'GI endoscopist + anesthesia', facility: 'MAC endoscopy suite', constraints: 'Additional series coordination', resourceTarget: 'endoscopy-mac' },
  { id: 3, operation: 'Pathology review', dependency: 'Specimens collected', provider: 'Pathologist', facility: 'Histology lab', constraints: '3-5 day gate', resourceTarget: 'non-bookable' },
  { id: 4, operation: 'CT restaging', dependency: 'Pathology available', provider: 'Radiology', facility: 'CT suite', constraints: 'Renal function check', resourceTarget: 'imaging' },
  { id: 5, operation: 'Tumor board / next treatment', dependency: 'Restaging complete', provider: 'Oncology team', facility: 'Conference / clinic', constraints: 'Weekly cadence', resourceTarget: 'clinic' },
];

export function getPathwayForPatient(patientId: string): PathwayStep[] {
  switch (patientId) {
    case 'maria-chen':
      return MARIA_PATHWAY;
    case 'robert-tan':
      return ROBERT_PATHWAY;
    case 'james-miller':
      return JAMES_PATHWAY;
    case 'anya-patel':
      return ANYA_PATHWAY;
    case 'david-williams':
      return DAVID_PATHWAY;
    case 'sofia-nguyen':
      return SOFIA_PATHWAY;
    default:
      return [];
  }
}
