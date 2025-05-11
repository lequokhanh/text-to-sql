// File: src/sections/database-management/view/database-view.tsx

import { useState, useEffect, useCallback } from 'react';

import { Box } from '@mui/material';

import { useDataSources } from 'src/hooks/use-data-sources';
import { useConversations } from 'src/hooks/use-conversations';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { formatResultsAsMarkdownTable } from 'src/utils/format-utils';

import { TabHeader } from 'src/layouts/db-chat/tab-header';
import { DatabaseLayout } from 'src/layouts/db-chat/database-layout';

import { MainContent } from 'src/components/text-to-sql/main-content/MainContent';
import { NoSourceSelected } from 'src/components/text-to-sql/states/no-source-selected';
import { DataSourceSidebar } from 'src/components/text-to-sql/sidebars/data-source-sidebar';
import { ConversationSidebar } from 'src/components/text-to-sql/sidebars/conversation-sidebar';
import { NoConversationSelected } from 'src/components/text-to-sql/states/no-conversation-selected';

import { IChatMessage } from 'src/types/chat';
import { DatabaseSource } from 'src/types/database';
import { Conversation } from 'src/types/conversation';

export default function DatabaseView() {
  // State for dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Data sources state using custom hook
  const {
    dataSources,
    selectedSource,
    setSelectedSource,
    fetchDataSources,
    updateDataSource,
    deleteDataSource,
    createDataSource,
  } = useDataSources();

  // Conversations state using custom hook
  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    isLoading: isConversationLoading,
    fetchSessions,
    fetchMessages,
    createNewConversation,
    addMessage,
    updateConversationPreview,
    clearConversation,
  } = useConversations();

  // Check if user is owner of selected data source
  const isOwner = true;

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const handleSourceSelect = (source: DatabaseSource) => {
    setSelectedSource(source);
    setSelectedConversation(null);
    setTabValue(0); // Default to chat tab when selecting a source
    // Fetch sessions for the selected source
    fetchSessions(source.id);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]);

  const handleNewChat = useCallback(async () => {
    if (!selectedSource) return;
    try {
      const conversation = await createNewConversation(selectedSource.id);
      setSelectedConversation(conversation);
      setTabValue(0); // Switch to chat tab
    } catch (error) {
      console.error('Error creating new chat:', error);
      // TODO: Show error notification
    }
  }, [selectedSource, createNewConversation, setSelectedConversation]);

  const handleSelectConversation = useCallback(
    async (conversation: Conversation) => {
      setSelectedConversation(conversation);
      setTabValue(0); // Switch to chat tab
      // Fetch messages for the selected conversation
      await fetchMessages(conversation.id);
    },
    [setSelectedConversation, fetchMessages]
  );

  const handleClearChat = useCallback(() => {
    if (!selectedConversation || !selectedSource) return;
    clearConversation(selectedConversation.id);
    updateConversationPreview(selectedSource.name, selectedConversation.id, 'Chat cleared');
  }, [selectedConversation, selectedSource, clearConversation, updateConversationPreview]);

  const handleExportChat = useCallback(() => {
    if (!selectedConversation || !selectedSource || !messages[selectedConversation.id]) return;

    const chatData = messages[selectedConversation.id];
    const chatText = chatData
      .map((msg) => {
        const sender = msg.senderId === 'user' ? 'User' : 'Database';
        return `${sender} (${new Date(msg.createdAt).toLocaleString()}):\n${msg.body}\n`;
      })
      .join('\n----------\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSource.name}-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [selectedConversation, selectedSource, messages]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!selectedConversation || !selectedSource) return;

      const userMessage: IChatMessage = {
        id: `msg-${Date.now()}`,
        body: message,
        contentType: 'text',
        createdAt: new Date(),
        senderId: 'user',
        attachments: [],
      };

      addMessage(selectedConversation.id, userMessage);
      updateConversationPreview(selectedSource.id, selectedConversation.id, message);

      try {
        // Ask question through backend proxy
        const { data: response } = await axiosInstance.post(endpoints.chat.ask, {
          chatSessionId: selectedConversation.id,
          dataSourceId: selectedSource.id,
          question: message,
        });

        // Format the response
        const resultText = formatResultsAsMarkdownTable(response.data);

        const botMessage: IChatMessage = {
          id: `msg-${Date.now()}`,
          body: resultText,
          contentType: 'text',
          createdAt: new Date(),
          senderId: 'bot',
          attachments: [],
          metadata: {
            query: response.query,
            results: response.data,
            rowCount: Array.isArray(response.data) ? response.data.length : 0,
          },
        };

        addMessage(selectedConversation.id, botMessage);
      } catch (error) {
        console.error('Error sending message:', error);
        // Add error message to chat
        const errorMessage: IChatMessage = {
          id: `error-${Date.now()}`,
          body: 'Sorry, there was an error processing your request. Please try again.',
          contentType: 'text',
          createdAt: new Date(),
          senderId: 'bot',
          attachments: [],
        };
        addMessage(selectedConversation.id, errorMessage);
      }
    },
    [selectedConversation, selectedSource, addMessage, updateConversationPreview]
  );

  const handleUpdateDataSource = (updatedSource: DatabaseSource) => {
    updateDataSource(updatedSource);
    setSelectedSource(updatedSource);
  };

  const handleCreateDataSource = async (source: DatabaseSource) => {
    try {
      await createDataSource(source);
      handleCloseCreateDialog();
    } catch (error) {
      console.error('Error creating data source:', error);
    }
  };

  const handleDeleteDataSource = (sourceId: string) => {
    deleteDataSource(sourceId);
    setSelectedSource(null);
  };

  // Render the content based on the active tab and selection state
  const renderMainContent = () => {
    if (!selectedSource) {
      return <NoSourceSelected />;
    }

    // Chat tab content
    if (tabValue === 0) {
      if (!selectedConversation) {
        return <NoConversationSelected onNewChat={handleNewChat} />;
      }

      return (
        <MainContent.Chat
          source={selectedSource}
          messages={messages[selectedConversation.id] || []}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onExportChat={handleExportChat}
          messageCount={messages[selectedConversation.id]?.length || 0}
          isLoading={isConversationLoading}
        />
      );
    }

    // Management tab content
    if (tabValue === 1) {
      if (!isOwner) {
        return <MainContent.NotOwner />;
      }

      return (
        <MainContent.Management
          dataSource={selectedSource}
          onUpdate={handleUpdateDataSource}
          onDelete={handleDeleteDataSource}
        />
      );
    }

    return null;
  };

  return (
    <DatabaseLayout>
      {/* Primary Sidebar - Data Sources */}
      <DatabaseLayout.PrimarySidebar>
        <DataSourceSidebar
          dataSources={dataSources}
          selectedSource={selectedSource}
          onSourceSelect={handleSourceSelect}
          onCreateSource={handleOpenCreateDialog}
        />
      </DatabaseLayout.PrimarySidebar>

      {/* Secondary Area - Tabs + Content */}
      <DatabaseLayout.Content>
        {/* Tabs for Chat/Management */}
        {selectedSource && (
          <TabHeader
            value={tabValue}
            onChange={handleTabChange}
            tabs={[
              { label: 'Chat', value: 0 },
              ...(isOwner ? [{ label: 'Manage Data Source', value: 1 }] : []),
            ]}
          />
        )}

        <Box sx={{ display: 'flex', flexGrow: 1, height: 0, overflow: 'hidden' }}>
          {/* Secondary Sidebar - Conversations (only visible when Chat tab is active) */}
          {tabValue === 0 && (
            <DatabaseLayout.SecondarySidebar>
              {selectedSource ? (
                <ConversationSidebar
                  conversations={conversations[selectedSource.name] || []}
                  selectedId={selectedConversation?.id || null}
                  onSelect={handleSelectConversation}
                  onNewChat={handleNewChat}
                />
              ) : (
                <MainContent.SelectDataSource />
              )}
            </DatabaseLayout.SecondarySidebar>
          )}

          {/* Main Content Area */}
          <DatabaseLayout.Main>{renderMainContent()}</DatabaseLayout.Main>
        </Box>
      </DatabaseLayout.Content>

      <MainContent.CreateDataSourceDialog
        open={isCreateDialogOpen}
        onClose={handleCloseCreateDialog}
        onCreateSource={handleCreateDataSource}
      />
    </DatabaseLayout>
  );
}
