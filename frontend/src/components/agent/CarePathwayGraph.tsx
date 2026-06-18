import type { PathwayStep } from '../../data/pathways';

interface CarePathwayGraphProps {
  steps: PathwayStep[];
  patientId: string;
}

export function CarePathwayGraph({ steps, patientId }: CarePathwayGraphProps) {
  const blockedStep =
    patientId === 'robert-tan' ? 8 : patientId === 'maria-chen' ? 4 : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Care Operation Graph</h3>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-36 p-3 rounded-lg border text-center ${
                  step.id === blockedStep
                    ? 'border-red-400 bg-red-50'
                    : 'border-mayo-navy/30 bg-mayo-light-blue'
                }`}
              >
                <p className="text-xs font-bold text-mayo-navy">Step {step.id}</p>
                <p className="text-xs mt-1 font-medium text-gray-800">{step.operation}</p>
                <p className="text-[10px] text-gray-500 mt-1">{step.provider}</p>
              </div>
              {i < steps.length - 1 && (
                <span className="text-mayo-navy mx-1">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
