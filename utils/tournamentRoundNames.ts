/**
 * Tournament round naming utilities.
 */

import type { BracketType } from '@/state/types';

/** Labels for bracket section headers */
export const BRACKET_SECTION_LABELS: Record<BracketType, string> = {
  WINNERS: 'Winners Bracket',
  LOSERS: 'Losers Bracket',
  GRAND_FINAL: 'Grand Final',
};

/**
 * Get a human-readable name for a round within a bracket section.
 *
 * @param roundNum - 1-based round number within the section
 * @param totalRounds - total rounds in this section
 * @param bracketType - which bracket section
 * @param isDE - whether this is a double elimination tournament
 * @param matchCount - number of matches in this round (optional, for contextual naming)
 */
export function getSectionRoundName(
  roundNum: number,
  totalRounds: number,
  bracketType: BracketType,
  isDE: boolean,
  matchCount?: number,
): string {
  if (bracketType === 'GRAND_FINAL') {
    if (roundNum === 1) return 'Grand Final';
    return `Grand Final (Reset)`;
  }

  if (bracketType === 'LOSERS') {
    if (roundNum === totalRounds) return 'LB Final';
    if (roundNum === totalRounds - 1 && matchCount === 1) return 'LB Semi-Final';
    return `LB Round ${roundNum}`;
  }

  // WINNERS bracket
  if (roundNum === totalRounds) {
    if (isDE) return 'WB Final';
    return 'Final';
  }
  if (roundNum === totalRounds - 1) {
    if (isDE) return 'WB Semi-Final';
    if (matchCount === 1) return 'Semi-Final';
    return 'Semi-Finals';
  }
  if (roundNum === totalRounds - 2 && !isDE) {
    return 'Quarter-Finals';
  }
  if (isDE) return `WB Round ${roundNum}`;
  return `Round ${roundNum}`;
}
