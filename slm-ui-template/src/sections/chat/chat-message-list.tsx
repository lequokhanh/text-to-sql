import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Scrollbar from 'src/components/scrollbar';

import { IChatMessage } from 'src/types/chat';

import { useMessagesScroll } from './hooks';
import ChatMessageItem from './chat-message-item';

// ----------------------------------------------------------------------

type Props = {
  messages: IChatMessage[];
};

export default function ChatMessageList({ messages = [] }: Props) {
  const { messagesEndRef } = useMessagesScroll(messages);

  const renderWelcomeMessage = (
    <Stack alignItems="center" spacing={2} sx={{ py: 5 }}>
      <Typography variant="h6">Welcome to the Chatbot</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        How can I assist you today?
      </Typography>
    </Stack>
  );

  return (
    <Scrollbar ref={messagesEndRef} sx={{ px: 3, py: 3, height: 1 }}>
      <Box>
        {messages.length === 0
          ? renderWelcomeMessage
          : messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                isBot={message.senderId === 'bot'}
              />
            ))}
      </Box>
    </Scrollbar>
  );
}
