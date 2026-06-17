'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TimerIcon from '@mui/icons-material/Timer';
import NumbersIcon from '@mui/icons-material/Numbers';
import PercentIcon from '@mui/icons-material/Percent';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { SpotlightCard } from '@/components/shared/SpotlightCard';
import type { LeaderboardConfig, Primitive, WinCondition } from '@/state/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_COLLAPSED_ROWS = 5;
const HEADER_GRADIENT = 'linear-gradient(135deg, #4f46e5, #818cf8)';
const HEADER_GRADIENT_TOURNAMENT = 'linear-gradient(135deg, #d97706, #f59e0b)';
const HEADER_BORDER_DEFAULT = '2px solid rgba(99, 102, 241, 0.4)';
const HEADER_BORDER_TOURNAMENT = '2px solid rgba(217, 119, 6, 0.4)';
const TITLE_BG = '#272932';
const ROW_BG_ODD = '#1e1f2a';
const ROW_BG_EVEN = '#171823';
const CELL_PADDING = '8px 14px';
const MUTED_TEXT = 'rgba(255, 255, 255, 0.5)';

// ─── Mock Data ───────────────────────────────────────────────────────────────

function getMockValues(primitive: Primitive, winCondition: WinCondition, count: number): string[] {
  switch (primitive) {
    case 'NUMBER': {
      const base = winCondition === 'HIGHEST' ? [1250, 980, 750, 520, 310] : [310, 520, 750, 980, 1250];
      return base.slice(0, count).map((v) => v.toLocaleString());
    }
    case 'DURATION': {
      const values = winCondition === 'LOWEST'
        ? ['1:23:45', '1:30:12', '1:45:00', '2:01:33', '2:15:07']
        : ['2:15:07', '2:01:33', '1:45:00', '1:30:12', '1:23:45'];
      return values.slice(0, count);
    }
    case 'BOOLEAN': return Array.from({ length: count }, (_, i) => i < 2 ? 'true' : 'false');
    case 'RATIO': {
      const values = winCondition === 'HIGHEST'
        ? ['85%', '72%', '60%', '48%', '35%'] : ['35%', '48%', '60%', '72%', '85%'];
      return values.slice(0, count);
    }
    case 'RANK': return ['1st', '2nd', '3rd', '4th', '5th'].slice(0, count);
    default: return Array.from({ length: count }, () => '--');
  }
}

const DEFAULT_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5'];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getPrimitiveIcon(primitive: Primitive): React.ReactNode {
  switch (primitive) {
    case 'DURATION':
      return <TimerIcon sx={{ fontSize: 14 }} />;
    case 'RATIO':
      return <PercentIcon sx={{ fontSize: 14 }} />;
    case 'RANK':
      return <MilitaryTechIcon sx={{ fontSize: 14 }} />;
    case 'BOOLEAN':
      return <CheckBoxIcon sx={{ fontSize: 14 }} />;
    default:
      return <NumbersIcon sx={{ fontSize: 14 }} />;
  }
}

function getPrimitiveLabel(primitive: Primitive): string {
  switch (primitive) {
    case 'NUMBER': return 'Number';
    case 'DURATION': return 'Duration';
    case 'BOOLEAN': return 'Completion';
    case 'RATIO': return 'Ratio';
    case 'RANK': return 'Rank';
    default: return 'Number';
  }
}

function getWinConditionLabel(winCondition: WinCondition): string {
  return winCondition === 'HIGHEST' ? 'Highest Wins' : 'Lowest Wins';
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface LeaderboardPreviewProps {
  leaderboard: LeaderboardConfig;
  index: number;
  isActive?: boolean;
  onScrollToMetric?: (metricIndex: number) => void;
  onScrollToTitle?: () => void;
  onScrollToDescription?: () => void;
  onAddMetric?: () => void;
  onInsertMetric?: (position: number) => void;
  participantNames?: string[];
  rowCount?: number;
  isTournament?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

function LeaderboardPreviewInner({
  leaderboard,
  index,
  isActive = false,
  onScrollToMetric,
  onScrollToTitle,
  onScrollToDescription,
  onAddMetric,
  onInsertMetric,
  participantNames,
  rowCount: rowCountProp,
  isTournament = false,
}: LeaderboardPreviewProps) {
  const totalRows = participantNames?.length ?? rowCountProp ?? 4;
  const canExpand = totalRows > MAX_COLLAPSED_ROWS;
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const rowCount = canExpand && !showAllParticipants ? MAX_COLLAPSED_ROWS : totalRows;
  const [isHovered, setIsHovered] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const displayTitle = leaderboard.title || `Leaderboard ${index + 1}`;
  const displayMetrics = leaderboard.metrics.length > 0
    ? leaderboard.metrics.map((m, i) => ({
        ...m,
        name: m.name.trim() || `Metric ${i + 1}`,
      }))
    : [{ id: 'default', name: 'Score', primitive: 'NUMBER' as Primitive, winCondition: 'HIGHEST' as WinCondition }];

  // Get primary metric for chip display
  const primaryMetric = displayMetrics[0];

  // Pre-compute mock values for each metric
  const mockData = useMemo(() => {
    return displayMetrics.map((metric) =>
      getMockValues(metric.primitive, metric.winCondition, totalRows)
    );
  }, [displayMetrics, totalRows]);

  const headerBaseStyle: React.CSSProperties = {
    background: isTournament ? HEADER_GRADIENT_TOURNAMENT : HEADER_GRADIENT,
    color: '#ffffff',
    fontWeight: 600,
    padding: CELL_PADDING,
    fontSize: '0.8rem',
    borderBottom: isTournament ? HEADER_BORDER_TOURNAMENT : HEADER_BORDER_DEFAULT,
    whiteSpace: 'nowrap',
  };

  const rowBorderBottom = '1px solid rgba(255, 255, 255, 0.06)';

  return (
    <SpotlightCard
      spotlightColor="rgba(255,255,255,0.03)"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        borderRadius: '10px',
        overflow: 'hidden',
        border: isActive
          ? isTournament
            ? '2px solid rgba(217, 119, 6, 0.7)'
            : '2px solid rgba(99, 102, 241, 0.7)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        bgcolor: '#171823',
        transition: 'all 0.3s ease',
        boxShadow: isActive
          ? isTournament
            ? '0 0 16px rgba(217, 119, 6, 0.25)'
            : '0 0 16px rgba(99, 102, 241, 0.25)'
          : '0 2px 8px rgba(0, 0, 0, 0.3)',
        minWidth: 370,
        maxWidth: 540,
        userSelect: 'none',
        '& .metric-name-hoverable:hover': {
          textDecoration: 'underline',
        },
      }}
    >
      {/* Title bar */}
      <Box
        onClick={onScrollToTitle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          background: TITLE_BG,
          borderBottom: isTournament ? HEADER_BORDER_TOURNAMENT : HEADER_BORDER_DEFAULT,
          cursor: onScrollToTitle ? 'pointer' : 'default',
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{
            color: '#ffffff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            fontSize: '0.95rem',
            cursor: onScrollToTitle ? 'pointer' : 'default',
            '&:hover': onScrollToTitle ? { textDecoration: 'underline' } : {},
          }}
        >
          {displayTitle}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}>
          <Chip
            label={getPrimitiveLabel(primaryMetric.primitive)}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.65rem',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              color: '#fff',
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
          {primaryMetric.primitive !== 'BOOLEAN' && (
            <Chip
              label={getWinConditionLabel(primaryMetric.winCondition)}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.65rem',
                bgcolor: primaryMetric.winCondition === 'HIGHEST'
                  ? 'rgba(46, 125, 50, 0.3)'
                  : 'rgba(2, 136, 209, 0.3)',
                color: '#fff',
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}
        </Box>
      </Box>

      {/* Description area (clickable if callback provided) */}
      {leaderboard.description && (
        <Box
          onClick={onScrollToDescription}
          sx={{
            px: 1.5,
            py: 0.5,
            cursor: onScrollToDescription ? 'pointer' : 'default',
            '&:hover': onScrollToDescription ? { bgcolor: 'rgba(99, 102, 241, 0.06)' } : {},
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: MUTED_TEXT,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {leaderboard.description}
          </Typography>
        </Box>
      )}

      {/* Preview table */}
      <Box ref={tableRef} sx={{ overflowX: 'auto' }}>
        <table
          style={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            width: '100%',
          }}
        >
          <thead>
            <tr>
              {/* Participant header */}
              <th
                style={{
                  ...headerBaseStyle,
                  textAlign: 'left',
                  minWidth: 100,
                }}
              >
                Player
              </th>
              {/* Metric column headers */}
              {displayMetrics.map((metric, metricIdx) => (
                <React.Fragment key={metric.id}>
                  <th
                    onClick={() => onScrollToMetric?.(metricIdx)}
                    style={{
                      ...headerBaseStyle,
                      textAlign: 'center',
                      minWidth: 80,
                      cursor: onScrollToMetric ? 'pointer' : 'default',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        justifyContent: 'center',
                      }}
                    >
                      {getPrimitiveIcon(metric.primitive)}
                      <span
                        className={onScrollToMetric ? 'metric-name-hoverable' : undefined}
                        style={{
                          maxWidth: 80,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {metric.name || `Metric ${metricIdx + 1}`}
                      </span>
                    </span>
                  </th>
                  {/* Insert "+" between metrics (not after last) */}
                  {isHovered && onInsertMetric && metricIdx < displayMetrics.length - 1 && (
                    <th
                      style={{
                        ...headerBaseStyle,
                        textAlign: 'center',
                        width: 24,
                        minWidth: 24,
                        padding: '4px 0',
                      }}
                    >
                      <Tooltip title="Insert metric here">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInsertMetric(metricIdx + 1);
                          }}
                          sx={{
                            color: '#ffffff',
                            width: 20,
                            height: 20,
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                          }}
                        >
                          <AddIcon sx={{ fontSize: 12 }} />
                        </IconButton>
                      </Tooltip>
                    </th>
                  )}
                </React.Fragment>
              ))}
              {/* Add metric column - visible on hover */}
              {isHovered && onAddMetric && (
                <th
                  style={{
                    ...headerBaseStyle,
                    textAlign: 'center',
                    width: 36,
                    padding: '4px',
                  }}
                >
                  <Tooltip title="Add metric">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddMetric();
                      }}
                      sx={{
                        color: '#ffffff',
                        width: 22,
                        height: 22,
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                      }}
                    >
                      <AddIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }).map((_, rowIdx) => {
              const rowBg = rowIdx % 2 === 0 ? ROW_BG_ODD : ROW_BG_EVEN;

              return (
                <tr key={rowIdx}>
                  {/* Participant */}
                  <td
                    style={{
                      padding: CELL_PADDING,
                      borderBottom: rowBorderBottom,
                      background: rowBg,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#e2e8f0',
                        fontWeight: rowIdx === 0 ? 500 : 400,
                        fontSize: '0.78rem',
                      }}
                    >
                      {participantNames?.[rowIdx] ?? DEFAULT_NAMES[rowIdx]}
                    </Typography>
                  </td>
                  {/* Metric values */}
                  {displayMetrics.map((metric, metricIdx) => (
                    <React.Fragment key={metric.id}>
                      <td
                        onClick={() => onScrollToMetric?.(metricIdx)}
                        style={{
                          padding: CELL_PADDING,
                          textAlign: 'center',
                          borderBottom: rowBorderBottom,
                          background: rowBg,
                          cursor: onScrollToMetric ? 'pointer' : 'default',
                        }}
                      >
                        {metric.primitive === 'BOOLEAN' ? (
                          mockData[metricIdx][rowIdx] === 'true' ? (
                            <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                          ) : (
                            <CloseIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                          )
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'monospace',
                              fontVariantNumeric: 'tabular-nums',
                              color: '#cbd5e1',
                              fontSize: '0.78rem',
                            }}
                          >
                            {mockData[metricIdx][rowIdx]}
                          </Typography>
                        )}
                      </td>
                      {isHovered && onInsertMetric && metricIdx < displayMetrics.length - 1 && (
                        <td
                          style={{
                            padding: 0,
                            borderBottom: rowBorderBottom,
                            background: rowBg,
                            width: 24,
                          }}
                        />
                      )}
                    </React.Fragment>
                  ))}
                  {/* Empty cell for add-metric column when hovered */}
                  {isHovered && onAddMetric && (
                    <td
                      style={{
                        padding: CELL_PADDING,
                        borderBottom: rowBorderBottom,
                        background: rowBg,
                        width: 36,
                      }}
                    />
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>

      {/* Show All / Show Less toggle */}
      {canExpand && (
        <Box
          onClick={(e) => {
            e.stopPropagation();
            setShowAllParticipants((prev) => !prev);
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            py: 0.75,
            cursor: 'pointer',
            bgcolor: TITLE_BG,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.06)' },
            transition: 'background-color 0.15s ease',
          }}
        >
          {showAllParticipants ? (
            <ExpandLessIcon sx={{ fontSize: 16, color: MUTED_TEXT }} />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: 16, color: MUTED_TEXT }} />
          )}
          <Typography
            variant="caption"
            sx={{ color: MUTED_TEXT, fontSize: '0.7rem', fontWeight: 500 }}
          >
            {showAllParticipants
              ? 'Show Less Participants'
              : `Show All Participants (${totalRows})`}
          </Typography>
        </Box>
      )}
    </SpotlightCard>
  );
}

export const LeaderboardPreview = React.memo(LeaderboardPreviewInner, (prev, next) => {
  return (
    prev.leaderboard === next.leaderboard &&
    prev.index === next.index &&
    prev.isActive === next.isActive &&
    prev.participantNames === next.participantNames &&
    prev.rowCount === next.rowCount &&
    prev.isTournament === next.isTournament &&
    prev.onScrollToMetric === next.onScrollToMetric &&
    prev.onScrollToTitle === next.onScrollToTitle &&
    prev.onScrollToDescription === next.onScrollToDescription &&
    prev.onAddMetric === next.onAddMetric &&
    prev.onInsertMetric === next.onInsertMetric
  );
});

export default LeaderboardPreview;
