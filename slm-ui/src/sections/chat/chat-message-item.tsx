import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { IChatMessage } from 'src/types/chat';

// ----------------------------------------------------------------------

type Props = {
  message: IChatMessage;
  isBot?: boolean;
};

export default function ChatMessageItem({ message, isBot = false }: Props) {
  const { body } = message;

  return (
    <Stack direction="row" justifyContent={isBot ? 'flex-start' : 'flex-end'} sx={{ mb: 3 }}>
      {isBot && (
        <Avatar
          alt="Bot"
          src="/assets/icons/chat/ic_chatbot.svg"
          sx={{ width: 32, height: 32, mr: 2 }}
        />
      )}

      <Box
        sx={{
          p: 1.5,
          minWidth: 48,
          maxWidth: '75%',
          borderRadius: 1,
          typography: 'body2',
          bgcolor: isBot ? 'background.neutral' : 'primary.lighter',
          color: isBot ? 'text.primary' : 'grey.800',
        }}
      >
        <Typography variant="body2">{body}</Typography>
      </Box>

      {!isBot && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            ml: 2,
            bgcolor: 'primary.main',
          }}
        >
          U
        </Avatar>
      )}
    </Stack>
  );
}
