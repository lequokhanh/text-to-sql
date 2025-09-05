import { Box } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

export const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  backgroundColor: alpha(theme.palette.background.default, 0.5),
  backgroundImage: `
    radial-gradient(circle at 10% 10%, ${alpha(theme.palette.primary.lighter, 0.04)} 0%, transparent 50%),
    radial-gradient(circle at 90% 90%, ${alpha(theme.palette.secondary.lighter, 0.03)} 0%, transparent 50%)
  `,
  position: 'relative',
  overflow: 'hidden',
}));