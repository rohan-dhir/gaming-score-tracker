'use client';

import { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import NumbersIcon from '@mui/icons-material/Numbers';

export interface MetricThreshold {
  type: 'MINIMUM' | 'MAXIMUM' | 'EXACT' | 'FIRST_TO_REACH';
  value: number;
}

interface NumberInputProps {
  label: string;
  value: number | null;
  onChange: (value: number | null, rawInput: string) => void;
  threshold?: MetricThreshold | null;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  required?: boolean;
  integer?: boolean;
}

function validateAgainstThreshold(value: number, threshold: MetricThreshold): string | null {
  switch (threshold.type) {
    case 'MINIMUM':
      if (value < threshold.value) return `Must be at least ${threshold.value}`;
      break;
    case 'MAXIMUM':
      if (value > threshold.value) return `Must be at most ${threshold.value}`;
      break;
    case 'EXACT':
      if (value !== threshold.value) return `Must equal ${threshold.value}`;
      break;
    case 'FIRST_TO_REACH':
      break;
  }
  return null;
}

export function NumberInput({
  label,
  value,
  onChange,
  threshold,
  disabled = false,
  helperText,
  error,
  required = false,
  integer = false,
}: NumberInputProps) {
  const [input, setInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (value !== null) {
      setInput(String(value));
    } else {
      setInput('');
    }
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setInput(raw);

      if (!raw.trim()) {
        setValidationError(null);
        onChange(null, '');
        return;
      }

      const parsed = integer ? parseInt(raw, 10) : parseFloat(raw);

      if (isNaN(parsed)) {
        setValidationError('Please enter a valid number');
        onChange(null, raw);
        return;
      }

      if (threshold) {
        setValidationError(validateAgainstThreshold(parsed, threshold));
      } else {
        setValidationError(null);
      }

      onChange(parsed, raw);
    },
    [threshold, onChange, integer],
  );

  const displayError = error || validationError;

  return (
    <Box>
      <TextField
        type="text"
        label={label}
        value={input}
        onChange={handleChange}
        disabled={disabled}
        error={!!displayError}
        required={required}
        fullWidth
        placeholder={integer ? 'e.g., 100' : 'e.g., 99.5'}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <NumbersIcon color={displayError ? 'error' : 'action'} />
              </InputAdornment>
            ),
          },
          htmlInput: {
            inputMode: integer ? ('numeric' as const) : ('decimal' as const),
          },
        }}
      />
      {(displayError || helperText) && (
        <Typography
          variant="caption"
          color={displayError ? 'error' : 'text.secondary'}
          sx={{ mt: 0.5, display: 'block' }}
        >
          {displayError || helperText}
        </Typography>
      )}
    </Box>
  );
}

export default NumberInput;
