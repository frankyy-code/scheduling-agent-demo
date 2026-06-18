import type { QueuePatient } from '../types/patient';
import type { RoomAvailability } from '../types/scheduling';
import type { PathwayStep } from '../data/pathways';
import {
  getAgentRecommendedStepId,
  getEffectiveSchedulingStep,
} from './careStepScheduling';

export type RoomMatchStatus =
  | 'recommended'
  | 'acceptable'
  | 'incompatible'
  | 'not-applicable'
  | 'scheduling-hold';

export type SchedulingResourceTarget =
  | 'clinic'
  | 'endoscopy-moderate'
  | 'endoscopy-mac'
  | 'operating-room'
  | 'imaging'
  | 'recovery'
  | 'blocked';

export interface RoomRequirements {
  schedulingContext: SchedulingResourceTarget;
  requiredCapabilities: string[];
  sedationRequirement: 'anesthesia-supervised-mac' | 'moderate-sedation' | null;
  nextOrderLabel: string | null;
  careStepId: number | null;
  careStepLabel: string | null;
  sources: string[];
  summary: string;
}

export interface RoomMatchResult {
  status: RoomMatchStatus;
  reason: string;
  warning: string | null;
}

const ENDOSCOPY_CAPS = new Set(['moderate-sedation', 'anesthesia-supervised-mac']);

function isEndoscopyRoom(room: RoomAvailability): boolean {
  return room.capabilities.some((c) => ENDOSCOPY_CAPS.has(c));
}

function isClinicRoom(room: RoomAvailability): boolean {
  return room.capabilities.includes('clinic-exam') || room.capabilities.includes('telehealth');
}

function isOperatingRoom(room: RoomAvailability): boolean {
  return room.capabilities.includes('general-anesthesia');
}

function isImagingRoom(room: RoomAvailability): boolean {
  return room.capabilities.some((cap) =>
    ['ct-scan', 'mri', 'pet-ct', 'diagnostic-imaging'].includes(cap),
  );
}

function isGiClinicRoom(room: RoomAvailability): boolean {
  return isClinicRoom(room) && /gi/i.test(room.name);
}

function isColorectalOrRoom(room: RoomAvailability): boolean {
  return isOperatingRoom(room) && room.capabilities.includes('colorectal');
}

function imagingCapabilitiesForStep(step: PathwayStep): string[] {
  const operation = step.operation.toLowerCase();
  if (/mri/i.test(operation)) return ['mri'];
  if (/pet/i.test(operation)) return ['pet-ct'];
  if (/ct/i.test(operation)) return ['ct-scan'];
  return ['ct-scan', 'mri'];
}

function stepNeedsEus(step: PathwayStep): boolean {
  return /eus/i.test(step.operation);
}

function orderText(order: {
  procedureType: string;
  indication: string;
  priorityFlags: string[];
}): string {
  return `${order.procedureType} ${order.indication} ${order.priorityFlags.join(' ')}`.toLowerCase();
}

function patientNeedsMac(patient: QueuePatient): boolean {
  const orders = [...patient.ordersBundle.orders, ...patient.addonOrders];
  const constraints = patient.symptomsBundle.schedulingConstraints;

  const heavySedationFlags = orders.flatMap((o) =>
    o.priorityFlags.filter((f) => f.toLowerCase().includes('heavy sedation')),
  );

  const macConstraints = constraints.filter((c) => {
    const lower = c.toLowerCase();
    return lower.includes('mac') || lower.includes('anesthesia-supervised');
  });

  const elevatedSedationOrders = orders.filter((o) =>
    orderText(o).includes('elevated sedation risk'),
  );

  return (
    heavySedationFlags.length > 0 ||
    macConstraints.length > 0 ||
    elevatedSedationOrders.length > 0
  );
}

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

function classifyNextTarget(
  patient: QueuePatient,
  nextOrder: NonNullable<ReturnType<typeof findNextSchedulableOrder>>,
): SchedulingResourceTarget {
  const procedure = nextOrder.procedureType.toLowerCase();

  if (/^gi consult|consult -|\bconsult\b|clinic evaluation|new patient consult/i.test(procedure)) {
    if (!/colonoscopy|endoscopy|eus/i.test(procedure)) {
      return 'clinic';
    }
  }

  if (/^ct |^mri |ultrasound|pet scan|radiology/i.test(procedure)) {
    return 'imaging';
  }

  if (/operating room| colectomy|resection|laparoscopic surgery|surgery/i.test(procedure)) {
    return 'operating-room';
  }

  if (/colonoscopy|endoscopy|sigmoidoscopy|eus/i.test(procedure)) {
    return patientNeedsMac(patient) ? 'endoscopy-mac' : 'endoscopy-moderate';
  }

  if (/anticoagulation bridge|clearance|anesthesia planning/i.test(procedure)) {
    return 'blocked';
  }

  return 'endoscopy-moderate';
}

function isRecoveryRoom(room: RoomAvailability): boolean {
  return (
    room.capabilities.includes('recovery-bay') || room.capabilities.includes('inpatient-bed')
  );
}

function deriveRoomRequirementsFromStep(
  step: PathwayStep,
  sources: string[],
): RoomRequirements {
  const stepSources = [
    ...sources,
    `Care sequence step ${step.id}: ${step.operation}`,
    `Facility: ${step.facility}`,
  ];
  const base = {
    careStepId: step.id,
    careStepLabel: step.operation,
    nextOrderLabel: step.operation,
    sources: stepSources,
  };

  if (step.resourceTarget === 'non-bookable') {
    return {
      ...base,
      schedulingContext: 'blocked',
      requiredCapabilities: [],
      sedationRequirement: null,
      summary: `Step ${step.id} (${step.operation}) is not booked through room/resource slots here — ${step.constraints}.`,
    };
  }

  switch (step.resourceTarget) {
    case 'clinic':
      return {
        ...base,
        schedulingContext: 'clinic',
        requiredCapabilities: ['clinic-exam'],
        sedationRequirement: null,
        summary: `Scheduling Step ${step.id} — ${step.operation}. Recommend GI clinic room.`,
      };
    case 'imaging': {
      const imagingCaps = imagingCapabilitiesForStep(step);
      return {
        ...base,
        schedulingContext: 'imaging',
        requiredCapabilities: imagingCaps,
        sedationRequirement: null,
        summary: `Scheduling Step ${step.id} — ${step.operation}. Recommend ${imagingCaps.map(formatCapability).join(' or ')} resources.`,
      };
    }
    case 'operating-room':
      return {
        ...base,
        schedulingContext: 'operating-room',
        requiredCapabilities: ['general-anesthesia'],
        sedationRequirement: null,
        summary: `Scheduling Step ${step.id} — ${step.operation}. Recommend operating room resources.`,
      };
    case 'recovery':
      return {
        ...base,
        schedulingContext: 'recovery',
        requiredCapabilities: ['recovery-bay', 'inpatient-bed'],
        sedationRequirement: null,
        summary: `Scheduling Step ${step.id} — ${step.operation}. Recommend PACU and inpatient bed holds aligned with the surgical slot.`,
      };
    case 'endoscopy-mac': {
      const macCaps = ['anesthesia-supervised-mac'];
      if (stepNeedsEus(step)) {
        macCaps.push('eus-staging');
      }
      return {
        ...base,
        schedulingContext: 'endoscopy-mac',
        requiredCapabilities: macCaps,
        sedationRequirement: 'anesthesia-supervised-mac',
        summary: `Scheduling Step ${step.id} — ${step.operation}. Recommend a MAC-capable endoscopy suite${stepNeedsEus(step) ? ' with EUS' : ''}.`,
      };
    }
    case 'endoscopy-moderate': {
      const moderateCaps = ['moderate-sedation'];
      if (stepNeedsEus(step)) {
        moderateCaps.push('eus-staging');
      }
      return {
        ...base,
        schedulingContext: 'endoscopy-moderate',
        requiredCapabilities: moderateCaps,
        sedationRequirement: 'moderate-sedation',
        summary: `Scheduling Step ${step.id} — ${step.operation}. Recommend a moderate sedation endoscopy suite${stepNeedsEus(step) ? ' with EUS' : ''}.`,
      };
    }
    case 'blocked':
    default:
      return {
        ...base,
        schedulingContext: 'blocked',
        requiredCapabilities: [],
        sedationRequirement: null,
        summary: `Step ${step.id} (${step.operation}) must be coordinated before a room hold — ${step.constraints}.`,
      };
  }
}

export function deriveRoomRequirements(
  patient: QueuePatient,
  selectedStepId?: number | null,
): RoomRequirements {
  const pathReadiness = patient.pathReadiness;
  const agentRecommendedStepId = getAgentRecommendedStepId(patient);
  const effectiveStep = getEffectiveSchedulingStep(patient, selectedStepId);
  const isManualStepSelection =
    selectedStepId != null &&
    agentRecommendedStepId != null &&
    selectedStepId !== agentRecommendedStepId;

  const sources: string[] = [];
  if (isManualStepSelection && effectiveStep) {
    sources.push(
      `Scheduler selected Step ${effectiveStep.id} (agent recommended Step ${agentRecommendedStepId})`,
    );
  } else if (agentRecommendedStepId) {
    sources.push(`Agent recommended next step: Step ${agentRecommendedStepId}`);
  }

  if (effectiveStep) {
    return deriveRoomRequirementsFromStep(effectiveStep, sources);
  }

  if (pathReadiness?.path === 'clarification' || pathReadiness?.readyToSchedule === false) {
    return {
      schedulingContext: 'blocked',
      requiredCapabilities: [],
      sedationRequirement: null,
      nextOrderLabel: null,
      careStepId: null,
      careStepLabel: null,
      sources: pathReadiness?.checks.filter((check) => !check.passed).map((check) => check.label) ?? [],
      summary:
        'Scheduling hold — clarification required before any room can be recommended.',
    };
  }

  const nextOrder = findNextSchedulableOrder(patient);
  if (!nextOrder) {
    return {
      schedulingContext: 'blocked',
      requiredCapabilities: [],
      sedationRequirement: null,
      nextOrderLabel: null,
      careStepId: null,
      careStepLabel: null,
      sources: [],
      summary: 'No schedulable orders identified for room matching.',
    };
  }

  const target = classifyNextTarget(patient, nextOrder);
  const orderSources = [`Next schedulable order: ${nextOrder.procedureType} (${nextOrder.id})`, ...sources];

  switch (target) {
    case 'clinic': {
      const summary =
        patientNeedsMac(patient) &&
        [...patient.ordersBundle.orders, ...patient.addonOrders].some((o) =>
          /colonoscopy|endoscopy|eus/i.test(o.procedureType),
        )
          ? `Recommend GI clinic room for the next step: ${nextOrder.procedureType}. When colonoscopy/endoscopy is scheduled, use a MAC-capable endoscopy suite if required.`
          : `Recommend GI clinic room for the next step: ${nextOrder.procedureType}.`;
      return {
        schedulingContext: 'clinic',
        requiredCapabilities: ['clinic-exam'],
        sedationRequirement: null,
        nextOrderLabel: nextOrder.procedureType,
        careStepId: null,
        careStepLabel: null,
        sources: orderSources,
        summary,
      };
    }
    case 'imaging':
      return {
        schedulingContext: 'imaging',
        requiredCapabilities: [],
        sedationRequirement: null,
        nextOrderLabel: nextOrder.procedureType,
        careStepId: null,
        careStepLabel: null,
        sources: orderSources,
        summary: `Next step is imaging (${nextOrder.procedureType}) — book through radiology scheduling, not endoscopy rooms.`,
      };
    case 'operating-room':
      return {
        schedulingContext: 'operating-room',
        requiredCapabilities: ['general-anesthesia'],
        sedationRequirement: null,
        nextOrderLabel: nextOrder.procedureType,
        careStepId: null,
        careStepLabel: null,
        sources: orderSources,
        summary: `Next step requires an operating room: ${nextOrder.procedureType}.`,
      };
    case 'endoscopy-mac': {
      const macSources = [...orderSources];
      if (patientNeedsMac(patient)) {
        macSources.push('MAC / heavy sedation requirements documented on orders or constraints');
      }
      return {
        schedulingContext: 'endoscopy-mac',
        requiredCapabilities: ['anesthesia-supervised-mac'],
        sedationRequirement: 'anesthesia-supervised-mac',
        nextOrderLabel: nextOrder.procedureType,
        careStepId: null,
        careStepLabel: null,
        sources: [...new Set(macSources)],
        summary: `Recommend a MAC-capable endoscopy suite for ${nextOrder.procedureType}.`,
      };
    }
    case 'endoscopy-moderate':
      return {
        schedulingContext: 'endoscopy-moderate',
        requiredCapabilities: ['moderate-sedation'],
        sedationRequirement: 'moderate-sedation',
        nextOrderLabel: nextOrder.procedureType,
        careStepId: null,
        careStepLabel: null,
        sources: orderSources,
        summary: `Recommend a moderate sedation endoscopy suite for ${nextOrder.procedureType}.`,
      };
    case 'blocked':
    default:
      return {
        schedulingContext: 'blocked',
        requiredCapabilities: [],
        sedationRequirement: null,
        nextOrderLabel: nextOrder.procedureType,
        careStepId: null,
        careStepLabel: null,
        sources: orderSources,
        summary: `Next order (${nextOrder.procedureType}) must be coordinated before a room hold is appropriate.`,
      };
  }
}

export function evaluateRoomMatch(
  room: RoomAvailability,
  requirements: RoomRequirements,
): RoomMatchResult {
  if (requirements.schedulingContext === 'blocked') {
    return {
      status: 'scheduling-hold',
      reason: requirements.summary,
      warning: 'Do not book a room until clarification or prerequisite steps are resolved.',
    };
  }

  if (requirements.schedulingContext === 'imaging') {
    if (!isImagingRoom(room)) {
      return {
        status: 'not-applicable',
        reason: `Imaging step (${requirements.nextOrderLabel}) requires radiology resources, not ${room.name}.`,
        warning: `${room.name} is not an imaging suite for the current care step.`,
      };
    }

    const missing = requirements.requiredCapabilities.filter(
      (cap) => !room.capabilities.includes(cap),
    );
    if (missing.length > 0) {
      return {
        status: 'acceptable',
        reason: `${room.name} is imaging-capable but is not the best match for ${missing.map(formatCapability).join(', ')}.`,
        warning: null,
      };
    }

    return {
      status: 'recommended',
      reason: `${room.name} matches the imaging step (${requirements.nextOrderLabel}).`,
      warning: null,
    };
  }

  if (requirements.schedulingContext === 'clinic') {
    if (isGiClinicRoom(room)) {
      return {
        status: 'recommended',
        reason: `${room.name} matches the clinic consult step (${requirements.nextOrderLabel}).`,
        warning: null,
      };
    }
    if (isClinicRoom(room)) {
      return {
        status: 'acceptable',
        reason: `${room.name} can host the visit, but a GI clinic room is preferred for this step.`,
        warning: null,
      };
    }
    if (isEndoscopyRoom(room) || isOperatingRoom(room)) {
      return {
        status: 'not-applicable',
        reason: `Endoscopy/OR resources are not the next step — ${requirements.nextOrderLabel} belongs in clinic.`,
        warning: `${room.name} is for a later care step, not the current GI consult.`,
      };
    }
    return {
      status: 'not-applicable',
      reason: 'This resource does not match the next clinic consult step.',
      warning: null,
    };
  }

  if (requirements.schedulingContext === 'operating-room') {
    if (isOperatingRoom(room)) {
      const colorectalStep =
        requirements.careStepLabel != null &&
        /colorect|resection|colectomy|surgery/i.test(requirements.careStepLabel);

      if (colorectalStep && isColorectalOrRoom(room)) {
        return {
          status: 'recommended',
          reason: `${room.name} is optimized for colorectal surgery (${requirements.nextOrderLabel}).`,
          warning: null,
        };
      }

      if (colorectalStep && !room.capabilities.includes('colorectal')) {
        return {
          status: 'acceptable',
          reason: `${room.name} can be used, but a colorectal-dedicated OR is preferred.`,
          warning: null,
        };
      }

      return {
        status: 'recommended',
        reason: `${room.name} matches the surgical step (${requirements.nextOrderLabel}).`,
        warning: null,
      };
    }
    return {
      status: 'not-applicable',
      reason: `Next step is surgical — ${requirements.nextOrderLabel} requires OR resources, not this room.`,
      warning: null,
    };
  }

  if (
    requirements.schedulingContext === 'endoscopy-mac' ||
    requirements.schedulingContext === 'endoscopy-moderate'
  ) {
    if (!isEndoscopyRoom(room)) {
      return {
        status: 'not-applicable',
        reason: `Next step (${requirements.nextOrderLabel}) requires an endoscopy suite, not this resource.`,
        warning: `${room.name} is not an endoscopy suite for the current scheduling step.`,
      };
    }

    const missing = requirements.requiredCapabilities.filter(
      (cap) => !room.capabilities.includes(cap),
    );
    if (missing.length > 0) {
      return {
        status: 'incompatible',
        reason: `Missing ${missing.map(formatCapability).join(', ')}. ${requirements.summary}`,
        warning: `${room.name} does not meet sedation requirements for this patient. ${requirements.summary}`,
      };
    }

    if (requirements.schedulingContext === 'endoscopy-mac') {
      const hasEus = room.capabilities.includes('eus-staging');
      const needsEus = requirements.requiredCapabilities.includes('eus-staging');

      if (needsEus && hasEus) {
        return {
          status: 'recommended',
          reason: `${room.name} meets MAC and EUS requirements for this step.`,
          warning: null,
        };
      }

      return {
        status: 'recommended',
        reason: `${room.name} meets MAC sedation requirements for this step.`,
        warning: null,
      };
    }

    const moderateOnly =
      room.capabilities.includes('moderate-sedation') &&
      !room.capabilities.includes('anesthesia-supervised-mac');

    if (moderateOnly) {
      const needsEus = requirements.requiredCapabilities.includes('eus-staging');
      if (needsEus && room.capabilities.includes('eus-staging')) {
        return {
          status: 'recommended',
          reason: `${room.name} is the preferred moderate sedation suite with EUS for this step.`,
          warning: null,
        };
      }

      return {
        status: 'recommended',
        reason: `${room.name} is a preferred moderate sedation suite for this step.`,
        warning: null,
      };
    }

    return {
      status: 'acceptable',
      reason: `${room.name} meets sedation requirements but a more specific suite may be preferred.`,
      warning: null,
    };
  }

  if (requirements.schedulingContext === 'recovery') {
    if (isRecoveryRoom(room)) {
      return {
        status: 'recommended',
        reason: `${room.name} matches post-procedure recovery for Step ${requirements.careStepId} (${requirements.careStepLabel}).`,
        warning: null,
      };
    }
    if (isClinicRoom(room) || isEndoscopyRoom(room)) {
      return {
        status: 'not-applicable',
        reason: `Step ${requirements.careStepId} requires PACU or inpatient bed resources, not ${room.name}.`,
        warning: null,
      };
    }
    return {
      status: 'not-applicable',
      reason: 'Recovery step requires PACU or inpatient bed holds.',
      warning: null,
    };
  }

  return {
    status: 'not-applicable',
    reason: '',
    warning: null,
  };
}

export function formatCapability(cap: string): string {
  return cap.replace(/-/g, ' ');
}

export type RoomCategory =
  | 'Clinic & Consult'
  | 'Endoscopy'
  | 'Operating Room'
  | 'Imaging'
  | 'Recovery & Inpatient';

export function getRoomCategory(room: RoomAvailability): RoomCategory {
  if (isClinicRoom(room)) return 'Clinic & Consult';
  if (isEndoscopyRoom(room)) return 'Endoscopy';
  if (isOperatingRoom(room)) return 'Operating Room';
  if (isImagingRoom(room)) return 'Imaging';
  if (isRecoveryRoom(room)) return 'Recovery & Inpatient';
  return 'Clinic & Consult';
}

const ROOM_CATEGORY_ORDER: RoomCategory[] = [
  'Clinic & Consult',
  'Endoscopy',
  'Operating Room',
  'Imaging',
  'Recovery & Inpatient',
];

export function groupRoomsByCategory(
  rooms: RoomAvailability[],
): { category: RoomCategory; rooms: RoomAvailability[] }[] {
  const grouped = new Map<RoomCategory, RoomAvailability[]>();

  for (const room of rooms) {
    const category = getRoomCategory(room);
    const list = grouped.get(category) ?? [];
    list.push(room);
    grouped.set(category, list);
  }

  return ROOM_CATEGORY_ORDER.filter((category) => grouped.has(category)).map((category) => ({
    category,
    rooms: grouped.get(category)!,
  }));
}
