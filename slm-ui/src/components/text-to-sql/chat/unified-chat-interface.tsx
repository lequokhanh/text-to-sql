import { useRef, useState, useEffect, useCallback } from 'react';

import { alpha, styled, keyframes } from '@mui/material/styles';
import {
  Box,
  Fade,
  Zoom,
  Card,
  Alert,
  Stack,
  Button,
  Tooltip,
  useTheme,
  Skeleton,
  Snackbar,
  Typography,
  IconButton,
  CardContent,
  CircularProgress,
} from '@mui/material';

import { useChatSessions } from 'src/hooks/use-chat-sessions';

import { formatSqlQuery } from 'src/utils/sql-formatter'; // Import SQL formatter
import axiosInstance, { endpoints } from 'src/utils/axios';
import { formatResultsAsMarkdownTable } from 'src/utils/format-utils';

import { DatabaseLayout } from 'src/layouts/db-chat/database-layout';

import Iconify from 'src/components/iconify';

import { IChatMessage } from 'src/types/chat';
import { DatabaseSource } from 'src/types/database'; 

import ChatMessageInput from './chat-message-input';
import { ChatMessage, BotLoadingMessage } from './chat-message';
import { ChatSessionsSidebar } from '../sidebars/chat-sessions-sidebar';

interface UnifiedChatInterfaceProps {
  selectedSource: DatabaseSource | null;
  onSourceRequired: () => void;
}

// Define a proper type for the active session
interface ChatSession {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  dataSourceId: string;
  messages: IChatMessage[];
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
}

const pulse = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
`;

const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  backgroundColor: alpha(theme.palette.background.default, 0.5),
  backgroundImage: `
    radial-gradient(circle at 10% 10%, ${alpha(theme.palette.primary.lighter, 0.04)} 0%, transparent 50%),
    radial-gradient(circle at 90% 90%, ${alpha(theme.palette.secondary.lighter, 0.03)} 0%, transparent 50%)
  `,
  position: 'relative',
  overflow: 'hidden',
}));

const MessagesArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  width: '100%',
  padding: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  scrollBehavior: 'smooth',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    borderRadius: 4,
    backgroundColor: alpha(theme.palette.grey[500], 0.2),
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: alpha(theme.palette.grey[500], 0.3),
    },
  },
}));

const InputArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  width: '100%',
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  backgroundColor: alpha(theme.palette.background.default, 0.98),
  backdropFilter: 'blur(20px)',
  position: 'relative',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 10,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -1,
    left: 0,
    right: 0,
    height: 1,
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
  },
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  textAlign: 'center',
  position: 'relative',
  padding: theme.spacing(2),
  '&::before': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: `radial-gradient(circle at center, ${alpha(theme.palette.primary.main, 0.02)} 0%, transparent 70%)`,
  },
}));

const FloatingActionButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  zIndex: 1000,
  width: 56,
  height: 56,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  boxShadow: `0 4px 20px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
  border: `4px solid ${alpha(theme.palette.background.default, 0.9)}`,
  opacity: 0.2,
  transition: theme.transitions.create(['transform', 'box-shadow', 'opacity'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    transform: 'scale(1.1)',
    boxShadow: `0 6px 28px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
    opacity: 1,
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

const WelcomeCard = styled(Card)(({ theme }) => ({
  maxWidth: 600,
  width: '100%',
  margin: theme.spacing(3, 'auto'),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
  borderRadius: 16,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.04)}`,
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 40px 0 ${alpha(theme.palette.common.black, 0.06)}`,
  },
}));

const SuggestionChip = styled(Button)(({ theme }) => ({
  borderRadius: 20,
  padding: theme.spacing(1, 3),
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.875rem',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  color: theme.palette.primary.main,
  backgroundColor: alpha(theme.palette.primary.main, 0.04),
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.short,
  }),
  marginBottom: theme.spacing(1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    borderColor: alpha(theme.palette.primary.main, 0.3),
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 12px 0 ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

const ErrorAlert = styled(Alert)(({ theme }) => ({
  margin: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
  width: 'calc(100% - 32px)',
  maxWidth: '100%',
  overflowX: 'auto',
  boxShadow: `0 4px 12px 0 ${alpha(theme.palette.error.main, 0.1)}`,
}));

export function UnifiedChatInterface({ selectedSource, onSourceRequired }: UnifiedChatInterfaceProps) {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const dataSourceRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [tempSession, setTempSession] = useState<ChatSession | null>(null);

  const {
    sessions,
    activeSession,
    addMessageToSession,
    createSessionFromChatResponse,
    switchSession,
    loadSessions,
    startNewChat,
    updateLocalSession,
    isLoadingSession,
    setActiveSession,
  } = useChatSessions();

  const [suggestions] = useState([
    'Show me all users from last month',
    'What are the top 5 products by sales?',
    'Count total orders by status',
    'Find revenue for this quarter',
  ]);

  const scrollToBottom = useCallback(() => {
    // Direct method: force scroll to the maximum possible value
    if (messagesAreaRef.current) {
      const container = messagesAreaRef.current;
      
      // Calculate the maximum scroll position
      const maxScroll = container.scrollHeight - container.clientHeight;
      
      // First set the scroll without animation to ensure it works
      container.scrollTop = maxScroll + 1000; // Add extra to ensure we're at the bottom
      
      // Then follow up with smooth scroll for better UX
      setTimeout(() => {
        container.scrollTo({
          top: maxScroll + 1000, // Add extra to ensure we're at the bottom
          behavior: 'smooth'
        });
      }, 50);
    }
  }, []);

  // Handle scroll to show/hide scroll button
  useEffect(() => {
    const messagesArea = messagesAreaRef.current;
    if (!messagesArea) return undefined;

    const handleScroll = () => {
      // Show scroll button when not at the bottom (with a 100px threshold)
      const { scrollTop, scrollHeight, clientHeight } = messagesArea;
      const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isScrolledToBottom);
    };

    // Initial check
    handleScroll();
    
    // Call handleScroll when messages area is scrolled
    messagesArea.addEventListener('scroll', handleScroll);
    
    // Also check when messages might change
    const observer = new MutationObserver(handleScroll);
    observer.observe(messagesArea, { childList: true, subtree: true });
    
    return () => {
      messagesArea.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

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

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Load sessions when datasource changes - with updated logic
  useEffect(() => {
    if (selectedSource) {
      console.log('Loading sessions for data source:', selectedSource.id);
      
      // Only load sessions if this is the first time seeing this data source
      if (dataSourceRef.current !== selectedSource.id) {
        dataSourceRef.current = selectedSource.id;
        loadSessions(selectedSource.id);
      }
    }
  }, [selectedSource, loadSessions]);

  const handleNewSession = useCallback(() => {
    if (!selectedSource) {
      onSourceRequired();
      return;
    }
    startNewChat();
    // No success notification here
  }, [selectedSource, onSourceRequired, startNewChat]);

  const handleSessionSelect = useCallback(async (session: any) => {
    console.log('handleSessionSelect', session);
    // Prevent selecting the currently active session again
    if (activeSession?.id === session.id) {
      console.log('Session already active, ignoring selection');
      return;
    }
    
    // Only set loading if we're actually switching sessions
    setIsLoading(true);
    setError(null);
    
    try {
      // Clear any pending message
      setPendingMessage(null);
      
      await switchSession(session.id);
      // No success notification for loading messages
    } catch (err) {
      console.error('Error switching session:', err);
      setError('Failed to load chat history');
      showSnackbar('Failed to load chat history', 'error');
    } finally {
      // Remove the loading state immediately after session switch
      setIsLoading(false);
    }
  }, [switchSession, setError, showSnackbar, activeSession]);

  // New function to create a temporary session
  const createTempSession = useCallback((userMessage: IChatMessage, dataSourceId: string) => {
    // Create a temporary session with a placeholder name based on the message
    const message = userMessage.body;
    const newTempSession: ChatSession = {
      id: `temp-${Date.now()}`,
      name: message.length > 30 ? `${message.substring(0, 30)}...` : message,
      description: 'Temporary session',
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 1,
      dataSourceId,
      messages: [userMessage],
    };
    
    // Store the temp session
    setTempSession(newTempSession);
    
    return newTempSession;
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!selectedSource) {
      onSourceRequired();
      return;
    }

    setError(null);
    setPendingMessage(message);
    
    // Add user message to current session
    const userMessage: IChatMessage = {
      id: `msg-${Date.now()}`,
      body: message,
      contentType: 'text',
      createdAt: new Date(),
      senderId: 'user',
      attachments: [],
    };

    // Create temporary session if no active session exists
    let currentSessionId = activeSession?.id;
    let isTemp = false;
    let temporaryMessages: IChatMessage[] = [];
    
    if (!currentSessionId) {
      // Create a temporary session
      const newTempSession = createTempSession(userMessage, selectedSource.id);
      currentSessionId = newTempSession.id;
      isTemp = true;
      temporaryMessages = [userMessage];
      
      // Start a new chat (this will be updated later)
      startNewChat();
    } else {
      // Add message to existing session
      addMessageToSession(currentSessionId, userMessage);
    }

    setIsLoading(true);

    try {
      // Prepare API payload
      const payload: any = {
        question: message,
        dataSourceId: parseInt(selectedSource.id, 10),
      };

      // Add chatSessionId if this isn't a temporary session
      if (currentSessionId && !isTemp) {
        // Handle different session ID formats
        let apiSessionId;
        try {
          const sessionParts = currentSessionId.split('-');
          apiSessionId = sessionParts.length > 1 && !Number.isNaN(Number(sessionParts[1])) 
            ? Number(sessionParts[1]) 
            : parseInt(currentSessionId, 10);
        } catch (err) {
          console.error('Error parsing session ID:', err);
          apiSessionId = currentSessionId;
        }
        
        payload.chatSessionId = apiSessionId;
      }
      
      console.log('Sending message payload:', payload);
      
      // Send to API
      const response = await axiosInstance.post(endpoints.chat.ask, payload);
    
      const botResponse = response.data;
      
      console.log('Bot response:', botResponse);
      
      // Get or create proper session based on the API response
      let session = activeSession;

      // Format the bot response into a message
      const sqlToFormat = botResponse?.message || botResponse?.sql || '';
      const formattedSql = sqlToFormat ? formatSqlQuery(sqlToFormat) : '';
      
      // Build the message body with SQL Query and Results sections
      let resultText = '';
      
      if (formattedSql) {
        resultText += `## SQL Query\n\`\`\`sql\n${formattedSql}\n\`\`\`\n\n`;
      }
        
      // Parse the data if it's a string
      let responseData = botResponse?.data;
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch (parseError) {
          console.error('Error parsing response data:', parseError);
          // Use as-is if not valid JSON
        }
      }
      
      // Add the results section
      resultText += `## Results\n`;
      if (Array.isArray(responseData) && responseData.length > 0) {
        resultText += formatResultsAsMarkdownTable(responseData);
      } else {
        resultText += "No results found.";
      }

      const botMessage: IChatMessage = {
        id: `msg-${Date.now() + 1}`,
        body: resultText,
        contentType: 'text',
        createdAt: new Date(),
        senderId: 'bot',
        attachments: [],
        metadata: {
          query: formattedSql, // Store the formatted SQL
          results: responseData,
          rowCount: Array.isArray(responseData) ? responseData.length : 0,
        },
      };
      
      try {
        // If this was a temporary session or no session, create a real one from API response
        if (isTemp || !session) {
          // Create the real session from API response
          const newSession = createSessionFromChatResponse(selectedSource.id, botResponse);
          session = newSession;
          
          // Create a proper session with all messages from temporary session
          const newSessionWithMessages = {
            ...newSession,
            messages: [...temporaryMessages, botMessage], // Include previous messages plus new bot message
            messageCount: temporaryMessages.length + 1,
          };
          
          // Explicitly set the active session with all messages preserved
          setActiveSession(newSessionWithMessages);
          
          // No need to manually add messages again since we included them above
          // But we should update session locally with the correct counts
          updateLocalSession(newSession.id, {
            messageCount: temporaryMessages.length + 1,
            lastActivity: new Date(),
          });
          
          showSnackbar('New chat created', 'success');
        } else if (session && session.id) {
          // For existing sessions, just add the bot message
          addMessageToSession(session.id, botMessage);
          
          // Update session locally
          updateLocalSession(session.id, {
            messageCount: (session.messageCount || 0) + 1, // Just add bot message count
            lastActivity: new Date(),
          });
        }
      } catch (sessionErr) {
        console.error('Error handling chat session:', sessionErr);
        
        // Create an error message
        const errorBotMessage: IChatMessage = {
          id: `msg-${Date.now() + 1}`,
          body: `## Error\n\n${sessionErr ?? 'Failed to create chat session'}`,
          contentType: 'text',
          createdAt: new Date(),
          senderId: 'bot',
          attachments: [],
        };
        
        // If we have an active session, add the error message to it
        if (activeSession && activeSession.id) {
          addMessageToSession(activeSession.id, errorBotMessage);
        } else {
          // If we don't have an active session, start a new one with an error
          startNewChat();
          // Need to check if activeSession is available after startNewChat
          const currentSession = activeSession;
          if (currentSession && currentSession.id) {
            addMessageToSession(currentSession.id, userMessage);
            addMessageToSession(currentSession.id, errorBotMessage);
          }
        }
        
        setIsLoading(false);
        setPendingMessage(null);
        setTimeout(scrollToBottom, 200);
        return;
      }
      
      // After updating, make sure to scroll to bottom
      setTimeout(scrollToBottom, 100);

    } catch (err) {
      console.error('Error sending message:', err);
      const errorMsg = err ?? 'Failed to send message';
      
      // Create a bot error message instead of showing an alert
      const errorBotMessage: IChatMessage = {
        id: `msg-${Date.now() + 1}`,
        body: `## Error\n\n${errorMsg}`,
        contentType: 'text',
        createdAt: new Date(),
        senderId: 'bot',
        attachments: [],
      };
      
      // Add error message to active session or create a new one
      if (activeSession && activeSession.id) {
        addMessageToSession(activeSession.id, errorBotMessage);
      } else {
        // If we don't have an active session, start a new one with an error
        startNewChat();
        // Need to check if activeSession is available after startNewChat
        const currentSession = activeSession;
        if (currentSession && currentSession.id) {
          addMessageToSession(currentSession.id, userMessage);
          addMessageToSession(currentSession.id, errorBotMessage);
        }
      }
      
      // We still want to show a snackbar for API errors
      showSnackbar(errorMsg, 'error');
    } finally {
      setIsLoading(false);
      setPendingMessage(null);
      setTempSession(null);
      // Final scroll to bottom check
      setTimeout(scrollToBottom, 200);
    }
  }, [selectedSource, activeSession, addMessageToSession, createSessionFromChatResponse, onSourceRequired, showSnackbar, updateLocalSession, scrollToBottom, startNewChat, createTempSession, setActiveSession]);

  useEffect(() => {
    console.log('Active session:', activeSession);
  }, [activeSession]);

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
    // No data source selected
    if (!selectedSource) {
      return (
        <EmptyState>
          <Box sx={{ 
            position: 'relative',
            animation: `${pulse} 2s ease-in-out infinite`,
          }}>
            <Box sx={{ 
              mb: 3, 
              p: 4, 
              borderRadius: '50%', 
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}>
              <Iconify 
                icon="eva:database-outline" 
                width={64} 
                height={64} 
                sx={{ 
                  color: 'primary.main',
                  filter: `drop-shadow(0 4px 8px ${alpha(theme.palette.primary.main, 0.2)})`,
                }} 
              />
            </Box>
          </Box>
          <Typography variant="h4" fontWeight={700} gutterBottom sx={{ letterSpacing: '-0.025em' }}>
            Select a Data Source
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, lineHeight: 1.6 }}>
            Choose a data source from the dropdown to start chatting and querying your data with natural language.
          </Typography>
        </EmptyState>
      );
    }
    
    // Empty chat state (data source selected but no active chat)
    if (!activeSession && !tempSession && !pendingMessage) {
      return (
        <EmptyState>
          <WelcomeCard>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ 
                mb: 3, 
                p: 3, 
                borderRadius: '50%', 
                bgcolor: alpha(theme.palette.success.main, 0.1),
                mx: 'auto',
                width: 'fit-content',
              }}>
                <Iconify 
                  icon="eva:message-square-outline" 
                  width={48} 
                  height={48} 
                  sx={{ color: 'success.main' }} 
                />
              </Box>
              <Typography variant="h5" fontWeight={700} gutterBottom sx={{ letterSpacing: '-0.025em' }}>
                Start a New Conversation
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
                Ask a question about your <strong>{selectedSource.name}</strong> database using natural language.
              </Typography>
              
              {/* Quick Suggestions */}
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                Try these examples:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
                {suggestions.map((suggestion, index) => (
                  <SuggestionChip
                    key={index}
                    variant="outlined"
                    size="small"
                    onClick={() => handleSendMessage(suggestion)}
                    startIcon={<Iconify icon="eva:arrow-right-fill" width={16} height={16} />}
                  >
                    {suggestion}
                  </SuggestionChip>
                ))}
              </Stack>
            </CardContent>
          </WelcomeCard>
        </EmptyState>
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
            onNewSession={handleNewSession}
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
            {error && (
              <Zoom in>
                <ErrorAlert 
                  severity="error" 
                  onClose={() => setError(null)}
                  action={
                    <Tooltip title="Retry">
                      <IconButton
                        aria-label="retry"
                        size="small"
                        onClick={() => {
                          setError(null);
                          if (pendingMessage) {
                            handleSendMessage(pendingMessage);
                          }
                        }}
                      >
                        <Iconify icon="eva:refresh-fill" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  {error}
                </ErrorAlert>
              </Zoom>
            )}

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
                  placeholder={(() => {
                    // Use IIFE to calculate placeholder and avoid nested ternary
                    if (!selectedSource) {
                      return "Select a data source to start chatting...";
                    }
                    if (tempSession || activeSession) {
                      return "Continue your conversation...";
                    }
                    return "Ask a question to start a new chat...";
                  })()}
                  disableSend={!selectedSource}
                  sessionInfo={activeSession || tempSession ? {
                    sessionId: (activeSession || tempSession)?.id || '',
                    messageCount: Math.floor(((activeSession || tempSession)?.messages?.length || 0) / 2),
                  } : null}
                />
              </Box>
            </InputArea>

            {/* Floating scroll to bottom button */}
            <Fade in={showScrollButton}>
              <FloatingActionButton
                onClick={scrollToBottom}
                aria-label="scroll to bottom"
                sx={{
                  position: 'fixed',
                  left: 100, // 80px from left edge as requested
                  bottom: { xs: 80, sm: 100 }, // Higher position to avoid input area
                  boxShadow: (t) => `0 0 20px 0 ${alpha(t.palette.primary.main, 0.3)}`,
                  zIndex: 1000,
                }}
              >
                <Iconify icon="eva:arrow-downward-fill" width={24} height={24} />
              </FloatingActionButton>
            </Fade>

            {/* Loading overlay for sessions/data source loading */}
            {isLoading && !activeSession && sessions.length === 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: (t) => alpha(t.palette.background.default, 0.7),
                  zIndex: 10,
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading data...
                  </Typography>
                </Box>
              </Box>
            )}
          </ChatContainer>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          variant="filled"
          sx={{
            borderRadius: 2,
            boxShadow: (t) => t.customShadows?.z20,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DatabaseLayout.Content>
  );
}