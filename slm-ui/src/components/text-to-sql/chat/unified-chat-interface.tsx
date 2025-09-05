import { useState, useEffect, useCallback } from 'react';

import { Box, Stack, Skeleton, Typography } from '@mui/material';

import { DatabaseLayout } from 'src/layouts/db-chat/database-layout';

import { DatabaseSource } from 'src/types/database';

import ChatMessageInput from './chat-message-input';
import { ChatMessage, BotLoadingMessage } from './chat-message';
import { ChatSessionsSidebar } from '../sidebars/chat-sessions-sidebar';
// Import our new hooks and components
import {
  useChatScroll,
  useMessageHandler,
  useChatSuggestions,
} from './hooks';
import {
  InputArea,
  EmptyStates,
  MessagesArea,
  ChatContainer,
  LoadingOverlay,
  ErrorAlertComponent,
  FloatingScrollButton,
  SnackbarNotifications,
} from './components';

interface UnifiedChatInterfaceProps {
  selectedSource: DatabaseSource | null;
  onSourceRequired: () => void;
}

export function UnifiedChatInterface({ selectedSource, onSourceRequired }: UnifiedChatInterfaceProps) {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Custom hooks
  const { messagesEndRef, messagesAreaRef, showScrollButton, scrollToBottom } = useChatScroll();
  const { suggestions, isSuggestionsLoading, fetchSuggestions } = useChatSuggestions(selectedSource);
  
  const {
    isLoading,
    error,
    pendingMessage,
    tempSession,
    sessions,
    activeSession,
    isLoadingSession,
    handleSendMessage,
    switchSession,
    loadSessions,
    startNewChat,
    setError,
  } = useMessageHandler({
    selectedSource,
    onSourceRequired,
    showSnackbar,
    scrollToBottom,
  });

  // Load sessions when datasource changes
  useEffect(() => {
    if (selectedSource) {
      console.log('Loading sessions for data source:', selectedSource.id);
      loadSessions(selectedSource.id);
    }
  }, [selectedSource, loadSessions]);

  // Auto-scroll to bottom when new messages arrive or active session changes
  useEffect(() => {
    if (activeSession && !isLoading) {
      // Add a small delay to ensure DOM is updated before scrolling
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [activeSession, activeSession?.messages, scrollToBottom, isLoading]);

  const handleSessionSelect = useCallback(async (session: any) => {
    console.log('handleSessionSelect', session);
    // Prevent selecting the currently active session again
    if (activeSession?.id === session.id) {
      console.log('Session already active, ignoring selection');
      return;
    }
    
    try {
      await switchSession(session.id);
    } catch (err) {
      console.error('Error switching session:', err);
      setError('Failed to load chat history');
      showSnackbar('Failed to load chat history', 'error');
    }
  }, [switchSession, setError, showSnackbar, activeSession]);

  const renderMessages = () => {
    // Get messages from active session or temporary session
    const messages = activeSession?.messages || tempSession?.messages || [];
    
    // Show empty state message if there are no messages
    if (messages.length === 0 && !isLoading && !pendingMessage) {
      return (
        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', width: '100%' }}>
          <Typography variant="body2">No messages yet. Start by asking a question.</Typography>
        </Box>
      );
    }

    // Show messages with loading indicator if applicable
    return (
      <>
        {messages.map((message) => (
          <Box key={message.id} sx={{ width: '100%', mb: 2 }}>
            <ChatMessage message={message} />
          </Box>
        ))}
        {isLoading && <BotLoadingMessage />}
      </>
    );
  };

  const renderContent = () => {
    // No data source selected or empty chat state
    if (!selectedSource || (!activeSession && !tempSession && !pendingMessage)) {
      return (
        <EmptyStates
          selectedSource={selectedSource}
          suggestions={suggestions}
          isSuggestionsLoading={isSuggestionsLoading}
          onSendMessage={handleSendMessage}
          onRefreshSuggestions={fetchSuggestions}
        />
      );
    }
    
    // Chat with messages (from active or temporary session)
    return (
      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
        {/* Only show skeleton loader for initial data source loading */}
        {isLoading && !activeSession && !tempSession && sessions.length === 0 && (
          <Box sx={{ mb: 2, p: 2, width: '100%' }}>
            <Stack spacing={2}>
              <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2, width: '60%' }} />
              <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2, width: '80%' }} />
            </Stack>
          </Box>
        )}
        
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {renderMessages()}
        </Box>
      </Box>
    );
  };

  const getPlaceholder = () => {
    if (!selectedSource) {
      return "Select a data source to start chatting...";
    }
    if (tempSession || activeSession) {
      return "Continue your conversation...";
    }
    return "Ask a question to start a new chat...";
  };

  return (
    <DatabaseLayout.Content>
      <Box 
        sx={{ 
          display: 'flex', 
          height: '100%', 
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ 
          position: 'fixed', 
          right: 0, // Right sidebar position
          top: 0, 
          bottom: 0, 
          zIndex: 99, // Lower than the main sidebar's z-index (1200)
          height: '100%',
          width: { xs: '280px', sm: '320px' },
          boxShadow: (t) => t.shadows[2],
          bgcolor: 'background.paper',
          borderLeft: '1px solid', // Changed from borderRight to borderLeft
          borderColor: 'divider',
        }}>
          <ChatSessionsSidebar
            selectedSource={selectedSource}
            sessions={sessions}
            activeSession={activeSession}
            onSessionSelect={handleSessionSelect}
            onNewSession={startNewChat}
            isLoading={isLoading}
            loadingSessionId={isLoadingSession} // Pass loading session ID
          />
        </Box>

        {/* Full width chat content */}
        <Box sx={{ 
          width: '100%',
          height: '100%',
          display: 'flex',
        }}>
          <ChatContainer>
            <ErrorAlertComponent 
              error={error}
              pendingMessage={pendingMessage}
              onClearError={() => setError(null)}
              onRetry={pendingMessage ? () => handleSendMessage(pendingMessage) : undefined}
            />

            <MessagesArea ref={messagesAreaRef}>
              <Box sx={{ width: '100%', height: '100%' }}>
                {renderContent()}
              </Box>
              <Box 
                ref={messagesEndRef} 
                sx={{ 
                  height: '1px', 
                  mb: 0,
                  float: 'left', 
                  clear: 'both',
                  width: '100%'
                }} 
              />
            </MessagesArea>

            <InputArea>
              <Box sx={{ width: '100%' }}>
                <ChatMessageInput
                  onSend={handleSendMessage}
                  disabled={isLoading}
                  placeholder={getPlaceholder()}
                  disableSend={!selectedSource}
                  sessionInfo={activeSession || tempSession ? {
                    sessionId: (activeSession || tempSession)?.id || '',
                    messageCount: Math.floor(((activeSession || tempSession)?.messages?.length || 0) / 2),
                  } : null}
                  newChat={!activeSession && !tempSession}
                  suggestions={suggestions}
                  onRefreshSuggestions={fetchSuggestions}
                  isSuggestionsLoading={isSuggestionsLoading}
                />
              </Box>
            </InputArea>

            {/* Floating scroll to bottom button */}
            <FloatingScrollButton 
              show={showScrollButton}
              onScrollToBottom={scrollToBottom}
            />

            {/* Loading overlay for sessions/data source loading */}
            <LoadingOverlay 
              show={isLoading && !activeSession && sessions.length === 0}
            />
          </ChatContainer>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <SnackbarNotifications 
        snackbar={snackbar}
        onClose={closeSnackbar}
      />
    </DatabaseLayout.Content>
  );
}