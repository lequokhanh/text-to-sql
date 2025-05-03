// File: src/sections/database-management/components/sidebars/ConversationSidebar.tsx

import { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';

import {
  Box,
  Chip,
  Stack,
  alpha,
  Button,
  styled,
  Tooltip,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';

import { ScrollableContent } from 'src/layouts/db-chat/database-layout';

import Iconify from 'src/components/iconify';
import SearchNotFound from 'src/components/search-not-found';

import { Conversation } from 'src/types/conversation';

const ConversationButton = styled(Button)(({ theme }) => ({
  justifyContent: 'flex-start',
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create(['background-color', 'box-shadow'], {
    duration: theme.transitions.duration.shorter,
  }),
  marginBottom: theme.spacing(1),
  textAlign: 'left',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: theme.customShadows?.z8,
  },
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onNewChat: () => void;
  onDelete?: (id: string) => void;
}

export function ConversationSidebar({
  conversations,
  selectedId,
  onSelect,
  onNewChat,
  onDelete,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // // Format date for conversation items
  // const formatConversationDate = (date: Date) => {
  //   if (isToday(date)) {
  //     return format(date, 'h:mm a');
  //   }
  //   if (isYesterday(date)) {
  //     return 'Yesterday';
  //   }
  //   return format(date, 'MMM d');
  // };

  const renderEmptyContent = () => {
    if (conversations.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Box
            sx={{
              height: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify
              icon="eva:message-square-outline"
              width={80}
              height={80}
              sx={{ color: 'text.disabled', opacity: 0.6 }}
            />
          </Box>
          <Typography variant="subtitle1" gutterBottom>
            No conversations yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Start a new chat to begin querying your database
          </Typography>
        </Box>
      );
    }

    if (filteredConversations.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <SearchNotFound query={searchQuery} />
        </Box>
      );
    }

    return null;
  };

  // Group conversations by date
  const groupedConversations = filteredConversations.reduce<Record<string, Conversation[]>>(
    (groups, conversation) => {
      const dateKey = format(conversation.createdAt, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(conversation);
      return groups;
    },
    {}
  );

  // Sort date keys in descending order
  const sortedDateKeys = Object.keys(groupedConversations).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <>
      <SidebarHeader>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={onNewChat}
          sx={{ mb: 2 }}
        >
          New Chat
        </Button>

        {conversations.length > 0 && (
          <TextField
            fullWidth
            size="small"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} height={18} color="text.disabled" />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 1.5,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
                },
              },
            }}
          />
        )}
      </SidebarHeader>

      <ScrollableContent>
        {renderEmptyContent()}

        {filteredConversations.length > 0 && (
          <Box sx={{ p: 2 }}>
            {sortedDateKeys.map((dateKey) => {
              const dateLabel = (() => {
                const date = new Date(dateKey);
                if (isToday(date)) return 'Today';
                if (isYesterday(date)) return 'Yesterday';
                return format(date, 'MMMM d, yyyy');
              })();

              return (
                <Box key={dateKey} sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      py: 0.5,
                      color: 'text.secondary',
                      fontWeight: 500,
                      display: 'block',
                    }}
                  >
                    {dateLabel}
                  </Typography>

                  {groupedConversations[dateKey].map((conversation) => {
                    const isSelected = selectedId === conversation.id;
                    const formattedTime = format(conversation.createdAt, 'h:mm a');

                    return (
                      <Tooltip
                        key={conversation.id}
                        title={format(conversation.createdAt, 'PPpp')}
                        placement="left"
                      >
                        <ConversationButton
                          fullWidth
                          onClick={() => onSelect(conversation)}
                          sx={{
                            borderRadius: 1.5,
                            bgcolor: (theme) =>
                              isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                            ...(isSelected && {
                              color: 'primary.main',
                            }),
                            '&:hover': {
                              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                            },
                          }}
                        >
                          <Stack spacing={1} width="100%">
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{ maxWidth: '70%' }}
                              >
                                <Iconify
                                  icon="eva:message-square-fill"
                                  width={16}
                                  height={16}
                                  color={isSelected ? 'primary.main' : 'text.disabled'}
                                />
                                <Typography
                                  variant="subtitle2"
                                  noWrap
                                  sx={{
                                    color: isSelected ? 'primary.main' : 'text.primary',
                                    fontWeight: conversation.unread ? 600 : 500,
                                  }}
                                >
                                  {conversation.title}
                                </Typography>
                              </Stack>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {formattedTime}
                              </Typography>
                            </Stack>

                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography
                                variant="body2"
                                noWrap
                                sx={{
                                  color: isSelected ? 'primary.main' : 'text.secondary',
                                  flexGrow: 1,
                                  opacity: 0.8,
                                }}
                              >
                                {conversation.preview}
                              </Typography>

                              {conversation.unread && (
                                <Chip
                                  label="New"
                                  color="primary"
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.625rem',
                                    fontWeight: 600,
                                  }}
                                />
                              )}

                              {conversation.queryCount && (
                                <Chip
                                  label={`${conversation.queryCount} ${
                                    conversation.queryCount === 1 ? 'query' : 'queries'
                                  }`}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.625rem',
                                    fontWeight: 500,
                                    backgroundColor: (theme) =>
                                      alpha(theme.palette.grey[500], 0.16),
                                    color: 'text.secondary',
                                  }}
                                />
                              )}
                            </Stack>
                          </Stack>
                        </ConversationButton>
                      </Tooltip>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        )}
      </ScrollableContent>
    </>
  );
}
