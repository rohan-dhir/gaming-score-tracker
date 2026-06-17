'use client';

import { useRef, useState, useCallback, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

interface SpotlightCardProps {
  children: ReactNode;
  spotlightColor?: string;
  spotlightSize?: number;
  sx?: SxProps<Theme>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * A card component with a mouse-following spotlight effect.
 */
export function SpotlightCard({
  children,
  spotlightColor = 'rgba(99, 102, 241, 0.06)',
  spotlightSize = 300,
  sx,
  onMouseEnter,
  onMouseLeave,
}: SpotlightCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: -1000, y: -1000 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSpotlightPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [],
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    onMouseEnter?.();
  }, [onMouseEnter]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    onMouseLeave?.();
  }, [onMouseLeave]);

  return (
    <Box
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {/* Spotlight gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: isHovering ? 1 : 0,
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(${spotlightSize}px circle at ${spotlightPos.x}px ${spotlightPos.y}px, ${spotlightColor}, transparent)`,
          zIndex: 0,
        }}
      />
      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
    </Box>
  );
}

export default SpotlightCard;
