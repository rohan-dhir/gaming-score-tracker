'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { computeMatchDistribution } from '@/utils/bracketDistribution';
import { getSectionRoundName } from '@/utils/tournamentRoundNames';
import type { EliminationType } from '@/state/types';

// ─── Visual Constants ────────────────────────────────────────────────────────

const SUBTLE_BORDER = 'rgba(255, 255, 255, 0.08)';
const MUTED_TEXT = 'rgba(255, 255, 255, 0.5)';
const PANEL_BG = '#1e1f2a';
const MATCH_BG = 'rgba(255,255,255,0.03)';
const GOLD_BORDER = '#d97706';
const GOLD_LIGHT = '#f59e0b';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PreviewMatch {
  matchIndex: number;
  round: number;
  position: number;
  slot1: string;
  slot2: string;
  isBye: boolean;
  bracketType: 'WINNERS' | 'LOSERS' | 'GRAND_FINAL';
}

interface TournamentBracketPreviewProps {
  playerNames: string[];
  eliminationType: EliminationType;
}

// ─── Bracket Generation ──────────────────────────────────────────────────────

function generatePreviewBracket(
  playerNames: string[],
  eliminationType: EliminationType,
): PreviewMatch[] {
  const total = playerNames.length;
  if (total < 2) return [];

  const bracketSize = Math.pow(2, Math.ceil(Math.log2(total)));
  const wbRounds = Math.ceil(Math.log2(bracketSize));
  const matches: PreviewMatch[] = [];
  let matchIndex = 0;

  // Seed participants into first round slots
  const slots: string[] = [];
  for (let i = 0; i < bracketSize; i++) {
    slots.push(i < total ? playerNames[i] : '');
  }

  // Generate Winners Bracket rounds
  let currentSlots = slots;
  for (let round = 1; round <= wbRounds; round++) {
    const matchCount = currentSlots.length / 2;
    const nextRoundSlots: string[] = [];

    for (let pos = 0; pos < matchCount; pos++) {
      const slot1 = currentSlots[pos * 2];
      const slot2 = currentSlots[pos * 2 + 1];
      const isBye = !slot1 || !slot2;

      matches.push({
        matchIndex,
        round,
        position: pos + 1,
        slot1: slot1 || 'BYE',
        slot2: slot2 || 'BYE',
        isBye,
        bracketType: 'WINNERS',
      });
      matchIndex++;

      if (isBye) {
        nextRoundSlots.push(slot1 || slot2);
      } else {
        nextRoundSlots.push('TBD');
      }
    }
    currentSlots = nextRoundSlots;
  }

  // Double elimination: add Losers Bracket and Grand Final
  if (eliminationType === 'DOUBLE_ELIMINATION') {
    const distribution = computeMatchDistribution(bracketSize, 'DOUBLE_ELIMINATION');
    const lbDistribution = distribution.filter(d => d.bracketType === 'LOSERS');
    const gfDistribution = distribution.filter(d => d.bracketType === 'GRAND_FINAL');

    for (const rd of lbDistribution) {
      const mc = Math.max(1, rd.matchCount);
      for (let pos = 0; pos < mc; pos++) {
        matches.push({
          matchIndex,
          round: rd.bracketRound,
          position: pos + 1,
          slot1: 'TBD',
          slot2: 'TBD',
          isBye: false,
          bracketType: 'LOSERS',
        });
        matchIndex++;
      }
    }

    for (const rd of gfDistribution) {
      matches.push({
        matchIndex,
        round: rd.bracketRound,
        position: 1,
        slot1: rd.bracketRound === 1 ? 'WB Winner' : 'TBD',
        slot2: rd.bracketRound === 1 ? 'LB Winner' : 'TBD',
        isBye: false,
        bracketType: 'GRAND_FINAL',
      });
      matchIndex++;
    }
  }

  return matches;
}

// ─── Match Card ──────────────────────────────────────────────────────────────

function PreviewMatchCard({ match }: { match: PreviewMatch }) {
  const isPlaceholder = (name: string) =>
    name === 'TBD' || name === 'BYE' || name === 'WB Winner' || name === 'LB Winner';

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        minWidth: 160,
        bgcolor: MATCH_BG,
        border: `1px solid ${SUBTLE_BORDER}`,
        borderRadius: 1.5,
        transition: 'border-color 0.15s ease',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.65rem',
          color: isPlaceholder(match.slot1) ? MUTED_TEXT : 'rgba(255,255,255,0.9)',
          fontStyle: isPlaceholder(match.slot1) ? 'italic' : 'normal',
          fontWeight: isPlaceholder(match.slot1) ? 400 : 500,
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {match.slot1}
      </Typography>
      <Divider sx={{ my: 0.5, borderColor: SUBTLE_BORDER }} />
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.65rem',
          color: isPlaceholder(match.slot2) ? MUTED_TEXT : 'rgba(255,255,255,0.9)',
          fontStyle: isPlaceholder(match.slot2) ? 'italic' : 'normal',
          fontWeight: isPlaceholder(match.slot2) ? 400 : 500,
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {match.slot2}
      </Typography>
      {match.isBye && (
        <Box sx={{ mt: 0.25 }}>
          <Typography
            variant="caption"
            sx={{
              color: GOLD_LIGHT,
              fontSize: '0.5rem',
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            BYE
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

// ─── Bracket Section ─────────────────────────────────────────────────────────

function PreviewBracketSection({
  title,
  matches,
  accentColor,
  bracketType,
  isDE = false,
}: {
  title: string;
  matches: PreviewMatch[];
  accentColor: string;
  bracketType: 'WINNERS' | 'LOSERS' | 'GRAND_FINAL';
  isDE?: boolean;
}) {
  const matchesByRound = useMemo(() => {
    const rounds = new Map<number, PreviewMatch[]>();
    matches.forEach((m) => {
      const existing = rounds.get(m.round) || [];
      existing.push(m);
      rounds.set(m.round, existing);
    });
    return Array.from(rounds.entries()).sort(([a], [b]) => a - b);
  }, [matches]);

  const totalRoundsInSection = useMemo(
    () => (matchesByRound.length > 0 ? Math.max(...matchesByRound.map(([r]) => r)) : 0),
    [matchesByRound],
  );

  if (matches.length === 0) return null;

  return (
    <Box
      sx={{
        borderRadius: '6px',
        overflow: 'hidden',
        border: `1px solid ${SUBTLE_BORDER}`,
        bgcolor: PANEL_BG,
        mb: 1.5,
      }}
    >
      {/* Section header */}
      <Box
        sx={{
          px: 1.5,
          py: 0.5,
          borderBottom: `1px solid ${SUBTLE_BORDER}`,
          borderLeft: `3px solid ${accentColor}`,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.6rem',
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* Bracket rounds */}
      <Box sx={{ overflowX: 'auto', p: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          {matchesByRound.map(([round, roundMatches]) => (
            <Box
              key={round}
              sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 170 }}
            >
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{
                  color: 'text.secondary',
                  textAlign: 'center',
                  mb: 0.5,
                  fontSize: '0.55rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {getSectionRoundName(
                  round,
                  totalRoundsInSection,
                  bracketType,
                  bracketType === 'WINNERS' && isDE,
                )}
              </Typography>
              {roundMatches
                .sort((a, b) => a.position - b.position)
                .map((match) => (
                  <PreviewMatchCard key={match.matchIndex} match={match} />
                ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Stat Box ────────────────────────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <Box sx={{ textAlign: 'center', px: 1.5 }}>
      <Typography variant="caption" sx={{ color: MUTED_TEXT, fontSize: '0.65rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ color: 'rgba(255,255,255,0.9)' }}>
        {value}
      </Typography>
    </Box>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TournamentBracketPreview({
  playerNames,
  eliminationType,
}: TournamentBracketPreviewProps) {
  const [expanded, setExpanded] = useState(true);

  const matches = useMemo(
    () => generatePreviewBracket(playerNames, eliminationType),
    [playerNames, eliminationType],
  );

  const wbMatches = useMemo(() => matches.filter((m) => m.bracketType === 'WINNERS'), [matches]);
  const lbMatches = useMemo(() => matches.filter((m) => m.bracketType === 'LOSERS'), [matches]);
  const gfMatches = useMemo(() => matches.filter((m) => m.bracketType === 'GRAND_FINAL'), [matches]);

  const playerCount = playerNames.length;
  const bracketSize = playerCount >= 2 ? Math.pow(2, Math.ceil(Math.log2(playerCount))) : 0;
  const byes = bracketSize - playerCount;
  const wbRounds = bracketSize >= 2 ? Math.ceil(Math.log2(bracketSize)) : 0;
  const isDE = eliminationType === 'DOUBLE_ELIMINATION';
  const nonByeMatches = matches.filter((m) => !m.isBye).length;

  if (playerCount < 2 || matches.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
      {/* Header with toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: expanded ? 2 : 0,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <AccountTreeIcon fontSize="small" />
          Bracket Preview
        </Typography>
        <IconButton size="small" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        {/* Stats row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <StatBox label="Participants" value={playerCount} />
          {!isDE && <StatBox label="Rounds" value={wbRounds} />}
          {isDE && <StatBox label="WB Rounds" value={wbRounds} />}
          {isDE && <StatBox label="LB Rounds" value={2 * (wbRounds - 1)} />}
          <StatBox label="Matches" value={nonByeMatches} />
          {byes > 0 && <StatBox label="Byes" value={byes} />}
        </Box>

        {/* Visual bracket */}
        <Box sx={{ overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: 1, pb: 1 }}>
          {/* Winners Bracket */}
          <PreviewBracketSection
            title={isDE ? 'Winners Bracket' : 'Bracket'}
            matches={wbMatches}
            accentColor={isDE ? '#3b82f6' : GOLD_BORDER}
            bracketType="WINNERS"
            isDE={isDE}
          />

          {/* Losers Bracket (DE only) */}
          {isDE && lbMatches.length > 0 && (
            <PreviewBracketSection
              title="Losers Bracket"
              matches={lbMatches}
              accentColor={GOLD_LIGHT}
              bracketType="LOSERS"
              isDE={isDE}
            />
          )}

          {/* Grand Final (DE only) */}
          {isDE && gfMatches.length > 0 && (
            <PreviewBracketSection
              title="Grand Final"
              matches={gfMatches}
              accentColor="#ef4444"
              bracketType="GRAND_FINAL"
              isDE={isDE}
            />
          )}
        </Box>

        {/* Byes explanation */}
        {byes > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Some participants will automatically advance in round 1 due to bracket size.
          </Typography>
        )}

        {/* DE explanation */}
        {isDE && (
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Winners Bracket:</strong> Lose once and drop to the Losers Bracket
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <strong>Losers Bracket:</strong> Lose again and you are eliminated
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <strong>Grand Final:</strong> Winners Bracket champion vs Losers Bracket champion
              (bracket reset if LB champion wins)
            </Typography>
          </Box>
        )}
      </Collapse>
    </Paper>
  );
}
