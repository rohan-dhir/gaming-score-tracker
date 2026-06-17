/**
 * Ranking Engine
 * Computes standings from scores based on metric configurations
 */

import type {
  LeaderboardConfig, ScoreEntry, Standing, Player, MetricDefinition
} from '../types';

/**
 * Compare two score entries for a single metric.
 * Returns negative if a should rank higher, positive if b should rank higher.
 */
function compareByMetric(
  a: number | undefined,
  b: number | undefined,
  winCondition: 'HIGHEST' | 'LOWEST'
): number {
  const aVal = a ?? (winCondition === 'HIGHEST' ? -Infinity : Infinity);
  const bVal = b ?? (winCondition === 'HIGHEST' ? -Infinity : Infinity);

  if (winCondition === 'HIGHEST') {
    return bVal - aVal; // higher is better → descending
  }
  return aVal - bVal; // lower is better → ascending
}

/**
 * Get a metric value from a score entry by metric ID.
 */
function getMetricValue(
  entry: ScoreEntry | undefined,
  metricId: string
): number | undefined {
  if (!entry) return undefined;
  const metric = entry.metrics.find(m => m.metricId === metricId);
  return metric?.value;
}

/**
 * Compute a composite score for weighted composite mode.
 * Normalizes scores to [0,1] and applies weights.
 */
function computeWeightedComposite(
  entry: ScoreEntry,
  metrics: MetricDefinition[],
  allEntries: ScoreEntry[]
): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const metric of metrics) {
    const value = getMetricValue(entry, metric.id);
    if (value === undefined) continue;

    const weight = metric.weight ?? 1;
    const allValues = allEntries
      .map(e => getMetricValue(e, metric.id))
      .filter((v): v is number => v !== undefined);

    if (allValues.length === 0) continue;

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;

    let normalized: number;
    if (range === 0) {
      normalized = 0.5;
    } else if (metric.winCondition === 'HIGHEST') {
      normalized = (value - min) / range;
    } else {
      normalized = (max - value) / range;
    }

    totalWeightedScore += normalized * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
}

/**
 * Rank players within a single leaderboard.
 * Returns player IDs sorted from best to worst.
 */
export function rankLeaderboard(
  leaderboard: LeaderboardConfig,
  scores: Record<string, ScoreEntry>,
  players: Player[]
): string[] {
  const entries = players
    .map(p => ({ playerId: p.id, entry: scores[p.id] }))
    .filter(({ entry }) => entry !== undefined) as { playerId: string; entry: ScoreEntry }[];

  if (entries.length === 0) return [];

  const { metrics, rankingMode } = leaderboard;

  if (rankingMode === 'WEIGHTED_COMPOSITE') {
    const allEntries = entries.map(e => e.entry);
    const scored = entries.map(({ playerId, entry }) => ({
      playerId,
      composite: computeWeightedComposite(entry, metrics, allEntries),
    }));
    scored.sort((a, b) => b.composite - a.composite);
    return scored.map(s => s.playerId);
  }

  // PRIORITY_ORDER (default) and ALL_REQUIRED
  // Sort by metrics in order of priority (first metric = primary)
  entries.sort((a, b) => {
    for (const metric of metrics) {
      const aVal = getMetricValue(a.entry, metric.id);
      const bVal = getMetricValue(b.entry, metric.id);
      const cmp = compareByMetric(aVal, bVal, metric.winCondition);
      if (cmp !== 0) return cmp;
    }
    // Tie-break by submission time (earlier is better)
    return a.entry.submittedAt - b.entry.submittedAt;
  });

  return entries.map(e => e.playerId);
}

/**
 * Determine the winner of a single leaderboard.
 */
export function getLeaderboardWinner(
  leaderboard: LeaderboardConfig,
  scores: Record<string, ScoreEntry>
): string | null {
  const ranked = rankLeaderboard(leaderboard, scores,
    Object.keys(scores).map(id => ({ id, name: '' }))
  );
  return ranked[0] ?? null;
}

/**
 * Compute overall standings across all leaderboards.
 * Each leaderboard winner gets a "win". The player with most wins ranks highest.
 */
export function computeStandings(
  leaderboards: LeaderboardConfig[],
  allScores: Record<string, Record<string, ScoreEntry>>,
  players: Player[]
): Standing[] {
  if (leaderboards.length === 0 || players.length === 0) return [];

  // Count wins per player across leaderboards
  const winCounts: Record<string, number> = {};
  players.forEach(p => { winCounts[p.id] = 0; });

  for (const lb of leaderboards) {
    const lbScores = allScores[lb.id] || {};
    const ranked = rankLeaderboard(lb, lbScores, players);
    if (ranked.length > 0) {
      winCounts[ranked[0]] = (winCounts[ranked[0]] || 0) + 1;
    }
  }

  // Sort players by win count (desc), then by earliest score submission
  const sorted = [...players].sort((a, b) => {
    const winDiff = (winCounts[b.id] || 0) - (winCounts[a.id] || 0);
    if (winDiff !== 0) return winDiff;
    // Tie-break by earliest score submission
    let aEarliest = Infinity;
    let bEarliest = Infinity;
    for (const lb of leaderboards) {
      const aScore = allScores[lb.id]?.[a.id];
      const bScore = allScores[lb.id]?.[b.id];
      if (aScore) aEarliest = Math.min(aEarliest, aScore.submittedAt);
      if (bScore) bEarliest = Math.min(bEarliest, bScore.submittedAt);
    }
    return aEarliest - bEarliest;
  });

  return sorted.map((player, index) => ({
    playerId: player.id,
    rank: index + 1,
    leaderboardWins: winCounts[player.id] || 0,
  }));
}
