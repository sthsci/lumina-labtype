/**
 * Fixed answer fixtures for deterministic scoring tests.
 *
 * Profiles are built by declaring a target "lean" per dimension and letting the
 * builder pick the Likert answer that pushes each question's dominant dimension
 * toward that lean. Unspecified dimensions default to the neutral midpoint.
 */
import scoringConfig from '@/data/configuration/scoring-config.json';
import type { Answers } from '@/features/scoring/types';

type Lean = 'high' | 'low' | 'neutral';
type Leans = Record<string, Lean>;

const questions = scoringConfig.questions as unknown as {
  id: string;
  weights: Record<string, number>;
}[];

/** Dominant (largest magnitude) weighted dimension for a question. */
function dominantDimension(weights: Record<string, number>): [string, number] {
  let best: [string, number] = ['', 0];
  for (const [dim, w] of Object.entries(weights)) {
    if (Math.abs(w) > Math.abs(best[1])) best = [dim, w];
  }
  return best;
}

export function buildAnswers(leans: Leans): Answers {
  const answers: Answers = {};
  for (const q of questions) {
    const [dim, weight] = dominantDimension(q.weights);
    const lean = leans[dim] ?? 'neutral';
    if (lean === 'neutral') {
      answers[q.id] = 3;
    } else if (lean === 'high') {
      answers[q.id] = weight > 0 ? 5 : 1;
    } else {
      answers[q.id] = weight > 0 ? 1 : 5;
    }
  }
  return answers;
}

/** Every question answered at the neutral midpoint. */
export const balancedProfile: Answers = Object.fromEntries(
  questions.map((q) => [q.id, 3]),
);

export const quantitativeSceptic = buildAnswers({
  qualitative_quantitative: 'high',
  acceptance_scepticism: 'high',
  result_reproducibility: 'high',
});

export const broadExplorer = buildAnswers({
  depth_breadth: 'high',
  hypothesis_pattern: 'high',
  safe_risk: 'high',
  opening_completing: 'low',
});

export const completionSpecialist = buildAnswers({
  opening_completing: 'high',
  result_reproducibility: 'high',
  improvisation_planning: 'high',
});

export const projectOpener = buildAnswers({
  opening_completing: 'low',
  depth_breadth: 'high',
  safe_risk: 'high',
  acceptance_scepticism: 'high',
});

export const workflowAutomator = buildAnswers({
  improvisation_planning: 'high',
  result_reproducibility: 'high',
  specialist_organiser: 'high',
  opening_completing: 'high',
});

export const highRiskStrategist = buildAnswers({
  safe_risk: 'high',
  launch_iteration: 'high',
  rumination_adaptation: 'high',
});

/** Tuned to satisfy the PI hidden rule (organiser + breadth + risk). */
export const hiddenSupervisor = buildAnswers({
  specialist_organiser: 'high',
  depth_breadth: 'high',
  safe_risk: 'high',
});

export const fixtures = {
  balancedProfile,
  quantitativeSceptic,
  broadExplorer,
  completionSpecialist,
  projectOpener,
  workflowAutomator,
  highRiskStrategist,
  hiddenSupervisor,
};
