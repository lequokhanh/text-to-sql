import { alpha, styled, keyframes } from '@mui/material/styles';
import { Box, Card, Chip, Button, MenuItem, TextField } from '@mui/material';

// Common animations
export const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(-10px) scale(0.95);
    filter: blur(4px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
`;

export const pulse = keyframes`
  0% { 
    box-shadow: 0 0 0 0 rgba(46, 213, 115, 0.4);
  }
  50% { 
    box-shadow: 0 0 0 8px rgba(46, 213, 115, 0);
  }
  100% { 
    box-shadow: 0 0 0 0 rgba(46, 213, 115, 0);
  }
`;

export const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const glow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 20px rgba(25, 118, 210, 0.3),
                0 0 40px rgba(25, 118, 210, 0.1);
  }
  50% { 
    box-shadow: 0 0 30px rgba(25, 118, 210, 0.4),
                0 0 60px rgba(25, 118, 210, 0.2);
  }
`;

// Common styled components
export const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  boxShadow: theme.customShadows?.z16 || '0 8px 32px rgba(0,0,0,0.12)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.98)} 0%, 
    ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
  backdropFilter: 'blur(10px)',
  transition: theme.transitions.create(['box-shadow', 'transform'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    boxShadow: theme.customShadows?.z20 || '0 12px 40px rgba(0,0,0,0.15)',
    transform: 'translateY(-2px)',
  },
}));

export const StyledChip = styled(Chip)(({ theme }) => ({
  height: 24,
  fontSize: '0.7rem',
  fontWeight: 700,
  borderRadius: 12,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.08)} 0%, 
    ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
  color: theme.palette.primary.main,
  backdropFilter: 'blur(8px)',
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.12)} 0%, 
      ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  },
  '& .MuiChip-label': {
    paddingX: theme.spacing(1.5),
    letterSpacing: '0.5px',
  },
}));

export const PrimaryButton = styled(Button)(({ theme }) => ({
  borderRadius: 16,
  padding: theme.spacing(1.5, 3),
  fontWeight: 700,
  fontSize: '0.875rem',
  textTransform: 'none',
  letterSpacing: '0.5px',
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main} 0%, 
    ${theme.palette.primary.dark} 100%)`,
  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    transform: 'translateY(-3px) scale(1.02)',
    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.35)}`,
    background: `linear-gradient(135deg, 
      ${theme.palette.primary.dark} 0%, 
      ${theme.palette.primary.main} 100%)`,
    border: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
  },
  '&:active': {
    transform: 'translateY(-1px) scale(0.98)',
  },
  '&:disabled': {
    opacity: 0.6,
    transform: 'none',
    background: theme.palette.action.disabledBackground,
  },
}));

export const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    transition: theme.transitions.create(['border-color', 'box-shadow', 'background-color'], {
      duration: theme.transitions.duration.shorter,
    }),
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.paper, 0.9),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'transparent',
      },
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.primary.main}`,
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'transparent',
      },
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 600,
    color: theme.palette.text.secondary,
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
  },
}));

export const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  borderRadius: 8,
  margin: theme.spacing(0.5, 1),
  padding: theme.spacing(1.5, 2),
  fontWeight: 500,
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'translateX(4px)',
    borderLeft: `3px solid ${theme.palette.primary.main}`,
  },
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    color: theme.palette.primary.main,
    fontWeight: 600,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.16),
    },
  },
}));

export const FieldContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const EmptyStateContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6),
  textAlign: 'center',
  animation: `${fadeIn} 0.4s ease-out`,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
}));

export const IconContainer = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.1)} 0%, 
    ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(3),
}));