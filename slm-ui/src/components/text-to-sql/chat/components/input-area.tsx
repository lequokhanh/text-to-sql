import { Box } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

export const InputArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  width: '100%',
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  backgroundColor: alpha(theme.palette.background.default, 0.98),
  backdropFilter: 'blur(20px)',
  position: 'relative',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 10,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -1,
    left: 0,
    right: 0,
    height: 1,
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
  },
}));