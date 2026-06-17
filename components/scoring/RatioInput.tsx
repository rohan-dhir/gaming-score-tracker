'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import PercentIcon from '@mui/icons-material/Percent';
import type { MetricThreshold } from './NumberInput';

interface RatioInputProps {
  label: string;
  value: number | null;
  onChange: (value: number | null, rawInput: string) => void;
  threshold?: MetricThreshold | null;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  required?: boolean;
}

type InputMode = 'percentage' | 'fraction';

function validateAgainstThreshold(value: number, threshold: MetricThreshold): string | null {
  const thresholdDecimal = threshold.value > 1 ? threshold.value / 100 : threshold.value;
  switch (threshold.type) {
    case 'MINIMUM': if (value < thresholdDecimal) return `Must be at least ${(thresholdDecimal * 100).toFixed(1)}%`; break;
    case 'MAXIMUM': if (value > thresholdDecimal) return `Must be at most ${(thresholdDecimal * 100).toFixed(1)}%`; break;
    case 'EXACT': if (Math.abs(value - thresholdDecimal) > 0.001) return `Must equal ${(thresholdDecimal * 100).toFixed(1)}%`; break;
    case 'FIRST_TO_REACH': break;
  }
  return null;
}

export function RatioInput({
  label, value, onChange, threshold, disabled = false, helperText, error, required = false,
}: RatioInputProps) {
  const [inputMode, setInputMode] = useState<InputMode>('percentage');
  const [percentageInput, setPercentageInput] = useState<string>('');
  const [numerator, setNumerator] = useState<string>('');
  const [denominator, setDenominator] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (isInternalChange.current) { isInternalChange.current = false; return; }
    if (value !== null) {
      setPercentageInput(String((value * 100).toFixed(2)));
      const percent = value * 100;
      if (Math.round(percent) === percent && percent <= 100) {
        setNumerator(String(Math.round(percent)));
        setDenominator('100');
      }
    } else { setPercentageInput(''); setNumerator(''); setDenominator(''); }
  }, [value]);

  const handlePercentageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setPercentageInput(raw);
      if (!raw.trim()) { setValidationError(null); isInternalChange.current = true; onChange(null, ''); return; }
      const parsed = parseFloat(raw);
      if (isNaN(parsed)) { setValidationError('Please enter a valid number'); isInternalChange.current = true; onChange(null, raw); return; }
      if (parsed < 0 || parsed > 100) { setValidationError('Percentage must be between 0 and 100'); isInternalChange.current = true; onChange(null, raw); return; }
      const decimal = parsed / 100;
      if (threshold) { setValidationError(validateAgainstThreshold(decimal, threshold)); } else { setValidationError(null); }
      isInternalChange.current = true;
      onChange(decimal, `${raw}%`);
    }, [threshold, onChange]
  );

  const handleFractionChange = useCallback(
    (field: 'numerator' | 'denominator', fieldValue: string) => {
      const num = field === 'numerator' ? fieldValue : numerator;
      const den = field === 'denominator' ? fieldValue : denominator;
      if (field === 'numerator') setNumerator(fieldValue); else setDenominator(fieldValue);
      if (!num && !den) { setValidationError(null); isInternalChange.current = true; onChange(null, ''); return; }
      const numValue = parseInt(num, 10), denValue = parseInt(den, 10);
      if (isNaN(numValue) || isNaN(denValue)) { setValidationError('Please enter valid numbers'); isInternalChange.current = true; onChange(null, `${num}/${den}`); return; }
      if (denValue === 0) { setValidationError('Denominator cannot be zero'); isInternalChange.current = true; onChange(null, `${num}/${den}`); return; }
      const decimal = numValue / denValue;
      if (decimal < 0) { setValidationError('Ratio cannot be negative'); isInternalChange.current = true; onChange(null, `${num}/${den}`); return; }
      if (threshold) { setValidationError(validateAgainstThreshold(decimal, threshold)); } else { setValidationError(null); }
      setPercentageInput(String((decimal * 100).toFixed(2)));
      isInternalChange.current = true;
      onChange(decimal, `${num}/${den}`);
    }, [numerator, denominator, threshold, onChange]
  );

  const displayError = error || validationError;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">{label}{required && ' *'}</Typography>
        <ToggleButtonGroup value={inputMode} exclusive onChange={(_, v) => v && setInputMode(v)} size="small" disabled={disabled}>
          <ToggleButton value="percentage">%</ToggleButton>
          <ToggleButton value="fraction">a/b</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {inputMode === 'percentage' ? (
        <TextField type="text" value={percentageInput} onChange={handlePercentageChange} disabled={disabled} error={!!displayError} placeholder="e.g., 75" fullWidth
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><PercentIcon color={displayError ? 'error' : 'action'} /></InputAdornment>,
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            },
            htmlInput: { inputMode: 'decimal' as const },
          }}
        />
      ) : (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField type="text" label="Numerator" value={numerator} onChange={(e) => handleFractionChange('numerator', e.target.value)} disabled={disabled} error={!!displayError} placeholder="e.g., 3" sx={{ flex: 1 }} slotProps={{ htmlInput: { inputMode: 'numeric' as const } }} />
          <Typography variant="h5" color="text.secondary">/</Typography>
          <TextField type="text" label="Denominator" value={denominator} onChange={(e) => handleFractionChange('denominator', e.target.value)} disabled={disabled} error={!!displayError} placeholder="e.g., 4" sx={{ flex: 1 }} slotProps={{ htmlInput: { inputMode: 'numeric' as const } }} />
        </Box>
      )}
      <Typography variant="caption" color={displayError ? 'error' : 'text.secondary'} sx={{ mt: 0.5, display: 'block' }}>
        {displayError || helperText || 'Enter as percentage (75) or fraction (3/4)'}
      </Typography>
      {value !== null && !displayError && (
        <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
          = {(value * 100).toFixed(2)}%
        </Typography>
      )}
    </Box>
  );
}

export default RatioInput;
