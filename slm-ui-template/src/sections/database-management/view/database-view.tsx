import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import { IChatMessage } from 'src/types/chat';
import { DatabaseSource } from 'src/types/database';

import ChatSection from '../chat-section';
import DatabaseCreateDialog from '../database-create-dialog';
import ConversationList, { Conversation } from '../conversation-list';

const RootStyle = styled('div')(({ theme }) => ({
  display: 'flex',
  height: '100%',
  overflow: 'hidden',
}));

const SidebarStyle = styled('div')(({ theme }) => ({
  width: 280,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${theme.palette.divider}`,
}));

const MainStyle = styled('div')({
  flexGrow: 1,
  height: '100%',
  overflow: 'hidden',
});

export default function DatabaseView() {
  const [dataSources, setDataSources] = useState<DatabaseSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<DatabaseSource | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Conversation states
  const [conversations, setConversations] = useState<Record<string, Conversation[]>>({});
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Record<string, IChatMessage[]>>({});

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const handleSourceSelect = (source: DatabaseSource) => {
    setSelectedSource(source);
    setSelectedConversation(null);
  };

  const handleNewChat = useCallback(() => {
    if (!selectedSource) return;

    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: `New Chat ${(conversations[selectedSource.name]?.length || 0) + 1}`,
      preview: 'Start a new conversation',
      createdAt: new Date(),
    };

    setConversations((prev) => ({
      ...prev,
      [selectedSource.name]: [...(prev[selectedSource.name] || []), newConversation],
    }));

    setSelectedConversation(newConversation);
    setMessages((prev) => ({
      ...prev,
      [newConversation.id]: [],
    }));
  }, [selectedSource, conversations]);

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
  }, []);

  const handleSendMessage = useCallback(
    (message: string) => {
      if (!selectedConversation) return;

      const userMessage: IChatMessage = {
        id: `msg-${Date.now()}`,
        body: message,
        contentType: 'text',
        createdAt: new Date(),
        senderId: 'user',
        attachments: [],
      };

      setMessages((prev) => ({
        ...prev,
        [selectedConversation.id]: [...(prev[selectedConversation.id] || []), userMessage],
      }));

      // Update conversation preview
      setConversations((prev) => ({
        ...prev,
        [selectedSource!.name]: prev[selectedSource!.name].map((conv) =>
          conv.id === selectedConversation.id ? { ...conv, preview: message } : conv
        ),
      }));

      // Simulate bot response
      setTimeout(() => {
        const botMessage: IChatMessage = {
          id: `msg-${Date.now()}`,
          body: 'This is a simulated response. Replace with actual database query results.',
          contentType: 'text',
          createdAt: new Date(),
          senderId: 'bot',
          attachments: [],
        };

        setMessages((prev) => ({
          ...prev,
          [selectedConversation.id]: [...(prev[selectedConversation.id] || []), botMessage],
        }));
      }, 1000);
    },
    [selectedConversation, selectedSource]
  );

  return (
    <RootStyle>
      {/* Primary Sidebar - Data Sources */}
      <SidebarStyle>
        <Stack sx={{ p: 2.5, pb: 0 }} spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Data Sources</Typography>
          </Stack>

          <Button
            fullWidth
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={handleOpenCreateDialog}
          >
            Create Data Source
          </Button>
        </Stack>

        <Stack sx={{ p: 2.5, flexGrow: 1, overflow: 'auto' }} spacing={1}>
          {dataSources.map((source) => (
            <Button
              key={source.name}
              fullWidth
              variant={selectedSource?.name === source.name ? 'contained' : 'outlined'}
              onClick={() => handleSourceSelect(source)}
              sx={{ justifyContent: 'flex-start', px: 2, py: 1 }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="eva:database-fill" width={20} height={20} />
                <Typography variant="body2" noWrap>
                  {source.name}
                </Typography>
              </Stack>
            </Button>
          ))}
        </Stack>
      </SidebarStyle>

      {/* Secondary Sidebar - Conversations */}
      <SidebarStyle>
        {selectedSource ? (
          <ConversationList
            conversations={conversations[selectedSource.name] || []}
            selectedId={selectedConversation?.id || null}
            onSelect={handleSelectConversation}
            onNewChat={handleNewChat}
          />
        ) : (
          <Stack sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
              Select a data source to view conversations
            </Typography>
          </Stack>
        )}
      </SidebarStyle>

      {/* Main Content Area */}
      <MainStyle>
        {selectedSource && selectedConversation ? (
          <ChatSection
            source={selectedSource}
            messages={messages[selectedConversation.id] || []}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: '100%', color: 'text.secondary' }}
          >
            <Typography variant="body2">
              {selectedSource
                ? 'Select or start a conversation'
                : 'Select a data source to start chatting'}
            </Typography>
          </Stack>
        )}
      </MainStyle>

      <DatabaseCreateDialog
        open={isCreateDialogOpen}
        onClose={handleCloseCreateDialog}
        onCreateSource={(source: DatabaseSource) => {
          setDataSources((prev) => [...prev, source]);
          setSelectedSource(source);
          handleCloseCreateDialog();
        }}
      />
    </RootStyle>
  );
}
