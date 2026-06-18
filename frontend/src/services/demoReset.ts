import { resetFeedbackStore } from './feedbackStore';

export function resetDemo(): void {
  resetFeedbackStore();
  sessionStorage.clear();
  window.location.href = '/';
}
