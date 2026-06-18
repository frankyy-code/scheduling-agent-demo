import { PATH_LABELS, SOP_QUESTIONS } from '../../data/sopDecisionTree';
import { SOP_MANDATE_COPY } from '../../data/labels';
import { useDemoState } from '../../hooks/useDemoState';

const Q1 = SOP_QUESTIONS.q1;
const Q2 = SOP_QUESTIONS.q2;
const Q3 = SOP_QUESTIONS.q3;

interface SOPDecisionTreeProps {
  patientId: string;
  patientName: string;
  mrn: string;
}

export function SOPDecisionTree({ patientId, patientName, mrn }: SOPDecisionTreeProps) {
  const { getSopState, answerSopQuestion, submitSopTemplate } = useDemoState();
  const state = getSopState(patientId);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100 bg-amber-50">
        <p className="text-xs text-amber-800 font-medium">{SOP_MANDATE_COPY}</p>
      </div>
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Scheduling Decision Tree</h3>

        <div className="flex flex-col gap-6">
          <QuestionBlock
            question={Q1}
            answer={state.q1}
            onAnswer={(answer) => answerSopQuestion(patientId, 'q1', answer)}
          />

          {state.q1 === 'Yes' && (
            <QuestionBlock
              question={Q2}
              answer={state.q2}
              onAnswer={(answer) => answerSopQuestion(patientId, 'q2', answer)}
            />
          )}

          {state.q1 === 'No' && (
            <QuestionBlock
              question={Q3}
              answer={state.q3}
              onAnswer={(answer) => answerSopQuestion(patientId, 'q3', answer)}
            />
          )}

          {state.showTemplate && (
            <IntakeTemplate
              patientName={patientName}
              mrn={mrn}
              submitted={state.templateSubmitted}
              onSubmit={() => submitSopTemplate(patientId)}
            />
          )}

          {state.resolvedPath && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-800">Decision tree complete.</p>
              <p className="mt-2">Path selected: {PATH_LABELS[state.resolvedPath]}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionBlock({
  question,
  answer,
  onAnswer,
}: {
  question: string;
  answer?: 'Yes' | 'No';
  onAnswer: (answer: 'Yes' | 'No') => void;
}) {
  const isAnswered = answer !== undefined;

  return (
    <div className="pb-6 border-b border-gray-100 last:border-b-0 last:pb-0">
      <p className="text-sm text-gray-800 mb-4">{question}</p>
      <div className="flex gap-3">
        <OptionButton
          label="Yes"
          selected={answer === 'Yes'}
          isAnswered={isAnswered}
          onClick={() => onAnswer('Yes')}
        />
        <OptionButton
          label="No"
          selected={answer === 'No'}
          isAnswered={isAnswered}
          onClick={() => onAnswer('No')}
        />
      </div>
    </div>
  );
}

function OptionButton({
  label,
  selected,
  isAnswered,
  onClick,
}: {
  label: 'Yes' | 'No';
  selected: boolean;
  isAnswered: boolean;
  onClick: () => void;
}) {
  const base = 'px-6 py-2 rounded-md text-sm font-medium';

  if (isAnswered) {
    return (
      <span
        className={`${base} ${
          selected
            ? 'bg-mayo-navy text-white'
            : 'border border-gray-300 text-gray-800 bg-white'
        }`}
      >
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${
        label === 'Yes'
          ? 'bg-mayo-navy text-white hover:bg-mayo-navy-dark'
          : 'border border-gray-300 text-gray-800 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

function IntakeTemplate({
  patientName,
  mrn,
  submitted,
  onSubmit,
}: {
  patientName: string;
  mrn: string;
  submitted: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className={`space-y-3 pt-2 ${submitted ? 'opacity-75' : ''}`}>
      <p className="text-sm font-medium text-gray-800">Complete intake template</p>
      <p className="text-xs text-gray-500">
        Scheduler will contact patient within 24-48 hours. Verify phone number on file.
      </p>
      <div className="grid gap-3">
        <Field label="Patient name" value={patientName} readOnly />
        <Field label="MRN" value={mrn} readOnly />
        <Field label="Is the order approved? (Y/N)" placeholder="Y" readOnly={submitted} />
        <Field label="Best day(s) of week" placeholder="Mon, Wed" readOnly={submitted} />
        <Field label="Preferred time (specific)" placeholder="Earliest possible 0700" readOnly={submitted} />
        <Field label="Frequency / series" placeholder="Every 8 weeks" readOnly={submitted} />
        <Field label="Best contact number" placeholder="555-0100" readOnly={submitted} />
        <Field
          label="Additional appointments note"
          placeholder="Patient also needs cardiology clearance..."
          readOnly={submitted}
        />
      </div>
      {!submitted ? (
        <button
          type="button"
          onClick={onSubmit}
          className="mt-2 px-4 py-2 bg-mayo-navy text-white text-sm rounded-md"
        >
          Submit template & continue
        </button>
      ) : (
        <p className="text-xs font-medium text-gray-500 mt-2">Template submitted</p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  readOnly,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <input
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full text-sm px-3 py-2 border border-gray-200 rounded-md ${
          readOnly ? 'bg-gray-100 text-gray-600' : ''
        }`}
      />
    </div>
  );
}
