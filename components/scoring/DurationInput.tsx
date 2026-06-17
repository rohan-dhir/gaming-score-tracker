'use client';

import { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import TimerIcon from '@mui/icons-material/Timer';
import type { MetricThreshold } from './NumberInput';

interface DurationInputProps {
  label: string;
  value: number | null;
  onChange: (value: number | null, rawInput: string) => void;
  threshold?: MetricThreshold | null;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  required?: boolean;
}

type InputMode = 'fields' | 'text';

function parseDurationToMs(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const colonMatch = trimmed.match(/^(?:(\d+):)?(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  if (colonMatch) {
    const [, hours, minutes, seconds] = colonMatch;
    let totalMs = 0;
    if (hours !== undefined && minutes !== undefined) {
      totalMs += parseInt(hours, 10) * 3600000;
      totalMs += parseInt(minutes, 10) * 60000;
      totalMs += parseFloat(seconds) * 1000;
    } else if (hours !== undefined) {
      totalMs += parseInt(hours, 10) * 60000;
      totalMs += parseFloat(seconds) * 1000;
    } else {
      totalMs += parseFloat(seconds) * 1000;
    }
    return Math.round(totalMs);
  }
  const humanMatch = trimmed.match(/^(?:(\d+(?:\.\d+)?)\s*h(?:ours?)?)?\s*(?:(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?)?)?\s*(?:(\d+(?:\.\d+)?)\s*s(?:ec(?:onds?)?)?)?$/i);
  if (humanMatch && (humanMatch[1] || humanMatch[2] || humanMatch[3])) {
    let totalMs = 0;
    if (humanMatch[1]) totalMs += parseFloat(humanMatch[1]) * 3600000;
    if (humanMatch[2]) totalMs += parseFloat(humanMatch[2]) * 60000;
    if (humanMatch[3]) totalMs += parseFloat(humanMatch[3]) * 1000;
    return Math.round(totalMs);
  }
  const plainNumber = parseFloat(trimmed);
  if (!isNaN(plainNumber)) return Math.round(plainNumber * 1000);
  return null;
}

function formatMsToDisplay(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }
  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }
  return `${seconds}.${String(milliseconds).padStart(3, '0')}`;
}

function validateAgainstThreshold(ms: number, threshold: MetricThreshold): string | null {
  switch (threshold.type) {
    case 'MINIMUM': if (ms < threshold.value) return `Must be at least ${formatMsToDisplay(threshold.value)}`; break;
    case 'MAXIMUM': if (ms > threshold.value) return `Must be at most ${formatMsToDisplay(threshold.value)}`; break;
    case 'EXACT': if (ms !== threshold.value) return `Must equal ${formatMsToDisplay(threshold.value)}`; break;
    case 'FIRST_TO_REACH': break;
  }
  return null;
}

export function DurationInput({
  label, value, onChange, threshold, disabled = false, helperText, error, required = false,
}: DurationInputProps) {
  const [inputMode, setInputMode] = useState<InputMode>('fields');
  const [textInput, setTextInput] = useState<string>('');
  const [hours, setHours] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const [seconds, setSeconds] = useState<string>('');
  const [milliseconds, setMilliseconds] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (value !== null) {
      const h = Math.floor(value / 3600000);
      const m = Math.floor((value % 3600000) / 60000);
      const s = Math.floor((value % 60000) / 1000);
      const ms = value % 1000;
      setHours(h > 0 ? String(h) : '');
      setMinutes(m > 0 || h > 0 ? String(m) : '');
      setSeconds(String(s));
      setMilliseconds(ms > 0 ? String(ms) : '');
      setTextInput(formatMsToDisplay(value));
    } else {
      setHours(''); setMinutes(''); setSeconds(''); setMilliseconds(''); setTextInput('');
    }
  }, [value]);

  const handleFieldChange = useCallback(
    (field: 'hours' | 'minutes' | 'seconds' | 'milliseconds', fieldValue: string) => {
      switch (field) {
        case 'hours': setHours(fieldValue); break;
        case 'minutes': setMinutes(fieldValue); break;
        case 'seconds': setSeconds(fieldValue); break;
        case 'milliseconds': setMilliseconds(fieldValue); break;
      }
      const h = field === 'hours' ? fieldValue : hours;
      const m = field === 'minutes' ? fieldValue : minutes;
      const s = field === 'seconds' ? fieldValue : seconds;
      const ms = field === 'milliseconds' ? fieldValue : milliseconds;
      if (!h && !m && !s && !ms) { setValidationError(null); onChange(null, ''); return; }
      const totalMs = (parseInt(h, 10) || 0) * 3600000 + (parseInt(m, 10) || 0) * 60000 +
        (parseInt(s, 10) || 0) * 1000 + (parseInt(ms, 10) || 0);
      if (threshold) { setValidationError(validateAgainstThreshold(totalMs, threshold)); }
      else { setValidationError(null); }
      const rawInput = formatMsToDisplay(totalMs);
      setTextInput(rawInput);
      onChange(totalMs, rawInput);
    }, [hours, minutes, seconds, milliseconds, threshold, onChange]
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setTextInput(raw);
      if (!raw.trim()) { setValidationError(null); onChange(null, ''); return; }
      const parsed = parseDurationToMs(raw);
      if (parsed === null) { setValidationError('Invalid time format. Try HH:MM:SS, 1h 30m, or seconds.'); onChange(null, raw); return; }
      if (threshold) { setValidationError(validateAgainstThreshold(parsed, threshold)); }
      else { setValidationError(null); }
      onChange(parsed, raw);
    }, [threshold, onChange]
  );

  const displayError = error || validationError;
  const displayHelperText = displayError || helperText || 'Enter time as HH:MM:SS.mmm, 1h 30m 45s, or seconds';

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {label}{required && ' *'}
        </Typography>
        <ToggleButtonGroup value={inputMode} exclusive onChange={(_, v) => v && setInputMode(v)} size="small" disabled={disabled}>
          <ToggleButton value="fields">Fields</ToggleButton>
          <ToggleButton value="text">Text</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {inputMode === 'fields' ? (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField label="Hours" type="number" value={hours} onChange={(e) => handleFieldChange('hours', e.target.value)} disabled={disabled} slotProps={{ htmlInput: { min: 0, max: 99 } }} sx={{ width: 90 }} error={!!displayError} />
          <TextField label="Min" type="number" value={minutes} onChange={(e) => handleFieldChange('minutes', e.target.value)} disabled={disabled} slotProps={{ htmlInput: { min: 0, max: 59 } }} sx={{ width: 80 }} error={!!displayError} />
          <TextField label="Sec" type="number" value={seconds} onChange={(e) => handleFieldChange('seconds', e.target.value)} disabled={disabled} slotProps={{ htmlInput: { min: 0, max: 59 } }} sx={{ width: 80 }} error={!!displayError} />
          <TextField label="ms" type="number" value={milliseconds} onChange={(e) => handleFieldChange('milliseconds', e.target.value)} disabled={disabled} slotProps={{ htmlInput: { min: 0, max: 999 } }} sx={{ width: 90 }} error={!!displayError} />
        </Box>
      ) : (
        <TextField value={textInput} onChange={handleTextChange} disabled={disabled} error={!!displayError} placeholder="e.g., 2:34:56, 1h 30m, 90s" fullWidth
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><TimerIcon color={displayError ? 'error' : 'action'} /></InputAdornment> } }}
        />
      )}
      <Typography variant="caption" color={displayError ? 'error' : 'text.secondary'} sx={{ mt: 0.5, display: 'block' }}>
        {displayHelperText}
      </Typography>
    </Box>
  );
}

export default DurationInput;
