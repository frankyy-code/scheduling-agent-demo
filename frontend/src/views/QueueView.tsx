import { useNavigate } from 'react-router-dom';
import { useDemoState } from '../hooks/useDemoState';
import { useOrderFeed } from '../hooks/useOrderFeed';
import { PatientHeader } from '../components/layout/PatientHeader';
import { InbasketMessages } from '../components/queue/InbasketMessages';
import { OrdersPanel } from '../components/queue/OrdersPanel';
import { CalendarStrip } from '../components/queue/CalendarStrip';
import { CareSequencePreview } from '../components/queue/CareSequencePreview';
import { SOPDecisionTree } from '../components/intake/SOPDecisionTree';

export function QueueView() {
  const navigate = useNavigate();
  const {
    rankedQueue,
    selectedPatientId,
    setSelectedPatientId,
    selectedPatient,
    agentReviewStarted,
    agentReviewLoading,
    startAgentReview,
  } = useDemoState();
  const orderFeed = useOrderFeed(selectedPatientId);

  return (
    <div className="space-y-6">
      <PatientHeader patient={selectedPatient} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <InbasketMessages
            patients={rankedQueue}
            selectedPatientId={selectedPatientId}
            onSelect={setSelectedPatientId}
            acuityRevealed={agentReviewStarted}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedPatient && (
            <>
              <div className="bg-mayo-light-blue border border-mayo-navy/20 rounded-lg p-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    Ready to Review: {selectedPatient.displayName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Medical records received and ready for evaluation
                  </p>
                </div>
                <button
                  type="button"
                  disabled={agentReviewLoading || agentReviewStarted}
                  onClick={async () => {
                    navigate('/agent-review');
                    await startAgentReview();
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-mayo-navy text-white rounded-md font-medium text-sm hover:bg-mayo-navy-dark whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-xs">
                    {agentReviewLoading ? '…' : '▶'}
                  </span>
                  {agentReviewLoading
                    ? 'AI Agent Review running...'
                    : agentReviewStarted
                      ? 'AI Agent Review complete'
                      : 'Start AI Agent Review'}
                </button>
              </div>

              <SOPDecisionTree
                patientId={selectedPatient.patientId}
                patientName={selectedPatient.displayName}
                mrn={selectedPatient.mrn}
              />

              {agentReviewStarted && <CareSequencePreview patient={selectedPatient} />}

              <CalendarStrip />

              {agentReviewStarted && orderFeed.hasAddon && !orderFeed.alreadyApplied && (
                <button
                  type="button"
                  onClick={orderFeed.apply}
                  className="w-full py-2 border-2 border-dashed border-urgent text-urgent text-sm font-medium rounded-lg hover:bg-urgent-bg"
                >
                  {orderFeed.triggerLabel}
                </button>
              )}

              {agentReviewStarted && (
                <OrdersPanel
                  baselineOrders={orderFeed.baselineOrders}
                  addonOrders={orderFeed.addonOrders}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
