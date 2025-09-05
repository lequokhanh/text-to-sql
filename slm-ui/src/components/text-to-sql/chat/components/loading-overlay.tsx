import { alpha } from '@mui/material/styles';
import { Box, Typography, CircularProgress } from '@mui/material';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

export function LoadingOverlay({ show, message = 'Loading data...' }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: (t) => alpha(t.palette.background.default, 0.7),
        zIndex: 10,
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Box>
  );
}