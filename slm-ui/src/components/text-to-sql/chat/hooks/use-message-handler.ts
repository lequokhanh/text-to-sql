import { useState, useCallback } from 'react';

import { useChatSessions } from 'src/hooks/use-chat-sessions';

import { formatSqlQuery } from 'src/utils/sql-formatter';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { formatResultsAsMarkdownTable } from 'src/utils/format-utils';

import { IChatMessage } from 'src/types/chat';
import { DatabaseSource } from 'src/types/database';

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

interface UseMessageHandlerProps {
  selectedSource: DatabaseSource | null;
  onSourceRequired: () => void;
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'info') => void;
  scrollToBottom: () => void;
}

/**
 * Custom hook to handle message sending and response processing
 */
export function useMessageHandler({
  selectedSource,
  onSourceRequired,
  showSnackbar,
  scrollToBottom,
}: UseMessageHandlerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
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

  return {
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
    startNewChat: () => {
      if (!selectedSource) {
        onSourceRequired();
        return;
      }
      startNewChat();
    },
    setError,
  };
}