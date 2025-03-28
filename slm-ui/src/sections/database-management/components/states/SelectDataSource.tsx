import { Box, Stack, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

export function SelectDataSource() {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        height: '100%',
        p: 2.5,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Iconify icon="eva:info-outline" width={40} height={40} sx={{ color: 'text.disabled' }} />
      </Box>
      <Typography variant="subtitle1" sx={{ color: 'text.secondary', textAlign: 'center' }}>
        Select a data source to view conversations
      </Typography>
    </Stack>
  );
}
