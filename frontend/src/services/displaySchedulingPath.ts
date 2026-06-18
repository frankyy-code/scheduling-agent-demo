import type { SopState } from '../hooks/useDemoState';
import type { SchedulingPath } from '../types/patient';
import { getSopGuidance, isDecisionTreeComplete, PATH_LABELS } from '../data/sopDecisionTree';

export interface DisplaySchedulingPath {
  showPathBadge: boolean;
  path: SchedulingPath | null;
  label: string | null;
  routingText: string;
}

export function getDisplaySchedulingPath(
  agentPath: SchedulingPath | null | undefined,
  sopState: SopState,
): DisplaySchedulingPath {
  if (!agentPath) {
    return {
      showPathBadge: false,
      path: null,
      label: null,
      routingText: 'Run AI agent review to determine routing.',
    };
  }

  if (agentPath === 'clarification') {
    return {
      showPathBadge: true,
      path: 'clarification',
      label: PATH_LABELS.clarification,
      routingText: `Route to ${PATH_LABELS.clarification}`,
    };
  }

  if (agentPath === 'standard') {
    return {
      showPathBadge: true,
      path: 'standard',
      label: PATH_LABELS.standard,
      routingText: `Route to ${PATH_LABELS.standard}`,
    };
  }

  const sopGuidance = getSopGuidance(sopState);
  if (
    sopGuidance?.path === 'procedure-access' &&
    isDecisionTreeComplete(sopState)
  ) {
    return {
      showPathBadge: true,
      path: 'procedure-access',
      label: PATH_LABELS['procedure-access'],
      routingText: `Route to ${PATH_LABELS['procedure-access']}`,
    };
  }

  return {
    showPathBadge: false,
    path: null,
    label: null,
    routingText:
      'Agent identified a multi-step pathway — complete the scheduling decision tree to confirm Procedure Access routing.',
  };
}
