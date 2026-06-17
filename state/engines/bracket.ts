/**
 * Bracket Generation Engine
 * Generates single and double elimination tournament brackets
 */

import type {
  Player, TournamentMatch, EliminationType, BracketType, LeaderboardConfig
} from '../types';

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeMatchId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a single elimination bracket.
 */
function generateSingleElimination(
  players: Player[],
  leaderboards: LeaderboardConfig[]
): TournamentMatch[] {
  const bracketSize = nextPowerOf2(players.length);
  const totalRounds = Math.ceil(Math.log2(bracketSize));
  const seeded = shuffle(players);
  const matches: TournamentMatch[] = [];

  // Create all matches round by round (back to front for linking)
  const matchesByRound: TournamentMatch[][] = [];

  for (let round = totalRounds; round >= 1; round--) {
    const matchCount = bracketSize / Math.pow(2, round);
    const roundMatches: TournamentMatch[] = [];

    for (let pos = 0; pos < matchCount; pos++) {
      const match: TournamentMatch = {
        id: makeMatchId(),
        round,
        position: pos,
        participant1Id: null,
        participant2Id: null,
        winnerId: null,
        loserId: null,
        isBye: false,
        status: 'PENDING',
        nextMatchId: null,
        loserNextMatchId: null,
        bracketType: 'WINNERS',
        leaderboardId: null,
      };
      roundMatches.push(match);
    }

    matchesByRound[round] = roundMatches;
  }

  // Link matches: match at round R, position P feeds into round R+1, position floor(P/2)
  for (let round = 1; round < totalRounds; round++) {
    const currentRound = matchesByRound[round];
    const nextRound = matchesByRound[round + 1];
    for (let i = 0; i < currentRound.length; i++) {
      const nextPos = Math.floor(i / 2);
      currentRound[i].nextMatchId = nextRound[nextPos].id;
    }
  }

  // Seed round 1 with players
  const round1 = matchesByRound[1];
  for (let i = 0; i < bracketSize; i++) {
    const matchIdx = Math.floor(i / 2);
    const player = i < seeded.length ? seeded[i] : null;

    if (i % 2 === 0) {
      round1[matchIdx].participant1Id = player?.id ?? null;
    } else {
      round1[matchIdx].participant2Id = player?.id ?? null;
    }
  }

  // Mark BYEs and auto-advance
  for (const match of round1) {
    if (match.participant1Id && !match.participant2Id) {
      match.isBye = true;
      match.status = 'BYE';
      match.winnerId = match.participant1Id;
      // Advance winner
      if (match.nextMatchId) {
        const nextMatch = matchesByRound[2]?.find(m => m.id === match.nextMatchId);
        if (nextMatch) {
          if (!nextMatch.participant1Id) nextMatch.participant1Id = match.participant1Id;
          else if (!nextMatch.participant2Id) nextMatch.participant2Id = match.participant1Id;
        }
      }
    } else if (!match.participant1Id && match.participant2Id) {
      match.isBye = true;
      match.status = 'BYE';
      match.winnerId = match.participant2Id;
      if (match.nextMatchId) {
        const nextMatch = matchesByRound[2]?.find(m => m.id === match.nextMatchId);
        if (nextMatch) {
          if (!nextMatch.participant1Id) nextMatch.participant1Id = match.participant2Id;
          else if (!nextMatch.participant2Id) nextMatch.participant2Id = match.participant2Id;
        }
      }
    }
  }

  // Assign leaderboards to non-bye matches
  let lbIdx = 0;
  for (let round = 1; round <= totalRounds; round++) {
    for (const match of matchesByRound[round]) {
      if (!match.isBye && lbIdx < leaderboards.length) {
        match.leaderboardId = leaderboards[lbIdx].id;
        lbIdx++;
      }
      matches.push(match);
    }
  }

  return matches;
}

/**
 * Generate a double elimination bracket.
 */
function generateDoubleElimination(
  players: Player[],
  leaderboards: LeaderboardConfig[]
): TournamentMatch[] {
  const bracketSize = nextPowerOf2(players.length);
  const wbRounds = Math.ceil(Math.log2(bracketSize));
  const lbRounds = 2 * (wbRounds - 1);
  const seeded = shuffle(players);
  const matches: TournamentMatch[] = [];

  // Generate Winners Bracket
  const wbMatchesByRound: Record<number, TournamentMatch[]> = {};
  for (let round = 1; round <= wbRounds; round++) {
    const matchCount = bracketSize / Math.pow(2, round);
    wbMatchesByRound[round] = [];
    for (let pos = 0; pos < matchCount; pos++) {
      wbMatchesByRound[round].push({
        id: makeMatchId(), round, position: pos,
        participant1Id: null, participant2Id: null,
        winnerId: null, loserId: null,
        isBye: false, status: 'PENDING',
        nextMatchId: null, loserNextMatchId: null,
        bracketType: 'WINNERS', leaderboardId: null,
      });
    }
  }

  // Link WB matches
  for (let round = 1; round < wbRounds; round++) {
    for (let i = 0; i < wbMatchesByRound[round].length; i++) {
      const nextPos = Math.floor(i / 2);
      wbMatchesByRound[round][i].nextMatchId = wbMatchesByRound[round + 1][nextPos].id;
    }
  }

  // Seed round 1
  const wbRound1 = wbMatchesByRound[1];
  for (let i = 0; i < bracketSize; i++) {
    const matchIdx = Math.floor(i / 2);
    const player = i < seeded.length ? seeded[i] : null;
    if (i % 2 === 0) wbRound1[matchIdx].participant1Id = player?.id ?? null;
    else wbRound1[matchIdx].participant2Id = player?.id ?? null;
  }

  // Generate Losers Bracket
  const lbMatchesByRound: Record<number, TournamentMatch[]> = {};
  for (let r = 1; r <= lbRounds; r++) {
    const matchCount = bracketSize / Math.pow(2, Math.ceil(r / 2) + 1);
    lbMatchesByRound[r] = [];
    for (let pos = 0; pos < matchCount; pos++) {
      lbMatchesByRound[r].push({
        id: makeMatchId(), round: wbRounds + r, position: 1000 + pos,
        participant1Id: null, participant2Id: null,
        winnerId: null, loserId: null,
        isBye: false, status: 'PENDING',
        nextMatchId: null, loserNextMatchId: null,
        bracketType: 'LOSERS', leaderboardId: null,
      });
    }
  }

  // Link LB matches
  for (let r = 1; r < lbRounds; r++) {
    for (let i = 0; i < lbMatchesByRound[r].length; i++) {
      const nextPos = Math.floor(i / 2);
      if (lbMatchesByRound[r + 1] && lbMatchesByRound[r + 1][nextPos]) {
        lbMatchesByRound[r][i].nextMatchId = lbMatchesByRound[r + 1][nextPos].id;
      }
    }
  }

  // Link WB losers to LB entry rounds (odd LB rounds)
  for (let wbRound = 1; wbRound <= wbRounds; wbRound++) {
    const lbEntryRound = (wbRound - 1) * 2 + 1; // WB round 1 → LB round 1, WB round 2 → LB round 3, etc.
    if (lbEntryRound <= lbRounds && lbMatchesByRound[lbEntryRound]) {
      for (let i = 0; i < wbMatchesByRound[wbRound].length; i++) {
        const lbPos = Math.floor(i / 2);
        if (lbMatchesByRound[lbEntryRound][lbPos]) {
          wbMatchesByRound[wbRound][i].loserNextMatchId = lbMatchesByRound[lbEntryRound][lbPos].id;
        }
      }
    }
  }

  // Generate Grand Final
  const gf1: TournamentMatch = {
    id: makeMatchId(), round: wbRounds + lbRounds + 1, position: 2000,
    participant1Id: null, participant2Id: null,
    winnerId: null, loserId: null,
    isBye: false, status: 'PENDING',
    nextMatchId: null, loserNextMatchId: null,
    bracketType: 'GRAND_FINAL', leaderboardId: null,
  };
  const gf2: TournamentMatch = {
    id: makeMatchId(), round: wbRounds + lbRounds + 2, position: 2001,
    participant1Id: null, participant2Id: null,
    winnerId: null, loserId: null,
    isBye: false, status: 'PENDING',
    nextMatchId: null, loserNextMatchId: null,
    bracketType: 'GRAND_FINAL', leaderboardId: null,
  };
  gf1.nextMatchId = gf2.id;

  // Link WB final winner to GF1
  const wbFinal = wbMatchesByRound[wbRounds][0];
  wbFinal.nextMatchId = gf1.id;

  // Link LB final winner to GF1
  if (lbMatchesByRound[lbRounds] && lbMatchesByRound[lbRounds][0]) {
    lbMatchesByRound[lbRounds][0].nextMatchId = gf1.id;
  }

  // BYE handling for WB round 1
  for (const match of wbRound1) {
    if (match.participant1Id && !match.participant2Id) {
      match.isBye = true;
      match.status = 'BYE';
      match.winnerId = match.participant1Id;
      if (match.nextMatchId) {
        const nextMatch = wbMatchesByRound[2]?.find(m => m.id === match.nextMatchId);
        if (nextMatch) {
          if (!nextMatch.participant1Id) nextMatch.participant1Id = match.participant1Id;
          else if (!nextMatch.participant2Id) nextMatch.participant2Id = match.participant1Id;
        }
      }
    } else if (!match.participant1Id && match.participant2Id) {
      match.isBye = true;
      match.status = 'BYE';
      match.winnerId = match.participant2Id;
      if (match.nextMatchId) {
        const nextMatch = wbMatchesByRound[2]?.find(m => m.id === match.nextMatchId);
        if (nextMatch) {
          if (!nextMatch.participant1Id) nextMatch.participant1Id = match.participant2Id;
          else if (!nextMatch.participant2Id) nextMatch.participant2Id = match.participant2Id;
        }
      }
    }
  }

  // Collect all matches
  for (let r = 1; r <= wbRounds; r++) matches.push(...wbMatchesByRound[r]);
  for (let r = 1; r <= lbRounds; r++) matches.push(...lbMatchesByRound[r]);
  matches.push(gf1, gf2);

  // Assign leaderboards to non-bye matches
  let lbIdx = 0;
  for (const match of matches) {
    if (!match.isBye && lbIdx < leaderboards.length) {
      match.leaderboardId = leaderboards[lbIdx].id;
      lbIdx++;
    }
  }

  return matches;
}

/**
 * Generate a tournament bracket.
 */
export function generateBracket(
  players: Player[],
  eliminationType: EliminationType,
  leaderboards: LeaderboardConfig[]
): TournamentMatch[] {
  if (eliminationType === 'DOUBLE_ELIMINATION') {
    return generateDoubleElimination(players, leaderboards);
  }
  return generateSingleElimination(players, leaderboards);
}
