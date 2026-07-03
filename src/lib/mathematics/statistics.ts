/**
 * Small, dependency-free numerical utilities.
 *
 * Every function here is pure and deterministic. Vectors are plain number[].
 * These are used by the scoring engine and the visualisations; they are unit
 * tested in statistics.test.ts.
 */

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Centre a 1–5 Likert answer to [-1, 1]:  z = (x - 3) / 2. */
export const centreAnswer = (answer: number): number => (answer - 3) / 2;

export const mean = (values: readonly number[]): number => {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
};

/** Population standard deviation. */
export const stdDev = (values: readonly number[]): number => {
  if (values.length === 0) return 0;
  const m = mean(values);
  let acc = 0;
  for (const v of values) acc += (v - m) ** 2;
  return Math.sqrt(acc / values.length);
};

export const euclidean = (a: readonly number[], b: readonly number[]): number => {
  let acc = 0;
  for (let i = 0; i < a.length; i += 1) acc += (a[i] - b[i]) ** 2;
  return Math.sqrt(acc);
};

/**
 * Weighted Euclidean distance:  sqrt( sum_d alpha_d (a_d - b_d)^2 ).
 * `weights` are the per-dimension importance factors (alpha_d).
 */
export const weightedEuclidean = (
  a: readonly number[],
  b: readonly number[],
  weights: readonly number[],
): number => {
  let acc = 0;
  for (let i = 0; i < a.length; i += 1) acc += weights[i] * (a[i] - b[i]) ** 2;
  return Math.sqrt(acc);
};

/** Cosine similarity in [-1, 1]; invariant to positive scaling. */
export const cosineSimilarity = (a: readonly number[], b: readonly number[]): number => {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
};

/** Pearson correlation coefficient in [-1, 1]. */
export const pearson = (a: readonly number[], b: readonly number[]): number => {
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i += 1) {
    const xa = a[i] - ma;
    const xb = b[i] - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  const denom = Math.sqrt(da) * Math.sqrt(db);
  return denom === 0 ? 0 : num / denom;
};

/**
 * Fractional ranks with tie-averaging (1-based). Ties receive the mean of the
 * ranks they span, which is required for a correct Spearman coefficient.
 */
export const rankWithTies = (values: readonly number[]): number[] => {
  const order = values
    .map((value, index) => ({ value, index }))
    .sort((p, q) => p.value - q.value);

  const ranks = new Array<number>(values.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1].value === order[i].value) j += 1;
    // ranks i..j are tied; average of (i+1 .. j+1)
    const avg = (i + 1 + (j + 1)) / 2;
    for (let k = i; k <= j; k += 1) ranks[order[k].index] = avg;
    i = j + 1;
  }
  return ranks;
};

/** Spearman rank correlation (Pearson on tie-averaged ranks). */
export const spearman = (a: readonly number[], b: readonly number[]): number =>
  pearson(rankWithTies(a), rankWithTies(b));

/**
 * Numerically stable softmax over `values` with temperature T.
 * Higher T flattens the distribution; lower T sharpens it.
 */
export const softmax = (values: readonly number[], temperature = 1): number[] => {
  const t = temperature === 0 ? 1e-6 : temperature;
  const scaled = values.map((v) => v / t);
  const max = Math.max(...scaled);
  const exps = scaled.map((v) => Math.exp(v - max));
  const sum = exps.reduce((acc, v) => acc + v, 0);
  return exps.map((v) => v / sum);
};

/** Shannon entropy (natural log) of a probability distribution. */
export const entropy = (probabilities: readonly number[]): number => {
  let h = 0;
  for (const p of probabilities) {
    if (p > 0) h -= p * Math.log(p);
  }
  return h;
};

/**
 * Normalised entropy in [0, 1]: H / log(K).
 * 0 → one outcome dominates; 1 → all K outcomes equally likely.
 */
export const normalisedEntropy = (probabilities: readonly number[]): number => {
  const k = probabilities.length;
  if (k <= 1) return 0;
  return entropy(probabilities) / Math.log(k);
};
