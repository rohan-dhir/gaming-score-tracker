'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { LeaderboardPreview } from './LeaderboardPreview';
import type { LeaderboardConfig } from '@/state/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const CARD_WIDTH = 420;
const CARD_GAP = 16;
const CARD_STEP = CARD_WIDTH + CARD_GAP;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const RENDER_WINDOW = 3;

// ─── Props ───────────────────────────────────────────────────────────────────

interface LeaderboardCarouselProps {
  leaderboards: LeaderboardConfig[];
  activeIndex: number;
  onSelectLeaderboard: (index: number) => void;
  onScrollToMetric?: (metricIndex: number) => void;
  onScrollToTitle?: () => void;
  onScrollToDescription?: () => void;
  onAddMetric?: () => void;
  onInsertMetric?: (position: number) => void;
  participantNamesPerLeaderboard?: string[][];
  isTournament?: boolean;
  onAddLeaderboard?: () => void;
  onDeleteLeaderboard?: (index: number) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LeaderboardCarousel({
  leaderboards,
  activeIndex,
  onSelectLeaderboard,
  onScrollToMetric,
  onScrollToTitle,
  onScrollToDescription,
  onAddMetric,
  onInsertMetric,
  participantNamesPerLeaderboard,
  isTournament = false,
  onAddLeaderboard,
  onDeleteLeaderboard,
}: LeaderboardCarouselProps) {
  const [hovered, setHovered] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const count = leaderboards.length;
  const isSingle = count === 1;

  // Clamp active index
  const clampedIndex = Math.max(0, Math.min(activeIndex, count - 1));

  useEffect(() => {
    if (clampedIndex !== activeIndex) {
      onSelectLeaderboard(clampedIndex);
    }
  }, [clampedIndex, activeIndex, onSelectLeaderboard]);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, count - 1));
    onSelectLeaderboard(clamped);
  }, [count, onSelectLeaderboard]);

  const goLeft = useCallback(() => goTo(clampedIndex - 1), [clampedIndex, goTo]);
  const goRight = useCallback(() => goTo(clampedIndex + 1), [clampedIndex, goTo]);

  // Touch handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goRight();
      else goLeft();
    }
    touchStartRef.current = null;
  }, [goLeft, goRight]);

  // Compute which cards to render (window of RENDER_WINDOW from center)
  const renderStart = Math.max(0, clampedIndex - RENDER_WINDOW);
  const renderEnd = Math.min(count - 1, clampedIndex + RENDER_WINDOW);

  // Translate the card strip so active card is centered
  const stripTranslate = -(clampedIndex * CARD_STEP);

  // Transition duration scales by distance jumped
  const [prevIndex, setPrevIndex] = useState(clampedIndex);
  const distance = Math.abs(clampedIndex - prevIndex);
  const baseDuration = 350;
  const duration = Math.min(baseDuration + distance * 50, 600);

  useEffect(() => {
    setPrevIndex(clampedIndex);
  }, [clampedIndex]);

  // ── Single Card Mode ──────────────────────────────────────────────────────

  if (isSingle) {
    return (
      <Box
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
          py: 1,
        }}
      >
        <Box sx={{ width: CARD_WIDTH, maxWidth: '100%' }}>
          <LeaderboardPreview
            leaderboard={leaderboards[0]}
            index={0}
            isActive
            onScrollToMetric={onScrollToMetric}
            onScrollToTitle={onScrollToTitle}
            onScrollToDescription={onScrollToDescription}
            onAddMetric={onAddMetric}
            onInsertMetric={onInsertMetric}
            participantNames={participantNamesPerLeaderboard?.[0]}
            isTournament={isTournament}
          />
        </Box>
        {/* Add leaderboard button */}
        {hovered && onAddLeaderboard && (
          <Box
            sx={{
              position: 'absolute',
              right: 'calc(50% - 240px)',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <Tooltip title="Add leaderboard">
              <IconButton
                onClick={onAddLeaderboard}
                sx={{
                  width: 36,
                  height: 36,
                  border: '2px dashed rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  color: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: 'primary.light',
                    color: 'primary.light',
                    bgcolor: 'rgba(99,102,241,0.1)',
                  },
                }}
              >
                <AddRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    );
  }

  // ── Multi-Card Carousel Mode ──────────────────────────────────────────────

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{ position: 'relative', py: 1 }}
    >
      {/* Counter chip */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
        <Chip
          label={`${clampedIndex + 1} / ${count}`}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.7rem',
            bgcolor: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.7)',
          }}
        />
      </Box>

      {/* Left arrow */}
      {clampedIndex > 0 && (
        <IconButton
          onClick={goLeft}
          disabled={clampedIndex === 0}
          sx={{
            position: 'absolute',
            left: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            color: 'text.secondary',
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
            '&.Mui-disabled': { opacity: 0.3 },
            flexShrink: 0,
            width: 36,
            height: 36,
          }}
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
      )}

      {/* Right arrow */}
      {clampedIndex < count - 1 && (
        <IconButton
          onClick={goRight}
          disabled={clampedIndex === count - 1}
          sx={{
            position: 'absolute',
            right: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            color: 'text.secondary',
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
            '&.Mui-disabled': { opacity: 0.3 },
            flexShrink: 0,
            width: 36,
            height: 36,
          }}
        >
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      )}

      {/* Viewport */}
      <Box
        ref={viewportRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        sx={{
          overflowX: 'hidden',
          overflowY: 'visible',
          width: '100%',
          position: 'relative',
          paddingTop: '8px',
        }}
      >
        {/* Card Strip - uses plain div with inline styles for reliable CSS transitions */}
        <div
          style={{
            display: 'flex',
            gap: `${CARD_GAP}px`,
            justifyContent: 'flex-start',
            alignItems: 'center',
            transform: `translateX(calc(50% - ${CARD_WIDTH / 2}px + ${stripTranslate}px))`,
            transition: `transform ${duration}ms ${EASING}`,
            willChange: 'transform',
          }}
        >
          {leaderboards.map((lb, i) => {
            const inWindow = i >= renderStart && i <= renderEnd;
            const distFromCenter = Math.abs(i - clampedIndex);
            const scale = distFromCenter === 0 ? 1 : Math.max(0.85, 1 - distFromCenter * 0.08);
            const opacity = distFromCenter === 0 ? 1 : Math.max(0.4, 1 - distFromCenter * 0.25);

            const isActive = i === clampedIndex;
            const isCardHovered = hoveredCardIndex === i;

            return (
              <div
                key={lb.id}
                onMouseEnter={() => setHoveredCardIndex(i)}
                onMouseLeave={() => setHoveredCardIndex(null)}
                style={{
                  width: `${CARD_WIDTH}px`,
                  minWidth: `${CARD_WIDTH}px`,
                  transform: `scale(${scale})`,
                  opacity,
                  transition: `transform ${duration}ms ${EASING}, opacity ${duration}ms ${EASING}`,
                  cursor: isActive ? 'default' : 'pointer',
                  position: 'relative',
                  overflow: 'visible',
                  flexShrink: 0,
                  zIndex: isActive ? 2 : 1,
                }}
                onClick={!isActive ? () => goTo(i) : undefined}
              >
                {inWindow ? (
                  <>
                    {/* Delete button -- top-right of active card on card hover */}
                    {isActive && isCardHovered && onDeleteLeaderboard && count > 1 && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLeaderboard(i);
                        }}
                        sx={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          zIndex: 3,
                          width: 28,
                          height: 28,
                          bgcolor: 'rgba(39, 41, 50, 0.75)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: 'rgba(255, 255, 255, 0.7)',
                          transition: 'background-color 0.15s ease, color 0.15s ease',
                          '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.85)', color: '#fff' },
                        }}
                      >
                        <CloseRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                    <LeaderboardPreview
                      leaderboard={lb}
                      index={i}
                      isActive={isActive}
                      onScrollToMetric={isActive ? onScrollToMetric : undefined}
                      onScrollToTitle={isActive ? onScrollToTitle : undefined}
                      onScrollToDescription={isActive ? onScrollToDescription : undefined}
                      onAddMetric={isActive ? onAddMetric : undefined}
                      onInsertMetric={isActive ? onInsertMetric : undefined}
                      participantNames={participantNamesPerLeaderboard?.[i]}
                      isTournament={isTournament}
                    />
                  </>
                ) : (
                  /* Placeholder for out-of-window cards */
                  <div style={{ width: CARD_WIDTH, height: 200 }} />
                )}
              </div>
            );
          })}

          {/* Add leaderboard button after last card */}
          {onAddLeaderboard && (
            <div
              style={{
                width: `${CARD_WIDTH}px`,
                minWidth: `${CARD_WIDTH}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tooltip title="Add leaderboard">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddLeaderboard();
                  }}
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                    border: '2px dashed rgba(99, 102, 241, 0.4)',
                    color: 'primary.light',
                    opacity: hovered ? 1 : 0,
                    transform: hovered ? 'scale(1)' : 'scale(0.8)',
                    transition: 'opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(99, 102, 241, 0.2)',
                      border: '2px dashed rgba(99, 102, 241, 0.7)',
                    },
                  }}
                >
                  <AddRoundedIcon sx={{ fontSize: 28 }} />
                </IconButton>
              </Tooltip>
            </div>
          )}
        </div>
      </Box>

      {/* Dot indicators */}
      {count > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 0.75,
            mt: 1.5,
          }}
        >
          {leaderboards.map((lb, i) => (
            <Box
              key={lb.id}
              onClick={() => goTo(i)}
              sx={{
                width: i === clampedIndex ? 20 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: i === clampedIndex
                  ? (isTournament ? '#f59e0b' : '#818cf8')
                  : 'rgba(255,255,255,0.15)',
                cursor: 'pointer',
                transition: `all 300ms ${EASING}`,
                '&:hover': {
                  bgcolor: i === clampedIndex
                    ? (isTournament ? '#f59e0b' : '#818cf8')
                    : 'rgba(255,255,255,0.3)',
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default LeaderboardCarousel;
