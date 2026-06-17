'use client';

import { useState, useCallback, useEffect, useRef, useDeferredValue, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import NumbersIcon from '@mui/icons-material/Numbers';
import TimerIcon from '@mui/icons-material/Timer';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import PercentIcon from '@mui/icons-material/Percent';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import BalanceIcon from '@mui/icons-material/Balance';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LoopIcon from '@mui/icons-material/Loop';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useChallenge } from '@/state/context';
import { uuid } from '@/utils/uuid';
import { LeaderboardCarousel } from './LeaderboardCarousel';
import { TournamentBracketPreview } from './TournamentBracketPreview';
import type {
  LeaderboardConfig,
  MetricDefinition,
  MetricThreshold,
  Primitive,
  WinCondition,
  RankingMode,
  EliminationType,
} from '@/state/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIMITIVES: {
  value: Primitive;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: 'NUMBER',
    label: 'Number',
    icon: <NumbersIcon />,
    description: 'Points, kills, coins, etc.',
  },
  {
    value: 'DURATION',
    label: 'Duration',
    icon: <TimerIcon />,
    description: 'Speedruns, survival time, etc.',
  },
  {
    value: 'BOOLEAN',
    label: 'Completion',
    icon: <CheckBoxIcon />,
    description: 'Achievement unlocked, goal reached',
  },
  {
    value: 'RATIO',
    label: 'Ratio',
    icon: <PercentIcon />,
    description: 'K/D ratio, accuracy percentage',
  },
  {
    value: 'RANK',
    label: 'Rank',
    icon: <MilitaryTechIcon />,
    description: 'Ordinal position (1st, 2nd, 3rd)',
  },
];

const RANKING_MODES: {
  value: RankingMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'PRIORITY_ORDER',
    label: 'Priority Order',
    description:
      'First metric is the primary ranking. Subsequent metrics break ties in order.',
    icon: <FormatListNumberedIcon />,
  },
  {
    value: 'WEIGHTED_COMPOSITE',
    label: 'Weighted Composite',
    description:
      'All metrics are combined into a single score using configurable weights.',
    icon: <BalanceIcon />,
  },
  {
    value: 'ALL_REQUIRED',
    label: 'All Required',
    description:
      'Players must meet every threshold to qualify. Failing any one metric disqualifies.',
    icon: <PlaylistAddCheckIcon />,
  },
];

const THRESHOLD_TYPES: {
  value: MetricThreshold['type'];
  label: string;
}[] = [
  { value: 'MINIMUM', label: 'Minimum' },
  { value: 'MAXIMUM', label: 'Maximum' },
  { value: 'EXACT', label: 'Exact' },
  { value: 'FIRST_TO_REACH', label: 'First to reach' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createDefaultMetric(): MetricDefinition {
  return {
    id: uuid(),
    name: '',
    primitive: 'NUMBER',
    winCondition: 'HIGHEST',
  };
}

function createDefaultLeaderboard(): LeaderboardConfig {
  return {
    id: uuid(),
    title: '',
    description: '',
    metrics: [createDefaultMetric()],
    rankingMode: 'PRIORITY_ORDER',
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LeaderboardStep() {
  const { state, dispatch } = useChallenge();
  const { challenge } = state;

  /** Which leaderboard is active (controls carousel + expanded form) */
  const [activeLeaderboardIndex, setActiveLeaderboardIndex] = useState(0);
  const deferredFormIndex = useDeferredValue(activeLeaderboardIndex);
  const formContainerRef = useRef<HTMLDivElement>(null);

  /** Track which metrics have their Advanced (threshold) section open */
  const [advancedOpen, setAdvancedOpen] = useState<Record<string, boolean>>({});

  /** Drag-and-drop sensors for metric reordering */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const toggleAdvanced = (metricId: string) => {
    setAdvancedOpen((prev) => ({ ...prev, [metricId]: !prev[metricId] }));
  };

  // ── Scroll helpers ──────────────────────────────────────────────────────

  const scrollToElement = useCallback((elementId: string) => {
    const container = formContainerRef.current;
    if (!container) return;
    const element = container.querySelector(`#${elementId}`);
    if (!element) return;
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const offsetTop = elementRect.top - containerRect.top + container.scrollTop;
    container.scrollTo({ top: offsetTop - containerRect.height / 3, behavior: 'smooth' });
  }, []);

  const handleScrollToMetric = useCallback((metricIndex: number) => {
    const lbIdx = activeLeaderboardIndex;
    requestAnimationFrame(() => {
      scrollToElement(`metric-${lbIdx}-${metricIndex}`);
      formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [activeLeaderboardIndex, scrollToElement]);

  const handleScrollToTitle = useCallback(() => {
    scrollToElement(`title-${activeLeaderboardIndex}`);
    formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLeaderboardIndex, scrollToElement]);

  const handleScrollToDescription = useCallback(() => {
    scrollToElement(`description-${activeLeaderboardIndex}`);
    formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLeaderboardIndex, scrollToElement]);

  // ── Leaderboard CRUD ─────────────────────────────────────────────────────

  const handleAddLeaderboard = useCallback(() => {
    const lb = createDefaultLeaderboard();
    dispatch({ type: 'ADD_LEADERBOARD', leaderboard: lb });
    // Set active to the new leaderboard (it will be at the end)
    setActiveLeaderboardIndex(challenge.leaderboards.length);
  }, [dispatch, challenge.leaderboards.length]);

  const handleUpdateLeaderboard = useCallback(
    (id: string, updates: Partial<LeaderboardConfig>) => {
      dispatch({ type: 'UPDATE_LEADERBOARD', leaderboardId: id, updates });
    },
    [dispatch],
  );

  const handleDeleteLeaderboard = useCallback((index: number) => {
    const lb = challenge.leaderboards[index];
    if (!lb || challenge.leaderboards.length <= 1) return;
    dispatch({ type: 'REMOVE_LEADERBOARD', leaderboardId: lb.id });
    if (activeLeaderboardIndex >= challenge.leaderboards.length - 1) {
      setActiveLeaderboardIndex(Math.max(0, challenge.leaderboards.length - 2));
    }
  }, [activeLeaderboardIndex, challenge.leaderboards, dispatch]);

  // ── Metric CRUD ──────────────────────────────────────────────────────────

  const handleAddMetric = useCallback(
    (leaderboardId: string) => {
      const lb = challenge.leaderboards.find((l) => l.id === leaderboardId);
      if (!lb || lb.metrics.length >= 5) return;
      const newMetric = createDefaultMetric();
      handleUpdateLeaderboard(leaderboardId, {
        metrics: [...lb.metrics, newMetric],
      });
    },
    [challenge.leaderboards, handleUpdateLeaderboard],
  );

  const handleAddMetricFromPreview = useCallback(() => {
    const lb = challenge.leaderboards[activeLeaderboardIndex];
    if (lb) handleAddMetric(lb.id);
  }, [activeLeaderboardIndex, challenge.leaderboards, handleAddMetric]);

  const handleInsertMetric = useCallback((position: number) => {
    const lb = challenge.leaderboards[activeLeaderboardIndex];
    if (!lb || lb.metrics.length >= 5) return;
    const newMetric = createDefaultMetric();
    const newMetrics = [...lb.metrics];
    newMetrics.splice(position, 0, newMetric);
    handleUpdateLeaderboard(lb.id, { metrics: newMetrics });
    setTimeout(() => scrollToElement(`metric-${activeLeaderboardIndex}-${position}`), 150);
  }, [activeLeaderboardIndex, challenge.leaderboards, handleUpdateLeaderboard, scrollToElement]);

  const handleUpdateMetric = useCallback(
    (
      leaderboardId: string,
      metricId: string,
      updates: Partial<MetricDefinition>,
    ) => {
      const lb = challenge.leaderboards.find((l) => l.id === leaderboardId);
      if (!lb) return;
      handleUpdateLeaderboard(leaderboardId, {
        metrics: lb.metrics.map((m) =>
          m.id === metricId ? { ...m, ...updates } : m,
        ),
      });
    },
    [challenge.leaderboards, handleUpdateLeaderboard],
  );

  const handleRemoveMetric = useCallback(
    (leaderboardId: string, metricId: string) => {
      const lb = challenge.leaderboards.find((l) => l.id === leaderboardId);
      if (!lb || lb.metrics.length <= 1) return;
      handleUpdateLeaderboard(leaderboardId, {
        metrics: lb.metrics.filter((m) => m.id !== metricId),
      });
    },
    [challenge.leaderboards, handleUpdateLeaderboard],
  );

  // Auto-create first leaderboard when entering this step
  useEffect(() => {
    if (challenge.leaderboards.length === 0) {
      handleAddLeaderboard();
    }
  }, [challenge.leaderboards.length, handleAddLeaderboard]);

  const isTournament = !!challenge.tournamentConfig;

  // Tournament toggle handler
  const handleTournamentToggle = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        dispatch({
          type: 'UPDATE_CHALLENGE_CONFIG',
          config: {
            tournamentConfig: { eliminationType: 'SINGLE_ELIMINATION' },
          },
        });
      } else {
        dispatch({
          type: 'UPDATE_CHALLENGE_CONFIG',
          config: { tournamentConfig: undefined },
        });
      }
    },
    [dispatch],
  );

  const handleEliminationTypeChange = useCallback(
    (eliminationType: EliminationType) => {
      dispatch({
        type: 'UPDATE_CHALLENGE_CONFIG',
        config: { tournamentConfig: { eliminationType } },
      });
    },
    [dispatch],
  );

  // Compute participant names for preview (use team names when team-based)
  const participantNames = useMemo(() => {
    if (challenge.isTeamBased && challenge.teams.length > 0) {
      const teamNames = challenge.teams
        .filter(t => t.playerIds.length > 0)
        .map(t => t.name);
      return challenge.leaderboards.map(() => teamNames);
    }
    const names = challenge.players.map(p => p.name);
    return challenge.leaderboards.map(() => names);
  }, [challenge.players, challenge.leaderboards, challenge.isTeamBased, challenge.teams]);

  const eliminationType =
    challenge.tournamentConfig?.eliminationType ?? 'SINGLE_ELIMINATION';

  return (
    <Box>
      {/* Section header (centered, matching closed-source) */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" fontWeight={600} gutterBottom>
          Leaderboard Builder
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Design your competition scoring system
        </Typography>
      </Box>

      {/* Tournament Config (toggle + elimination type) */}
      {challenge.players.length >= 3 && (
        <Box sx={{ mb: 3 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            {/* Toggle header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: isTournament ? 3 : 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: isTournament ? 'primary.main' : 'action.hover',
                    color: isTournament ? 'primary.contrastText' : 'text.secondary',
                    transition: 'all 0.2s',
                  }}
                >
                  <EmojiEventsIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Tournament Mode
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a bracket-style competition with elimination rounds
                  </Typography>
                </Box>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={isTournament}
                    onChange={(e) => handleTournamentToggle(e.target.checked)}
                    color="primary"
                  />
                }
                label=""
              />
            </Box>

            {/* Elimination type cards */}
            <Collapse in={isTournament}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 2,
                }}
              >
                {/* Single Elimination */}
                <Card
                  variant={eliminationType === 'SINGLE_ELIMINATION' ? 'elevation' : 'outlined'}
                  sx={{
                    border: eliminationType === 'SINGLE_ELIMINATION' ? 2 : 1,
                    borderColor:
                      eliminationType === 'SINGLE_ELIMINATION'
                        ? 'primary.main'
                        : 'divider',
                    bgcolor:
                      eliminationType === 'SINGLE_ELIMINATION'
                        ? 'action.selected'
                        : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => handleEliminationTypeChange('SINGLE_ELIMINATION')}
                >
                  <CardContent sx={{ py: 1.5, px: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Box
                        sx={{
                          color:
                            eliminationType === 'SINGLE_ELIMINATION'
                              ? 'primary.main'
                              : 'text.secondary',
                        }}
                      >
                        <AccountTreeIcon />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Single Elimination
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      One loss and you are out
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      Traditional knockout format. Lose once and you are eliminated. Fast and exciting, but no second chances.
                    </Typography>
                  </CardContent>
                </Card>

                {/* Double Elimination */}
                <Card
                  variant={eliminationType === 'DOUBLE_ELIMINATION' ? 'elevation' : 'outlined'}
                  sx={{
                    border: eliminationType === 'DOUBLE_ELIMINATION' ? 2 : 1,
                    borderColor:
                      eliminationType === 'DOUBLE_ELIMINATION'
                        ? 'primary.main'
                        : 'divider',
                    bgcolor:
                      eliminationType === 'DOUBLE_ELIMINATION'
                        ? 'action.selected'
                        : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => handleEliminationTypeChange('DOUBLE_ELIMINATION')}
                >
                  <CardContent sx={{ py: 1.5, px: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Box
                        sx={{
                          color:
                            eliminationType === 'DOUBLE_ELIMINATION'
                              ? 'primary.main'
                              : 'text.secondary',
                        }}
                      >
                        <LoopIcon />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Double Elimination
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Two losses to be eliminated
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      Includes a losers bracket. After losing once, you move to the losers bracket. Lose again and you are out. More forgiving format.
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Collapse>
          </Paper>
        </Box>
      )}

      {/* Tournament Bracket Preview (when tournament enabled) */}
      {isTournament && challenge.players.length >= 3 && (
        <Box sx={{ mb: 3 }}>
          <TournamentBracketPreview
            playerNames={
              challenge.isTeamBased && challenge.teams.length > 0
                ? challenge.teams.filter(t => t.playerIds.length > 0).map(t => t.name)
                : challenge.players.map(p => p.name)
            }
            eliminationType={eliminationType}
          />
        </Box>
      )}

      {/* Leaderboard Preview Carousel */}
      <Box sx={{ mb: 4 }}>
        <LeaderboardCarousel
          leaderboards={challenge.leaderboards}
          activeIndex={activeLeaderboardIndex}
          onSelectLeaderboard={setActiveLeaderboardIndex}
          onScrollToMetric={handleScrollToMetric}
          onScrollToTitle={handleScrollToTitle}
          onScrollToDescription={handleScrollToDescription}
          onAddMetric={handleAddMetricFromPreview}
          onInsertMetric={handleInsertMetric}
          participantNamesPerLeaderboard={participantNames}
          isTournament={isTournament}
          onAddLeaderboard={handleAddLeaderboard}
          onDeleteLeaderboard={handleDeleteLeaderboard}
        />
      </Box>

      {/* Form Card (Paper-wrapped, matching closed-source) */}
      <Paper
        ref={formContainerRef}
        variant="outlined"
        sx={{
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          bgcolor: 'background.paper',
          maxHeight: 'min(500px, calc(100vh - 400px))',
          minHeight: 300,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 3,
          pt: 3,
          pb: 3,
          /* Custom scrollbar */
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.15) transparent',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(255,255,255,0.15)',
            borderRadius: 3,
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {challenge.leaderboards.map((lb, lbIndex) => {
            const isExpanded = lbIndex === deferredFormIndex;

            return (
                <Card
                  key={lb.id}
                  sx={{
                    bgcolor: '#272932',
                    border: isExpanded
                      ? '1px solid rgba(99,102,241,0.3)'
                      : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 2,
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 2,
                    }}
                  >
                    <IconButton size="small" onClick={() => setActiveLeaderboardIndex(lbIndex)}>
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <LeaderboardIcon color="primary" />
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => setActiveLeaderboardIndex(lbIndex)}
                    >
                      {lb.title || `Leaderboard ${lbIndex + 1}`}
                    </Typography>
                    {challenge.leaderboards.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteLeaderboard(lbIndex)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  {/* Expanded Content */}
                  <Collapse in={isExpanded}>
                    <CardContent
                      sx={{
                        pt: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5,
                      }}
                    >
                      {/* Leaderboard fields */}
                      <Box id={`title-${lbIndex}`}>
                        <TextField
                          label="Leaderboard Title"
                          value={lb.title}
                          onChange={(e) =>
                            handleUpdateLeaderboard(lb.id, {
                              title: e.target.value,
                            })
                          }
                          fullWidth
                          required
                          placeholder="e.g., Speedrun, High Score, Boss Rush"
                          helperText="Required. Give this leaderboard a name."
                          slotProps={{ htmlInput: { maxLength: 50 } }}
                        />
                      </Box>
                      <Box id={`description-${lbIndex}`}>
                        <TextField
                          label="Description"
                          value={lb.description}
                          onChange={(e) =>
                            handleUpdateLeaderboard(lb.id, {
                              description: e.target.value,
                            })
                          }
                          fullWidth
                          multiline
                          rows={2}
                          placeholder="Describe what this leaderboard tracks..."
                          helperText="Optional. Explain the scoring criteria or rules."
                          slotProps={{
                            htmlInput: { maxLength: 200 },
                          }}
                        />
                      </Box>

                      {/* ── Metrics ── */}
                      <Box>
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          sx={{ mb: 1.5, color: 'primary.light' }}
                        >
                          Metrics
                        </Typography>

                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => {
                            const { active, over } = event;
                            if (over && active.id !== over.id) {
                              const oldIndex = lb.metrics.findIndex(m => m.id === active.id);
                              const newIndex = lb.metrics.findIndex(m => m.id === over.id);
                              if (oldIndex !== -1 && newIndex !== -1) {
                                handleUpdateLeaderboard(lb.id, {
                                  metrics: arrayMove(lb.metrics, oldIndex, newIndex),
                                });
                              }
                            }
                          }}
                        >
                          <SortableContext
                            items={lb.metrics.map(m => m.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                pl: lb.metrics.length > 1 ? 4 : 0,
                              }}
                            >
                              {lb.metrics.map((metric, mIndex) => (
                                <Box key={metric.id} id={`metric-${lbIndex}-${mIndex}`}>
                                  <SortableMetricCard
                                    id={metric.id}
                                    disabled={lb.metrics.length <= 1}
                                  >
                                    <MetricCard
                                      metric={metric}
                                      index={mIndex}
                                      leaderboardId={lb.id}
                                      rankingMode={lb.rankingMode}
                                      canRemove={lb.metrics.length > 1}
                                      advancedOpen={!!advancedOpen[metric.id]}
                                      onToggleAdvanced={() => toggleAdvanced(metric.id)}
                                      onUpdate={handleUpdateMetric}
                                      onRemove={handleRemoveMetric}
                                    />
                                  </SortableMetricCard>
                                </Box>
                              ))}
                            </Box>
                          </SortableContext>
                        </DndContext>

                        <Box sx={{ mt: 2 }}>
                          {lb.metrics.length < 5 ? (
                            <Button
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => handleAddMetric(lb.id)}
                              sx={{ alignSelf: 'flex-start' }}
                            >
                              Add Another Metric
                            </Button>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Maximum of 5 metrics reached
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* ── Ranking Mode (shown when 2+ metrics) ── */}
                      {lb.metrics.length >= 2 && (
                        <RankingModeSelector
                          currentMode={lb.rankingMode}
                          onChange={(mode) =>
                            handleUpdateLeaderboard(lb.id, {
                              rankingMode: mode,
                            })
                          }
                        />
                      )}
                    </CardContent>
                  </Collapse>
                </Card>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}

// ─── SortableMetricCard ──────────────────────────────────────────────────────

function SortableMetricCard({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
    animateLayoutChanges: () => false,
  });

  const style = {
    transform: disabled ? undefined : CSS.Transform.toString(transform),
    transition: disabled ? undefined : transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative' as const,
  };

  return (
    <Box ref={setNodeRef} style={style} sx={{ position: 'relative' }}>
      {!disabled && (
        <Box
          {...attributes}
          {...listeners}
          sx={{
            position: 'absolute',
            left: -32,
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'grab',
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            '&:active': { cursor: 'grabbing' },
            '&:hover': { color: 'text.primary' },
            zIndex: 1,
          }}
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>
      )}
      {children}
    </Box>
  );
}

// ─── MetricCard ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  metric: MetricDefinition;
  index: number;
  leaderboardId: string;
  rankingMode: RankingMode;
  canRemove: boolean;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  onUpdate: (
    leaderboardId: string,
    metricId: string,
    updates: Partial<MetricDefinition>,
  ) => void;
  onRemove: (leaderboardId: string, metricId: string) => void;
}

function getPrimitiveIcon(primitive: Primitive): React.ReactNode {
  const config = PRIMITIVES.find((p) => p.value === primitive);
  return config?.icon ?? <NumbersIcon />;
}

function MetricCard({
  metric,
  index,
  leaderboardId,
  rankingMode,
  canRemove,
  advancedOpen,
  onToggleAdvanced,
  onUpdate,
  onRemove,
}: MetricCardProps) {
  return (
    <Card variant="outlined" sx={{ position: 'relative' }}>
      <CardContent>
        {/* Header with icon, title, primary chip, delete button */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: 'primary.main' }}>
              {getPrimitiveIcon(metric.primitive)}
            </Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Metric {index + 1}
            </Typography>
            {rankingMode === 'PRIORITY_ORDER' && index === 0 && (
              <Chip label="Primary" size="small" color="primary" />
            )}
          </Box>
          {canRemove && (
            <IconButton
              onClick={() => onRemove(leaderboardId, metric.id)}
              color="error"
              size="small"
              aria-label="Delete metric"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Metric name */}
          <TextField
            label="Metric Name"
            placeholder={`Metric ${index + 1}`}
            value={metric.name}
            onChange={(e) =>
              onUpdate(leaderboardId, metric.id, { name: e.target.value })
            }
            required
            fullWidth
            slotProps={{ htmlInput: { maxLength: 50 } }}
            helperText="What are participants tracking?"
          />

          {/* Primitive type and win condition row */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Primitive type selector */}
            <FormControl sx={{ flex: 1 }}>
              <InputLabel id={`primitive-label-${metric.id}`}>Type</InputLabel>
              <Select
                labelId={`primitive-label-${metric.id}`}
                value={metric.primitive}
                label="Type"
                onChange={(e) =>
                  onUpdate(leaderboardId, metric.id, {
                    primitive: e.target.value as Primitive,
                  })
                }
              >
                {PRIMITIVES.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {p.icon}
                      <Box>
                        <Typography variant="body2">{p.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Win condition toggle */}
            {metric.primitive !== 'BOOLEAN' && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.75,
                  minWidth: 180,
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor:
                      metric.winCondition === 'HIGHEST'
                        ? 'success.main'
                        : 'info.main',
                    color: '#fff',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  {metric.winCondition === 'HIGHEST' ? (
                    <TrendingUpIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 18 }} />
                  )}
                </Box>
                <Typography variant="body2" fontWeight={500}>
                  {metric.winCondition === 'HIGHEST' ? 'Highest' : 'Lowest'} wins
                </Typography>
                <Switch
                  checked={metric.winCondition === 'HIGHEST'}
                  onChange={(e) =>
                    onUpdate(leaderboardId, metric.id, {
                      winCondition: e.target.checked ? 'HIGHEST' : 'LOWEST',
                    })
                  }
                  size="small"
                />
              </Box>
            )}
          </Box>

          {/* Weight input (for WEIGHTED_COMPOSITE mode) */}
          {rankingMode === 'WEIGHTED_COMPOSITE' && (
            <TextField
              label="Weight"
              type="text"
              value={metric.weight ?? 1}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val))
                  onUpdate(leaderboardId, metric.id, { weight: val });
              }}
              size="small"
              sx={{ maxWidth: 200 }}
              slotProps={{
                htmlInput: { inputMode: 'decimal' as const },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">x</InputAdornment>
                  ),
                },
              }}
            />
          )}

          {/* Advanced options toggle */}
          <Box>
            <Button
              size="small"
              onClick={onToggleAdvanced}
              startIcon={
                advancedOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />
              }
              sx={{ textTransform: 'none' }}
            >
              {advancedOpen ? 'Hide' : 'Show'} Advanced Options
            </Button>
          </Box>

          {/* Advanced options */}
          <Collapse in={advancedOpen}>
            <Divider sx={{ my: 1.5 }} />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1.5,
              }}
            >
              <Typography variant="body2" fontWeight={500}>
                Threshold Requirement
              </Typography>
              <Switch
                checked={!!metric.threshold}
                onChange={() => {
                  if (metric.threshold) {
                    onUpdate(leaderboardId, metric.id, {
                      threshold: undefined,
                    });
                  } else {
                    onUpdate(leaderboardId, metric.id, {
                      threshold: { type: 'MINIMUM', value: 0 },
                    });
                  }
                }}
                size="small"
              />
            </Box>
            {metric.threshold && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Threshold Type</InputLabel>
                  <Select
                    value={metric.threshold.type}
                    label="Threshold Type"
                    onChange={(e) =>
                      onUpdate(leaderboardId, metric.id, {
                        threshold: {
                          ...metric.threshold!,
                          type: e.target.value as MetricThreshold['type'],
                        },
                      })
                    }
                  >
                    {THRESHOLD_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        {t.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Value"
                  type="number"
                  value={metric.threshold.value}
                  size="small"
                  sx={{ width: 120 }}
                  onChange={(e) =>
                    onUpdate(leaderboardId, metric.id, {
                      threshold: {
                        ...metric.threshold!,
                        value: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </Box>
            )}
          </Collapse>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── RankingModeSelector ─────────────────────────────────────────────────────

interface RankingModeSelectorProps {
  currentMode: RankingMode;
  onChange: (mode: RankingMode) => void;
}

function RankingModeSelector({
  currentMode,
  onChange,
}: RankingModeSelectorProps) {
  return (
    <Box>
      <Typography
        variant="subtitle2"
        fontWeight={600}
        sx={{ mb: 1.5, color: 'primary.light' }}
      >
        Ranking Mode
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
        }}
      >
        {RANKING_MODES.map((mode) => {
          const isSelected = currentMode === mode.value;
          return (
            <Card
              key={mode.value}
              variant="outlined"
              onClick={() => onChange(mode.value)}
              sx={{
                flex: 1,
                cursor: 'pointer',
                borderColor: isSelected
                  ? 'primary.main'
                  : 'rgba(255,255,255,0.08)',
                bgcolor: isSelected
                  ? 'rgba(99,102,241,0.1)'
                  : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: isSelected
                    ? 'primary.light'
                    : 'rgba(255,255,255,0.2)',
                  bgcolor: isSelected
                    ? 'rgba(99,102,241,0.14)'
                    : 'rgba(255,255,255,0.04)',
                },
              }}
            >
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      color: isSelected ? 'primary.light' : 'text.secondary',
                      display: 'flex',
                    }}
                  >
                    {mode.icon}
                  </Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    color={isSelected ? 'primary.light' : 'text.primary'}
                  >
                    {mode.label}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ lineHeight: 1.4 }}
                >
                  {mode.description}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
