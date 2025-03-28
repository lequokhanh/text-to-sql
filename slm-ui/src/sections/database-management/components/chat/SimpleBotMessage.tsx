import { Card, Stack, alpha, useTheme, CardHeader, CardContent } from '@mui/material';

import Iconify from 'src/components/iconify';
import Markdown from 'src/components/markdown';

import { IChatMessage } from 'src/types/chat';

interface SimpleBotMessageProps {
  message: IChatMessage;
}

export function SimpleBotMessage({ message }: SimpleBotMessageProps) {
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
          p: 2,
          width: '80%',
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
          borderLeft: `4px solid ${theme.palette.info.light}`,
          boxShadow: theme.customShadows?.z8,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: theme.customShadows?.z16,
            borderLeft: `4px solid ${theme.palette.info.main}`,
            bgcolor: (t) => alpha(t.palette.info.lighter, 0.1),
          },
        }}
      >
        <CardHeader
          title="Response"
          titleTypographyProps={{ variant: 'subtitle1' }}
          avatar={<Iconify icon="mdi:robot" width={24} />}
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0 }}>
          <Markdown>{message.body}</Markdown>
        </CardContent>
      </Card>
    </Stack>
  );
}
