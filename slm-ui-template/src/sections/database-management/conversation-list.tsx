import { useState } from 'react';
import { format } from 'date-fns';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import SearchNotFound from 'src/components/search-not-found';

// ----------------------------------------------------------------------

export type Conversation = {
  id: string;
  title: string;
  preview: string;
  createdAt: Date;
  unread?: boolean;
  queryCount?: number;
};

type Props = {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onNewChat: () => void;
};

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewChat,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderEmptyContent = () => {
    if (conversations.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <SearchNotFound />
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            No conversations yet. Start a new chat to begin.
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

  const renderConversationItem = (conversation: Conversation) => {
    const isSelected = selectedId === conversation.id;
    const formattedDate = format(conversation.createdAt, 'MMM d, h:mm a');

    return (
      <Tooltip
        key={conversation.id}
        title={format(conversation.createdAt, 'PPpp')}
        placement="left"
      >
        <Button
          fullWidth
          onClick={() => onSelect(conversation)}
          sx={{
            py: 2,
            px: 2.5,
            height: 'auto',
            alignItems: 'flex-start',
            textAlign: 'left',
            borderRadius: 1,
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
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  color: isSelected ? 'primary.main' : 'text.primary',
                  fontWeight: conversation.unread ? 700 : 400,
                  maxWidth: '70%',
                }}
              >
                {conversation.title}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formattedDate}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="body2"
                noWrap
                sx={{
                  color: isSelected ? 'primary.main' : 'text.secondary',
                  flexGrow: 1,
                }}
              >
                {conversation.preview}
              </Typography>

              {conversation.unread && (
                <Chip label="New" color="primary" size="small" sx={{ height: 20, fontSize: 12 }} />
              )}

              {conversation.queryCount && (
                <Chip
                  label={`${conversation.queryCount} ${
                    conversation.queryCount === 1 ? 'query' : 'queries'
                  }`}
                  size="small"
                  sx={{ height: 20, fontSize: 12 }}
                />
              )}
            </Stack>
          </Stack>
        </Button>
      </Tooltip>
    );
  };

  return (
    <Stack sx={{ height: '100%' }}>
      <Stack sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={onNewChat}
        >
          New Chat
        </Button>

        {conversations.length > 0 && (
          <TextField
            fullWidth
            size="small"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={20} height={20} />
                </InputAdornment>
              ),
            }}
            sx={{ mt: 2 }}
          />
        )}
      </Stack>

      <Scrollbar>
        {renderEmptyContent()}

        {filteredConversations.length > 0 && (
          <Stack spacing={1} sx={{ p: 2 }}>
            {filteredConversations.map(renderConversationItem)}
          </Stack>
        )}
      </Scrollbar>
    </Stack>
  );
}
