import { useState, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { IChatMessage } from 'src/types/chat';
import { Conversation } from 'src/types/conversation';

interface ChatSession {
  id: number;
  title?: string;
  lastMessage?: string;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  content: string;
  createdAt: string;
  senderType: 'USER' | 'BOT';
  metadata?: Record<string, any>;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Record<string, Conversation[]>>({});
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Record<string, IChatMessage[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchSessions = useCallback(async (sourceId: string) => {
    try {
      setIsLoading(true);
      const { data: sessions } = await axiosInstance.get<ChatSession[]>(endpoints.chat.sessions);
      
      // Transform sessions to conversations
      const transformedSessions = sessions.map((session) => ({
        id: session.id.toString(),
        title: session.title || `Chat ${session.id}`,
        preview: session.lastMessage || 'No messages yet',
        createdAt: new Date(session.createdAt),
        unread: false,
      }));

      setConversations((prev: Record<string, Conversation[]>) => ({
        ...prev,
        [sourceId]: transformedSessions,
      }));
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      const { data: chatMessages } = await axiosInstance.get<ChatMessage[]>(
        endpoints.chat.messages(sessionId)
      );
      
      // Transform messages to IChatMessage format
      const transformedMessages = chatMessages.map((msg) => ({
        id: msg.id.toString(),
        body: msg.content,
        contentType: 'text',
        createdAt: new Date(msg.createdAt),
        senderId: msg.senderType === 'USER' ? 'user' : 'bot',
        attachments: [],
        metadata: msg.metadata,
      }));

      setMessages((prev: Record<string, IChatMessage[]>) => ({
        ...prev,
        [sessionId]: transformedMessages,
      }));
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewConversation = useCallback(
    async (sourceId: string) => {
      try {
        setIsLoading(true);
        const { data: session } = await axiosInstance.post<ChatSession>(endpoints.chat.session, {
          dataSourceId: sourceId,
        });

        const newConversation: Conversation = {
          id: session.id.toString(),
          title: `New Chat ${(conversations[sourceId]?.length || 0) + 1}`,
          preview: 'Start a new conversation',
          createdAt: new Date(session.createdAt),
        };

        setConversations((prev: Record<string, Conversation[]>) => ({
          ...prev,
          [sourceId]: [...(prev[sourceId] || []), newConversation],
        }));

        setMessages((prev: Record<string, IChatMessage[]>) => ({
          ...prev,
          [newConversation.id]: [],
        }));

        return newConversation;
      } catch (error) {
        console.error('Error creating new conversation:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [conversations]
  );

  const addMessage = useCallback((conversationId: string, message: IChatMessage) => {
    setMessages((prev: Record<string, IChatMessage[]>) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), message],
    }));
  }, []);

  const updateConversationPreview = useCallback(
    (sourceId: string, conversationId: string, preview: string) => {
      setConversations((prev: Record<string, Conversation[]>) => ({
        ...prev,
        [sourceId]:
          prev[sourceId]?.map((conv: Conversation) =>
            conv.id === conversationId ? { ...conv, preview } : conv
          ) || [],
      }));
    },
    []
  );

  const clearConversation = useCallback((conversationId: string) => {
    setMessages((prev: Record<string, IChatMessage[]>) => ({
      ...prev,
      [conversationId]: [],
    }));
  }, []);

  return {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    isLoading,
    fetchSessions,
    fetchMessages,
    createNewConversation,
    addMessage,
    updateConversationPreview,
    clearConversation,
  };
}
