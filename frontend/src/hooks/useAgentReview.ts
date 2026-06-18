import { useDemoState } from './useDemoState';

export function useAgentReview() {
  const {
    rankedQueue,
    compassSession,
    agentReviewTriggered,
    agentReviewLoading,
    agentReviewStarted,
    startAgentReview,
    selectedPatient,
    getSopState,
  } = useDemoState();

  const selectedRanked = rankedQueue.find(
    (p) => p.patientId === selectedPatient?.patientId,
  );

  return {
    rankedQueue,
    compassSession,
    agentReviewTriggered,
    agentReviewLoading,
    agentReviewStarted,
    startAgentReview,
    selectedRanked,
    selectedPatient,
    getSopState,
  };
}
