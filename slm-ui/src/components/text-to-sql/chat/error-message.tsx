import { Card, Stack, alpha, useTheme, CardHeader, CardContent } from '@mui/material';

import Iconify from 'src/components/iconify';
import Markdown from 'src/components/markdown';

import { IChatMessage } from 'src/types/chat';

interface ErrorMessageProps {
  message: IChatMessage;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
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
      <Card
        sx={{
          width: '80%',
          borderRadius: 2,
          borderLeft: `4px solid ${theme.palette.error.main}`,
          boxShadow: theme.customShadows?.z8,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: theme.customShadows?.z16,
          },
          bgcolor: () => alpha(theme.palette.error.lighter, 0.6),
        }}
      >
        <CardHeader
          title="Error"
          titleTypographyProps={{ variant: 'subtitle1' }}
          avatar={<Iconify icon="mdi:alert-circle" width={24} color={theme.palette.error.main} />}
          sx={{ pb: 1 }}
        />
        <CardContent>
          <Markdown>{message.body}</Markdown>
        </CardContent>
      </Card>
    </Stack>
  );
}
