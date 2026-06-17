'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { SpotlightCard } from '@/components/shared/SpotlightCard';
import { useChallenge } from '@/state/context';
import { getMedalColor, MEDAL_COLORS, formatScoreDisplay } from '@/utils/scoreFormatting';
import LeaderboardTable from '@/components/active/LeaderboardTable';
import type { Player, Standing } from '@/state/types';

/**
 * Medal icon for the top-3 ranks in the final standings table.
 * Returns a small trophy/medal SVG tinted with the appropriate color.
 */
function MedalIcon({ rank }: { rank: number }) {
  const color = getMedalColor(rank);
  if (!color) return null;
  return (
    <WorkspacePremiumIcon
      sx={{
        fontSize: 20,
        color,
        filter: rank === 1 ? `drop-shadow(0 0 4px ${MEDAL_COLORS.gold})` : undefined,
      }}
    />
  );
}

/**
 * ResultsView -- the celebration screen shown when a challenge is complete.
 *
 * Reads all data from the ChallengeContext:
 * - winner / standings for the final standings table
 * - challenge.leaderboards + scores for per-leaderboard results
 *
 * Dispatches RESET to start a fresh challenge.
 */
export default function ResultsView() {
  const { state, dispatch } = useChallenge();
  const { challenge, standings, scores, winner } = state;

  // In team mode, use teams as effective participants for display
  const effectiveParticipants: Player[] = useMemo(() => {
    if (challenge.isTeamBased && challenge.teams.length > 0) {
      return challenge.teams
        .filter(t => t.playerIds.length > 0)
        .map(t => ({ id: t.id, name: t.name }));
    }
    return challenge.players;
  }, [challenge.isTeamBased, challenge.teams, challenge.players]);

  /** Participants keyed by id for quick lookup */
  const playersById = useMemo(
    () => Object.fromEntries(effectiveParticipants.map((p) => [p.id, p])),
    [effectiveParticipants],
  );

  /** Standings sorted by rank (ascending) */
  const sortedStandings = useMemo(
    () => [...standings].sort((a, b) => a.rank - b.rank),
    [standings],
  );

  const handleReset = () => {
    dispatch({ type: 'RESET' });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        maxWidth: 800,
        mx: 'auto',
        py: 4,
        px: { xs: 2, sm: 0 },
      }}
    >
      {/* ================================================================
       *  1. Winner Announcement (Hero Section)
       * ================================================================ */}
      <SpotlightCard
        spotlightColor="rgba(255, 215, 0, 0.10)"
        spotlightSize={400}
        sx={{
          borderRadius: 3,
          border: '1px solid rgba(255, 215, 0, 0.25)',
          bgcolor: 'rgba(39, 41, 50, 0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          p: { xs: 3, sm: 5 },
          textAlign: 'center',
          animation: 'pulse-glow 3s ease-in-out infinite',
          '@keyframes pulse-glow': {
            '0%, 100%': {
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.03)',
            },
            '50%': {
              boxShadow: '0 0 40px rgba(255, 215, 0, 0.6), inset 0 0 40px rgba(255, 215, 0, 0.06)',
            },
          },
        }}
      >
        {/* Trophy icon */}
        <EmojiEventsIcon
          sx={{
            fontSize: 72,
            color: MEDAL_COLORS.gold,
            filter: `drop-shadow(0 0 12px rgba(255, 215, 0, 0.5))`,
            mb: 1,
          }}
        />

        {/* Heading */}
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'shimmer 3s linear infinite',
            '@keyframes shimmer': {
              '0%': { backgroundPosition: '0% center' },
              '100%': { backgroundPosition: '200% center' },
            },
          }}
        >
          Challenge Complete!
        </Typography>

        {/* Winner or draw message */}
        {winner ? (
          <Typography
            variant="h3"
            fontWeight={900}
            sx={{
              color: MEDAL_COLORS.gold,
              mt: 1,
              textShadow: '0 0 24px rgba(255, 215, 0, 0.4)',
              letterSpacing: '-0.02em',
            }}
          >
            {winner.name}
          </Typography>
        ) : (
          <Typography
            variant="h3"
            fontWeight={900}
            sx={{ color: 'text.primary', mt: 1 }}
          >
            It&apos;s a Draw!
          </Typography>
        )}

        {winner && (
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            takes the victory
          </Typography>
        )}
      </SpotlightCard>

      {/* ================================================================
       *  2. Final Standings
       * ================================================================ */}
      <SpotlightCard
        sx={{
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.06)',
          bgcolor: 'rgba(39, 41, 50, 0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          p: { xs: 2, sm: 3 },
        }}
      >
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          Final Standings
        </Typography>

        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0 4px',
            '& th': {
              textAlign: 'left',
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              pb: 1,
              px: 2,
            },
            '& td': {
              py: 1.5,
              px: 2,
            },
          }}
        >
          <thead>
            <tr>
              <th style={{ width: 72 }}>Rank</th>
              <th>Player</th>
              <th style={{ width: 140, textAlign: 'right' }}>Leaderboard Wins</th>
            </tr>
          </thead>
          <tbody>
            {sortedStandings.map((standing) => {
              const medalColor = getMedalColor(standing.rank);
              const player = playersById[standing.playerId];
              return (
                <Box
                  component="tr"
                  key={standing.playerId}
                  sx={{
                    bgcolor: medalColor
                      ? `${medalColor}12`
                      : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 2,
                    '& td:first-of-type': { borderRadius: '8px 0 0 8px' },
                    '& td:last-of-type': { borderRadius: '0 8px 8px 0' },
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      bgcolor: medalColor
                        ? `${medalColor}20`
                        : 'rgba(255, 255, 255, 0.06)',
                    },
                  }}
                >
                  <td>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MedalIcon rank={standing.rank} />
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: medalColor || 'text.secondary' }}
                      >
                        #{standing.rank}
                      </Typography>
                    </Box>
                  </td>
                  <td>
                    <Typography
                      variant="body1"
                      fontWeight={standing.rank === 1 ? 700 : 500}
                      sx={{
                        color: standing.rank === 1 ? MEDAL_COLORS.gold : 'text.primary',
                      }}
                    >
                      {player?.name ?? standing.playerId}
                    </Typography>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ color: 'text.secondary' }}
                    >
                      {standing.leaderboardWins}
                    </Typography>
                  </td>
                </Box>
              );
            })}
          </tbody>
        </Box>
      </SpotlightCard>

      {/* ================================================================
       *  3. Leaderboard Results (per-leaderboard final scores)
       * ================================================================ */}
      {challenge.leaderboards.length > 0 && (
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
            Leaderboard Results
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {challenge.leaderboards.map((lb) => (
              <LeaderboardTable
                key={lb.id}
                leaderboard={lb}
                scores={scores[lb.id] ?? {}}
                players={effectiveParticipants}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* ================================================================
       *  4. Action Buttons
       * ================================================================ */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 4 }}>
        <Button
          onClick={handleReset}
          variant="contained"
          size="large"
          startIcon={<RestartAltIcon />}
          sx={{
            px: 5,
            py: 1.5,
            fontSize: '1.05rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4338ca, #6366f1)',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.45)',
            },
          }}
        >
          New Challenge
        </Button>
      </Box>
    </Box>
  );
}
