import { Box, Stack, alpha, Button, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

interface NoConversationSelectedProps {
  onNewChat: () => void;
}

export function NoConversationSelected({ onNewChat }: NoConversationSelectedProps) {
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
          bgcolor: (theme) => alpha(theme.palette.info.lighter, 0.2),
          border: (theme) => `1px dashed ${theme.palette.info.main}`,
        }}
      >
        <Iconify
          icon="eva:message-circle-outline"
          width={60}
          height={60}
          sx={{ color: 'info.main' }}
        />
      </Box>
      <Typography variant="h5" color="text.primary" gutterBottom>
        Select or Start a Conversation
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 480, mb: 4 }}
      >
        Start a new conversation to query your database using natural language, or select an
        existing conversation from the sidebar.
      </Typography>
      <Button
        variant="contained"
        startIcon={<Iconify icon="eva:plus-fill" />}
        onClick={onNewChat}
        size="large"
      >
        New Chat
      </Button>
    </Stack>
  );
}
