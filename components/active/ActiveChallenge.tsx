'use client';

import { useMemo, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import LinearProgress from '@mui/material/LinearProgress';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FlagIcon from '@mui/icons-material/Flag';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { SpotlightCard } from '@/components/shared/SpotlightCard';
import { useChallenge } from '@/state/context';
import type {
  MetricScore, LeaderboardConfig, Player, ScoreEntry, Standing, TournamentMatch,
} from '@/state/types';
import LeaderboardTable from './LeaderboardTable';
import ScoreEntryPanel from './ScoreEntryPanel';
import TournamentView from '@/components/active/TournamentView';

/** Map challenge type to color for the type chip. */
const TYPE_CHIP_COLOR: Record<string, 'primary' | 'info' | 'warning'> = {
  SINGLE: 'primary',
  MULTI: 'info',
  TOURNAMENT: 'warning',
};

const TYPE_LABELS: Record<string, string> = {
  SINGLE: '1 v 1',
  MULTI: 'Multiplayer',
  TOURNAMENT: 'Tournament',
};

/**
 * Main container for the active challenge phase.
 * Layout adjusts based on challenge type (SINGLE/MULTI vs TOURNAMENT).
 */
export default function ActiveChallenge() {
  const { state, dispatch } = useChallenge();
  const { challenge, scores, bracket, standings, currentRound } = state;
  const { players, leaderboards, type: challengeType } = challenge;

  const [scoresPanelOpen, setScoresPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const isTournament = challengeType === 'TOURNAMENT';

  // In team mode, use teams as the effective participants for scoring
  const effectiveParticipants: Player[] = useMemo(() => {
    if (challenge.isTeamBased && challenge.teams.length > 0) {
      return challenge.teams
        .filter(t => t.playerIds.length > 0)
        .map(t => ({ id: t.id, name: t.name }));
    }
    return players;
  }, [challenge.isTeamBased, challenge.teams, players]);

  // ---- Score submission handler ----
  const handleSubmitScore = useCallback(
    (leaderboardId: string, playerId: string, metrics: MetricScore[]) => {
      dispatch({ type: 'SUBMIT_SCORE', leaderboardId, playerId, metrics });
    },
    [dispatch],
  );

  // ---- Progress calculation ----
  const { totalSlots, filledSlots, progressPct, allScored } = useMemo(() => {
    let total = 0;
    let filled = 0;
    for (const lb of leaderboards) {
      total += effectiveParticipants.length;
      const lbScores = scores[lb.id];
      if (lbScores) {
        filled += Object.keys(lbScores).length;
      }
    }
    const pct = total > 0 ? (filled / total) * 100 : 0;
    return { totalSlots: total, filledSlots: filled, progressPct: pct, allScored: filled === total && total > 0 };
  }, [leaderboards, effectiveParticipants, scores]);

  // ---- Tournament: current round leaderboards ----
  const currentRoundLeaderboards = useMemo(() => {
    if (!isTournament || !bracket) return [];
    const activeMatches = bracket.filter(
      m => m.round === currentRound && m.status !== 'COMPLETED' && !m.isBye,
    );
    const lbIds = new Set(activeMatches.map(m => m.leaderboardId).filter(Boolean));
    return leaderboards.filter(lb => lbIds.has(lb.id));
  }, [isTournament, bracket, currentRound, leaderboards]);

  // ---- Completion readiness ----
  const canComplete = allScored || isTournament;

  const handleComplete = useCallback(() => {
    dispatch({ type: 'COMPLETE_CHALLENGE' });
  }, [dispatch]);

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ================ HEADER ================ */}
      <SpotlightCard
        sx={{
          bgcolor: '#272932',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.06)',
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.2 }}>
              {challenge.title}
            </Typography>
            {challenge.gameName && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <SportsEsportsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {challenge.gameName}
                </Typography>
              </Box>
            )}
            {challenge.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {challenge.description}
              </Typography>
            )}
          </Box>
          <Chip
            label={TYPE_LABELS[challengeType] ?? challengeType}
            color={TYPE_CHIP_COLOR[challengeType] ?? 'default'}
            icon={challengeType === 'TOURNAMENT' ? <EmojiEventsIcon /> : undefined}
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Progress bar */}
        <Box sx={{ mt: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Score Progress
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {filledSlots} / {totalSlots} scores entered
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.06)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: allScored
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : 'linear-gradient(90deg, #4f46e5, #818cf8)',
              },
            }}
          />
        </Box>
      </SpotlightCard>

      {/* ================ BODY ================ */}
      {isTournament ? (
        <TournamentLayout
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentRound={currentRound}
          bracket={bracket}
          leaderboards={leaderboards}
          currentRoundLeaderboards={currentRoundLeaderboards}
          scores={scores}
          players={effectiveParticipants}
          scoresPanelOpen={scoresPanelOpen}
          onToggleScoresPanel={() => setScoresPanelOpen(!scoresPanelOpen)}
          onSubmitScore={handleSubmitScore}
        />
      ) : (
        <StandardLayout
          leaderboards={leaderboards}
          scores={scores}
          players={effectiveParticipants}
          standings={standings}
          scoresPanelOpen={scoresPanelOpen}
          onToggleScoresPanel={() => setScoresPanelOpen(!scoresPanelOpen)}
          onSubmitScore={handleSubmitScore}
        />
      )}

      {/* ================ COMPLETE BUTTON ================ */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={<FlagIcon />}
          onClick={handleComplete}
          disabled={!canComplete}
          sx={{
            fontWeight: 700,
            px: 4,
            py: 1.4,
            borderRadius: 2,
            background: canComplete ? 'linear-gradient(135deg, #16a34a, #22c55e)' : undefined,
            '&:hover': {
              background: canComplete ? 'linear-gradient(135deg, #15803d, #16a34a)' : undefined,
            },
          }}
        >
          Complete Challenge
        </Button>
      </Box>
    </Box>
  );
}

// ================================================================
// Standard (SINGLE / MULTI) layout
// ================================================================

interface StandardLayoutProps {
  leaderboards: LeaderboardConfig[];
  scores: Record<string, Record<string, ScoreEntry>>;
  players: Player[];
  standings: Standing[];
  scoresPanelOpen: boolean;
  onToggleScoresPanel: () => void;
  onSubmitScore: (leaderboardId: string, playerId: string, metrics: MetricScore[]) => void;
}

function StandardLayout({
  leaderboards,
  scores,
  players,
  standings,
  scoresPanelOpen,
  onToggleScoresPanel,
  onSubmitScore,
}: StandardLayoutProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 340px' },
        gap: 3,
        alignItems: 'start',
      }}
    >
      {/* Left: Leaderboards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {leaderboards.map(lb => (
          <LeaderboardTable
            key={lb.id}
            leaderboard={lb}
            scores={scores[lb.id] ?? {}}
            players={players}
          />
        ))}

        {/* Overall Standings (shown when multiple leaderboards) */}
        {leaderboards.length > 1 && standings.length > 0 && (
          <StandingsSummary standings={standings} players={players} />
        )}
      </Box>

      {/* Right: Score Entry Panel */}
      <Box sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>
        {/* Collapse toggle on mobile */}
        <Box
          onClick={onToggleScoresPanel}
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#272932',
            borderRadius: scoresPanelOpen ? '8px 8px 0 0' : 2,
            border: '1px solid rgba(255,255,255,0.06)',
            borderBottom: scoresPanelOpen ? 'none' : '1px solid rgba(255,255,255,0.06)',
            px: 2.5,
            py: 1.5,
            cursor: 'pointer',
            mb: scoresPanelOpen ? 0 : 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditNoteIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2">Score Entry</Typography>
          </Box>
          {scoresPanelOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>

        {/* Always visible on md+, collapsible on xs */}
        <Box sx={{ display: { xs: scoresPanelOpen ? 'block' : 'none', md: 'block' } }}>
          <ScoreEntryPanel
            leaderboards={leaderboards}
            players={players}
            scores={scores}
            onSubmitScore={onSubmitScore}
          />
        </Box>
      </Box>
    </Box>
  );
}

// ================================================================
// Tournament layout
// ================================================================

interface TournamentLayoutProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  currentRound: number;
  bracket: TournamentMatch[] | null;
  leaderboards: LeaderboardConfig[];
  currentRoundLeaderboards: LeaderboardConfig[];
  scores: Record<string, Record<string, ScoreEntry>>;
  players: Player[];
  scoresPanelOpen: boolean;
  onToggleScoresPanel: () => void;
  onSubmitScore: (leaderboardId: string, playerId: string, metrics: MetricScore[]) => void;
}

function TournamentLayout({
  activeTab,
  onTabChange,
  currentRound,
  bracket,
  leaderboards,
  currentRoundLeaderboards,
  scores,
  players,
  scoresPanelOpen,
  onToggleScoresPanel,
  onSubmitScore,
}: TournamentLayoutProps) {
  /** Players relevant to the current round (participants in active matches). */
  const currentRoundPlayers = useMemo(() => {
    if (!bracket) return players;
    const activeMatches = bracket.filter(
      m => m.round === currentRound && !m.isBye && m.status !== 'COMPLETED',
    );
    const playerIds = new Set<string>();
    activeMatches.forEach(m => {
      if (m.participant1Id) playerIds.add(m.participant1Id);
      if (m.participant2Id) playerIds.add(m.participant2Id);
    });
    return players.filter(p => playerIds.has(p.id));
  }, [bracket, currentRound, players]);

  return (
    <Box>
      {/* Round Indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Chip
          label={`Round ${currentRound}`}
          color="warning"
          variant="filled"
          sx={{ fontWeight: 700, fontSize: '0.85rem' }}
        />
        {bracket && (
          <Typography variant="body2" color="text.secondary">
            {bracket.filter(m => m.round === currentRound && m.status === 'COMPLETED').length}
            {' / '}
            {bracket.filter(m => m.round === currentRound && !m.isBye).length}
            {' matches complete'}
          </Typography>
        )}
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => onTabChange(v)}
        sx={{
          mb: 3,
          '& .MuiTabs-indicator': {
            background: 'linear-gradient(90deg, #d97706, #f59e0b)',
          },
        }}
      >
        <Tab
          label="Bracket"
          icon={<EmojiEventsIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
          sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
        />
        <Tab
          label="Current Round"
          icon={<LeaderboardIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
          sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
        />
      </Tabs>

      {/* Bracket Tab */}
      {activeTab === 0 && (
        <Box>
          {bracket ? (
            <TournamentView />
          ) : (
            <Box
              sx={{
                bgcolor: '#272932',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.06)',
                p: 4,
                textAlign: 'center',
              }}
            >
              <EmojiEventsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No bracket data available. Start the challenge to generate the bracket.
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Current Round Tab */}
      {activeTab === 1 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 340px' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          {/* Round Leaderboards */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {currentRoundLeaderboards.length > 0 ? (
              currentRoundLeaderboards.map(lb => (
                <LeaderboardTable
                  key={lb.id}
                  leaderboard={lb}
                  scores={scores[lb.id] ?? {}}
                  players={currentRoundPlayers}
                  isTournament
                />
              ))
            ) : (
              <Box
                sx={{
                  bgcolor: '#272932',
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.06)',
                  p: 4,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No active matches in this round. Advance to the next round or complete the tournament.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Score Entry */}
          <Box sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>
            <Box
              onClick={onToggleScoresPanel}
              sx={{
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: '#272932',
                borderRadius: scoresPanelOpen ? '8px 8px 0 0' : 2,
                border: '1px solid rgba(255,255,255,0.06)',
                borderBottom: scoresPanelOpen ? 'none' : '1px solid rgba(255,255,255,0.06)',
                px: 2.5,
                py: 1.5,
                cursor: 'pointer',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditNoteIcon sx={{ fontSize: 18 }} />
                <Typography variant="subtitle2">Score Entry</Typography>
              </Box>
              {scoresPanelOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
            <Box sx={{ display: { xs: scoresPanelOpen ? 'block' : 'none', md: 'block' } }}>
              <ScoreEntryPanel
                leaderboards={currentRoundLeaderboards.length > 0 ? currentRoundLeaderboards : leaderboards}
                players={currentRoundPlayers.length > 0 ? currentRoundPlayers : players}
                scores={scores}
                onSubmitScore={onSubmitScore}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ================================================================
// Overall standings summary (multi-leaderboard challenges)
// ================================================================

interface StandingsSummaryProps {
  standings: Standing[];
  players: Player[];
}

function StandingsSummary({ standings, players }: StandingsSummaryProps) {
  const playerMap = useMemo(() => {
    const map = new Map<string, string>();
    players.forEach(p => map.set(p.id, p.name));
    return map;
  }, [players]);

  return (
    <Box
      sx={{
        bgcolor: '#272932',
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LeaderboardIcon sx={{ fontSize: 20, color: 'primary.light' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Overall Standings
        </Typography>
      </Box>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: 280,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                padding: '8px 16px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#fff',
                width: 56,
              }}
            >
              Rank
            </th>
            <th
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                padding: '8px 16px',
                textAlign: 'left',
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#fff',
              }}
            >
              Player
            </th>
            <th
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                padding: '8px 16px',
                textAlign: 'right',
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#fff',
                width: 100,
              }}
            >
              Wins
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, idx) => {
            const baseBg = idx % 2 === 0 ? '#1e1f2a' : '#171823';
            return (
              <tr key={s.playerId} style={{ background: baseBg }}>
                <td
                  style={{
                    padding: '8px 16px',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                  }}
                >
                  {s.rank}
                </td>
                <td
                  style={{
                    padding: '8px 16px',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    color: '#f1f5f9',
                  }}
                >
                  {playerMap.get(s.playerId) ?? 'Unknown'}
                </td>
                <td
                  style={{
                    padding: '8px 16px',
                    textAlign: 'right',
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: s.leaderboardWins > 0 ? '#818cf8' : '#64748b',
                  }}
                >
                  {s.leaderboardWins}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Box>
  );
}
