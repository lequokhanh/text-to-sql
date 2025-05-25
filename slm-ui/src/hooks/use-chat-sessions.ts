import { useState, useEffect, useCallback  } from 'react'; 

import { formatSqlQuery } from 'src/utils/sql-formatter';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { formatResultsAsMarkdownTable } from 'src/utils/format-utils';

import { IChatMessage } from 'src/types/chat';

export interface ChatSession {
  id: string;
  title: string;
  dataSourceId: string;
  messages: IChatMessage[];
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
}

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug logging for active session changes
  useEffect(() => {
    console.log('Active session changed:', activeSession);
  }, [activeSession]);

  // Load messages for a specific session - always loads from API
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    console.log('Loading messages for session:', sessionId);
    // Don't set global loading state here to prevent UI flickering
    // Only track errors at this level
    setError(null);
    
    try {
      // Parse sessionId to match API expectations
      let apiSessionId;
      try {
        const sessionParts = sessionId.split('-');
        apiSessionId = sessionParts.length > 1 && !Number.isNaN(Number(sessionParts[1])) 
          ? Number(sessionParts[1]) 
          : parseInt(sessionId, 10);
      } catch (err) {
        console.error('Error parsing session ID:', err);
        apiSessionId = sessionId;
      }

      console.log('Fetching messages with API session ID:', apiSessionId);
      const response = await axiosInstance.get(endpoints.chat.messages(apiSessionId.toString()));
      
      console.log('API response for messages:', response.data);
      
      // API returns a nested structure with data array
      const messagesData = response.data || [];
      
      // Transform messages
      const transformedMessages = messagesData.map((msg: any) => {
        // Handle both /ask and /message API formats
        const messageContent = msg.message || ''; 
        const sqlQuery = msg.sql || ''; // For /ask API
        const responseData = msg.responseData || []; // For /message API
        
        // For bot messages, format SQL and response data in markdown
        if (msg.userRole === 'BOT') {
          // Format for the SqlQueryResults component
          // Format the SQL code for the SQL section
          const sqlToFormat = messageContent || sqlQuery || '';
          const formattedSql = sqlToFormat ? formatSqlQuery(sqlToFormat) : '';
          
          // Build the message body with SQL Query and Results sections
          // as expected by the SqlQueryResults component
          let resultText = '';
          
          if (formattedSql) {
            resultText += `## SQL Query\n\`\`\`sql\n${formattedSql}\n\`\`\`\n\n`;
          }
          
          // Parse responseData if it's a string
          let parsedResponseData = responseData;
          if (typeof responseData === 'string') {
            try {
              parsedResponseData = JSON.parse(responseData);
            } catch (parseError) {
              console.error('Error parsing response data:', parseError);
              // Use as-is if not valid JSON
            }
          }
          
          // Add the results section
          resultText += `## Results\n`;
          if (Array.isArray(parsedResponseData) && parsedResponseData.length > 0) {
            resultText += formatResultsAsMarkdownTable(parsedResponseData);
          } else {
            resultText += "No results found.";
          }
          
          return {
            id: msg.id.toString(),
            body: resultText,
            contentType: 'text',
            createdAt: new Date(msg.createdAt || Date.now()),
            senderId: 'bot',
            attachments: [],
            metadata: {
              query: formattedSql,
              results: parsedResponseData,
              rowCount: Array.isArray(parsedResponseData) ? parsedResponseData.length : 0,
            },
          };
        }
        
        // For user messages, keep it simple
        return {
          id: msg.id.toString(),
          body: messageContent,
          contentType: 'text',
          createdAt: new Date(msg.createdAt || Date.now()),
          senderId: 'user',
          attachments: [],
        };
      });

      console.log('Transformed messages:', transformedMessages);

      // Update the sessions list with the fetched messages - but don't trigger UI updates
      // This will be a background update to keep the sessions consistent
      setSessions(prev => {
        const updatedSessions = prev.map(session => 
          session.id === sessionId 
            ? { 
                ...session, 
                messages: transformedMessages, 
                messageCount: transformedMessages.length 
              }
            : session
        );
        
        // Only update if there's an actual change
        if (JSON.stringify(prev) !== JSON.stringify(updatedSessions)) {
          return updatedSessions;
        }
        return prev;
      });
      
      // We'll let the caller update the active session instead of doing it here
      // This prevents duplicate state updates

      return transformedMessages;
    } catch (err) {
      console.error('Error loading session messages:', err);
      setError('Failed to load chat messages');
      throw err; // Rethrow to allow handling in the UI component
    }
  }, []);

  // Load sessions for a data source - fetch from API but preserve active session if possible
  const loadSessions = useCallback(async (dataSourceId: string) => {
    console.log('Loading sessions for data source ID:', dataSourceId);
    setIsLoading(true);
    setError(null);
    
    // Store current active session info to potentially restore it
    const currentActiveSessionId = activeSession?.id;
    const currentDataSourceId = activeSession?.dataSourceId;
    
    try {
      const response = await axiosInstance.get(endpoints.chat.sessions(dataSourceId));
      
      // API returns a nested structure with data array
      const sessionsData = response.data || [];
      
      console.log('API sessions response:', sessionsData);
      
      // Convert dataSourceId to number for proper comparison with API response
      const dataSourceIdNum = parseInt(dataSourceId, 10);
      
      // Transform API response to our session format
      const transformedSessions = sessionsData
        .filter((session: any) => session.dataSourceId === dataSourceIdNum)
        .map((session: any) => ({
          id: session.id.toString(),
          title: session.conversationName || `Chat ${session.id}`, // API returns 'conversationName'
          dataSourceId, // Keep as string for consistency in our app
          messages: [],
          createdAt: new Date(session.createdAt || Date.now()),
          lastActivity: new Date(session.updatedAt || Date.now()),
          messageCount: session.messageCount || 0,
        }))
        .sort((a: ChatSession, b: ChatSession) => 
          // Sort by ID as fallback if dates aren't available
          parseInt(b.id, 10) - parseInt(a.id, 10)
        );
      
      console.log('Transformed sessions:', transformedSessions);
      setSessions(transformedSessions);
      
      // Only reset active session if data source changed, otherwise try to preserve it
      if (currentDataSourceId !== dataSourceId) {
        setActiveSession(null);
      } else if (currentActiveSessionId) {
        // Try to find and restore the active session
        const foundSession = transformedSessions.find((s: ChatSession) => s.id === currentActiveSessionId);
        if (foundSession) {
          console.log('Preserving active session after refresh:', foundSession);
          
          // Important: Set active session with existing messages instead of triggering a reload
          // This prevents the infinite loop of session loading
          setActiveSession(prevSession => {
            if (!prevSession) return foundSession;
            
            // Keep messages from previous session state
            return {
              ...foundSession,
              messages: prevSession.messages || [],
            };
          });
          
          // Only load messages if we don't already have them
          if (!activeSession?.messages?.length) {
            loadSessionMessages(foundSession.id).catch(err => {
              console.error('Error loading messages for preserved session:', err);
            });
          }
        } else {
          setActiveSession(null);
        }
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load chat sessions');
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, loadSessionMessages]);

  // Create session from chat API response - no separate API call needed
  const createSessionFromChatResponse = useCallback((dataSourceId: string, botResponse: any) => {
    // Extract the session ID from the response
    const sessionId = botResponse.chatSessionId?.toString();
    
    if (!sessionId) {
      throw new Error('No chat session ID in response');
    }
    
    console.log('Creating new session from response:', { sessionId, dataSourceId });
    
    const newSession: ChatSession = {
      id: sessionId,
      title: `Chat ${sessions.length + 1}`,
      dataSourceId,
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 1,
    };
    
    // Add to sessions list but maintain order (new session first)
    setSessions(prev => [newSession, ...prev]);
    
    // Let the caller decide when to set the active session
    // This prevents overwriting any temporary messages in the UI
    
    return newSession;
  }, [sessions.length]);

  // Add message to session
  const addMessageToSession = useCallback((sessionId: string, message: IChatMessage) => {
    console.log('Adding message to session:', { sessionId, message });
    
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { 
            ...session, 
            messages: [...session.messages, message],
            lastActivity: new Date(),
            messageCount: session.messageCount + 1,
          }
        : session
    ));
    
    // Always update active session if it matches the sessionId
    if (activeSession?.id === sessionId) {
      setActiveSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, message],
        lastActivity: new Date(),
        messageCount: prev.messageCount + 1,
      } : null);
    }
  }, [activeSession]);

  // Track session loading state to prevent flickering
  const [isLoadingSession, setIsLoadingSession] = useState<string | null>(null);

  // Switch active session - always load messages from API
  const switchSession = useCallback(async (sessionId: string) => {
    console.log('Switching to session:', sessionId);
    
    // Prevent switching to a session that's already loading
    if (isLoadingSession === sessionId) {
      console.log('Already loading this session, ignoring duplicate request');
      return;
    }
    
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      console.error('Session not found:', sessionId);
      return;
    }
    
    // Mark this session as loading to prevent duplicate loads
    setIsLoadingSession(sessionId);
    
    // Set active session immediately with any existing messages
    // This is important to ensure UI shows something right away
    setActiveSession({
      ...session,
      // Keep any existing messages if available
      messages: session.messages || [],
      messageCount: session.messageCount || 0,
    });
    
    try {
      // Always load messages from API
      const messages = await loadSessionMessages(sessionId);
      
      // Only update the active session if it's still the one we're loading
      // This prevents race conditions when switching sessions quickly
      setActiveSession(prevSession => {
        if (prevSession && prevSession.id === sessionId) {
          return {
            ...prevSession,
            messages: messages || [],
            messageCount: (messages || []).length,
          };
        }
        return prevSession;
      });
    } catch (e) {
      console.error('Error switching session:', e);
      setError('Failed to load messages for this session');
    } finally {
      // Clear the loading state for this session
      setIsLoadingSession(null);
    }
  }, [sessions, loadSessionMessages, isLoadingSession]);

  // Clear active session (start new chat) - don't create session yet
  const startNewChat = useCallback(() => {
    console.log('Starting new chat');
    // Simply clear the active session without triggering any API calls
    setActiveSession(null);
    setError(null);
    // Don't touch the sessions list to prevent reloading
  }, []);

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    console.log('Deleting session:', sessionId);
    
    try {
      await axiosInstance.delete(`${endpoints.chat.sessions}/${sessionId}`);
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
      }
      
      // Refresh sessions list to ensure consistency
      if (sessions.length > 0) {
        const firstSession = sessions.find(s => s.id !== sessionId);
        if (firstSession) {
          loadSessions(firstSession.dataSourceId);
        }
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete session');
    }
  }, [activeSession, sessions, loadSessions]);

  // Update local session list without API reload
  const updateLocalSession = useCallback((sessionId: string, updatedProperties: Partial<ChatSession>) => {
    console.log('Updating local session:', { sessionId, updatedProperties });
    
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { 
            ...session, 
            ...updatedProperties,
            lastActivity: new Date(),
          }
        : session
    ));

    // Update active session if it matches
    if (activeSession?.id === sessionId) {
      setActiveSession(prev => prev ? {
        ...prev,
        ...updatedProperties,
        lastActivity: new Date(),
      } : null);
    }
  }, [activeSession]);

  // Refresh sessions from API while preserving active session
  const refreshSessions = useCallback(async (dataSourceId: string, forceReload = false) => {
    console.log('Refreshing sessions for data source:', dataSourceId, 'Force reload:', forceReload);
    // Only do a full API reload if forceReload is true
    if (forceReload) {
      await loadSessions(dataSourceId);
    }
    // If not forcing reload, updates will happen through updateLocalSession only
  }, [loadSessions]);

  return {
    sessions,
    activeSession,
    setActiveSession,
    isLoading,
    isLoadingSession, // Add this to the return value
    error,
    setError,
    loadSessions,
    loadSessionMessages,
    createSessionFromChatResponse,
    addMessageToSession,
    switchSession,
    startNewChat,
    deleteSession,
    refreshSessions,
    updateLocalSession, // Add the new method to the returned object
  };
}