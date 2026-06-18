import { useDemoState } from './useDemoState';
import {
  getAddonTriggerLabel,
  hasAddonOrder,
} from '../services/orderFeedService';

export function useOrderFeed(patientId: string | null) {
  const { applyAddonOrder, selectedPatient } = useDemoState();
  const id = patientId ?? selectedPatient?.patientId ?? '';
  const triggerLabel = id ? getAddonTriggerLabel(id) : '';
  const hasAddon = id ? hasAddonOrder(id) : false;
  const alreadyApplied =
    selectedPatient?.addonOrders.some((o) => o.status === 'New') ?? false;

  return {
    triggerLabel,
    hasAddon,
    alreadyApplied,
    apply: () => id && applyAddonOrder(id),
    addonOrders: selectedPatient?.addonOrders ?? [],
    baselineOrders: selectedPatient?.ordersBundle.orders ?? [],
  };
}
