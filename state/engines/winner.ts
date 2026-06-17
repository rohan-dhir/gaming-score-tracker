/**
 * Winner Determination Engine
 */

import type { ChallengeConfig, Player, ScoreEntry, TournamentMatch } from '../types';
import { computeStandings } from './ranking';

/**
 * Determine the winner of a completed challenge.
 *
 * For tournaments: the winner of the final match (highest round).
 * For non-tournaments: the player with the most leaderboard wins from standings.
 * Tie-break: earliest total submission time.
 */
export function determineWinner(
  challenge: ChallengeConfig,
  scores: Record<string, Record<string, ScoreEntry>>,
  bracket: TournamentMatch[] | null,
): Player | null {
  const { players, leaderboards } = challenge;

  if (players.length === 0) return null;

  // Tournament: find the winner of the final match
  if (bracket && bracket.length > 0) {
    // For double elimination, look at GRAND_FINAL matches first
    const gfMatches = bracket
      .filter(m => m.bracketType === 'GRAND_FINAL')
      .sort((a, b) => b.round - a.round);

    for (const m of gfMatches) {
      if (m.winnerId) {
        return players.find(p => p.id === m.winnerId) ?? null;
      }
    }

    // Single elimination: highest round in WINNERS bracket
    const sortedByRound = [...bracket]
      .filter(m => m.bracketType === 'WINNERS')
      .sort((a, b) => b.round - a.round);

    for (const m of sortedByRound) {
      if (m.winnerId) {
        return players.find(p => p.id === m.winnerId) ?? null;
      }
    }

    return null;
  }

  // Non-tournament: use standings
  const standings = computeStandings(leaderboards, scores, players);

  if (standings.length === 0) return null;

  // The first standing is the player with the most leaderboard wins
  // (computeStandings already handles tie-breaking by earliest submission)
  const topStanding = standings[0];
  return players.find(p => p.id === topStanding.playerId) ?? null;
}
