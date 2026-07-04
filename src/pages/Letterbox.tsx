import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useI18n } from '@/i18n/I18nProvider';
import { useResult } from '@/features/results/useResult';
import {
  DuplicateSuggestionError,
  insertQuestionSuggestion,
  insertTypeSuggestion,
  isSupabaseConfigured,
  LetterboxUnconfiguredError,
} from '@/features/letterbox/letterboxDb';
import {
  clearQuestionDraft,
  clearTypeDraft,
  isCoolingDown,
  loadQuestionDraft,
  loadTypeDraft,
  saveQuestionDraft,
  saveTypeDraft,
  secondsUntilReady,
  startCooldown,
} from '@/features/letterbox/storage';
import { ANSWER_FORMATS, emptyQuestionDraft, emptyTypeDraft, type AnswerFormat, type LetterboxMode, type QuestionSuggestionDraft, type TypeSuggestionDraft } from '@/features/letterbox/types';
import { validateQuestionSuggestion, validateTypeSuggestion } from '@/features/letterbox/validation';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'success'; mode: LetterboxMode; id: string }
  | { kind: 'duplicate'; mode: LetterboxMode }
  | { kind: 'error'; message: string; details?: string };

const MIN_SECONDS_BEFORE_SUBMIT = 3;

export function Letterbox() {
  const { t, lang } = useI18n();
  const result = useResult();
  const [mode, setMode] = useState<LetterboxMode>('type');
  const [typeDraft, setTypeDraft] = useState<TypeSuggestionDraft>(() => loadTypeDraft());
  const [questionDraft, setQuestionDraft] = useState<QuestionSuggestionDraft>(() => loadQuestionDraft());
  const [typeErrors, setTypeErrors] = useState<Record<string, string>>({});
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });
  const openedAt = useRef(Date.now());

  useEffect(() => {
    saveTypeDraft(typeDraft);
  }, [typeDraft]);

  useEffect(() => {
    saveQuestionDraft(questionDraft);
  }, [questionDraft]);

  const draftLength = useMemo(
    () => JSON.stringify(typeDraft).length + JSON.stringify(questionDraft).length,
    [typeDraft, questionDraft],
  );

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (draftLength < 450 || submitState.kind === 'success') return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [draftLength, submitState.kind]);

  const currentType = result?.primary ?? null;
  const cooldownSeconds = secondsUntilReady();
  const submitLabel = submitState.kind === 'saving' ? t('letterbox.actions.sending') : t('letterbox.actions.submit');

  const submitType = async () => {
    if (submitState.kind === 'saving') return;
    setTypeErrors({});
    setSubmitState({ kind: 'idle' });
    if (Date.now() - openedAt.current < MIN_SECONDS_BEFORE_SUBMIT * 1000) {
      setSubmitState({ kind: 'error', message: t('letterbox.errors.tooFast') });
      return;
    }
    if (isCoolingDown()) {
      setSubmitState({ kind: 'error', message: t('letterbox.errors.cooldown', { seconds: cooldownSeconds }) });
      return;
    }
    const validated = validateTypeSuggestion(typeDraft, lang, currentType);
    if (!validated.ok || !validated.value) {
      setTypeErrors(validated.errors);
      return;
    }
    setSubmitState({ kind: 'saving' });
    try {
      const { id } = await insertTypeSuggestion(validated.value);
      clearTypeDraft();
      setTypeDraft(emptyTypeDraft);
      startCooldown();
      setSubmitState({ kind: 'success', mode: 'type', id });
    } catch (error) {
      if (error instanceof DuplicateSuggestionError) {
        setSubmitState({ kind: 'duplicate', mode: 'type' });
      } else if (error instanceof LetterboxUnconfiguredError) {
        setSubmitState({ kind: 'error', message: t('letterbox.errors.unconfigured') });
      } else {
        setSubmitState({
          kind: 'error',
          message: t('letterbox.errors.submitFailed'),
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }
  };

  const submitQuestion = async () => {
    if (submitState.kind === 'saving') return;
    setQuestionErrors({});
    setSubmitState({ kind: 'idle' });
    if (Date.now() - openedAt.current < MIN_SECONDS_BEFORE_SUBMIT * 1000) {
      setSubmitState({ kind: 'error', message: t('letterbox.errors.tooFast') });
      return;
    }
    if (isCoolingDown()) {
      setSubmitState({ kind: 'error', message: t('letterbox.errors.cooldown', { seconds: cooldownSeconds }) });
      return;
    }
    const validated = validateQuestionSuggestion(questionDraft, lang, currentType);
    if (!validated.ok || !validated.value) {
      setQuestionErrors(validated.errors);
      return;
    }
    setSubmitState({ kind: 'saving' });
    try {
      const { id } = await insertQuestionSuggestion(validated.value);
      clearQuestionDraft();
      setQuestionDraft(emptyQuestionDraft);
      startCooldown();
      setSubmitState({ kind: 'success', mode: 'question', id });
    } catch (error) {
      if (error instanceof DuplicateSuggestionError) {
        setSubmitState({ kind: 'duplicate', mode: 'question' });
      } else if (error instanceof LetterboxUnconfiguredError) {
        setSubmitState({ kind: 'error', message: t('letterbox.errors.unconfigured') });
      } else {
        setSubmitState({
          kind: 'error',
          message: t('letterbox.errors.submitFailed'),
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }
  };

  const resetForAnother = () => {
    setSubmitState({ kind: 'idle' });
    openedAt.current = Date.now();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader kicker={t('letterbox.kicker')} title={t('letterbox.title')} subtitle={t('letterbox.subtitle')} />

      <section className="panel p-5 sm:p-6">
        <p className="max-w-3xl text-sm leading-relaxed text-parchment/80">{t('letterbox.intro')}</p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-haze">{t('letterbox.privacy')}</p>
        {!isSupabaseConfigured && (
          <p className="mt-4 rounded-lg border border-amber-glow/35 bg-amber-glow/10 px-3 py-2 text-sm text-amber-glow" role="status">
            {t('letterbox.unconfiguredNote')}
          </p>
        )}
      </section>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2" role="tablist" aria-label={t('letterbox.tabs.label')}>
        <ModeButton active={mode === 'type'} title={t('letterbox.tabs.type')} body={t('letterbox.tabs.typeBody')} onClick={() => setMode('type')} />
        <ModeButton active={mode === 'question'} title={t('letterbox.tabs.question')} body={t('letterbox.tabs.questionBody')} onClick={() => setMode('question')} />
      </div>

      <section className="panel mt-5 p-5 sm:p-6">
        {mode === 'type' ? (
          <TypeForm
            draft={typeDraft}
            errors={typeErrors}
            currentType={currentType}
            submitLabel={submitLabel}
            disabled={submitState.kind === 'saving'}
            onChange={setTypeDraft}
            onSubmit={submitType}
          />
        ) : (
          <QuestionForm
            draft={questionDraft}
            errors={questionErrors}
            currentType={currentType}
            submitLabel={submitLabel}
            disabled={submitState.kind === 'saving'}
            onChange={setQuestionDraft}
            onSubmit={submitQuestion}
          />
        )}
      </section>

      <Feedback state={submitState} onAnother={resetForAnother} />
    </div>
  );
}

function ModeButton({ active, title, body, onClick }: { active: boolean; title: string; body: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`rounded-lg border p-4 text-left transition-colors ${active ? 'border-lumina-300 bg-lumina-300/10' : 'border-line bg-panel hover:bg-slate850/40'}`}
      onClick={onClick}
    >
      <span className="block text-base font-semibold text-parchment">{title}</span>
      <span className="mt-1 block text-sm leading-relaxed text-haze">{body}</span>
    </button>
  );
}

function TypeForm({
  draft,
  errors,
  currentType,
  submitLabel,
  disabled,
  onChange,
  onSubmit,
}: {
  draft: TypeSuggestionDraft;
  errors: Record<string, string>;
  currentType: string | null;
  submitLabel: string;
  disabled: boolean;
  onChange: (draft: TypeSuggestionDraft) => void;
  onSubmit: () => void;
}) {
  const { t } = useI18n();
  const set = <K extends keyof TypeSuggestionDraft>(key: K, value: TypeSuggestionDraft[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="letterbox-type-website">Website</label>
        <input id="letterbox-type-website" value={draft.honeypot} tabIndex={-1} autoComplete="off" onChange={(e) => set('honeypot', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field id="type-name" label={t('letterbox.type.name')} required value={draft.proposedName} max={60} error={errors.proposedName} onChange={(v) => set('proposedName', v)} />
        <Field id="type-code" label={t('letterbox.type.code')} value={draft.proposedCode} max={12} error={errors.proposedCode} helper={t('letterbox.type.codeHelp')} onChange={(v) => set('proposedCode', v.toUpperCase())} />
      </div>
      <Field id="type-summary" label={t('letterbox.type.summary')} required value={draft.summary} max={200} error={errors.summary} helper={t('letterbox.type.summaryHelp')} onChange={(v) => set('summary', v)} />
      <Field id="type-behaviour" label={t('letterbox.type.behaviour')} required multiline value={draft.behaviourExample} max={1000} error={errors.behaviourExample} helper={t('letterbox.type.behaviourHelp')} onChange={(v) => set('behaviourExample', v)} />
      <Field id="type-distinction" label={t('letterbox.type.distinction')} required multiline value={draft.distinctionFromExisting} max={1000} error={errors.distinctionFromExisting} helper={t('letterbox.type.distinctionHelp')} onChange={(v) => set('distinctionFromExisting', v)} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field id="type-tagline" label={t('letterbox.type.tagline')} value={draft.tagline} max={1000} error={errors.tagline} onChange={(v) => set('tagline', v)} />
        <Field id="type-discipline" label={t('letterbox.type.discipline')} value={draft.discipline} max={1000} error={errors.discipline} onChange={(v) => set('discipline', v)} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field id="type-strength" label={t('letterbox.type.strength')} multiline value={draft.strength} max={1000} error={errors.strength} onChange={(v) => set('strength', v)} />
        <Field id="type-failure" label={t('letterbox.type.failure')} multiline value={draft.failureMode} max={1000} error={errors.failureMode} onChange={(v) => set('failureMode', v)} />
      </div>
      <Field id="type-notes" label={t('letterbox.common.extraNotes')} multiline value={draft.extraNotes} max={1000} error={errors.extraNotes} helper={t('letterbox.type.notesHelp')} onChange={(v) => set('extraNotes', v)} />
      <AttachType checked={draft.attachType} currentType={currentType} onChange={(v) => set('attachType', v)} />
      <SubmitRow disabled={disabled} label={submitLabel} />
    </form>
  );
}

function QuestionForm({
  draft,
  errors,
  currentType,
  submitLabel,
  disabled,
  onChange,
  onSubmit,
}: {
  draft: QuestionSuggestionDraft;
  errors: Record<string, string>;
  currentType: string | null;
  submitLabel: string;
  disabled: boolean;
  onChange: (draft: QuestionSuggestionDraft) => void;
  onSubmit: () => void;
}) {
  const { t } = useI18n();
  const set = <K extends keyof QuestionSuggestionDraft>(key: K, value: QuestionSuggestionDraft[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="letterbox-question-website">Website</label>
        <input id="letterbox-question-website" value={draft.honeypot} tabIndex={-1} autoComplete="off" onChange={(e) => set('honeypot', e.target.value)} />
      </div>
      <Field id="question-text" label={t('letterbox.question.questionText')} required multiline value={draft.questionText} max={500} error={errors.questionText} helper={t('letterbox.question.questionHelp')} onChange={(v) => set('questionText', v)} />
      <Field id="question-rationale" label={t('letterbox.question.rationale')} required multiline value={draft.rationale} max={1000} error={errors.rationale} onChange={(v) => set('rationale', v)} />
      <Field id="question-distinction" label={t('letterbox.question.distinction')} required multiline value={draft.intendedDistinction} max={1000} error={errors.intendedDistinction} helper={t('letterbox.question.distinctionHelp')} onChange={(v) => set('intendedDistinction', v)} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field id="question-dimension" label={t('letterbox.question.dimension')} value={draft.suggestedDimension} max={1000} error={errors.suggestedDimension} onChange={(v) => set('suggestedDimension', v)} />
        <SelectField
          id="question-format"
          label={t('letterbox.question.answerFormat')}
          value={draft.answerFormat}
          options={ANSWER_FORMATS.map((f) => ({ value: f, label: t(`letterbox.answerFormats.${f}`) }))}
          onChange={(v) => set('answerFormat', v as AnswerFormat)}
        />
      </div>
      <Field id="question-scenario" label={t('letterbox.question.scenario')} multiline value={draft.laboratoryScenario} max={1000} error={errors.laboratoryScenario} onChange={(v) => set('laboratoryScenario', v)} />
      <label className="flex items-start gap-3 rounded-lg border border-line bg-slate850/30 p-3 text-sm">
        <input type="checkbox" className="mt-1" checked={draft.reverseScored} onChange={(e) => set('reverseScored', e.target.checked)} />
        <span>
          <span className="block font-medium text-parchment">{t('letterbox.question.reverseScored')}</span>
          <span className="mt-1 block text-xs leading-relaxed text-haze">{t('letterbox.question.reverseScoredHelp')}</span>
        </span>
      </label>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field id="question-low" label={t('letterbox.question.lowMeaning')} multiline value={draft.lowResponseMeaning} max={1000} error={errors.lowResponseMeaning} onChange={(v) => set('lowResponseMeaning', v)} />
        <Field id="question-high" label={t('letterbox.question.highMeaning')} multiline value={draft.highResponseMeaning} max={1000} error={errors.highResponseMeaning} onChange={(v) => set('highResponseMeaning', v)} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field id="question-discipline" label={t('letterbox.question.discipline')} value={draft.discipline} max={1000} error={errors.discipline} onChange={(v) => set('discipline', v)} />
        <Field id="question-notes" label={t('letterbox.common.extraNotes')} value={draft.extraNotes} max={1000} error={errors.extraNotes} onChange={(v) => set('extraNotes', v)} />
      </div>
      <AttachType checked={draft.attachType} currentType={currentType} onChange={(v) => set('attachType', v)} />
      <SubmitRow disabled={disabled} label={submitLabel} />
    </form>
  );
}

function Field({
  id,
  label,
  value,
  max,
  onChange,
  required = false,
  multiline = false,
  helper,
  error,
}: {
  id: string;
  label: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  helper?: string;
  error?: string;
}) {
  const { t } = useI18n();
  const describedBy = `${id}-help ${id}-count ${id}-error`;
  const cls = `w-full rounded-lg border bg-panel px-3 py-2 text-sm text-parchment placeholder:text-haze/60 focus:border-lumina-400/60 focus:outline-none ${error ? 'border-signal-pos' : 'border-line'}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-parchment">
        {label} {required && <span className="text-amber-glow">{t('letterbox.common.required')}</span>}
      </label>
      {multiline ? (
        <textarea id={id} value={value} maxLength={max + 100} rows={4} className={cls} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} value={value} maxLength={max + 100} className={cls} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value)} />
      )}
      <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-haze">
        <span id={`${id}-help`}>{helper}</span>
        <span id={`${id}-count`} className={value.length > max ? 'text-signal-pos' : undefined}>
          {value.length}/{max}
        </span>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-signal-pos" role="alert">
          {t(`letterbox.errors.${error}`)}
        </p>
      )}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-parchment">{label}</label>
      <select id={id} value={value} className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-parchment focus:border-lumina-400/60 focus:outline-none" onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('letterbox.question.answerFormatEmpty')}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function AttachType({ checked, currentType, onChange }: { checked: boolean; currentType: string | null; onChange: (value: boolean) => void }) {
  const { t } = useI18n();
  return (
    <label className="flex items-start gap-3 rounded-lg border border-line bg-slate850/30 p-3 text-sm">
      <input type="checkbox" className="mt-1" checked={checked} disabled={!currentType} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block font-medium text-parchment">{t('letterbox.common.attachType')}</span>
        <span className="mt-1 block text-xs leading-relaxed text-haze">
          {currentType ? t('letterbox.common.attachTypeHelp', { type: currentType }) : t('letterbox.common.noCurrentType')}
        </span>
      </span>
    </label>
  );
}

function SubmitRow({ disabled, label }: { disabled: boolean; label: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
      <button type="submit" className="btn-primary px-6" disabled={disabled} data-testid="letterbox-submit">
        {label}
      </button>
      <p className="text-xs text-haze">{t('letterbox.common.autosave')}</p>
    </div>
  );
}

function Feedback({ state, onAnother }: { state: SubmitState; onAnother: () => void }) {
  const { t } = useI18n();
  if (state.kind === 'idle' || state.kind === 'saving') return null;
  const isSuccess = state.kind === 'success';
  const message =
    state.kind === 'success'
      ? t(state.mode === 'type' ? 'letterbox.success.type' : 'letterbox.success.question')
      : state.kind === 'duplicate'
        ? t('letterbox.success.duplicate')
        : state.message;
  return (
    <section className={`panel mt-5 p-5 ${isSuccess ? 'border-lumina-400/40' : 'border-amber-glow/35'}`} role={state.kind === 'error' ? 'alert' : 'status'}>
      <p className="text-sm leading-relaxed text-parchment">{message}</p>
      {state.kind === 'error' && state.details && (
        <p className="mt-2 text-xs text-haze">{t('letterbox.errors.details', { message: state.details })}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={onAnother}>{t('letterbox.actions.another')}</button>
        <Link to="/result" className="btn-ghost">{t('letterbox.actions.result')}</Link>
        <Link to="/atlas" className="btn-ghost">{t('letterbox.actions.atlas')}</Link>
      </div>
    </section>
  );
}
