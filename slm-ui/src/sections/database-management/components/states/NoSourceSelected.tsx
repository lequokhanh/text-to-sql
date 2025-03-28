import { Box, Stack, alpha, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

export function NoSourceSelected() {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        height: '100%',
        color: 'text.secondary',
        p: 3,
      }}
    >
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: '50%',
          bgcolor: (theme) => alpha(theme.palette.primary.lighter, 0.2),
          border: (theme) => `1px dashed ${theme.palette.primary.main}`,
        }}
      >
        <Iconify
          icon="eva:database-outline"
          width={60}
          height={60}
          sx={{ color: 'primary.main' }}
        />
      </Box>
      <Typography variant="h5" color="text.primary" gutterBottom>
        No Data Source Selected
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 480, mb: 4 }}
      >
        Select an existing data source from the sidebar or create a new one to get started with your
        database queries.
      </Typography>
      <Box
        sx={{
          position: 'relative',
          '&:before': {
            content: '""',
            position: 'absolute',
            left: -15,
            top: '50%',
            width: 30,
            height: 30,
            borderRadius: '50%',
            bgcolor: 'primary.lighter',
            opacity: 0.4,
            transform: 'translateY(-50%)',
          },
        }}
      >
        <Iconify icon="eva:arrow-back-fill" width={24} height={24} />
      </Box>
    </Stack>
  );
}
