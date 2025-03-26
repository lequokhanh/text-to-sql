import sqlFormatter from '@sqltools/formatter';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import axiosEmbed, { endpoints } from 'src/utils/axios-embed';
import axios, { endpoints as endpointBackend } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

import { IChatMessage } from 'src/types/chat';
import { DatabaseSource } from 'src/types/database';

import ChatSection from '../chat-section';
import axiosEngine from '../../../utils/axios-engine';
import DatabaseCreateDialog from '../database-create-dialog';
import DataSourceManagement from '../data-source-management';
import ConversationList, { Conversation } from '../conversation-list';

// Styled components
const RootStyle = styled('div')(({ theme }) => ({
  display: 'flex',
  height: '100%',
  overflow: 'hidden',
}));

const PrimarySidebarStyle = styled('div')(({ theme }) => ({
  width: 280,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.customShadows?.z4,
  overflow: 'hidden',
}));

const SecondarySidebarStyle = styled('div')(({ theme }) => ({
  width: 280,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.customShadows?.z4,
  overflow: 'hidden',
}));

const TabsContainerStyle = styled('div')(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const ScrollableContent = styled('div')({
  flexGrow: 1,
  overflow: 'auto',
});

const MainStyle = styled('div')({
  flexGrow: 1,
  height: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
});

export default function DatabaseView() {
  const [dataSources, setDataSources] = useState<DatabaseSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<DatabaseSource | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Conversation states
  const [conversations, setConversations] = useState<Record<string, Conversation[]>>({});
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Record<string, IChatMessage[]>>({});

  // Check if user is owner of selected data source
  const isOwner = true;

  // Memoize the fetchDataSources function
  const fetchDataSources = useMemo(
    () => async () => {
      try {
        const { data } = await axios.get(endpointBackend.dataSource.owned);
        setDataSources(data);

        // Set the first data source as selected if available and no source is currently selected
        if (data.length > 0 && !selectedSource) {
          setSelectedSource(data[0]);
          setTabValue(0); // Default to chat tab when selecting a source
        }
      } catch (error) {
        console.error('Error fetching data sources:', error);
      }
    },
    [selectedSource]
  ); // Dependencies for the memoized function

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
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]); // Empty dependency array to run once on mount

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
    setTabValue(0); // Switch to chat tab
  }, [selectedSource, conversations]);

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    setTabValue(0); // Switch to chat tab
  }, []);

  const updateConversationPreview = useCallback(
    (sourceId: string, conversationId: string, preview: string) => {
      setConversations((prev) => ({
        ...prev,
        [sourceId]: prev[sourceId].map((conv) =>
          conv.id === conversationId ? { ...conv, preview } : conv
        ),
      }));
    },
    []
  );

  const handleClearChat = useCallback(() => {
    if (!selectedConversation || !selectedSource) return;

    setMessages((prev) => ({
      ...prev,
      [selectedConversation.id]: [],
    }));

    updateConversationPreview(selectedSource.name, selectedConversation.id, 'Chat cleared');
  }, [selectedConversation, selectedSource, updateConversationPreview]);

  const handleExportChat = useCallback(() => {
    if (!selectedConversation || !selectedSource) return;

    const chatData = messages[selectedConversation.id] || [];
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

  const addMessage = useCallback((conversationId: string, message: IChatMessage) => {
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), message],
    }));
  }, []);

  const formatResultsAsMarkdownTable = (data: any[]) => {
    if (!data.length) return '```\nNo results found\n```';

    const columns = Object.keys(data[0]);

    // Create header row
    let table = `| ${columns.join(' | ')} |\n`;
    table += `| ${columns.map(() => '---').join(' | ')} |\n`;

    // Add data rows
    data.forEach((row) => {
      table += `| ${columns
        .map((col) => {
          const value = row[col];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value);
        })
        .join(' | ')} |\n`;
    });

    return table;
  };

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
      updateConversationPreview(selectedSource.name, selectedConversation.id, message);

      setIsLoading(true);
      try {
        // Get SQL query from NL query
        let { data: query } = await axiosEngine.post('/query', {
          query: message,
          connection_payload: {
            url: `${selectedSource.host}:${selectedSource.port}/${selectedSource.databaseName}`,
            username: selectedSource.username,
            password: selectedSource.password,
            dbType: selectedSource.databaseType.toLowerCase(),
          },
        });

        query = query.replace(/;$/, '');

        // Apply SQL beautification
        const beautifiedQuery = sqlFormatter.format(query);

        // Execute query against the database
        const { data } = await axiosEmbed.post(endpoints.db.query, {
          query,
          url: `${selectedSource.host}:${selectedSource.port}/${selectedSource.databaseName}`,
          username: selectedSource.username,
          password: selectedSource.password,
          dbType: selectedSource.databaseType.toLowerCase(),
        });

        let resultText = '';

        if (Array.isArray(data)) {
          // Format the response with two clear sections and improved styling
          const sqlQuerySection = `## SQL Query\n\`\`\`sql\n${beautifiedQuery}\n\`\`\`\n\n`;
          const resultsSection = `## Results (${data.length} ${
            data.length === 1 ? 'row' : 'rows'
          })\n`;

          // Format as markdown table when possible
          resultText = sqlQuerySection + resultsSection + formatResultsAsMarkdownTable(data);
        } else {
          // Fallback for other data formats
          const sqlQuerySection = `## SQL Query\n\`\`\`sql\n${beautifiedQuery}\n\`\`\`\n\n`;
          resultText = `${sqlQuerySection}## Results\n\`\`\`json\n${JSON.stringify(
            data,
            null,
            2
          )}\n\`\`\``;
        }

        const botMessage: IChatMessage = {
          id: `msg-${Date.now()}`,
          body: resultText,
          contentType: 'text',
          createdAt: new Date(),
          senderId: 'bot',
          attachments: [],
          metadata: {
            query: beautifiedQuery,
            results: data,
            rowCount: Array.isArray(data) ? data.length : 0,
          },
        };

        addMessage(selectedConversation.id, botMessage);
      } catch (error) {
        const errorMessage: IChatMessage = {
          id: `msg-${Date.now()}`,
          body: `## Error\n\`\`\`\n${
            error instanceof Error ? error.message : 'An unexpected error occurred'
          }\n\`\`\``,
          contentType: 'text',
          createdAt: new Date(),
          senderId: 'bot',
          attachments: [],
        };

        addMessage(selectedConversation.id, errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedConversation, selectedSource, addMessage, updateConversationPreview]
  );

  // Handle data source update (for the management tab)
  const handleUpdateDataSource = (updatedSource: DatabaseSource) => {
    setDataSources((prev) =>
      prev.map((source) => (source.name === updatedSource.name ? updatedSource : source))
    );
    setSelectedSource(updatedSource);
  };

  const handleCreateDataSource = async (source: DatabaseSource) => {
    try {
      await axios.post(endpointBackend.dataSource.create, source);
      await fetchDataSources(); // Call the memoized function
      handleCloseCreateDialog();
    } catch (error) {
      console.error('Error creating data source:', error);
    }
  };

  // Render the content based on the active tab
  const renderMainContent = () => {
    if (!selectedSource) {
      return (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            height: '100%',
            color: 'text.secondary',
            bgcolor: 'background.default',
          }}
        >
          <Typography variant="h6">Select a data source to start</Typography>
        </Stack>
      );
    }

    // Chat tab content
    if (tabValue === 0) {
      if (!selectedConversation) {
        return (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              height: '100%',
              color: 'text.secondary',
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Select or start a conversation
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={handleNewChat}
              sx={{ mt: 2 }}
            >
              New Chat
            </Button>
          </Stack>
        );
      }

      return (
        <ChatSection
          source={selectedSource}
          messages={messages[selectedConversation.id] || []}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onExportChat={handleExportChat}
          messageCount={messages[selectedConversation.id]?.length || 0}
          isLoading={isLoading}
        />
      );
    }

    // Management tab content
    if (tabValue === 1) {
      if (!isOwner) {
        return (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              height: '100%',
              color: 'text.secondary',
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="h6">
              You need to be the owner of this data source to manage it
            </Typography>
          </Stack>
        );
      }

      return (
        <DataSourceManagement
          dataSource={selectedSource}
          onUpdate={handleUpdateDataSource}
          onDelete={(sourceId) => {
            setDataSources((prev) => prev.filter((source) => source.name !== sourceId));
            setSelectedSource(null);
          }}
        />
      );
    }

    return null;
  };

  return (
    <RootStyle>
      {/* Primary Sidebar - Data Sources */}
      <PrimarySidebarStyle>
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

        <ScrollableContent>
          <Stack sx={{ p: 2.5 }} spacing={1}>
            {dataSources.map((source) => (
              <Button
                key={source.name}
                fullWidth
                variant={selectedSource?.name === source.name ? 'contained' : 'outlined'}
                onClick={() => handleSourceSelect(source)}
                sx={{
                  justifyContent: 'flex-start',
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  mb: 0.5,
                }}
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
        </ScrollableContent>
      </PrimarySidebarStyle>

      {/* Secondary Area - Tabs + Content */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%' }}>
        {/* Tabs for Chat/Management - placed above second sidebar */}
        {selectedSource && (
          <TabsContainerStyle>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="data source tabs"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Chat" />
              {isOwner && <Tab label="Manage Data Source" />}
            </Tabs>
          </TabsContainerStyle>
        )}

        <Box sx={{ display: 'flex', flexGrow: 1, height: 0, overflow: 'hidden' }}>
          {/* Secondary Sidebar - Conversations (only visible when Chat tab is active) */}
          {tabValue === 0 && (
            <SecondarySidebarStyle>
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
            </SecondarySidebarStyle>
          )}

          {/* Main Content Area */}
          <MainStyle>{renderMainContent()}</MainStyle>
        </Box>
      </Box>

      <DatabaseCreateDialog
        open={isCreateDialogOpen}
        onClose={handleCloseCreateDialog}
        onCreateSource={handleCreateDataSource}
      />
    </RootStyle>
  );
}
