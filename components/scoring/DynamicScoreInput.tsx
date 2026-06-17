'use client';

import { useCallback } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import type { Primitive } from '@/state/types';
import { NumberInput, type MetricThreshold } from './NumberInput';
import { DurationInput } from './DurationInput';
import { RatioInput } from './RatioInput';

interface DynamicScoreInputProps {
  primitive: Primitive;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  threshold?: MetricThreshold | null;
  maxRank?: number;
  disabled?: boolean;
}

/**
 * Renders the appropriate score input component based on the metric's primitive type.
 */
export function DynamicScoreInput({
  primitive,
  label,
  value,
  onChange,
  threshold,
  maxRank,
  disabled = false,
}: DynamicScoreInputProps) {
  const handleChange = useCallback(
    (val: number | null, _rawInput?: string) => {
      onChange(val);
    },
    [onChange],
  );

  switch (primitive) {
    case 'DURATION':
      return (
        <DurationInput
          label={label}
          value={value}
          onChange={handleChange}
          threshold={threshold}
          disabled={disabled}
        />
      );

    case 'RATIO':
      return (
        <RatioInput
          label={label}
          value={value}
          onChange={handleChange}
          threshold={threshold}
          disabled={disabled}
        />
      );

    case 'BOOLEAN':
      return (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            {label}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={value === 1}
                onChange={(e) => onChange(e.target.checked ? 1 : 0)}
                disabled={disabled}
                color="success"
              />
            }
            label={value === 1 ? 'Completed' : 'Not completed'}
          />
        </Box>
      );

    case 'RANK':
      return (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            {label}
          </Typography>
          <TextField
            type="number"
            value={value !== null ? value : ''}
            onChange={(e) => {
              const raw = e.target.value;
              if (!raw) {
                onChange(null);
                return;
              }
              const parsed = parseInt(raw, 10);
              if (!isNaN(parsed) && parsed >= 1 && (!maxRank || parsed <= maxRank)) {
                onChange(parsed);
              }
            }}
            disabled={disabled}
            fullWidth
            placeholder={maxRank ? `1 - ${maxRank}` : 'e.g., 1'}
            slotProps={{
              htmlInput: {
                min: 1,
                max: maxRank ?? undefined,
                inputMode: 'numeric' as const,
              },
            }}
            helperText={maxRank ? `Enter a rank from 1 to ${maxRank}` : 'Enter ordinal rank'}
          />
        </Box>
      );

    case 'NUMBER':
    default:
      return (
        <NumberInput
          label={label}
          value={value}
          onChange={handleChange}
          threshold={threshold}
          disabled={disabled}
        />
      );
  }
}

export default DynamicScoreInput;
