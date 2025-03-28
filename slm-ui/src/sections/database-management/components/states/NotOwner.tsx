import { Box, Stack, Alert, Typography, AlertTitle } from '@mui/material';

import Iconify from 'src/components/iconify';

export function NotOwner() {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        height: '100%',
        p: 3,
      }}
    >
      <Alert
        severity="warning"
        variant="outlined"
        sx={{
          mb: 2,
          maxWidth: 500,
          boxShadow: (theme) => theme.customShadows.z8,
        }}
      >
        <AlertTitle>Permission Required</AlertTitle>
        You need to be the owner of this data source to access management features
      </Alert>

      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: '50%',
          bgcolor: (theme) => theme.palette.warning.lighter,
        }}
      >
        <Iconify icon="eva:lock-outline" width={60} height={60} sx={{ color: 'warning.main' }} />
      </Box>

      <Typography variant="h5" gutterBottom>
        Restricted Access
      </Typography>

      <Typography
        variant="body1"
        sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 480 }}
      >
        Only the data source owner can modify its configuration. You can still use the data source
        for querying through the chat interface.
      </Typography>
    </Stack>
  );
}
