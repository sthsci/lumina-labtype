/**
 * Principal Component Analysis for small matrices.
 *
 * We compute the covariance matrix of the (mean-centred) data and diagonalise
 * it with the Jacobi eigenvalue algorithm. Jacobi is numerically robust for the
 * small symmetric matrices we deal with here (<= 15x15) and avoids the pitfalls
 * of a hand-rolled general eigen solver. This is used to project the
 * 15-dimensional archetype/user/synthetic matrix onto PC1/PC2.
 *
 * NOTE: PCA here is genuinely computed from the profile matrix at runtime —
 * coordinates are never hard-coded. See Methodology.
 */

export interface PcaResult {
  /** Column means used for centring. */
  mean: number[];
  /** Eigenvectors (principal axes) as rows, sorted by descending eigenvalue. */
  components: number[][];
  /** Eigenvalues (variance along each component), descending. */
  eigenvalues: number[];
  /** Fraction of total variance explained by each component. */
  explainedVariance: number[];
}

/** Symmetric covariance matrix of `data` (rows = samples, cols = features). */
export function covarianceMatrix(data: number[][]): number[][] {
  const n = data.length;
  const dim = data[0]?.length ?? 0;
  const means = new Array(dim).fill(0);
  for (const row of data) for (let j = 0; j < dim; j += 1) means[j] += row[j];
  for (let j = 0; j < dim; j += 1) means[j] /= n;

  const cov = Array.from({ length: dim }, () => new Array(dim).fill(0));
  for (const row of data) {
    for (let i = 0; i < dim; i += 1) {
      const di = row[i] - means[i];
      for (let j = i; j < dim; j += 1) {
        cov[i][j] += di * (row[j] - means[j]);
      }
    }
  }
  // divide by (n - 1) for the sample covariance, mirror the upper triangle
  const denom = Math.max(1, n - 1);
  for (let i = 0; i < dim; i += 1) {
    for (let j = i; j < dim; j += 1) {
      cov[i][j] /= denom;
      cov[j][i] = cov[i][j];
    }
  }
  return cov;
}

/**
 * Jacobi eigenvalue decomposition of a real symmetric matrix.
 * Returns eigenvalues and eigenvectors (as columns of `vectors`).
 */
export function jacobiEigen(
  matrix: number[][],
  maxSweeps = 100,
  tolerance = 1e-12,
): { values: number[]; vectors: number[][] } {
  const n = matrix.length;
  // work on a copy
  const a = matrix.map((row) => row.slice());
  // identity for eigenvectors
  const v: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );

  const offDiagonalNorm = (): number => {
    let sum = 0;
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) sum += a[i][j] * a[i][j];
    }
    return Math.sqrt(sum);
  };

  for (let sweep = 0; sweep < maxSweeps; sweep += 1) {
    if (offDiagonalNorm() < tolerance) break;
    for (let p = 0; p < n - 1; p += 1) {
      for (let q = p + 1; q < n; q += 1) {
        if (Math.abs(a[p][q]) < 1e-18) continue;
        const app = a[p][p];
        const aqq = a[q][q];
        const apq = a[p][q];
        const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
        const c = Math.cos(phi);
        const s = Math.sin(phi);

        for (let i = 0; i < n; i += 1) {
          const aip = a[i][p];
          const aiq = a[i][q];
          a[i][p] = c * aip - s * aiq;
          a[i][q] = s * aip + c * aiq;
        }
        for (let i = 0; i < n; i += 1) {
          const api = a[p][i];
          const aqi = a[q][i];
          a[p][i] = c * api - s * aqi;
          a[q][i] = s * api + c * aqi;
        }
        for (let i = 0; i < n; i += 1) {
          const vip = v[i][p];
          const viq = v[i][q];
          v[i][p] = c * vip - s * viq;
          v[i][q] = s * vip + c * viq;
        }
      }
    }
  }

  const values = a.map((row, i) => row[i]);
  return { values, vectors: v };
}

/** Fit PCA on `data` (rows = samples, cols = features). */
export function fitPca(data: number[][]): PcaResult {
  const dim = data[0]?.length ?? 0;
  const means = new Array(dim).fill(0);
  for (const row of data) for (let j = 0; j < dim; j += 1) means[j] += row[j];
  for (let j = 0; j < dim; j += 1) means[j] /= data.length;

  const cov = covarianceMatrix(data);
  const { values, vectors } = jacobiEigen(cov);

  // sort components by descending eigenvalue
  const idx = values.map((_, i) => i).sort((p, q) => values[q] - values[p]);
  const eigenvalues = idx.map((i) => values[i]);
  const components = idx.map((i) => vectors.map((row) => row[i])); // eigenvector i as a row

  const totalVar = eigenvalues.reduce((acc, v) => acc + Math.max(0, v), 0) || 1;
  const explainedVariance = eigenvalues.map((v) => Math.max(0, v) / totalVar);

  return { mean: means, components, eigenvalues, explainedVariance };
}

/** Project one sample onto the first `k` principal components. */
export function projectPoint(sample: number[], pca: PcaResult, k = 2): number[] {
  const centred = sample.map((value, i) => value - pca.mean[i]);
  const out: number[] = [];
  for (let c = 0; c < k; c += 1) {
    let acc = 0;
    const comp = pca.components[c];
    for (let i = 0; i < centred.length; i += 1) acc += centred[i] * comp[i];
    out.push(acc);
  }
  return out;
}

/** Project many samples at once. */
export function projectAll(data: number[][], pca: PcaResult, k = 2): number[][] {
  return data.map((row) => projectPoint(row, pca, k));
}
