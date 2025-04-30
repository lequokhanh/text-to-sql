import { m } from 'framer-motion';

import {
  Box,
  Card,
  Stack,
  alpha,
  Skeleton,
  useTheme,
  CardHeader,
  Typography,
  CardContent,
} from '@mui/material';

import Iconify from 'src/components/iconify';

// Animation variants for loading indicator
const loadingBarVariants = {
  initial: { scaleX: 0, originX: 0 },
  animate: { scaleX: 1, originX: 0, transition: { duration: 2, repeat: Infinity } },
};

export function BotLoadingMessage() {
  const theme = useTheme();

  return (
    <Stack direction="row" sx={{ mb: 3 }}>
      <Card
        sx={{
          width: '80%',
          borderLeft: `3px solid ${alpha(theme.palette.primary.main, 0.5)}`,
          bgcolor: alpha(theme.palette.primary.lighter, 0.04),
          borderRadius: 2,
          boxShadow: theme.customShadows?.z8,
        }}
      >
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <m.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              >
                <Iconify icon="mdi:robot" width={24} />
              </m.div>
              <Typography variant="subtitle1">Analyzing your query...</Typography>
            </Stack>
          }
        />
        <CardContent>
          <Box sx={{ position: 'relative' }}>
            <Box
              component={m.div}
              variants={loadingBarVariants}
              initial="initial"
              animate="animate"
              sx={{
                height: 2,
                bgcolor: 'primary.main',
                position: 'absolute',
                bottom: -16,
                left: 0,
                right: 0,
                transformOrigin: 'left',
              }}
            />
            <Stack spacing={1} sx={{ opacity: 0.8 }}>
              <Skeleton variant="rounded" height={12} width="85%" />
              <Skeleton variant="rounded" height={12} width="70%" />
              <Skeleton variant="rounded" height={12} width="80%" />
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
