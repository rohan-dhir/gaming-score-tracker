/**
 * Bracket distribution utilities.
 * Used by TournamentBracketPreview to compute match counts per round.
 */

import type { EliminationType, BracketType } from '@/state/types';

export interface RoundDistribution {
  bracketType: BracketType;
  bracketRound: number;
  matchCount: number;
}

/**
 * Compute the match distribution for a tournament bracket.
 * Returns an array of { bracketType, bracketRound, matchCount } entries.
 */
export function computeMatchDistribution(
  bracketSize: number,
  eliminationType: EliminationType,
): RoundDistribution[] {
  const wbRounds = Math.ceil(Math.log2(bracketSize));
  const result: RoundDistribution[] = [];

  // Winners bracket
  for (let round = 1; round <= wbRounds; round++) {
    const matchCount = bracketSize / Math.pow(2, round);
    result.push({
      bracketType: 'WINNERS',
      bracketRound: round,
      matchCount,
    });
  }

  if (eliminationType === 'DOUBLE_ELIMINATION') {
    // Losers bracket: 2 * (wbRounds - 1) rounds
    const lbRounds = 2 * (wbRounds - 1);
    for (let r = 1; r <= lbRounds; r++) {
      const matchCount = Math.max(1, bracketSize / Math.pow(2, Math.ceil(r / 2) + 1));
      result.push({
        bracketType: 'LOSERS',
        bracketRound: r,
        matchCount,
      });
    }

    // Grand Final: 2 matches (one base, one potential reset)
    result.push({
      bracketType: 'GRAND_FINAL',
      bracketRound: 1,
      matchCount: 1,
    });
    result.push({
      bracketType: 'GRAND_FINAL',
      bracketRound: 2,
      matchCount: 1,
    });
  }

  return result;
}
