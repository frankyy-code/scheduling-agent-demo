import type { PathReadinessResult } from '../../types/pathReadiness';

interface PathReadinessPanelProps {
  readiness: PathReadinessResult;
  routingText: string;
}

export function PathReadinessPanel({ readiness, routingText }: PathReadinessPanelProps) {
  const passedCount = readiness.checks.filter((check) => check.passed).length;
  const failedCount = readiness.checks.length - passedCount;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Pathing &amp; Readiness</h3>
      </div>

      <div className="p-6 space-y-5">
        <p className="text-sm text-gray-700">{readiness.summary}</p>

        <details className="rounded-md border border-gray-200">
          <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:bg-gray-50">
            Order completeness &amp; accuracy checks ({passedCount} passed
            {failedCount > 0 ? `, ${failedCount} failed` : ''})
          </summary>
          <ul className="space-y-2 p-4 pt-0 border-t border-gray-100">
            {readiness.checks.map((check) => (
              <li
                key={check.id}
                className={`text-sm rounded-md border px-3 py-2 ${
                  check.passed
                    ? 'border-green-100 bg-green-50 text-green-900'
                    : 'border-amber-100 bg-amber-50 text-amber-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="font-bold">{check.passed ? '✓' : '!'}</span>
                  <div>
                    <p className="font-medium">{check.label}</p>
                    <p className="text-xs mt-0.5 opacity-80">{check.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </details>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Routing decision</p>
          <p className="text-sm font-medium text-mayo-navy">{routingText}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Agent messages</p>
          <ul className="space-y-1">
            {readiness.messages.map((message) => (
              <li key={message} className="text-sm text-gray-700">
                · {message}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Scheduler decisions</p>
          <ul className="space-y-1">
            {readiness.decisions.map((decision) => (
              <li key={decision} className="text-sm text-gray-800">
                · {decision}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
