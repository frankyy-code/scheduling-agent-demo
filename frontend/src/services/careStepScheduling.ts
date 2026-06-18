import type { PathwayStep } from '../data/pathways';
import { getPathwayForPatient } from '../data/pathways';
import type { QueuePatient } from '../types/patient';

type PathwayStepWithTarget = PathwayStep;

function isDeferredOrder(order: QueuePatient['ordersBundle']['orders'][number]): boolean {
  const window = order.requestedWindow.toLowerCase();
  return (
    window.includes('after pathology') ||
    order.priorityFlags.some((flag) => /pending pathology gate/i.test(flag))
  );
}

function findNextSchedulableOrder(patient: QueuePatient) {
  const orders = [...patient.ordersBundle.orders, ...patient.addonOrders];
  return orders.find((order) => !isDeferredOrder(order)) ?? orders[0] ?? null;
}

function matchStepToOrder(pathway: PathwayStepWithTarget[], procedureType: string): number | null {
  const procedure = procedureType.toLowerCase();

  if (/^gi consult|consult -|\bconsult\b|clinic evaluation|new patient consult/i.test(procedure)) {
    const step = pathway.find(
      (s) =>
        s.resourceTarget === 'clinic' &&
        /consult|evaluation|follow-up|restaging consult/i.test(s.operation),
    );
    return step?.id ?? null;
  }

  if (/^ct |^mri |ultrasound|pet scan|radiology/i.test(procedure)) {
    const step = pathway.find(
      (s) => s.resourceTarget === 'imaging' || /ct|mri|staging/i.test(s.operation),
    );
    return step?.id ?? null;
  }

  if (/operating room| colectomy|resection|laparoscopic surgery|surgery/i.test(procedure)) {
    const step = pathway.find(
      (s) => s.resourceTarget === 'operating-room' || /surgery|resection|colectomy/i.test(s.operation),
    );
    return step?.id ?? null;
  }

  if (/colonoscopy|endoscopy|sigmoidoscopy|eus/i.test(procedure)) {
    const step = pathway.find(
      (s) =>
        (s.resourceTarget === 'endoscopy-moderate' || s.resourceTarget === 'endoscopy-mac') &&
        /colonoscopy|endoscopy|eus/i.test(s.operation),
    );
    return step?.id ?? null;
  }

  return null;
}

export function getPathwaySteps(patientId: string): PathwayStepWithTarget[] {
  return getPathwayForPatient(patientId) as PathwayStepWithTarget[];
}

export function getAgentRecommendedStepId(patient: QueuePatient): number | null {
  const pathway = getPathwaySteps(patient.patientId);
  if (pathway.length === 0) return null;

  if (patient.pathReadiness?.path === 'clarification') {
    return pathway[0]?.id ?? null;
  }

  const nextOrder = findNextSchedulableOrder(patient);
  if (!nextOrder) {
    return pathway.find((s) => s.resourceTarget !== 'non-bookable' && s.resourceTarget !== 'blocked')
      ?.id ?? pathway[0].id;
  }

  return matchStepToOrder(pathway, nextOrder.procedureType) ?? pathway[0].id;
}

export function getPathwayStep(
  patientId: string,
  stepId: number,
): PathwayStepWithTarget | undefined {
  return getPathwaySteps(patientId).find((step) => step.id === stepId);
}

export function getEffectiveSchedulingStepId(
  patient: QueuePatient,
  selectedStepId: number | null | undefined,
): number | null {
  const pathway = getPathwaySteps(patient.patientId);
  if (pathway.length === 0) return null;

  if (selectedStepId && pathway.some((step) => step.id === selectedStepId)) {
    return selectedStepId;
  }

  return getAgentRecommendedStepId(patient);
}

export function getEffectiveSchedulingStep(
  patient: QueuePatient,
  selectedStepId: number | null | undefined,
): PathwayStepWithTarget | null {
  const stepId = getEffectiveSchedulingStepId(patient, selectedStepId);
  if (!stepId) return null;
  return getPathwayStep(patient.patientId, stepId) ?? null;
}
