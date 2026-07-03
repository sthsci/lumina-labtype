/**
 * Clustering utilities: k-means, agglomerative hierarchical clustering, and the
 * silhouette score. All are genuine implementations used by the ML Lab
 * visualisations (k-means teaching animation, archetype similarity tree).
 */
import { euclidean } from './statistics';
import type { Rng } from './random';

/* ----------------------------- k-means --------------------------------- */

export interface KMeansStep {
  centroids: number[][];
  assignments: number[];
  inertia: number; // within-cluster sum of squares
}

export interface KMeansResult extends KMeansStep {
  iterations: number;
  history: KMeansStep[];
}

const nearestCentroid = (point: number[], centroids: number[][]): number => {
  let best = 0;
  let bestDist = Infinity;
  for (let c = 0; c < centroids.length; c += 1) {
    const d = euclidean(point, centroids[c]);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
};

const computeInertia = (
  data: number[][],
  centroids: number[][],
  assignments: number[],
): number => {
  let acc = 0;
  for (let i = 0; i < data.length; i += 1) {
    acc += euclidean(data[i], centroids[assignments[i]]) ** 2;
  }
  return acc;
};

/**
 * k-means with deterministic k-means++ seeding driven by a seeded RNG.
 * Records every iteration in `history` so the UI can animate convergence.
 */
export function kMeans(
  data: number[][],
  k: number,
  rng: Rng,
  maxIterations = 40,
): KMeansResult {
  const dim = data[0].length;
  // k-means++ initialisation
  const centroids: number[][] = [];
  centroids.push(data[rng.int(0, data.length - 1)].slice());
  while (centroids.length < k) {
    const dists = data.map((p) => {
      let best = Infinity;
      for (const c of centroids) best = Math.min(best, euclidean(p, c) ** 2);
      return best;
    });
    const total = dists.reduce((a, b) => a + b, 0) || 1;
    let target = rng.next() * total;
    let chosen = 0;
    for (let i = 0; i < dists.length; i += 1) {
      target -= dists[i];
      if (target <= 0) {
        chosen = i;
        break;
      }
    }
    centroids.push(data[chosen].slice());
  }

  const history: KMeansStep[] = [];
  let assignments = data.map((p) => nearestCentroid(p, centroids));
  history.push({
    centroids: centroids.map((c) => c.slice()),
    assignments: assignments.slice(),
    inertia: computeInertia(data, centroids, assignments),
  });

  let iterations = 0;
  for (; iterations < maxIterations; iterations += 1) {
    // recompute centroids
    const sums = Array.from({ length: k }, () => new Array(dim).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < data.length; i += 1) {
      const a = assignments[i];
      counts[a] += 1;
      for (let d = 0; d < dim; d += 1) sums[a][d] += data[i][d];
    }
    for (let c = 0; c < k; c += 1) {
      if (counts[c] === 0) continue; // keep an empty centroid where it was
      for (let d = 0; d < dim; d += 1) centroids[c][d] = sums[c][d] / counts[c];
    }

    const next = data.map((p) => nearestCentroid(p, centroids));
    const changed = next.some((v, i) => v !== assignments[i]);
    assignments = next;
    history.push({
      centroids: centroids.map((c) => c.slice()),
      assignments: assignments.slice(),
      inertia: computeInertia(data, centroids, assignments),
    });
    if (!changed) break;
  }

  return {
    centroids: centroids.map((c) => c.slice()),
    assignments,
    inertia: computeInertia(data, centroids, assignments),
    iterations,
    history,
  };
}

/**
 * Mean silhouette score in [-1, 1]. Higher means better-separated clusters.
 * Returns 0 if fewer than two clusters are populated.
 */
export function silhouetteScore(data: number[][], assignments: number[]): number {
  const clusters = new Map<number, number[]>();
  assignments.forEach((c, i) => {
    if (!clusters.has(c)) clusters.set(c, []);
    clusters.get(c)!.push(i);
  });
  if (clusters.size < 2) return 0;

  let total = 0;
  for (let i = 0; i < data.length; i += 1) {
    const own = clusters.get(assignments[i])!;
    // a(i): mean intra-cluster distance
    let a = 0;
    if (own.length > 1) {
      for (const j of own) if (j !== i) a += euclidean(data[i], data[j]);
      a /= own.length - 1;
    }
    // b(i): lowest mean distance to another cluster
    let b = Infinity;
    for (const [c, members] of clusters) {
      if (c === assignments[i]) continue;
      let d = 0;
      for (const j of members) d += euclidean(data[i], data[j]);
      d /= members.length;
      b = Math.min(b, d);
    }
    const s = own.length > 1 ? (b - a) / Math.max(a, b) : 0;
    total += s;
  }
  return total / data.length;
}

/* --------------------- hierarchical clustering ------------------------- */

export type Linkage = 'average' | 'complete' | 'ward';

export interface DendrogramNode {
  id: number;
  height: number;
  /** Leaf label index into the original items, or null for internal nodes. */
  leaf: number | null;
  children: DendrogramNode[];
  /** Number of leaves under this node. */
  size: number;
}

/**
 * Agglomerative clustering with Lance–Williams updates.
 * Returns the root of the merge tree. `heights` are the merge distances.
 */
export function hierarchicalCluster(
  points: number[][],
  linkage: Linkage = 'average',
): DendrogramNode {
  const n = points.length;
  const nodes: DendrogramNode[] = points.map((_, i) => ({
    id: i,
    height: 0,
    leaf: i,
    children: [],
    size: 1,
  }));

  // active cluster indices
  const active: number[] = points.map((_, i) => i);
  // pairwise distance cache keyed by cluster id
  const dist = new Map<string, number>();
  const key = (a: number, b: number) => (a < b ? `${a},${b}` : `${b},${a}`);
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      dist.set(key(i, j), euclidean(points[i], points[j]));
    }
  }

  let nextId = n;
  while (active.length > 1) {
    // find closest pair
    let bestA = 0;
    let bestB = 1;
    let bestD = Infinity;
    for (let i = 0; i < active.length; i += 1) {
      for (let j = i + 1; j < active.length; j += 1) {
        const d = dist.get(key(active[i], active[j]))!;
        if (d < bestD) {
          bestD = d;
          bestA = i;
          bestB = j;
        }
      }
    }

    const ia = active[bestA];
    const ib = active[bestB];
    const nodeA = nodes[ia];
    const nodeB = nodes[ib];
    const merged: DendrogramNode = {
      id: nextId,
      height: bestD,
      leaf: null,
      children: [nodeA, nodeB],
      size: nodeA.size + nodeB.size,
    };
    nodes[nextId] = merged;

    // Lance–Williams distance update for the new cluster vs each other cluster
    for (const c of active) {
      if (c === ia || c === ib) continue;
      const dac = dist.get(key(ia, c))!;
      const dbc = dist.get(key(ib, c))!;
      const na = nodeA.size;
      const nb = nodeB.size;
      const nc = nodes[c].size;
      let dNew: number;
      if (linkage === 'complete') {
        dNew = Math.max(dac, dbc);
      } else if (linkage === 'ward') {
        const t = na + nb + nc;
        dNew = Math.sqrt(
          ((na + nc) / t) * dac * dac +
            ((nb + nc) / t) * dbc * dbc -
            (nc / t) * bestD * bestD,
        );
      } else {
        // average linkage weighted by cluster sizes
        dNew = (na * dac + nb * dbc) / (na + nb);
      }
      dist.set(key(nextId, c), dNew);
    }

    // remove merged clusters, add the new one
    active.splice(bestB, 1);
    active.splice(bestA, 1);
    active.push(nextId);
    nextId += 1;
  }

  return nodes[active[0]];
}

/** Flatten a dendrogram into clusters by cutting at a distance threshold. */
export function cutTree(root: DendrogramNode, threshold: number): number[][] {
  const clusters: number[][] = [];
  const collectLeaves = (node: DendrogramNode, acc: number[]) => {
    if (node.leaf !== null) acc.push(node.leaf);
    else node.children.forEach((child) => collectLeaves(child, acc));
  };
  const walk = (node: DendrogramNode) => {
    if (node.leaf !== null || node.height <= threshold) {
      const acc: number[] = [];
      collectLeaves(node, acc);
      clusters.push(acc);
    } else {
      node.children.forEach(walk);
    }
  };
  walk(root);
  return clusters;
}
