import type { AcuityResult } from '../../types/rubric';

interface AgentReasoningPanelProps {
  patientName: string;
  acuity: AcuityResult;
  rank: number;
  compassSessionId?: string;
}

export function AgentReasoningPanel({
  patientName,
  acuity,
  rank,
  compassSessionId,
}: AgentReasoningPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Agent Reasoning — {patientName}</h3>
        <span className="text-xs bg-mayo-navy text-white px-2 py-1 rounded">Rank #{rank}</span>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase">Acuity Tier</p>
          <p
            className={`text-lg font-bold mt-1 ${
              acuity.tier === 'High' ? 'text-urgent' : 'text-green-700'
            }`}
          >
            {acuity.tier}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase">Reason</p>
          <ul className="mt-2 space-y-1">
            {acuity.reasons.map((r) => (
              <li key={r} className="text-sm text-gray-700 flex gap-2">
                <span className="text-mayo-navy">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase">Recommended Action</p>
          <ul className="mt-2 space-y-1">
            {acuity.recommendedActions.map((a) => (
              <li key={a} className="text-sm text-gray-700 flex gap-2">
                <span className="text-green-600">→</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
        {compassSessionId && (
          <p className="text-xs text-gray-400 pt-2 border-t">
            Compass session: {compassSessionId}
          </p>
        )}
      </div>
    </div>
  );
}
