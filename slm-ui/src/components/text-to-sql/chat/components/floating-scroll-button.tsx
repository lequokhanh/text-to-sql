import { Fade, IconButton } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

import Iconify from 'src/components/iconify';

const FloatingActionButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  zIndex: 1000,
  width: 56,
  height: 56,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  boxShadow: `0 4px 20px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
  border: `4px solid ${alpha(theme.palette.background.default, 0.9)}`,
  opacity: 0.2,
  transition: theme.transitions.create(['transform', 'box-shadow', 'opacity'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    transform: 'scale(1.1)',
    boxShadow: `0 6px 28px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
    opacity: 1,
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

interface FloatingScrollButtonProps {
  show: boolean;
  onScrollToBottom: () => void;
}

export function FloatingScrollButton({ show, onScrollToBottom }: FloatingScrollButtonProps) {
  return (
    <Fade in={show}>
      <FloatingActionButton
        onClick={onScrollToBottom}
        aria-label="scroll to bottom"
        sx={{
          position: 'fixed',
          left: 100, // 80px from left edge as requested
          bottom: { xs: 80, sm: 100 }, // Higher position to avoid input area
          boxShadow: (t) => `0 0 20px 0 ${alpha(t.palette.primary.main, 0.3)}`,
          zIndex: 1000,
        }}
      >
        <Iconify icon="eva:arrow-downward-fill" width={24} height={24} />
      </FloatingActionButton>
    </Fade>
  );
}