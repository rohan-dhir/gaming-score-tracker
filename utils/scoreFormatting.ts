/**
 * Score formatting utilities for display in leaderboard tables.
 */

import type { Primitive } from '@/state/types';

/** Medal color constants */
export const MEDAL_COLORS = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
} as const;

/**
 * Get the medal color for a rank position (1-3), or undefined for other ranks.
 */
export function getMedalColor(rank: number): string | undefined {
  switch (rank) {
    case 1: return MEDAL_COLORS.gold;
    case 2: return MEDAL_COLORS.silver;
    case 3: return MEDAL_COLORS.bronze;
    default: return undefined;
  }
}

/**
 * Format a numeric score value for display based on its metric primitive type.
 */
export function formatScoreDisplay(value: number, primitive: Primitive): string {
  switch (primitive) {
    case 'DURATION': {
      const totalMs = Math.abs(value);
      const hours = Math.floor(totalMs / 3600000);
      const minutes = Math.floor((totalMs % 3600000) / 60000);
      const seconds = Math.floor((totalMs % 60000) / 1000);
      const ms = totalMs % 1000;

      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
      }
      if (minutes > 0) {
        return `${minutes}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
      }
      return `${seconds}.${String(ms).padStart(3, '0')}`;
    }

    case 'BOOLEAN':
      return value ? 'Yes' : 'No';

    case 'RATIO':
      return `${(value * 100).toFixed(1)}%`;

    case 'RANK': {
      const n = Math.round(value);
      const suffix =
        n % 100 >= 11 && n % 100 <= 13
          ? 'th'
          : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
      return `${n}${suffix}`;
    }

    case 'NUMBER':
    default:
      return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
  }
}
