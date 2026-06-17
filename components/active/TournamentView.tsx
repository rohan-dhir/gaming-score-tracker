'use client';

import { useMemo, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useChallenge } from '@/state/context';
import type { TournamentMatch, BracketType, Player } from '@/state/types';
import { getSectionRoundName, BRACKET_SECTION_LABELS } from '@/utils/tournamentRoundNames';

// ---------------------------------------------------------------------------
// Visual constants
// ---------------------------------------------------------------------------

const BRACKET_BG = '#171823';
const PANEL_BG = '#1e1f2a';
const MATCH_BG = '#2a2c36';
const MATCH_BG_HOVER = '#32343f';
const GOLD_BORDER = '#d97706';
const GOLD_LIGHT = '#f59e0b';
const CONNECTOR_COLOR = 'rgba(255, 255, 255, 0.15)';
const MUTED_TEXT = 'rgba(255, 255, 255, 0.5)';
const LIGHT_TEXT = 'rgba(255, 255, 255, 0.9)';
const BYE_BG = '#222333';

const MATCH_WIDTH = 200;
const MATCH_HEIGHT = 80;
const ROUND_GAP = 80;
const MATCH_GAP = 24;
const SLOT_HEIGHT = MATCH_HEIGHT / 2;
const CONNECTOR_THICKNESS = 2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a player lookup map from the players array. */
function buildPlayerMap(players: Player[]): Map<string, Player> {
  const map = new Map<string, Player>();
  for (const p of players) {
    map.set(p.id, p);
  }
  return map;
}

interface GroupedSection {
  bracketType: BracketType;
  /** rounds is a Map<bracketRound (1-based within section), matches[]> */
  rounds: Map<number, TournamentMatch[]>;
  totalRounds: number;
}

/**
 * Group matches by bracketType, then by section-local round number.
 * For WINNERS the round field on the match is already 1-based.
 * For LOSERS the match.round is offset by the number of WB rounds -- we
 * compute a section-local round number starting at 1.
 * For GRAND_FINAL we do the same.
 */
function groupMatches(bracket: TournamentMatch[]): GroupedSection[] {
  const sectionOrder: BracketType[] = ['WINNERS', 'LOSERS', 'GRAND_FINAL'];
  const byType = new Map<BracketType, TournamentMatch[]>();
  for (const m of bracket) {
    const list = byType.get(m.bracketType) ?? [];
    list.push(m);
    byType.set(m.bracketType, list);
  }

  const sections: GroupedSection[] = [];
  for (const bt of sectionOrder) {
    const matches = byType.get(bt);
    if (!matches || matches.length === 0) continue;

    // Determine the minimum global round for this section so we can
    // compute a 1-based section-local round.
    const globalRounds = matches.map(m => m.round);
    const minRound = Math.min(...globalRounds);

    const rounds = new Map<number, TournamentMatch[]>();
    for (const m of matches) {
      const localRound = m.round - minRound + 1;
      const list = rounds.get(localRound) ?? [];
      list.push(m);
      rounds.set(localRound, list);
    }

    // Sort matches within each round by position
    for (const [, list] of rounds) {
      list.sort((a, b) => a.position - b.position);
    }

    sections.push({
      bracketType: bt,
      rounds,
      totalRounds: rounds.size,
    });
  }

  return sections;
}

/**
 * Check if a match is clickable (can select a winner).
 * Only when both participants are assigned, match is not completed, and not a BYE.
 */
function isMatchClickable(match: TournamentMatch): boolean {
  return (
    !match.isBye &&
    match.status !== 'COMPLETED' &&
    match.status !== 'BYE' &&
    match.participant1Id !== null &&
    match.participant2Id !== null
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ParticipantSlotProps {
  playerId: string | null;
  playerMap: Map<string, Player>;
  isWinner: boolean;
  isBye: boolean;
  isClickable: boolean;
  slotPosition: 'top' | 'bottom';
  onClick: () => void;
}

function ParticipantSlot({
  playerId,
  playerMap,
  isWinner,
  isBye,
  isClickable,
  slotPosition,
  onClick,
}: ParticipantSlotProps) {
  const player = playerId ? playerMap.get(playerId) : null;
  const displayName = player ? player.name : isBye ? 'BYE' : 'TBD';
  const isMuted = !player || isBye;

  return (
    <Tooltip
      title={isClickable ? `Select ${displayName} as winner` : ''}
      placement="right"
      arrow
      disableHoverListener={!isClickable}
    >
      <Box
        onClick={isClickable ? onClick : undefined}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          height: SLOT_HEIGHT,
          px: 1.25,
          cursor: isClickable ? 'pointer' : 'default',
          borderTop: slotPosition === 'bottom' ? '1px solid rgba(255,255,255,0.06)' : 'none',
          borderLeft: isWinner ? `3px solid ${GOLD_BORDER}` : '3px solid transparent',
          bgcolor: isWinner ? 'rgba(217, 119, 6, 0.08)' : 'transparent',
          transition: 'background-color 0.15s ease, border-color 0.15s ease',
          '&:hover': isClickable
            ? { bgcolor: 'rgba(255, 255, 255, 0.06)' }
            : {},
        }}
      >
        <Typography
          variant="body2"
          noWrap
          sx={{
            flex: 1,
            fontSize: '0.8rem',
            fontWeight: isWinner ? 600 : 400,
            color: isMuted ? MUTED_TEXT : isWinner ? GOLD_LIGHT : LIGHT_TEXT,
            fontStyle: isMuted && !isBye ? 'italic' : 'normal',
          }}
        >
          {displayName}
        </Typography>
        {isWinner && (
          <CheckCircleIcon sx={{ fontSize: 14, color: GOLD_LIGHT, flexShrink: 0 }} />
        )}
      </Box>
    </Tooltip>
  );
}

interface MatchCardProps {
  match: TournamentMatch;
  playerMap: Map<string, Player>;
  onSelectWinner: (matchId: string, winnerId: string) => void;
}

function MatchCard({ match, playerMap, onSelectWinner }: MatchCardProps) {
  const clickable = isMatchClickable(match);
  const isByeMatch = match.isBye || match.status === 'BYE';

  return (
    <Box
      sx={{
        width: MATCH_WIDTH,
        height: MATCH_HEIGHT,
        borderRadius: 1,
        bgcolor: isByeMatch ? BYE_BG : MATCH_BG,
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        opacity: isByeMatch ? 0.6 : 1,
        '&:hover': clickable
          ? {
              borderColor: 'rgba(255,255,255,0.15)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
              bgcolor: MATCH_BG_HOVER,
            }
          : {},
      }}
    >
      <ParticipantSlot
        playerId={match.participant1Id}
        playerMap={playerMap}
        isWinner={match.winnerId !== null && match.winnerId === match.participant1Id}
        isBye={isByeMatch && match.participant1Id === null}
        isClickable={clickable}
        slotPosition="top"
        onClick={() => {
          if (match.participant1Id) onSelectWinner(match.id, match.participant1Id);
        }}
      />
      <ParticipantSlot
        playerId={match.participant2Id}
        playerMap={playerMap}
        isWinner={match.winnerId !== null && match.winnerId === match.participant2Id}
        isBye={isByeMatch && match.participant2Id === null}
        isClickable={clickable}
        slotPosition="bottom"
        onClick={() => {
          if (match.participant2Id) onSelectWinner(match.id, match.participant2Id);
        }}
      />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Connector SVG between rounds
// ---------------------------------------------------------------------------

interface ConnectorProps {
  /** Number of matches in the source (left) round */
  sourceCount: number;
  /** Number of matches in the target (right) round */
  targetCount: number;
}

/**
 * Draw SVG connector lines between two adjacent rounds.
 * Each pair of source matches feeds into one target match.
 * Lines go: source right edge -> midpoint horizontal -> vertical span -> target left edge.
 */
function RoundConnectors({ sourceCount, targetCount }: ConnectorProps) {
  const sourceColumnHeight = sourceCount * MATCH_HEIGHT + (sourceCount - 1) * MATCH_GAP;
  const targetColumnHeight = targetCount * MATCH_HEIGHT + (targetCount - 1) * MATCH_GAP;
  const svgHeight = Math.max(sourceColumnHeight, targetColumnHeight);
  const svgWidth = ROUND_GAP;

  // Compute Y center for each match in a column
  const getMatchCenterY = (index: number, count: number) => {
    const totalHeight = count * MATCH_HEIGHT + (count - 1) * MATCH_GAP;
    const offsetY = (svgHeight - totalHeight) / 2;
    return offsetY + index * (MATCH_HEIGHT + MATCH_GAP) + MATCH_HEIGHT / 2;
  };

  const midX = svgWidth / 2;
  const paths: string[] = [];

  // If each pair of source matches feeds into one target match
  if (sourceCount >= targetCount) {
    const ratio = Math.max(1, Math.floor(sourceCount / targetCount));
    for (let t = 0; t < targetCount; t++) {
      const targetY = getMatchCenterY(t, targetCount);
      // Connect source matches to this target
      const startIdx = t * ratio;
      const endIdx = Math.min(startIdx + ratio, sourceCount);

      for (let s = startIdx; s < endIdx; s++) {
        const sourceY = getMatchCenterY(s, sourceCount);
        // Horizontal from source to midpoint
        paths.push(`M 0 ${sourceY} L ${midX} ${sourceY}`);
        // Vertical from source Y to target Y at midpoint
        paths.push(`M ${midX} ${sourceY} L ${midX} ${targetY}`);
      }
      // Horizontal from midpoint to target
      paths.push(`M ${midX} ${targetY} L ${svgWidth} ${targetY}`);
    }
  } else {
    // 1:1 or fewer sources than targets (unusual but handle gracefully)
    for (let i = 0; i < Math.min(sourceCount, targetCount); i++) {
      const sourceY = getMatchCenterY(i, sourceCount);
      const targetY = getMatchCenterY(i, targetCount);
      paths.push(`M 0 ${sourceY} L ${midX} ${sourceY}`);
      paths.push(`M ${midX} ${sourceY} L ${midX} ${targetY}`);
      paths.push(`M ${midX} ${targetY} L ${svgWidth} ${targetY}`);
    }
  }

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={CONNECTOR_COLOR}
          strokeWidth={CONNECTOR_THICKNESS}
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Section (Winners / Losers / Grand Final)
// ---------------------------------------------------------------------------

interface BracketSectionProps {
  section: GroupedSection;
  playerMap: Map<string, Player>;
  isDE: boolean;
  onSelectWinner: (matchId: string, winnerId: string) => void;
  defaultExpanded?: boolean;
}

function BracketSection({
  section,
  playerMap,
  isDE,
  onSelectWinner,
  defaultExpanded = true,
}: BracketSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const sortedRounds = useMemo(
    () => Array.from(section.rounds.entries()).sort(([a], [b]) => a - b),
    [section.rounds]
  );

  return (
    <Box sx={{ mb: 3 }}>
      {/* Section header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded(prev => !prev)}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            fontSize: '0.95rem',
            color: LIGHT_TEXT,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          {BRACKET_SECTION_LABELS[section.bracketType] ?? section.bracketType}
        </Typography>
        <IconButton size="small" sx={{ color: MUTED_TEXT }}>
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            overflowX: 'auto',
            pb: 2,
            // Minimal scrollbar styling
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(255,255,255,0.1)',
              borderRadius: 3,
            },
          }}
        >
          {sortedRounds.map(([roundNum, matches], roundIdx) => {
            const nextEntry = sortedRounds[roundIdx + 1];
            const matchCount = matches.length;

            // Compute the tallest column height across all rounds for vertical centering
            const maxMatchesInAnyRound = Math.max(
              ...sortedRounds.map(([, m]) => m.length)
            );
            const maxColumnHeight =
              maxMatchesInAnyRound * MATCH_HEIGHT +
              (maxMatchesInAnyRound - 1) * MATCH_GAP;

            const roundName = getSectionRoundName(
              roundNum,
              section.totalRounds,
              section.bracketType,
              isDE,
              matchCount
            );

            return (
              <Box
                key={`${section.bracketType}-r${roundNum}`}
                sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                {/* Round column */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Round header */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: MUTED_TEXT,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      mb: 1.5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {roundName}
                  </Typography>

                  {/* Matches column with vertical centering */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: `${MATCH_GAP}px`,
                      justifyContent: 'center',
                      minHeight: maxColumnHeight,
                    }}
                  >
                    {matches.map(match => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        playerMap={playerMap}
                        onSelectWinner={onSelectWinner}
                      />
                    ))}
                  </Box>
                </Box>

                {/* Connector lines to next round */}
                {nextEntry && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      // Offset for the round header height
                      mt: '28px',
                      minHeight: maxColumnHeight,
                    }}
                  >
                    <RoundConnectors
                      sourceCount={matchCount}
                      targetCount={nextEntry[1].length}
                    />
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Champion banner
// ---------------------------------------------------------------------------

interface ChampionBannerProps {
  champion: Player;
}

function ChampionBanner({ champion }: ChampionBannerProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        mt: 2,
        mb: 1,
        py: 2,
        px: 3,
        borderRadius: 2,
        bgcolor: 'rgba(217, 119, 6, 0.08)',
        border: `1px solid ${GOLD_BORDER}`,
        boxShadow: `0 0 24px rgba(217, 119, 6, 0.12)`,
      }}
    >
      <EmojiEventsIcon sx={{ color: GOLD_LIGHT, fontSize: 28 }} />
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: GOLD_BORDER,
            fontWeight: 700,
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Tournament Champion
        </Typography>
        <Typography
          variant="h6"
          sx={{ color: GOLD_LIGHT, fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}
        >
          {champion.name}
        </Typography>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Mobile list view
// ---------------------------------------------------------------------------

interface MobileListViewProps {
  sections: GroupedSection[];
  playerMap: Map<string, Player>;
  isDE: boolean;
  onSelectWinner: (matchId: string, winnerId: string) => void;
}

function MobileListView({ sections, playerMap, isDE, onSelectWinner }: MobileListViewProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {sections.map(section => {
        const sortedRounds = Array.from(section.rounds.entries()).sort(([a], [b]) => a - b);
        return (
          <Box key={section.bracketType}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: '0.85rem',
                color: LIGHT_TEXT,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                mb: 1,
              }}
            >
              {BRACKET_SECTION_LABELS[section.bracketType] ?? section.bracketType}
            </Typography>
            {sortedRounds.map(([roundNum, matches]) => {
              const roundName = getSectionRoundName(
                roundNum,
                section.totalRounds,
                section.bracketType,
                isDE,
                matches.length
              );
              return (
                <Box key={roundNum} sx={{ mb: 1.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: MUTED_TEXT,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      mb: 0.5,
                      display: 'block',
                    }}
                  >
                    {roundName}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {matches.map(match => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        playerMap={playerMap}
                        onSelectWinner={onSelectWinner}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TournamentView() {
  const { state, dispatch } = useChallenge();
  const { bracket, challenge } = state;
  const { players, tournamentConfig } = challenge;

  const isDE = tournamentConfig?.eliminationType === 'DOUBLE_ELIMINATION';

  const playerMap = useMemo(() => buildPlayerMap(players), [players]);

  const sections = useMemo(() => {
    if (!bracket || bracket.length === 0) return [];
    return groupMatches(bracket);
  }, [bracket]);

  const handleSelectWinner = useCallback(
    (matchId: string, winnerId: string) => {
      dispatch({ type: 'ADVANCE_MATCH', matchId, winnerId });
    },
    [dispatch]
  );

  // Determine tournament champion: the winner of the last match in the bracket
  const champion = useMemo(() => {
    if (!bracket || bracket.length === 0) return null;

    // For double elimination, champion is the winner of the last grand final match
    // For single elimination, champion is the winner of the final match
    if (isDE) {
      const gfMatches = bracket
        .filter(m => m.bracketType === 'GRAND_FINAL')
        .sort((a, b) => b.round - a.round);
      // The last GF match that has a winner
      for (const m of gfMatches) {
        if (m.winnerId) return playerMap.get(m.winnerId) ?? null;
      }
      return null;
    }

    // Single elimination: find the final match (highest round in WINNERS)
    const winnersMatches = bracket
      .filter(m => m.bracketType === 'WINNERS')
      .sort((a, b) => b.round - a.round);
    if (winnersMatches.length > 0 && winnersMatches[0].winnerId) {
      return playerMap.get(winnersMatches[0].winnerId) ?? null;
    }
    return null;
  }, [bracket, isDE, playerMap]);

  // Track mobile view toggle
  const [mobileListMode, setMobileListMode] = useState(false);

  if (!bracket || bracket.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: MUTED_TEXT }}>
          No bracket data available.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: BRACKET_BG,
        borderRadius: 2,
        p: { xs: 1.5, sm: 2.5 },
        position: 'relative',
      }}
    >
      {/* Header row with optional mobile toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1rem', sm: '1.15rem' },
            color: LIGHT_TEXT,
          }}
        >
          Tournament Bracket
        </Typography>

        {/* Mobile list view toggle -- visible only on small screens */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Tooltip title={mobileListMode ? 'Show bracket view' : 'Show list view'}>
            <IconButton
              size="small"
              onClick={() => setMobileListMode(prev => !prev)}
              sx={{ color: MUTED_TEXT }}
            >
              {mobileListMode ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Champion banner */}
      {champion && <ChampionBanner champion={champion} />}

      {/* Bracket body */}
      <Box
        sx={{
          bgcolor: PANEL_BG,
          borderRadius: 1.5,
          p: { xs: 1.5, sm: 2 },
        }}
      >
        {/* Desktop bracket view -- hidden on small screens when list mode is on */}
        <Box sx={{ display: { xs: mobileListMode ? 'none' : 'block', md: 'block' } }}>
          {sections.map(section => (
            <BracketSection
              key={section.bracketType}
              section={section}
              playerMap={playerMap}
              isDE={isDE}
              onSelectWinner={handleSelectWinner}
            />
          ))}
        </Box>

        {/* Mobile list view */}
        <Box sx={{ display: { xs: mobileListMode ? 'block' : 'none', md: 'none' } }}>
          <MobileListView
            sections={sections}
            playerMap={playerMap}
            isDE={isDE}
            onSelectWinner={handleSelectWinner}
          />
        </Box>
      </Box>
    </Box>
  );
}
