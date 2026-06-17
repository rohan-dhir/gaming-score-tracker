/**
 * MUI Component style overrides for Boards Local (dark mode)
 */

import { Components, Theme } from '@mui/material/styles';

export const components: Components<Theme> = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 24,
        padding: '8px 20px',
        transition: 'all 0.2s ease-in-out',
      },
      contained: {
        boxShadow: 'none',
        background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
        color: '#ffffff',
        '&:hover': {
          background: 'linear-gradient(135deg, #4338ca, #6366f1)',
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
        },
        '&.Mui-disabled': {
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.4), rgba(129, 140, 248, 0.4))',
        },
      },
      outlined: {
        borderWidth: 2,
        borderColor: '#818cf8',
        color: '#818cf8',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        '&:hover': {
          borderWidth: 2,
          borderColor: '#6366f1',
          color: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
        },
      },
      text: {
        backgroundColor: 'transparent',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
      },
      sizeSmall: { padding: '4px 14px', fontSize: '0.8125rem' },
      sizeLarge: { padding: '12px 28px', fontSize: '1rem' },
    },
    defaultProps: { disableElevation: true },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        borderRadius: 12,
        transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
        backdropFilter: 'blur(12px)',
        backgroundColor: '#272932',
        '&:hover': { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)' },
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: { padding: 16, '&:last-child': { paddingBottom: 16 } },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: { '& .MuiOutlinedInput-root': { borderRadius: 8 } },
    },
    defaultProps: { variant: 'outlined', size: 'medium' },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '&:hover .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { backgroundImage: 'none', backdropFilter: 'blur(12px)', backgroundColor: '#272932' },
      rounded: { borderRadius: 12 },
    },
  },
  MuiChip: {
    styleOverrides: { root: { fontWeight: 500, borderRadius: 6 } },
  },
  MuiAlert: {
    styleOverrides: {
      root: { borderRadius: 8 },
      standardSuccess: { backgroundColor: 'rgba(34, 197, 94, 0.12)' },
      standardError: { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
      standardWarning: { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
      standardInfo: { backgroundColor: 'rgba(59, 130, 246, 0.12)' },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
        backgroundColor: 'rgba(39,41,50,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        marginTop: 4,
        backgroundColor: 'rgba(39,41,50,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: { borderRadius: 4, margin: '0 4px', padding: '8px 12px' },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '&.Mui-selected': {
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.18)' },
        },
      },
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: {
        backgroundColor: 'rgba(39,41,50,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
      },
    },
  },
};
