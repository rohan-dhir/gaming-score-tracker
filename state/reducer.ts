/**
 * Main state reducer for Boards Local
 */

import type {
  ChallengeState, ChallengeAction, ChallengeConfig, ScoreEntry, Standing,
  TournamentMatch, LeaderboardConfig, Player, TeamDefinition
} from './types';
import { computeStandings } from './engines/ranking';
import { generateBracket } from './engines/bracket';
import { determineWinner } from './engines/winner';
import { uuid } from '@/utils/uuid';

export function createInitialState(): ChallengeState {
  return {
    phase: 'setup',
    setupStep: 0,
    challenge: {
      title: '',
      description: '',
      gameName: '',
      type: 'SINGLE',
      players: [],
      leaderboards: [],
      isTeamBased: false,
      teams: [],
    },
    scores: {},
    bracket: null,
    standings: [],
    winner: null,
    currentRound: 1,
  };
}

function getEffectiveParticipants(challenge: ChallengeState['challenge']): Player[] {
  if (challenge.isTeamBased && challenge.teams.length > 0) {
    return challenge.teams
      .filter(t => t.playerIds.length > 0)
      .map(t => ({ id: t.id, name: t.name }));
  }
  return challenge.players;
}

function recomputeStandings(state: ChallengeState): Standing[] {
  return computeStandings(
    state.challenge.leaderboards,
    state.scores,
    getEffectiveParticipants(state.challenge)
  );
}

export function challengeReducer(
  state: ChallengeState,
  action: ChallengeAction
): ChallengeState {
  switch (action.type) {
    case 'SET_SETUP_STEP':
      return { ...state, setupStep: action.step };

    case 'UPDATE_CHALLENGE_CONFIG': {
      const challenge = { ...state.challenge, ...action.config };
      // Auto-detect challenge type
      if (challenge.tournamentConfig) {
        challenge.type = 'TOURNAMENT';
      } else if (challenge.players.length > 2) {
        challenge.type = 'MULTI';
      } else {
        challenge.type = 'SINGLE';
      }
      return { ...state, challenge };
    }

    case 'ADD_PLAYER': {
      const newPlayer: Player = {
        id: uuid(),
        name: action.name.trim(),
      };
      const players = [...state.challenge.players, newPlayer];
      const challenge = { ...state.challenge, players };
      // Auto-detect type
      if (challenge.tournamentConfig) {
        challenge.type = 'TOURNAMENT';
      } else if (players.length > 2) {
        challenge.type = 'MULTI';
      } else {
        challenge.type = 'SINGLE';
      }
      return { ...state, challenge };
    }

    case 'REMOVE_PLAYER': {
      const players = state.challenge.players.filter(p => p.id !== action.playerId);
      const teams = state.challenge.teams.map(t => ({
        ...t,
        playerIds: t.playerIds.filter(id => id !== action.playerId),
      }));
      const challenge = { ...state.challenge, players, teams };
      if (challenge.tournamentConfig) {
        challenge.type = 'TOURNAMENT';
      } else if (players.length > 2) {
        challenge.type = 'MULTI';
      } else {
        challenge.type = 'SINGLE';
      }
      return { ...state, challenge };
    }

    case 'ADD_LEADERBOARD':
      return {
        ...state,
        challenge: {
          ...state.challenge,
          leaderboards: [...state.challenge.leaderboards, action.leaderboard],
        },
      };

    case 'UPDATE_LEADERBOARD':
      return {
        ...state,
        challenge: {
          ...state.challenge,
          leaderboards: state.challenge.leaderboards.map(lb =>
            lb.id === action.leaderboardId ? { ...lb, ...action.updates } : lb
          ),
        },
      };

    case 'REMOVE_LEADERBOARD':
      return {
        ...state,
        challenge: {
          ...state.challenge,
          leaderboards: state.challenge.leaderboards.filter(lb => lb.id !== action.leaderboardId),
        },
      };

    case 'START_CHALLENGE': {
      let bracket: TournamentMatch[] | null = null;
      let scores: Record<string, Record<string, ScoreEntry>> = {};

      // In team mode, use teams as the effective participants
      const effectiveParticipants: Player[] =
        state.challenge.isTeamBased && state.challenge.teams.length > 0
          ? state.challenge.teams
              .filter(t => t.playerIds.length > 0)
              .map(t => ({ id: t.id, name: t.name }))
          : state.challenge.players;

      if (state.challenge.type === 'TOURNAMENT' && state.challenge.tournamentConfig) {
        bracket = generateBracket(
          effectiveParticipants,
          state.challenge.tournamentConfig.eliminationType,
          state.challenge.leaderboards
        );
        // Initialize score entries for round 1 leaderboards
        const round1Matches = bracket.filter(m => m.round === 1 && m.bracketType === 'WINNERS' && !m.isBye);
        round1Matches.forEach(match => {
          if (match.leaderboardId) {
            scores[match.leaderboardId] = {};
          }
        });
      } else {
        // Initialize score entries for all leaderboards
        state.challenge.leaderboards.forEach(lb => {
          scores[lb.id] = {};
        });
      }

      return {
        ...state,
        phase: 'active',
        scores,
        bracket,
        standings: [],
        winner: null,
        currentRound: 1,
      };
    }

    case 'SUBMIT_SCORE': {
      const entry: ScoreEntry = {
        playerId: action.playerId,
        leaderboardId: action.leaderboardId,
        metrics: action.metrics,
        submittedAt: Date.now(),
      };
      const newScores = {
        ...state.scores,
        [action.leaderboardId]: {
          ...state.scores[action.leaderboardId],
          [action.playerId]: entry,
        },
      };
      const newState = { ...state, scores: newScores };
      newState.standings = recomputeStandings(newState);
      return newState;
    }

    case 'SET_BRACKET':
      return { ...state, bracket: action.bracket };

    case 'ADVANCE_MATCH': {
      if (!state.bracket) return state;
      const updatedBracket = state.bracket.map(match => {
        if (match.id !== action.matchId) return match;
        const loserId = match.participant1Id === action.winnerId
          ? match.participant2Id
          : match.participant1Id;
        return {
          ...match,
          winnerId: action.winnerId,
          loserId,
          status: 'COMPLETED' as const,
        };
      });

      // Advance winner to next match
      const completedMatch = updatedBracket.find(m => m.id === action.matchId);
      if (completedMatch?.nextMatchId) {
        const nextMatch = updatedBracket.find(m => m.id === completedMatch.nextMatchId);
        if (nextMatch) {
          if (!nextMatch.participant1Id) {
            nextMatch.participant1Id = action.winnerId;
          } else if (!nextMatch.participant2Id) {
            nextMatch.participant2Id = action.winnerId;
          }
        }
      }

      // For double elimination: send loser to losers bracket
      if (completedMatch?.loserNextMatchId && completedMatch.loserId) {
        const loserMatch = updatedBracket.find(m => m.id === completedMatch.loserNextMatchId);
        if (loserMatch) {
          if (!loserMatch.participant1Id) {
            loserMatch.participant1Id = completedMatch.loserId;
          } else if (!loserMatch.participant2Id) {
            loserMatch.participant2Id = completedMatch.loserId;
          }
        }
      }

      return { ...state, bracket: updatedBracket };
    }

    case 'ADVANCE_ROUND': {
      return { ...state, currentRound: state.currentRound + 1 };
    }

    case 'COMPLETE_CHALLENGE': {
      const standings = recomputeStandings(state);
      const participants = getEffectiveParticipants(state.challenge);
      let winner: Player | null = null;

      if (action.winnerId) {
        winner = participants.find(p => p.id === action.winnerId) || null;
      } else {
        // Build a challenge config with effective participants for winner determination
        const effectiveChallenge: ChallengeConfig = {
          ...state.challenge,
          players: participants,
        };
        winner = determineWinner(effectiveChallenge, state.scores, state.bracket);
      }

      return {
        ...state,
        phase: 'complete',
        standings,
        winner,
      };
    }

    case 'TOGGLE_TEAM_MODE': {
      const challenge = {
        ...state.challenge,
        isTeamBased: action.enabled,
        teams: action.enabled ? state.challenge.teams : [],
      };
      return { ...state, challenge };
    }

    case 'ADD_TEAM': {
      const newTeam: TeamDefinition = {
        id: uuid(),
        name: action.name,
        playerIds: [],
      };
      return {
        ...state,
        challenge: {
          ...state.challenge,
          teams: [...state.challenge.teams, newTeam],
        },
      };
    }

    case 'REMOVE_TEAM': {
      return {
        ...state,
        challenge: {
          ...state.challenge,
          teams: state.challenge.teams.filter(t => t.id !== action.teamId),
        },
      };
    }

    case 'RENAME_TEAM': {
      return {
        ...state,
        challenge: {
          ...state.challenge,
          teams: state.challenge.teams.map(t =>
            t.id === action.teamId ? { ...t, name: action.name } : t
          ),
        },
      };
    }

    case 'ASSIGN_PLAYER_TO_TEAM': {
      // Remove from any existing team first, then add to target team
      const teams = state.challenge.teams.map(t => {
        const filtered = t.playerIds.filter(id => id !== action.playerId);
        if (t.id === action.teamId) {
          return { ...t, playerIds: [...filtered, action.playerId] };
        }
        return { ...t, playerIds: filtered };
      });
      return {
        ...state,
        challenge: { ...state.challenge, teams },
      };
    }

    case 'REMOVE_PLAYER_FROM_TEAM': {
      return {
        ...state,
        challenge: {
          ...state.challenge,
          teams: state.challenge.teams.map(t =>
            t.id === action.teamId
              ? { ...t, playerIds: t.playerIds.filter(id => id !== action.playerId) }
              : t
          ),
        },
      };
    }

    case 'RESET':
      return createInitialState();

    default:
      return state;
  }
}
