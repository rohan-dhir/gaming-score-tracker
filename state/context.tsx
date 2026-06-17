'use client';

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { ChallengeState, ChallengeAction } from './types';
import { challengeReducer, createInitialState } from './reducer';

interface ChallengeContextValue {
  state: ChallengeState;
  dispatch: React.Dispatch<ChallengeAction>;
}

const ChallengeContext = createContext<ChallengeContextValue | null>(null);

export function ChallengeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(challengeReducer, undefined, createInitialState);
  return (
    <ChallengeContext.Provider value={{ state, dispatch }}>
      {children}
    </ChallengeContext.Provider>
  );
}

export function useChallenge(): ChallengeContextValue {
  const ctx = useContext(ChallengeContext);
  if (!ctx) {
    throw new Error('useChallenge must be used within a ChallengeProvider');
  }
  return ctx;
}
