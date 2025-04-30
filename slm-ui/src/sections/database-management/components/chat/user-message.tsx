import { Stack, Paper, useTheme, Typography } from '@mui/material';

import { IChatMessage } from 'src/types/chat';

interface UserMessageProps {
  message: IChatMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      justifyContent="flex-end"
      sx={{
        mb: 3,
        opacity: 0,
        animation: 'fadeSlideIn 0.3s ease forwards',
        '@keyframes fadeSlideIn': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Paper
        sx={{
          p: 2,
          maxWidth: '80%',
          bgcolor: theme.palette.primary.light,
          color: theme.palette.primary.contrastText,
          borderRadius: 2,
          boxShadow: theme.customShadows?.z8,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: theme.customShadows?.z16,
          },
        }}
      >
        <Typography variant="body1">{message.body}</Typography>
      </Paper>
    </Stack>
  );
}
