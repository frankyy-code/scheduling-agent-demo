import type { ClinicalOrder } from '../types/patient';
import { getAdditionalOrderFile } from './mockDataLoaders';

export function loadAddonOrder(patientId: string): ClinicalOrder | null {
  const file = getAdditionalOrderFile(patientId);
  return file.order;
}

export function getAddonTriggerLabel(patientId: string): string {
  return getAdditionalOrderFile(patientId).triggerLabel;
}

export function hasAddonOrder(patientId: string): boolean {
  const file = getAdditionalOrderFile(patientId);
  return file.order !== null;
}

export function getDependencyImpact(patientId: string) {
  return getAdditionalOrderFile(patientId).dependencyImpact;
}
