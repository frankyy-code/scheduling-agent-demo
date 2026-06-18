import type { SopState } from '../hooks/useDemoState';
import type { SchedulingPath } from '../types/patient';

export const SOP_QUESTIONS = {
  q1: "Is this the patient's first series / new referral for this care type?",
  q2: 'Is the patient requesting to schedule an additional series?',
  q3: 'Is the patient requesting to reschedule a currently scheduled appointment?',
} as const;

export const PATH_LABELS: Record<SchedulingPath, string> = {
  standard: 'Standard Scheduling',
  'procedure-access': 'Procedure Access (complex pathway)',
  clarification: 'Clarification Needed',
};

export interface SopGuidance {
  path: SchedulingPath;
  pathLabel: string;
  branchSummary: string;
  messages: string[];
  decisions: string[];
}

export function getSopGuidance(state: SopState): SopGuidance | null {
  if (state.q1 === 'Yes' && state.q2 === 'No') {
    return {
      path: 'standard',
      pathLabel: PATH_LABELS.standard,
      branchSummary: 'New referral — not an additional series.',
      messages: [
        'Patient is on a first-time referral pathway for this care type.',
        'No add-on series intake template is required before scheduling.',
        'Communicate appointment details only after the decision tree is complete.',
      ],
      decisions: [
        'Proceed with standard scheduling using agent-ranked acuity and room recommendations.',
        'Confirm prep, anticoagulation hold, and escort constraints from order flags before booking.',
        'Offer the first recommended endoscopy slot that matches sedation requirements.',
      ],
    };
  }

  if (state.q1 === 'Yes' && state.q2 === 'Yes') {
    return {
      path: 'procedure-access',
      pathLabel: PATH_LABELS['procedure-access'],
      branchSummary: 'New referral requesting an additional series.',
      messages: [
        'Patient needs a complex procedure-access intake before dates are finalized.',
        state.templateSubmitted
          ? 'Intake template submitted — patient contact window is 24-48 hours.'
          : 'Intake template must be completed before confirming appointment type with the patient.',
      ],
      decisions: [
        'Use the intake template to capture preferred days, times, and contact details.',
        'Do not promise a specific appointment type until template review is complete.',
        'After intake, align the series with the agent care sequence and capacity holds.',
      ],
    };
  }

  if (state.q1 === 'No' && state.q3 === 'No') {
    return {
      path: 'procedure-access',
      pathLabel: PATH_LABELS['procedure-access'],
      branchSummary: 'Returning patient — not a reschedule request.',
      messages: [
        'Patient is not on a first-series referral and is not rescheduling an existing appointment.',
        'Route through procedure access to validate the next step in the care sequence.',
      ],
      decisions: [
        'Review prior pathway steps before offering new slots.',
        'Confirm downstream dependencies (pathology, clearance, sedation class) with agent recommendations.',
        'Hold capacity only after procedure-access criteria are satisfied.',
      ],
    };
  }

  if (state.q1 === 'No' && state.q3 === 'Yes') {
    return {
      path: 'procedure-access',
      pathLabel: PATH_LABELS['procedure-access'],
      branchSummary: 'Reschedule request for an existing appointment.',
      messages: [
        'Patient is requesting to move a currently scheduled appointment.',
        state.templateSubmitted
          ? 'Reschedule intake template submitted — verify contact number and preferred windows.'
          : 'Complete the intake template to capture reschedule preferences before releasing holds.',
      ],
      decisions: [
        'Release or move any existing room hold before booking a replacement slot.',
        'Check whether reschedule affects bundled steps (prep, clearance, OR/PACU).',
        'Confirm the new slot still meets sedation and resource constraints from orders.',
      ],
    };
  }

  if (state.resolvedPath) {
    const path = state.resolvedPath;
    return {
      path,
      pathLabel: PATH_LABELS[path],
      branchSummary: 'Decision tree completed.',
      messages: [`Path selected: ${PATH_LABELS[path]}`],
      decisions: ['Review agent recommendations and selected room hold before accepting.'],
    };
  }

  return null;
}

export function getSopAnswerRows(state: SopState): { question: string; answer: string }[] {
  const rows: { question: string; answer: string }[] = [];

  if (state.q1) {
    rows.push({ question: SOP_QUESTIONS.q1, answer: state.q1 });
  }
  if (state.q1 === 'Yes' && state.q2) {
    rows.push({ question: SOP_QUESTIONS.q2, answer: state.q2 });
  }
  if (state.q1 === 'No' && state.q3) {
    rows.push({ question: SOP_QUESTIONS.q3, answer: state.q3 });
  }

  return rows;
}

export function isDecisionTreeComplete(state: SopState): boolean {
  if (state.q1 === 'Yes' && state.q2 === 'No') return true;
  if (state.q1 === 'No' && state.q3 === 'No') return true;
  if (state.q1 === 'Yes' && state.q2 === 'Yes') return state.templateSubmitted;
  if (state.q1 === 'No' && state.q3 === 'Yes') return state.templateSubmitted;
  return state.resolvedPath !== null;
}
