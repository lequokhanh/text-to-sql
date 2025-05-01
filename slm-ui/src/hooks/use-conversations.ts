import { useState, useCallback } from 'react';

import { IChatMessage } from 'src/types/chat';
import { Conversation } from 'src/types/conversation';


export function useConversations() {
  const [conversations, setConversations] = useState<Record<string, Conversation[]>>({});
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Record<string, IChatMessage[]>>({});

  const createNewConversation = useCallback(
    (sourceId: string) => {
      const newConversation: Conversation = {
        id: `conv-${Date.now()}`,
        title: `New Chat ${(conversations[sourceId]?.length || 0) + 1}`,
        preview: 'Start a new conversation',
        createdAt: new Date(),
      };

      setConversations((prev) => ({
        ...prev,
        [sourceId]: [...(prev[sourceId] || []), newConversation],
      }));

      setMessages((prev) => ({
        ...prev,
        [newConversation.id]: [],
      }));

      return newConversation;
    },
    [conversations]
  );

  const addMessage = useCallback((conversationId: string, message: IChatMessage) => {
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), message],
    }));
  }, []);

  const updateConversationPreview = useCallback(
    (sourceId: string, conversationId: string, preview: string) => {
      setConversations((prev) => ({
        ...prev,
        [sourceId]:
          prev[sourceId]?.map((conv) =>
            conv.id === conversationId ? { ...conv, preview } : conv
          ) || [],
      }));
    },
    []
  );

  const clearConversation = useCallback((conversationId: string) => {
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [],
    }));
  }, []);

  const deleteConversation = useCallback(
    (sourceId: string, conversationId: string) => {
      setConversations((prev) => ({
        ...prev,
        [sourceId]: prev[sourceId]?.filter((conv) => conv.id !== conversationId) || [],
      }));

      setMessages((prev) => {
        const newMessages = { ...prev };
        delete newMessages[conversationId];
        return newMessages;
      });

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
    },
    [selectedConversation]
  );

  return {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    addMessage,
    updateConversationPreview,
    clearConversation,
    deleteConversation,
    createNewConversation,
  };
}
