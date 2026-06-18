import { PATH_LABELS } from '../data/sopDecisionTree';
import type { SchedulingPath } from '../types/patient';
import type { PathReadinessResult, ReadinessCheck } from '../types/pathReadiness';
import type { RubricInput } from '../types/rubric';

const CLARIFICATION_FLAG_PATTERN =
  /clarification|incomplete referral|hold for review|referral incomplete/i;
const PROCEDURE_ACCESS_FLAG_PATTERN =
  /pathology gate|additional series|heavy sedation|suspected malignancy|anticoagulation hold|staging|multi-step/i;

function orderChecks(order: RubricInput['orders'][number]): ReadinessCheck[] {
  const indication = order.indication.trim();
  const vagueIndication =
    indication.length < 25 ||
    /pending|tbd|details pending|workup - see notes/i.test(indication);

  return [
    {
      id: `${order.id}-procedure`,
      label: 'Procedure type specified',
      passed: order.procedureType.trim().length > 0,
      detail: order.procedureType || 'Missing procedure type',
    },
    {
      id: `${order.id}-indication`,
      label: 'Clinical indication documented',
      passed: indication.length > 0 && !vagueIndication,
      detail: indication || 'No indication on file',
    },
    {
      id: `${order.id}-diagnosis`,
      label: 'Diagnosis codes attached',
      passed: order.diagnoses.length > 0,
      detail: order.diagnoses.join(', ') || 'No ICD-10 codes linked',
    },
    {
      id: `${order.id}-provider`,
      label: 'Ordering provider identified',
      passed: order.orderingProvider.trim().length > 0,
      detail: order.orderingProvider || 'Ordering provider missing',
    },
  ];
}

function hasClarificationSignal(input: RubricInput, checks: ReadinessCheck[]): boolean {
  const allOrders = [...input.orders, ...input.addonOrders];
  const failedCritical = checks.some((check) => !check.passed);

  const clarificationFlags = allOrders.flatMap((order) =>
    order.priorityFlags.filter((flag) => CLARIFICATION_FLAG_PATTERN.test(flag)),
  );

  const awaitingCallback = input.schedulingConstraints.some((constraint) =>
    /awaiting|pending pcp|callback|clarification/i.test(constraint),
  );

  return failedCritical || clarificationFlags.length > 0 || awaitingCallback;
}

function hasProcedureAccessSignal(input: RubricInput): boolean {
  const allOrders = [...input.orders, ...input.addonOrders];

  if (allOrders.length >= 3) return true;

  const accessFlags = allOrders.flatMap((order) =>
    order.priorityFlags.filter((flag) => PROCEDURE_ACCESS_FLAG_PATTERN.test(flag)),
  );
  if (accessFlags.length > 0) return true;

  const invasiveOrders = allOrders.filter((order) =>
    /colonoscopy|endoscopy|eus|surgery|resection|ct |mri|or /i.test(order.procedureType),
  );
  if (invasiveOrders.length >= 2) return true;

  const complexConstraints = input.schedulingConstraints.filter((constraint) =>
    /mac|pathology|bridge|escort|clearance|multi-step|atomic/i.test(constraint),
  );

  return complexConstraints.length >= 2;
}

function guidanceForPath(path: SchedulingPath, readyToSchedule: boolean): Pick<PathReadinessResult, 'messages' | 'decisions' | 'summary'> {
  switch (path) {
    case 'clarification':
      return {
        summary: 'Not ready to schedule — order completeness or accuracy issues require clarification.',
        messages: [
          'The agent could not validate that the referral package is complete and internally consistent.',
          'Scheduling must pause until the ordering provider or intake team resolves missing details.',
          'Do not communicate final appointment type to the patient until clarification is resolved.',
        ],
        decisions: [
          'Route to Clarification Needed queue and contact the ordering provider.',
          'Document what is missing (indication, diagnosis, or referral intent) before re-running agent review.',
          'Do not place room holds until the case returns as ready to schedule.',
        ],
      };
    case 'procedure-access':
      return {
        summary: readyToSchedule
          ? 'Ready for Procedure Access — multi-step coordination required before dates are finalized.'
          : 'Procedure Access pathway identified — complete dependency checks before booking.',
        messages: [
          'Orders imply a multi-step GI/oncology sequence rather than a single standard booking.',
          'Dependencies such as clearance, sedation class, or pathology gates must be tracked in the care graph.',
          'Capacity holds should align with the full sequence, not an isolated appointment.',
        ],
        decisions: [
          'Assign to Procedure Access workflow and review the care operation graph.',
          'Confirm prep, sedation, anticoagulation, and downstream resource dependencies.',
          'Offer slots only when they satisfy the next unlocked step in the pathway.',
        ],
      };
    case 'standard':
    default:
      return {
        summary: 'Ready to schedule — orders are complete, accurate, and suitable for standard scheduling.',
        messages: [
          'Referral documentation passed completeness and consistency checks.',
          'No clarification flags or multi-step dependency conflicts were detected.',
          'Standard scheduling workflow may proceed using agent acuity and room recommendations.',
        ],
        decisions: [
          'Route to Standard Scheduling and offer the first matching recommended room slot.',
          'Confirm patient-facing instructions for prep and arrival only after slot selection.',
          'Escalate to Procedure Access if new orders or add-ons change the care sequence.',
        ],
      };
  }
}

export function evaluatePathReadiness(input: RubricInput): PathReadinessResult {
  const allOrders = [...input.orders, ...input.addonOrders];
  const checks = allOrders.flatMap((order) => orderChecks(order));

  if (allOrders.length === 0) {
    const guidance = guidanceForPath('clarification', false);
    return {
      path: 'clarification',
      readyToSchedule: false,
      checks: [
        {
          id: 'orders-present',
          label: 'At least one active order on file',
          passed: false,
          detail: 'No orders found for scheduling review',
        },
      ],
      ...guidance,
    };
  }

  if (hasClarificationSignal(input, checks)) {
    const guidance = guidanceForPath('clarification', false);
    return {
      path: 'clarification',
      readyToSchedule: false,
      checks,
      ...guidance,
    };
  }

  if (hasProcedureAccessSignal(input)) {
    const guidance = guidanceForPath('procedure-access', true);
    return {
      path: 'procedure-access',
      readyToSchedule: true,
      checks,
      ...guidance,
    };
  }

  const guidance = guidanceForPath('standard', true);
  return {
    path: 'standard',
    readyToSchedule: true,
    checks,
    ...guidance,
  };
}

export function pathLabel(path: SchedulingPath): string {
  return PATH_LABELS[path];
}
