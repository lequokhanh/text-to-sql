import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';

import { IChatMessage } from 'src/types/chat';

import ChatMessageList from '../chat-message-list';
import ChatMessageInput from '../chat-message-input';

// ----------------------------------------------------------------------

export default function ChatView() {
  const [messages, setMessages] = useState<IChatMessage[]>([]);

  const handleSendMessage = useCallback((message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: IChatMessage = {
      id: `user-${Date.now()}`,
      body: message,
      senderId: 'user',
      contentType: 'text',
      createdAt: new Date(),
      attachments: [], // Add empty attachments array
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Simulate bot response
    setTimeout(() => {
      const botMessage: IChatMessage = {
        id: `bot-${Date.now()}`,
        body: 'This is a simulated bot response. You can replace this with actual bot responses.',
        senderId: 'bot',
        contentType: 'text',
        createdAt: new Date(),
        attachments: [], // Add empty attachments array
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    }, 1000);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Card sx={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <ChatMessageList messages={messages} />
        </Box>

        <Stack sx={{ p: 3 }}>
          <ChatMessageInput onSend={handleSendMessage} />
        </Stack>
      </Card>
    </Container>
  );
}
