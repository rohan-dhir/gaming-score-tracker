'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import NumbersIcon from '@mui/icons-material/Numbers';
import TimerIcon from '@mui/icons-material/Timer';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import PercentIcon from '@mui/icons-material/Percent';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import BalanceIcon from '@mui/icons-material/Balance';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TuneIcon from '@mui/icons-material/Tune';
import GroupsIcon from '@mui/icons-material/Groups';
import { useChallenge } from '@/state/context';
import { stringToColor } from '@/utils/stringToColor';
import type { Primitive, RankingMode, MetricDefinition } from '@/state/types';

// ─── Display Helpers ─────────────────────────────────────────────────────────

const PRIMITIVE_LABELS: Record<Primitive, { label: string; icon: React.ReactNode }> = {
  NUMBER: { label: 'Number', icon: <NumbersIcon fontSize="small" /> },
  DURATION: { label: 'Duration', icon: <TimerIcon fontSize="small" /> },
  BOOLEAN: { label: 'Completion', icon: <CheckBoxIcon fontSize="small" /> },
  RATIO: { label: 'Ratio', icon: <PercentIcon fontSize="small" /> },
  RANK: { label: 'Rank', icon: <MilitaryTechIcon fontSize="small" /> },
};

const RANKING_MODE_LABELS: Record<
  RankingMode,
  { label: string; icon: React.ReactNode }
> = {
  PRIORITY_ORDER: {
    label: 'Priority Order',
    icon: <FormatListNumberedIcon fontSize="small" />,
  },
  WEIGHTED_COMPOSITE: {
    label: 'Weighted Composite',
    icon: <BalanceIcon fontSize="small" />,
  },
  ALL_REQUIRED: {
    label: 'All Required',
    icon: <PlaylistAddCheckIcon fontSize="small" />,
  },
};

const THRESHOLD_LABELS: Record<string, string> = {
  MINIMUM: 'Min',
  MAXIMUM: 'Max',
  EXACT: 'Exact',
  FIRST_TO_REACH: 'First to',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReviewStep() {
  const { state } = useChallenge();
  const { challenge } = state;

  // Validation warnings
  const warnings: string[] = [];
  if (!challenge.title.trim()) warnings.push('Challenge title is missing.');
  if (challenge.players.length < 2)
    warnings.push('At least 2 players are required.');
  if (challenge.leaderboards.length === 0)
    warnings.push('At least 1 leaderboard is required.');
  if (challenge.isTeamBased) {
    if (challenge.teams.length < 2)
      warnings.push('At least 2 teams are required for team mode.');
    const assignedIds = new Set(challenge.teams.flatMap(t => t.playerIds));
    const unassignedCount = challenge.players.filter(p => !assignedIds.has(p.id)).length;
    if (unassignedCount > 0)
      warnings.push(`${unassignedCount} player${unassignedCount !== 1 ? 's' : ''} not assigned to a team.`);
    for (const t of challenge.teams) {
      if (t.playerIds.length === 0)
        warnings.push(`Team "${t.name || 'Unnamed'}" has no members.`);
    }
  }
  for (const lb of challenge.leaderboards) {
    if (lb.metrics.length === 0)
      warnings.push(
        `Leaderboard "${lb.title || 'Untitled'}" has no metrics.`,
      );
    for (const m of lb.metrics) {
      if (!m.name.trim())
        warnings.push(
          `A metric in "${lb.title || 'Untitled'}" is unnamed.`,
        );
    }
  }

  const typeConfig = {
    SINGLE: {
      icon: <PersonIcon />,
      color: 'primary' as const,
      label: '1 v 1',
    },
    MULTI: {
      icon: <GroupIcon />,
      color: 'info' as const,
      label: 'Multiplayer',
    },
    TOURNAMENT: {
      icon: <EmojiEventsIcon />,
      color: 'warning' as const,
      label: 'Tournament',
    },
  };

  const ct = typeConfig[challenge.type];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Info Banner */}
      <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
        Review your challenge settings below. Press{' '}
        <strong>Start Challenge</strong> when ready. All data stays in your
        browser and will be lost if you close or refresh the page.
      </Alert>

      {/* Validation Warnings */}
      {warnings.length > 0 && (
        <Alert
          severity="warning"
          variant="outlined"
          icon={<WarningAmberIcon />}
          sx={{ borderRadius: 2 }}
        >
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Issues to fix before starting:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {warnings.map((w, i) => (
              <li key={i}>
                <Typography variant="body2">{w}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* ── Challenge Info ── */}
      <Card
        sx={{
          bgcolor: '#272932',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <CardContent>
          <SectionHeader icon={<SportsEsportsIcon />} label="Challenge Info" />

          <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
            {challenge.title || 'Untitled Challenge'}
          </Typography>

          {challenge.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}
            >
              {challenge.description}
            </Typography>
          )}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 1.5,
              flexWrap: 'wrap',
            }}
          >
            {challenge.gameName && (
              <Chip
                icon={<SportsEsportsIcon />}
                label={challenge.gameName}
                size="small"
                variant="outlined"
              />
            )}
            <Chip
              icon={ct.icon}
              label={ct.label}
              color={ct.color}
              size="small"
              sx={{ fontWeight: 600 }}
            />
            {challenge.tournamentConfig && (
              <Chip
                label={
                  challenge.tournamentConfig.eliminationType ===
                  'SINGLE_ELIMINATION'
                    ? 'Single Elimination'
                    : 'Double Elimination'
                }
                size="small"
                variant="outlined"
                color="warning"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* ── Players ── */}
      <Card
        sx={{
          bgcolor: '#272932',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <CardContent>
          <SectionHeader
            icon={<PeopleIcon />}
            label={`Players (${challenge.players.length})`}
          />
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              mt: 1.5,
            }}
          >
            {challenge.players.map((player) => (
              <Chip
                key={player.id}
                avatar={
                  <Avatar
                    sx={{
                      bgcolor: stringToColor(player.name),
                      width: 24,
                      height: 24,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </Avatar>
                }
                label={player.name}
                variant="outlined"
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* ── Teams (if team-based) ── */}
      {challenge.isTeamBased && challenge.teams.length > 0 && (
        <Card
          sx={{
            bgcolor: '#272932',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <CardContent>
            <SectionHeader
              icon={<GroupsIcon />}
              label={`Teams (${challenge.teams.length})`}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1.5 }}>
              {challenge.teams.map((team) => {
                const members = challenge.players.filter(p =>
                  team.playerIds.includes(p.id),
                );
                return (
                  <Box
                    key={team.id}
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                      {team.name || 'Unnamed Team'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {members.length > 0 ? (
                        members.map((player) => (
                          <Chip
                            key={player.id}
                            avatar={
                              <Avatar
                                sx={{
                                  bgcolor: stringToColor(player.name),
                                  width: 24,
                                  height: 24,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                }}
                              >
                                {player.name.charAt(0).toUpperCase()}
                              </Avatar>
                            }
                            label={player.name}
                            size="small"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No members
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Leaderboards ── */}
      <Card
        sx={{
          bgcolor: '#272932',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <CardContent>
          <SectionHeader
            icon={<LeaderboardIcon />}
            label={`Leaderboards (${challenge.leaderboards.length})`}
          />

          {challenge.leaderboards.map((lb, i) => {
            const modeInfo = RANKING_MODE_LABELS[lb.rankingMode];
            return (
              <Box key={lb.id}>
                <Box sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      {lb.title || `Leaderboard ${i + 1}`}
                    </Typography>
                  </Box>

                  {lb.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {lb.description}
                    </Typography>
                  )}

                  {/* Ranking mode badge */}
                  {lb.metrics.length >= 2 && (
                    <Chip
                      icon={modeInfo.icon as React.ReactElement}
                      label={modeInfo.label}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ mb: 1.5 }}
                    />
                  )}

                  {/* Metrics */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    {lb.metrics.map((metric) => (
                      <MetricSummary key={metric.id} metric={metric} />
                    ))}
                  </Box>
                </Box>

                {i < challenge.leaderboards.length - 1 && (
                  <Divider sx={{ mt: 2 }} />
                )}
              </Box>
            );
          })}
        </CardContent>
      </Card>
    </Box>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Box sx={{ color: 'primary.light', display: 'flex' }}>{icon}</Box>
      <Typography variant="h6" fontWeight={600}>
        {label}
      </Typography>
    </Box>
  );
}

function MetricSummary({ metric }: { metric: MetricDefinition }) {
  const prim = PRIMITIVE_LABELS[metric.primitive];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 1,
        borderRadius: 2,
        bgcolor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap',
      }}
    >
      <Typography variant="body2" fontWeight={600} sx={{ minWidth: 80 }}>
        {metric.name || 'Unnamed'}
      </Typography>

      <Chip
        icon={prim.icon as React.ReactElement}
        label={prim.label}
        size="small"
        variant="outlined"
        sx={{ fontSize: '0.7rem', height: 24 }}
      />

      <Chip
        icon={
          metric.winCondition === 'HIGHEST' ? (
            <ArrowUpwardIcon fontSize="small" />
          ) : (
            <ArrowDownwardIcon fontSize="small" />
          )
        }
        label={
          metric.winCondition === 'HIGHEST'
            ? 'Highest wins'
            : 'Lowest wins'
        }
        size="small"
        variant="outlined"
        color={metric.winCondition === 'HIGHEST' ? 'success' : 'info'}
        sx={{ fontSize: '0.7rem', height: 24 }}
      />

      {metric.weight != null && metric.weight !== 1 && (
        <Chip
          label={`Weight: ${metric.weight}`}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem', height: 24 }}
        />
      )}

      {metric.threshold && (
        <Chip
          icon={<TuneIcon sx={{ fontSize: 14 }} />}
          label={`${THRESHOLD_LABELS[metric.threshold.type] || metric.threshold.type}: ${metric.threshold.value}`}
          size="small"
          variant="outlined"
          color="warning"
          sx={{ fontSize: '0.7rem', height: 24 }}
        />
      )}
    </Box>
  );
}
