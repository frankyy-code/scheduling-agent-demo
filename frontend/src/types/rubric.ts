import type { AcuityTier, ClinicalOrder, SymptomEntry } from './patient';

export interface AcuityBreakdownItem {
  label: string;
  points: number;
  source: string;
}

export interface AcuityResult {
  tier: AcuityTier;
  score: number;
  reasons: string[];
  recommendedActions: string[];
  breakdown: AcuityBreakdownItem[];
}

export interface RubricInput {
  orders: ClinicalOrder[];
  symptoms: SymptomEntry[];
  activeConditions: string[];
  schedulingConstraints: string[];
  addonOrders: ClinicalOrder[];
}
