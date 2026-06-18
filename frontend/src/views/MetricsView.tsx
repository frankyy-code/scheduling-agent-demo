import { MetricsCards } from '../components/metrics/MetricsCards';
import { getFeedbackEntries } from '../services/feedbackStore';

export function MetricsView() {
  const feedback = getFeedbackEntries();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Metrics Dashboard</h2>
      <MetricsCards />
      {feedback.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold mb-3">Recent Feedback (Overrides & Actions)</h3>
          <ul className="space-y-2">
            {feedback.slice(-5).reverse().map((f) => (
              <li key={f.id} className="text-sm text-gray-600 border-b pb-2">
                <strong>{f.action}</strong> — {f.patientId}
                {f.reason && `: ${f.reason}`}
                <span className="text-xs text-gray-400 ml-2">
                  {new Date(f.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
