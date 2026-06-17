/**
 * Core type definitions for Boards Local
 */

// ─── Enums / Literal Unions ─────────────────────────────────────────────────

export type ChallengePhase = 'setup' | 'active' | 'complete';

export type ChallengeType = 'SINGLE' | 'MULTI' | 'TOURNAMENT';

export type Primitive = 'NUMBER' | 'DURATION' | 'BOOLEAN' | 'RATIO' | 'RANK';

export type WinCondition = 'HIGHEST' | 'LOWEST';

export type RankingMode = 'PRIORITY_ORDER' | 'WEIGHTED_COMPOSITE' | 'ALL_REQUIRED';

export type EliminationType = 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';

export type BracketType = 'WINNERS' | 'LOSERS' | 'GRAND_FINAL';

export type MatchStatus = 'PENDING' | 'COMPLETED' | 'BYE';

export type ThresholdType = 'MINIMUM' | 'MAXIMUM' | 'EXACT' | 'FIRST_TO_REACH';

// ─── Data Models ────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
}

export interface TeamDefinition {
  id: string;
  name: string;
  playerIds: string[];
}

export interface MetricThreshold {
  type: ThresholdType;
  value: number;
}

export interface MetricDefinition {
  id: string;
  name: string;
  primitive: Primitive;
  winCondition: WinCondition;
  weight?: number;
  threshold?: MetricThreshold;
}

export interface LeaderboardConfig {
  id: string;
  title: string;
  description?: string;
  metrics: MetricDefinition[];
  rankingMode: RankingMode;
}

export interface TournamentConfig {
  eliminationType: EliminationType;
}

export interface ChallengeConfig {
  title: string;
  description: string;
  gameName: string;
  type: ChallengeType;
  players: Player[];
  leaderboards: LeaderboardConfig[];
  isTeamBased: boolean;
  teams: TeamDefinition[];
  tournamentConfig?: TournamentConfig;
}

// ─── Score Data ─────────────────────────────────────────────────────────────

export interface MetricScore {
  metricId: string;
  value: number;
}

/** Alias for backward compat -- MetricValue is used in some imports */
export type MetricValue = MetricScore;

export interface ScoreEntry {
  playerId: string;
  leaderboardId: string;
  metrics: MetricScore[];
  submittedAt: number;
}

// ─── Standings ──────────────────────────────────────────────────────────────

export interface Standing {
  playerId: string;
  rank: number;
  leaderboardWins: number;
}

export interface LeaderboardStanding {
  playerId: string;
  rank: number;
  leaderboardId: string;
}

// ─── Tournament ─────────────────────────────────────────────────────────────

export interface TournamentMatch {
  id: string;
  round: number;
  position: number;
  participant1Id: string | null;
  participant2Id: string | null;
  winnerId: string | null;
  loserId: string | null;
  isBye: boolean;
  status: MatchStatus;
  nextMatchId: string | null;
  loserNextMatchId: string | null;
  bracketType: BracketType;
  leaderboardId: string | null;
}

// ─── State ──────────────────────────────────────────────────────────────────

export interface ChallengeState {
  phase: ChallengePhase;
  setupStep: number;
  challenge: ChallengeConfig;
  /** Scores keyed by leaderboardId, then playerId */
  scores: Record<string, Record<string, ScoreEntry>>;
  bracket: TournamentMatch[] | null;
  standings: Standing[];
  winner: Player | null;
  currentRound: number;
}

// ─── Actions ────────────────────────────────────────────────────────────────

export type ChallengeAction =
  | { type: 'SET_SETUP_STEP'; step: number }
  | { type: 'UPDATE_CHALLENGE_CONFIG'; config: Partial<ChallengeConfig> }
  | { type: 'ADD_PLAYER'; name: string }
  | { type: 'REMOVE_PLAYER'; playerId: string }
  | { type: 'ADD_LEADERBOARD'; leaderboard: LeaderboardConfig }
  | { type: 'UPDATE_LEADERBOARD'; leaderboardId: string; updates: Partial<LeaderboardConfig> }
  | { type: 'REMOVE_LEADERBOARD'; leaderboardId: string }
  | { type: 'START_CHALLENGE' }
  | { type: 'SUBMIT_SCORE'; leaderboardId: string; playerId: string; metrics: MetricScore[] }
  | { type: 'SET_BRACKET'; bracket: TournamentMatch[] }
  | { type: 'ADVANCE_MATCH'; matchId: string; winnerId: string }
  | { type: 'ADVANCE_ROUND' }
  | { type: 'COMPLETE_CHALLENGE'; winnerId?: string }
  | { type: 'TOGGLE_TEAM_MODE'; enabled: boolean }
  | { type: 'ADD_TEAM'; name: string }
  | { type: 'REMOVE_TEAM'; teamId: string }
  | { type: 'RENAME_TEAM'; teamId: string; name: string }
  | { type: 'ASSIGN_PLAYER_TO_TEAM'; playerId: string; teamId: string }
  | { type: 'REMOVE_PLAYER_FROM_TEAM'; playerId: string; teamId: string }
  | { type: 'RESET' };
