'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { useChallenge } from '@/state/context';
import SetupWizard from '@/components/setup/SetupWizard';
import ActiveChallenge from '@/components/active/ActiveChallenge';
import ResultsView from '@/components/complete/ResultsView';

export default function HomePage() {
  const { state } = useChallenge();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ minHeight: '80vh' }}>
        {state.phase === 'setup' && <SetupWizard />}
        {state.phase === 'active' && <ActiveChallenge />}
        {state.phase === 'complete' && <ResultsView />}
      </Box>
    </Container>
  );
}
