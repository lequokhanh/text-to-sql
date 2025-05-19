// File: src/sections/database-management/view/database-view.tsx
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import { alpha, styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Alert,
  Paper,
  Stack,
  Container,
  Typography,
  AlertTitle,
} from '@mui/material';

import { useDataSources } from 'src/hooks/use-data-sources';
import { ChatSession, useChatSessions } from 'src/hooks/use-chat-sessions';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { formatResultsAsMarkdownTable } from 'src/utils/format-utils';

import Iconify from 'src/components/iconify';
import { MainContent } from 'src/components/text-to-sql/main-content/MainContent';
import ChatMessageInput from 'src/components/text-to-sql/chat/chat-message-input';
import { ChatMessage, BotLoadingMessage } from 'src/components/text-to-sql/chat/chat-message';
import { DataSourceDropdown } from 'src/components/text-to-sql/datasource/datasource-dropdown';

import { IChatMessage } from 'src/types/chat';
import { DatabaseSource } from 'src/types/database';

const HeaderContainer = styled(Paper)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: theme.zIndex.appBar,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  borderRadius: 0,
  backgroundColor: alpha(theme.palette.background.default, 0.9),
  backdropFilter: 'blur(8px)',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ChatContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: alpha(theme.palette.background.default, 0.4),
  backgroundImage: `radial-gradient(circle at 10% 10%, ${alpha(theme.palette.primary.lighter, 0.05)} 0%, transparent 50%)`,
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(3),
  paddingBottom: theme.spacing(1),
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  backgroundColor: alpha(theme.palette.background.default, 0.9),
  backdropFilter: 'blur(8px)',
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '60vh',
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

export default function DatabaseView() {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSources, setAvailableSources] = useState<DatabaseSource[]>([]);
  const [showNoSourceAlert, setShowNoSourceAlert] = useState(false);

  // Custom hooks
  const {
    dataSources: ownedSources,
    selectedSource,
    setSelectedSource,
    fetchDataSources,
    createDataSource,
  } = useDataSources();

  const {
    activeSession,
    setActiveSession,
    createSessionFromChatResponse,
    addMessageToSession,
  } = useChatSessions();

  useEffect(() => {
    fetchDataSources();
    fetchAvailableSources();
  }, [fetchDataSources]);

  const fetchAvailableSources = async () => {
    try {
      const response = await axiosInstance.get('/api/v1/data-sources/available');
      setAvailableSources(response.data);
    } catch (error) {
      console.error('Error fetching available sources:', error);
    }
  };

  const handleSourceSelect = (source: DatabaseSource) => {
    setSelectedSource(source);
    setShowNoSourceAlert(false);
  };

  const handleManageSource = (sourceId: string) => {
    navigate(`/datasource/${sourceId}/manage`);
  };

  const handleCreateDataSource = async (source: DatabaseSource) => {
    try {
      await createDataSource(source);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating data source:', error);
    }
  };

  const handleSendMessage = useCallback(async (message: string) => {
    if (!selectedSource) {
      setShowNoSourceAlert(true);
      return;
    }

    // Create session if none exists
    let session = activeSession;
    if (!session) {
      session = createSessionFromChatResponse(selectedSource.id, {
        chatSessionId: Date.now().toString(),
        data: [],
      });
    }

    if (!session) {
      console.error('Failed to create or get session');
      return;
    }

    // Add user message
    const userMessage: IChatMessage = {
      id: `msg-${Date.now()}`,
      body: message,
      contentType: 'text',
      createdAt: new Date(),
      senderId: 'user',
      attachments: [],
    };

    addMessageToSession(session.id, userMessage);
    setIsLoading(true);

    try {
      // Prepare API payload
      const payload: any = {
        question: message,
        dataSourceId: parseInt(selectedSource.id, 10),
      };

      // Extract API session ID from our session ID
      const sessionParts = session.id.split('-');
      const apiSessionId = sessionParts.length > 1 && !Number.isNaN(Number(sessionParts[1])) 
        ? Number(sessionParts[1]) 
        : null;

      // Add chatSessionId if this isn't the first message in session
      if (apiSessionId && session.messageCount > 0) {
        payload.chatSessionId = apiSessionId;
      }

      // Send to API
      const response = await axiosInstance.post(endpoints.chat.ask, payload);
      
      // Update session ID with API response if this was the first message
      if (response.data?.chatSessionId && !apiSessionId) {
        const newSession: ChatSession = {
          id: `session-${response.data.chatSessionId}`,
          title: session.title,
          dataSourceId: session.dataSourceId,
          messages: session.messages,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          messageCount: session.messageCount
        };
        setActiveSession(newSession);
      }

      // Format bot response
      const sqlSection = response.data?.sql 
        ? `## SQL Query\n\`\`\`sql\n${response.data.sql}\n\`\`\`\n\n`
        : '';
      const resultText = sqlSection + formatResultsAsMarkdownTable(response.data?.data || []);

      const botMessage: IChatMessage = {
        id: `msg-${Date.now() + 1}`,
        body: resultText,
        contentType: 'text',
        createdAt: new Date(),
        senderId: 'bot',
        attachments: [],
        metadata: {
          query: response.data?.sql,
          results: response.data?.data,
          rowCount: Array.isArray(response.data?.data) ? response.data.data.length : 0,
        },
      };

      addMessageToSession(session.id, botMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: IChatMessage = {
        id: `error-${Date.now()}`,
        body: '## Error\n\nSorry, there was an error processing your request. Please try again.',
        contentType: 'text',
        createdAt: new Date(),
        senderId: 'bot',
        attachments: [],
      };
      
      addMessageToSession(session.id, errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSource, activeSession, createSessionFromChatResponse, addMessageToSession, setActiveSession]);

  const renderMessages = () => {
    if (!selectedSource) {
      return (
        <EmptyState>
          <Box sx={{ mb: 3, p: 3, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
            <Iconify icon="eva:database-outline" width={48} height={48} sx={{ color: 'primary.main' }} />
          </Box>
          <Typography variant="h5" gutterBottom>
            Welcome to Natural Language Database Chat
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: 500, mb: 3 }}>
            Select a data source from the dropdown above and start asking questions about your data in plain English.
          </Typography>
        </EmptyState>
      );
    }

    if (!activeSession || activeSession.messages.length === 0) {
      return (
        <EmptyState>
          <Box sx={{ mb: 3, p: 3, borderRadius: '50%', bgcolor: alpha(theme.palette.success.main, 0.1) }}>
            <Iconify icon="eva:message-square-outline" width={48} height={48} sx={{ color: 'success.main' }} />
          </Box>
          <Typography variant="h5" gutterBottom>
            Ready to Chat!
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: 500, mb: 3 }}>
            Ask a question about your <strong>{selectedSource.name}</strong> database to start a new conversation.
          </Typography>
          <Box sx={{ 
            p: 2, 
            borderRadius: 1, 
            bgcolor: alpha(theme.palette.info.main, 0.1),
            border: `1px dashed ${theme.palette.info.main}`,
            maxWidth: 400 
          }}>
            <Typography variant="body2" color="info.dark" style={{ fontStyle: 'italic' }}>
              {`"What were the top 5 sales by revenue last quarter?"`}
            </Typography>
          </Box>
        </EmptyState>
      );
    }

    return (
      <Box>
        {activeSession.messages.map((message, index) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && <BotLoadingMessage />}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {showNoSourceAlert && (
        <Alert 
          severity="warning" 
          sx={{ m: 2 }} 
          onClose={() => setShowNoSourceAlert(false)}
        >
          <AlertTitle>No Data Source Selected</AlertTitle>
          Please select a data source from the dropdown to continue.
        </Alert>
      )}

      <HeaderContainer elevation={0}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Iconify icon="eva:database-fill" width={32} height={32} sx={{ color: 'primary.main' }} />
              <Typography variant="h4" fontWeight="600">
                Database Chat
              </Typography>
            </Stack>
            
            <DataSourceDropdown
              ownedSources={ownedSources}
              sharedSources={availableSources}
              selectedSource={selectedSource}
              onSourceSelect={handleSourceSelect}
              onCreateSource={() => setIsCreateDialogOpen(true)}
              onManageSource={handleManageSource}
            />
          </Stack>
        </Container>
      </HeaderContainer>

      <ChatContainer>
        <MessagesContainer>
          <Container maxWidth="lg" sx={{ height: '100%' }}>
            {renderMessages()}
          </Container>
        </MessagesContainer>

        <InputContainer>
          <Container maxWidth="lg">
            <ChatMessageInput
              onSend={handleSendMessage}
              disabled={isLoading}
              placeholder={
                selectedSource 
                  ? `Ask a question about ${selectedSource.name}...`
                  : 'Select a data source to start chatting...'
              }
              disableSend={!selectedSource}
              sessionInfo={activeSession ? {
                sessionId: activeSession.id,
                messageCount: Math.floor(activeSession.messages.length / 2),
              } : null}
              showSuggestions={!!selectedSource && !activeSession}
            />
          </Container>
        </InputContainer>
      </ChatContainer>

      <MainContent.CreateDataSourceDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateSource={handleCreateDataSource}
      />
    </Box>
  );
}