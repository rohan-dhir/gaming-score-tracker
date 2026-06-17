'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import type { LeaderboardConfig, Player, ScoreEntry } from '@/state/types';
import { rankLeaderboard } from '@/state/engines/ranking';
import { formatScoreDisplay, getMedalColor } from '@/utils/scoreFormatting';

interface LeaderboardTableProps {
  leaderboard: LeaderboardConfig;
  scores: Record<string, ScoreEntry>;
  players: Player[];
  isTournament?: boolean;
}

/** Row tint colors keyed by rank position */
const MEDAL_ROW_TINTS: Record<number, string> = {
  1: 'rgba(255, 215, 0, 0.06)',
  2: 'rgba(192, 192, 192, 0.04)',
  3: 'rgba(205, 127, 50, 0.04)',
};

/** Medal emoji for podium ranks */
function getMedalIcon(rank: number): string | null {
  switch (rank) {
    case 1: return '\u{1F947}';
    case 2: return '\u{1F948}';
    case 3: return '\u{1F949}';
    default: return null;
  }
}

const RANKING_MODE_LABELS: Record<string, string> = {
  PRIORITY_ORDER: 'Priority',
  WEIGHTED_COMPOSITE: 'Weighted',
  ALL_REQUIRED: 'All Required',
};

/**
 * Leaderboard table with ranked player scores.
 * Uses a native HTML table for lightweight rendering.
 */
export default function LeaderboardTable({
  leaderboard,
  scores,
  players,
  isTournament = false,
}: LeaderboardTableProps) {
  const headerGradient = isTournament
    ? 'linear-gradient(135deg, #d97706, #f59e0b)'
    : 'linear-gradient(135deg, #4f46e5, #818cf8)';

  /** Player IDs sorted by rank (only scored players). */
  const rankedPlayerIds = useMemo(
    () => rankLeaderboard(leaderboard, scores, players),
    [leaderboard, scores, players],
  );

  /** Full ordered list: ranked players first, then unscored players in original order. */
  const orderedPlayers = useMemo(() => {
    const rankedSet = new Set(rankedPlayerIds);
    const ranked = rankedPlayerIds.map(id => players.find(p => p.id === id)!);
    const unranked = players.filter(p => !rankedSet.has(p.id));
    return [...ranked, ...unranked];
  }, [rankedPlayerIds, players]);

  /** Map from player ID to rank position (1-based). Unscored players have no rank. */
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    rankedPlayerIds.forEach((id, idx) => map.set(id, idx + 1));
    return map;
  }, [rankedPlayerIds]);

  const hasAnyScores = rankedPlayerIds.length > 0;

  return (
    <Box
      sx={{
        bgcolor: '#272932',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
          {leaderboard.title}
        </Typography>
        <Chip
          label={RANKING_MODE_LABELS[leaderboard.rankingMode] ?? leaderboard.rankingMode}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem', height: 22, borderColor: 'rgba(255,255,255,0.15)' }}
        />
      </Box>

      {leaderboard.description && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, pb: 1.5, mt: -0.5 }}>
          {leaderboard.description}
        </Typography>
      )}

      {/* Table */}
      <Box sx={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            minWidth: 360,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  background: headerGradient,
                  padding: '10px 16px',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#ffffff',
                  width: 56,
                }}
              >
                Rank
              </th>
              <th
                style={{
                  background: headerGradient,
                  padding: '10px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#ffffff',
                }}
              >
                Player
              </th>
              {leaderboard.metrics.map(metric => (
                <th
                  key={metric.id}
                  style={{
                    background: headerGradient,
                    padding: '10px 16px',
                    textAlign: 'right',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {metric.name}
                  {metric.winCondition === 'LOWEST' && (
                    <span style={{ opacity: 0.7, marginLeft: 4, fontSize: '0.65rem' }}>(low)</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td
                  colSpan={2 + leaderboard.metrics.length}
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.875rem',
                  }}
                >
                  No players added
                </td>
              </tr>
            ) : !hasAnyScores ? (
              <tr>
                <td
                  colSpan={2 + leaderboard.metrics.length}
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.875rem',
                  }}
                >
                  No scores submitted yet. Enter scores to see the leaderboard.
                </td>
              </tr>
            ) : (
              orderedPlayers.map((player, rowIndex) => {
                const rank = rankMap.get(player.id);
                const entry = scores[player.id];
                const isScored = !!entry;
                const medal = rank ? getMedalIcon(rank) : null;
                const medalColor = rank ? getMedalColor(rank) : undefined;
                const rowTint = rank ? MEDAL_ROW_TINTS[rank] : undefined;
                const baseBg = rowIndex % 2 === 0 ? '#1e1f2a' : '#171823';
                const bg = rowTint ?? baseBg;

                return (
                  <tr key={player.id} style={{ background: bg }}>
                    {/* Rank */}
                    <td
                      style={{
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontWeight: rank && rank <= 3 ? 700 : 500,
                        fontSize: rank && rank <= 3 ? '1.1rem' : '0.875rem',
                        color: medalColor ?? '#94a3b8',
                      }}
                    >
                      {medal ?? (rank ? `${rank}` : '\u2014')}
                    </td>
                    {/* Player Name */}
                    <td
                      style={{
                        padding: '10px 16px',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        color: isScored ? '#f1f5f9' : '#64748b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {player.name}
                      {!isScored && (
                        <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#475569' }}>
                          (no score)
                        </span>
                      )}
                    </td>
                    {/* Metric Columns */}
                    {leaderboard.metrics.map(metric => {
                      const metricScore = entry?.metrics.find(m => m.metricId === metric.id);
                      return (
                        <td
                          key={metric.id}
                          style={{
                            padding: '10px 16px',
                            textAlign: 'right',
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontVariantNumeric: 'tabular-nums',
                            fontSize: '0.875rem',
                            fontWeight: rank === 1 ? 600 : 400,
                            color: metricScore != null ? '#f1f5f9' : '#475569',
                          }}
                        >
                          {metricScore != null
                            ? formatScoreDisplay(metricScore.value, metric.primitive)
                            : '\u2014'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}
