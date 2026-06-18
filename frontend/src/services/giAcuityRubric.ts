import type { RubricInput, AcuityResult, AcuityBreakdownItem } from '../types/rubric';
import type { AcuityTier } from '../types/patient';

const HIGH_SIGNALS: { keyword: string; label: string; points: number }[] = [
  { keyword: 'suspected malignancy', label: 'Suspected malignancy signal on order', points: 15 },
  { keyword: 'red flag', label: 'Red flag symptom flag on order', points: 15 },
  { keyword: 'weight loss', label: 'Weight loss documented on order', points: 15 },
  { keyword: 'anemia', label: 'Anemia documented on order', points: 15 },
  { keyword: 'rectal bleeding', label: 'Rectal bleeding documented on order', points: 15 },
  { keyword: 'anticoagulation', label: 'Anticoagulation complicates scheduling', points: 15 },
  { keyword: 'heavy sedation', label: 'Heavy sedation room required', points: 15 },
];

export function scoreAcuity(input: RubricInput): AcuityResult {
  const reasons: string[] = [];
  const breakdown: AcuityBreakdownItem[] = [];
  let score = 0;

  for (const order of [...input.orders, ...input.addonOrders]) {
    const text = `${order.indication} ${order.priorityFlags.join(' ')}`.toLowerCase();

    for (const signal of HIGH_SIGNALS) {
      if (text.includes(signal.keyword)) {
        score += signal.points;
        breakdown.push({
          label: signal.label,
          points: signal.points,
          source: `${order.procedureType} (${order.id})`,
        });
        if (signal.keyword === 'suspected malignancy') {
          reasons.push('Indication suggests possible malignancy');
        }
        if (['weight loss', 'anemia', 'rectal bleeding'].includes(signal.keyword)) {
          reasons.push('Recent encounter indicates worsening symptoms');
        }
        if (signal.keyword === 'anticoagulation') {
          reasons.push('Anticoagulation hold window required before invasive steps');
        }
        if (signal.keyword === 'heavy sedation') {
          reasons.push('Sedation class elevated — heavy sedation room policy applies');
        }
      }
    }

    if (
      order.requestedWindow.toLowerCase().includes('within 7') ||
      order.requestedWindow.toLowerCase().includes('within 14')
    ) {
      score += 10;
      breakdown.push({
        label: 'Tight requested scheduling window',
        points: 10,
        source: `${order.requestedWindow} (${order.id})`,
      });
      reasons.push('Existing appointment window exceeds specialty target for routine cases');
    }
  }

  for (const condition of input.activeConditions) {
    if (condition.toLowerCase().includes('suspected') || condition.toLowerCase().includes('cancer')) {
      score += 20;
      breakdown.push({
        label: 'Active condition suggests suspected malignancy',
        points: 20,
        source: condition,
      });
    }
  }

  for (const c of input.schedulingConstraints) {
    if (c.toLowerCase().includes('escort')) {
      reasons.push('Patient constraint: discharge escort required for sedated procedures');
      score += 5;
      breakdown.push({ label: 'Discharge escort required', points: 5, source: c });
    }
    if (c.toLowerCase().includes('mac') || c.toLowerCase().includes('osa')) {
      reasons.push('Facility constraint: anesthesia-supervised MAC required');
      score += 10;
      breakdown.push({ label: 'MAC / OSA facility constraint', points: 10, source: c });
    }
  }

  if (input.orders.length === 1 && input.symptoms.length === 0) {
    score = Math.min(score, 25);
    reasons.length = 0;
    breakdown.length = 0;
    breakdown.push({
      label: 'Routine surveillance — no red flag symptoms',
      points: 25,
      source: 'Single stable order, no active symptoms',
    });
    reasons.push('Routine surveillance — no red flag symptoms');
  }

  const uniqueReasons = [...new Set(reasons)];
  const tier: AcuityTier = score >= 40 ? 'High' : 'Routine';

  breakdown.push({
    label: `Tier threshold (${tier} ≥ 40 pts for High)`,
    points: 0,
    source: `Final score: ${score}`,
  });

  const recommendedActions: string[] = [];
  if (tier === 'High') {
    recommendedActions.push('Prioritize above routine surveillance');
    recommendedActions.push('Offer first available matching slot with sedation-capable room');
    recommendedActions.push('If no slot within target window, flag capacity mismatch');
  } else {
    recommendedActions.push('Schedule within standard 90-day surveillance window');
    recommendedActions.push('Standard moderate sedation room acceptable');
  }

  if (input.addonOrders.length > 0) {
    recommendedActions.push('Re-evaluate dependency graph — physician add-on order received');
  }

  return { tier, score, reasons: uniqueReasons, recommendedActions, breakdown };
}

export function rankQueue<
  T extends {
    patientId: string;
    ordersBundle: { orders: unknown[] };
    symptomsBundle: {
      symptoms: unknown[];
      activeConditions: string[];
      schedulingConstraints: string[];
    };
    addonOrders: unknown[];
  },
>(patients: T[]): (T & { rank: number; acuity: AcuityResult })[] {
  const scored = patients.map((p) => ({
    ...p,
    acuity: scoreAcuity({
      orders: p.ordersBundle.orders as import('../types/patient').ClinicalOrder[],
      symptoms: p.symptomsBundle.symptoms as import('../types/patient').SymptomEntry[],
      activeConditions: p.symptomsBundle.activeConditions,
      schedulingConstraints: p.symptomsBundle.schedulingConstraints,
      addonOrders: p.addonOrders as import('../types/patient').ClinicalOrder[],
    }),
  }));

  scored.sort((a, b) => b.acuity.score - a.acuity.score);
  return scored.map((p, i) => ({ ...p, rank: i + 1 }));
}

export function acuityInputFromPatient(patient: {
  ordersBundle: { orders: import('../types/patient').ClinicalOrder[] };
  symptomsBundle: {
    symptoms: import('../types/patient').SymptomEntry[];
    activeConditions: string[];
    schedulingConstraints: string[];
  };
  addonOrders: import('../types/patient').ClinicalOrder[];
}): RubricInput {
  return {
    orders: patient.ordersBundle.orders,
    symptoms: patient.symptomsBundle.symptoms,
    activeConditions: patient.symptomsBundle.activeConditions,
    schedulingConstraints: patient.symptomsBundle.schedulingConstraints,
    addonOrders: patient.addonOrders,
  };
}
