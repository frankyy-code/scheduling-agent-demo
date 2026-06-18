import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { QueuePatient, QueueStatus, SchedulingPath } from '../types/patient';
import type { AcuityResult } from '../types/rubric';
import type { DocumentReviewSession } from '../types/compass';
import type { BookedSlot } from '../types/scheduling';
import { buildInitialQueue } from '../services/mockDataLoaders';
import { rankQueue, scoreAcuity, acuityInputFromPatient } from '../services/giAcuityRubric';
import { evaluatePathReadiness } from '../services/schedulingPathEvaluator';
import {
  hasAddonOrder,
  loadAddonOrder,
} from '../services/orderFeedService';
import { startDocumentReview } from '../services/compassApi';
import { addFeedbackEntry } from '../services/feedbackStore';
import { sleep } from '../utils/sleep';

export interface SopState {
  q1?: 'Yes' | 'No';
  q2?: 'Yes' | 'No';
  q3?: 'Yes' | 'No';
  showTemplate: boolean;
  templateSubmitted: boolean;
  resolvedPath: SchedulingPath | null;
}

const EMPTY_SOP: SopState = {
  showTemplate: false,
  templateSubmitted: false,
  resolvedPath: null,
};

interface RankedPatient extends QueuePatient {
  rank: number;
  acuity: AcuityResult | null;
}

interface DemoContextValue {
  queue: QueuePatient[];
  rankedQueue: RankedPatient[];
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  selectedPatient: QueuePatient | null;
  schedulingPath: SchedulingPath | null;
  getSopState: (patientId: string) => SopState;
  answerSopQuestion: (patientId: string, question: 'q1' | 'q2' | 'q3', answer: 'Yes' | 'No') => void;
  submitSopTemplate: (patientId: string) => void;
  compassSession: DocumentReviewSession | null;
  agentReviewTriggered: boolean;
  agentReviewLoading: boolean;
  agentReviewStarted: boolean;
  startAgentReview: () => Promise<void>;
  applyAddonOrder: (patientId: string) => void;
  updatePatientStatus: (patientId: string, status: QueueStatus) => void;
  submitReviewAction: (
    patientId: string,
    action: 'accept' | 'override' | 'manual-review',
    reason?: string,
  ) => void;
  msacApprovals: Record<string, boolean>;
  setMsacApproval: (id: string, approved: boolean) => void;
  slotBookings: BookedSlot[];
  bookSlot: (booking: BookedSlot) => void;
  clearPatientSlot: (patientId: string) => void;
  getSchedulingStepId: (patientId: string) => number | null;
  setSchedulingStepId: (patientId: string, stepId: number | null) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueuePatient[]>(() => buildInitialQueue());
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>('maria-chen');
  const [schedulingPath, setSchedulingPath] = useState<SchedulingPath | null>(null);
  const [sopByPatient, setSopByPatient] = useState<Record<string, SopState>>({});
  const [compassSession, setCompassSession] = useState<DocumentReviewSession | null>(null);
  const [agentReviewTriggered, setAgentReviewTriggered] = useState(false);
  const [agentReviewLoading, setAgentReviewLoading] = useState(false);
  const [agentReviewStarted, setAgentReviewStarted] = useState(false);
  const [msacApprovals, setMsacApprovals] = useState<Record<string, boolean>>({});
  const [slotBookings, setSlotBookings] = useState<BookedSlot[]>([]);
  const [schedulingStepByPatient, setSchedulingStepByPatient] = useState<
    Record<string, number | null>
  >({});

  const rankedQueue = useMemo((): RankedPatient[] => {
    if (!agentReviewStarted) {
      return queue.map((p, i) => ({ ...p, rank: i + 1, acuity: null }));
    }
    return rankQueue(queue);
  }, [queue, agentReviewStarted]);

  const selectedPatient = useMemo(
    () => queue.find((p) => p.patientId === selectedPatientId) ?? null,
    [queue, selectedPatientId],
  );

  const getSopState = useCallback(
    (patientId: string): SopState => sopByPatient[patientId] ?? EMPTY_SOP,
    [sopByPatient],
  );

  const answerSopQuestion = useCallback(
    (patientId: string, question: 'q1' | 'q2' | 'q3', answer: 'Yes' | 'No') => {
      setSopByPatient((prev) => {
        const current = prev[patientId] ?? { ...EMPTY_SOP };
        const next: SopState = { ...current, [question]: answer };

        if (question === 'q2') {
          if (answer === 'Yes') {
            next.showTemplate = true;
          } else {
            next.resolvedPath = 'standard';
          }
        }

        if (question === 'q3') {
          if (answer === 'Yes') {
            next.showTemplate = true;
          } else {
            next.resolvedPath = 'procedure-access';
          }
        }

        return { ...prev, [patientId]: next };
      });

      if (question === 'q2' && answer === 'No') {
        setSchedulingPath('standard');
      } else if (question === 'q3' && answer === 'No') {
        setSchedulingPath('procedure-access');
      }
    },
    [],
  );

  const submitSopTemplate = useCallback((patientId: string) => {
    setSopByPatient((prev) => ({
      ...prev,
      [patientId]: {
        ...(prev[patientId] ?? EMPTY_SOP),
        showTemplate: true,
        templateSubmitted: true,
        resolvedPath: 'procedure-access',
      },
    }));
    setSchedulingPath('procedure-access');
  }, []);

  const startAgentReview = useCallback(async () => {
    if (!selectedPatient || agentReviewLoading || agentReviewStarted) return;

    setAgentReviewTriggered(true);
    setAgentReviewLoading(true);

    setQueue((q) =>
      q.map((p) =>
        p.patientId === selectedPatient.patientId
          ? { ...p, status: 'In Agent Review' as QueueStatus }
          : p,
      ),
    );

    await sleep(5000);

    const scored = rankQueue(queue);
    setAgentReviewStarted(true);
    setQueue((q) =>
      q.map((p) => {
        const ranked = scored.find((s) => s.patientId === p.patientId)!;
        const pathReadiness = evaluatePathReadiness(acuityInputFromPatient(p));
        return {
          ...p,
          urgent: ranked.acuity.tier === 'High',
          preScoreAcuity: ranked.acuity.tier,
          pathReadiness,
        };
      }),
    );

    const session = await startDocumentReview({
      patientId: selectedPatient.patientId,
      mrn: selectedPatient.mrn,
      symptoms: selectedPatient.symptomsBundle.symptoms,
    });
    setCompassSession(session);
    setQueue((q) =>
      q.map((p) =>
        p.patientId === selectedPatient.patientId
          ? { ...p, status: 'Awaiting Scheduler' as QueueStatus }
          : p,
      ),
    );
    setAgentReviewLoading(false);
  }, [selectedPatient, queue, agentReviewLoading, agentReviewStarted]);

  const applyAddonOrder = useCallback(
    (patientId: string) => {
      if (!hasAddonOrder(patientId)) return;
      const order = loadAddonOrder(patientId);
      if (!order) return;
      setQueue((q) => {
        const updated = q.map((p) =>
          p.patientId === patientId
            ? { ...p, addonOrders: [...p.addonOrders, order] }
            : p,
        );
        if (!agentReviewStarted) return updated;
        return updated.map((p) => {
          const input = acuityInputFromPatient(p);
          const acuity = scoreAcuity(input);
          const pathReadiness = evaluatePathReadiness(input);
          return {
            ...p,
            urgent: acuity.tier === 'High',
            preScoreAcuity: acuity.tier,
            pathReadiness,
          };
        });
      });
    },
    [agentReviewStarted],
  );

  const updatePatientStatus = useCallback((patientId: string, status: QueueStatus) => {
    setQueue((q) => q.map((p) => (p.patientId === patientId ? { ...p, status } : p)));
  }, []);

  const submitReviewAction = useCallback(
    (
      patientId: string,
      action: 'accept' | 'override' | 'manual-review',
      reason?: string,
    ) => {
      addFeedbackEntry({ patientId, action, reason });
      const status: QueueStatus =
        action === 'accept'
          ? 'Accepted'
          : action === 'override'
            ? 'Overridden'
            : 'Manual Review';
      updatePatientStatus(patientId, status);
    },
    [updatePatientStatus],
  );

  const setMsacApproval = useCallback((id: string, approved: boolean) => {
    setMsacApprovals((prev) => ({ ...prev, [id]: approved }));
  }, []);

  const bookSlot = useCallback((booking: BookedSlot) => {
    setSlotBookings((prev) => {
      const taken = prev.find(
        (b) =>
          b.roomId === booking.roomId &&
          b.start === booking.start &&
          b.patientId !== booking.patientId,
      );
      if (taken) return prev;

      const withoutPatient = prev.filter((b) => b.patientId !== booking.patientId);
      const withoutSlot = withoutPatient.filter(
        (b) => !(b.roomId === booking.roomId && b.start === booking.start),
      );
      return [...withoutSlot, booking];
    });
  }, []);

  const clearPatientSlot = useCallback((patientId: string) => {
    setSlotBookings((prev) => prev.filter((b) => b.patientId !== patientId));
  }, []);

  const getSchedulingStepId = useCallback(
    (patientId: string): number | null => schedulingStepByPatient[patientId] ?? null,
    [schedulingStepByPatient],
  );

  const setSchedulingStepId = useCallback((patientId: string, stepId: number | null) => {
    setSchedulingStepByPatient((prev) => ({ ...prev, [patientId]: stepId }));
  }, []);

  const value: DemoContextValue = {
    queue,
    rankedQueue,
    selectedPatientId,
    setSelectedPatientId,
    selectedPatient,
    schedulingPath,
    getSopState,
    answerSopQuestion,
    submitSopTemplate,
    compassSession,
    agentReviewTriggered,
    agentReviewLoading,
    agentReviewStarted,
    startAgentReview,
    applyAddonOrder,
    updatePatientStatus,
    submitReviewAction,
    msacApprovals,
    setMsacApproval,
    slotBookings,
    bookSlot,
    clearPatientSlot,
    getSchedulingStepId,
    setSchedulingStepId,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoState() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemoState must be used within DemoProvider');
  return ctx;
}
