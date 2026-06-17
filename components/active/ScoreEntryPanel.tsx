'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SendIcon from '@mui/icons-material/Send';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { DynamicScoreInput } from '@/components/scoring';
import type { LeaderboardConfig, Player, ScoreEntry, MetricScore } from '@/state/types';

interface ScoreEntryPanelProps {
  leaderboards: LeaderboardConfig[];
  players: Player[];
  scores: Record<string, Record<string, ScoreEntry>>;
  onSubmitScore: (leaderboardId: string, playerId: string, metrics: MetricScore[]) => void;
}

/**
 * Panel for entering player scores on leaderboards.
 * Supports multi-leaderboard selection, per-metric input, and auto-advance
 * to the next unscored player after submission.
 */
export default function ScoreEntryPanel({
  leaderboards,
  players,
  scores,
  onSubmitScore,
}: ScoreEntryPanelProps) {
  const [selectedLeaderboardId, setSelectedLeaderboardId] = useState(
    leaderboards[0]?.id ?? '',
  );
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [metricValues, setMetricValues] = useState<Record<string, number | null>>({});
  const [autoAdvance, setAutoAdvance] = useState(true);

  const selectedLeaderboard = useMemo(
    () => leaderboards.find(lb => lb.id === selectedLeaderboardId),
    [leaderboards, selectedLeaderboardId],
  );

  /** Players who have already submitted scores for the selected leaderboard. */
  const scoredPlayerIds = useMemo(() => {
    const lbScores = scores[selectedLeaderboardId];
    if (!lbScores) return new Set<string>();
    return new Set(Object.keys(lbScores));
  }, [scores, selectedLeaderboardId]);

  /** Next unscored player ID (for auto-advance). */
  const nextUnscoredPlayerId = useCallback(
    (afterPlayerId?: string) => {
      const startIdx = afterPlayerId
        ? players.findIndex(p => p.id === afterPlayerId) + 1
        : 0;
      // Search from startIdx onward, then wrap around
      for (let i = 0; i < players.length; i++) {
        const idx = (startIdx + i) % players.length;
        if (!scoredPlayerIds.has(players[idx].id)) {
          return players[idx].id;
        }
      }
      return '';
    },
    [players, scoredPlayerIds],
  );

  /** Auto-select the first unscored player when leaderboard changes. */
  useEffect(() => {
    const firstUnscored = nextUnscoredPlayerId();
    setSelectedPlayerId(firstUnscored || (players[0]?.id ?? ''));
    setMetricValues({});
  }, [selectedLeaderboardId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Reset metric inputs when player changes. Pre-fill if player already has a score. */
  useEffect(() => {
    if (!selectedLeaderboard || !selectedPlayerId) {
      setMetricValues({});
      return;
    }
    const existing = scores[selectedLeaderboardId]?.[selectedPlayerId];
    if (existing) {
      const prefilled: Record<string, number | null> = {};
      existing.metrics.forEach(m => { prefilled[m.metricId] = m.value; });
      setMetricValues(prefilled);
    } else {
      setMetricValues({});
    }
  }, [selectedPlayerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMetricChange = useCallback((metricId: string, value: number | null) => {
    setMetricValues(prev => ({ ...prev, [metricId]: value }));
  }, []);

  /** Validation: every metric must have a non-null value. */
  const canSubmit = useMemo(() => {
    if (!selectedLeaderboard || !selectedPlayerId) return false;
    return selectedLeaderboard.metrics.every(m => {
      const val = metricValues[m.id];
      return val !== null && val !== undefined;
    });
  }, [selectedLeaderboard, selectedPlayerId, metricValues]);

  const handleSubmit = useCallback(() => {
    if (!selectedLeaderboard || !selectedPlayerId || !canSubmit) return;

    const metrics: MetricScore[] = selectedLeaderboard.metrics.map(m => ({
      metricId: m.id,
      value: metricValues[m.id]!,
    }));

    onSubmitScore(selectedLeaderboardId, selectedPlayerId, metrics);

    // Auto-advance to next unscored player
    if (autoAdvance) {
      const next = nextUnscoredPlayerId(selectedPlayerId);
      if (next && next !== selectedPlayerId) {
        setSelectedPlayerId(next);
      }
    }
    setMetricValues({});
  }, [
    selectedLeaderboard, selectedPlayerId, selectedLeaderboardId,
    canSubmit, metricValues, onSubmitScore, autoAdvance, nextUnscoredPlayerId,
  ]);

  /** Progress: how many of the total player-leaderboard slots are filled. */
  const totalSlots = players.length;
  const filledSlots = scoredPlayerIds.size;
  const allScored = filledSlots === totalSlots && totalSlots > 0;

  return (
    <Box
      sx={{
        bgcolor: '#272932',
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Panel Header */}
      <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Score Entry
        </Typography>
        <Chip
          label={`${filledSlots} / ${totalSlots}`}
          size="small"
          color={allScored ? 'success' : 'default'}
          variant={allScored ? 'filled' : 'outlined'}
          sx={{ fontSize: '0.75rem' }}
        />
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Leaderboard Selector (only when multiple) */}
        {leaderboards.length > 1 && (
          <TextField
            select
            label="Leaderboard"
            value={selectedLeaderboardId}
            onChange={(e) => setSelectedLeaderboardId(e.target.value)}
            fullWidth
            size="small"
          >
            {leaderboards.map(lb => {
              const lbScored = scores[lb.id] ? Object.keys(scores[lb.id]).length : 0;
              const lbDone = lbScored === players.length;
              return (
                <MenuItem key={lb.id} value={lb.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <span style={{ flex: 1 }}>{lb.title}</span>
                    <Chip
                      label={`${lbScored}/${players.length}`}
                      size="small"
                      color={lbDone ? 'success' : 'default'}
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                  </Box>
                </MenuItem>
              );
            })}
          </TextField>
        )}

        {/* Player Selector */}
        <TextField
          select
          label="Player"
          value={selectedPlayerId}
          onChange={(e) => setSelectedPlayerId(e.target.value)}
          fullWidth
          size="small"
        >
          {players.map(player => {
            const hasScore = scoredPlayerIds.has(player.id);
            return (
              <MenuItem key={player.id} value={player.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  {hasScore ? (
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                  )}
                  <span style={{ flex: 1 }}>{player.name}</span>
                  {hasScore && (
                    <Typography variant="caption" color="text.secondary">
                      scored
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            );
          })}
        </TextField>

        {/* Metric Inputs */}
        {selectedLeaderboard && selectedPlayerId && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {selectedLeaderboard.metrics.map(metric => (
              <DynamicScoreInput
                key={metric.id}
                primitive={metric.primitive}
                label={metric.name}
                value={metricValues[metric.id] ?? null}
                onChange={(value) => handleMetricChange(metric.id, value)}
                threshold={metric.threshold ?? null}
                maxRank={players.length}
              />
            ))}
          </Box>
        )}

        {/* Submit Button */}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
          startIcon={<SendIcon />}
          fullWidth
          sx={{
            mt: 0.5,
            py: 1.2,
            fontWeight: 600,
            background: canSubmit ? 'linear-gradient(135deg, #4f46e5, #818cf8)' : undefined,
            '&:hover': {
              background: canSubmit ? 'linear-gradient(135deg, #4338ca, #6366f1)' : undefined,
            },
          }}
        >
          {scoredPlayerIds.has(selectedPlayerId) ? 'Update Score' : 'Submit Score'}
        </Button>

        {/* Auto-advance toggle */}
        <Box
          onClick={() => setAutoAdvance(!autoAdvance)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            opacity: 0.7,
            '&:hover': { opacity: 1 },
            transition: 'opacity 0.15s',
            userSelect: 'none',
          }}
        >
          <SkipNextIcon sx={{ fontSize: 18, color: autoAdvance ? 'primary.light' : 'text.disabled' }} />
          <Typography variant="caption" color={autoAdvance ? 'primary.light' : 'text.disabled'}>
            Auto-advance to next player
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
