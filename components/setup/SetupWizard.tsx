'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { SpotlightCard } from '@/components/shared/SpotlightCard';
import { useChallenge } from '@/state/context';
import ChallengeInfoStep from './ChallengeInfoStep';
import LeaderboardStep from './LeaderboardStep';
import ReviewStep from './ReviewStep';

const steps = ['Challenge Info', 'Leaderboards', 'Review & Start'];

export default function SetupWizard() {
  const { state, dispatch } = useChallenge();
  const { setupStep, challenge } = state;

  /** Validation gate for each step */
  const canProceed = useMemo(() => {
    switch (setupStep) {
      case 0:
        return (
          challenge.title.trim().length > 0 &&
          challenge.players.length >= 2
        );
      case 1:
        return (
          challenge.leaderboards.length > 0 &&
          challenge.leaderboards.every(
            (lb) =>
              lb.metrics.length > 0 &&
              lb.metrics.every((m) => m.name.trim().length > 0),
          )
        );
      case 2:
        return true;
      default:
        return false;
    }
  }, [setupStep, challenge]);

  /** Validation message shown when the user cannot advance */
  const validationHint = useMemo(() => {
    if (canProceed) return null;
    switch (setupStep) {
      case 0:
        if (!challenge.title.trim()) return 'A challenge title is required.';
        if (challenge.players.length < 2)
          return `Add at least 2 players (currently ${challenge.players.length}).`;
        return null;
      case 1:
        if (challenge.leaderboards.length === 0)
          return 'Add at least one leaderboard.';
        for (const lb of challenge.leaderboards) {
          if (lb.metrics.length === 0)
            return `Leaderboard "${lb.title || 'Untitled'}" needs at least one metric.`;
          const unnamed = lb.metrics.find((m) => !m.name.trim());
          if (unnamed)
            return `All metrics in "${lb.title || 'Untitled'}" must be named.`;
        }
        return null;
      default:
        return null;
    }
  }, [setupStep, canProceed, challenge]);

  const handleNext = () => {
    if (setupStep < steps.length - 1) {
      dispatch({ type: 'SET_SETUP_STEP', step: setupStep + 1 });
    }
  };

  const handleBack = () => {
    if (setupStep > 0) {
      dispatch({ type: 'SET_SETUP_STEP', step: setupStep - 1 });
    }
  };

  const handleStart = () => {
    dispatch({ type: 'START_CHALLENGE' });
  };

  return (
    <>
      {/* ---- Stepper (no card wrapper) ---- */}
      <Stepper
        activeStep={setupStep}
        alternativeLabel
        sx={{
          mb: 4,
          '& .MuiStepLabel-label': {
            color: 'text.secondary',
            '&.Mui-active': { color: 'primary.light', fontWeight: 600 },
            '&.Mui-completed': { color: 'primary.main' },
          },
          '& .MuiStepIcon-root': {
            color: 'rgba(255,255,255,0.12)',
            '&.Mui-active': { color: 'primary.main' },
            '&.Mui-completed': { color: 'primary.main' },
          },
          '& .MuiStepConnector-line': {
            borderColor: 'rgba(255,255,255,0.12)',
          },
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ---- Step Content ---- */}
      {setupStep === 1 ? (
        <Box sx={{ mb: 4 }}>
          <LeaderboardStep />
        </Box>
      ) : (
        <SpotlightCard
          sx={{
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.06)',
            bgcolor: 'rgba(39,41,50,0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            p: { xs: 2, sm: 4 },
          }}
        >
          <Box sx={{ minHeight: 400 }}>
            {setupStep === 0 && <ChallengeInfoStep />}
            {setupStep === 2 && <ReviewStep />}
          </Box>
        </SpotlightCard>
      )}

      {/* ---- Validation Hint ---- */}
      {validationHint && (
        <Typography
          variant="body2"
          sx={{ color: 'warning.light', textAlign: 'center', mt: 2 }}
        >
          {validationHint}
        </Typography>
      )}

      {/* ---- Navigation Buttons (no card wrapper) ---- */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 4,
          pt: 2,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Button
          onClick={handleBack}
          disabled={setupStep === 0}
          variant="outlined"
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>

        {setupStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            variant="contained"
            endIcon={<ArrowForwardIcon />}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleStart}
            disabled={!canProceed}
            variant="contained"
            size="large"
            endIcon={<RocketLaunchIcon />}
            sx={{
              background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
              px: 4,
              '&:hover': {
                background: 'linear-gradient(135deg, #4338ca, #6366f1)',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.45)',
              },
            }}
          >
            Start Challenge
          </Button>
        )}
      </Box>
    </>
  );
}
