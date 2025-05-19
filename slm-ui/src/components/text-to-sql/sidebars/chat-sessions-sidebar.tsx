import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';

import {
  Box,
  List,
  Fade,
  Chip,
  alpha,
  Input,
  Button,
  styled,
  Dialog,
  Divider,
  Tooltip,
  ListItem,
  IconButton,
  Typography,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
  InputAdornment,
  CircularProgress,
  DialogContentText,
} from '@mui/material';

import { ChatSession } from 'src/hooks/use-chat-sessions';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';

import { DatabaseSource } from 'src/types/database';

interface ChatSessionsSidebarProps {
  selectedSource: DatabaseSource | null;
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  onSessionSelect: (session: ChatSession) => void;
  onNewSession: () => void;
  isLoading: boolean;
  loadingSessionId: string | null;
  onDeleteSession?: (sessionId: string) => void; // Add delete handler
}

const SessionHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  position: 'relative',
}));

const StyledInput = styled(Input)(({ theme }) => ({
  height: 40,
  width: '100%',
  fontSize: '0.875rem',
  padding: theme.spacing(0.5, 1.5),
  borderRadius: theme.shape.borderRadius * 1.5,
  backgroundColor: alpha(theme.palette.grey[500], 0.08),
  transition: 'all 0.2s ease-in-out',
  '&:hover, &.Mui-focused': {
    backgroundColor: alpha(theme.palette.grey[500], 0.12),
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
  },
  '& .MuiInput-input': {
    paddingTop: 0,
    paddingBottom: 0,
  },
  '&::before, &::after': {
    display: 'none',
  },
}));

const SessionItem = styled(m.div)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  margin: theme.spacing(0.5, 1),
  transition: theme.transitions.create(['background-color', 'transform'], {
    duration: theme.transitions.duration.shorter,
  }),
  cursor: 'pointer',
  overflow: 'hidden',
}));

export function ChatSessionsSidebar({
  selectedSource,
  sessions,
  activeSession,
  onSessionSelect,
  onNewSession,
  isLoading,
  loadingSessionId,
  onDeleteSession,
}: ChatSessionsSidebarProps) {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    // Check if date is today
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
  
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  
    // Check if date is yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
                        date.getMonth() === yesterday.getMonth() &&
                        date.getFullYear() === yesterday.getFullYear();
  
    if (isYesterday) {
      return 'Yesterday';
    }
  
    // For older dates
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
    });
  };

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (sessionToDelete && onDeleteSession) {
      onDeleteSession(sessionToDelete);
    }
    setDeleteConfirmOpen(false);
    setSessionToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setSessionToDelete(null);
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      borderLeft: '1px solid',
      borderColor: 'divider',
    }}>
      <SessionHeader>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Chat History
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
            {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        
        <Tooltip title="Start a new conversation">
          <Button 
            startIcon={<Iconify icon="eva:plus-circle-fill" />} 
            variant="contained" 
            size="small"
            onClick={onNewSession}
            disabled={!selectedSource || isLoading}
            sx={{ 
              borderRadius: 1.5,
              textTransform: 'none',
              px: 2,
              boxShadow: (theme) => theme.customShadows?.primary,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: (theme) => `0 8px 16px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              }
            }}
          >
            New Chat
          </Button>
        </Tooltip>
      </SessionHeader>

      <SearchContainer>
        <StyledInput
          disableUnderline
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          }
          endAdornment={
            searchQuery && (
              <InputAdornment position="end">
                <IconButton 
                  edge="end" 
                  onClick={() => setSearchQuery('')}
                  size="small"
                  sx={{ p: 0.5 }}
                >
                  <Iconify icon="eva:close-fill" width={18} sx={{ color: 'text.disabled' }} />
                </IconButton>
              </InputAdornment>
            )
          }
        />
      </SearchContainer>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', pt: 1, pb: 1 }}>
        {(() => {
          if (isLoading && sessions.length === 0) {
            return (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={32} thickness={3} />
              </Box>
            );
          }
          
          if (filteredSessions.length === 0) {
            let emptyTitle = "No conversations yet";
            let emptyDescription = "Start a new chat to begin asking questions";
            
            if (searchQuery) {
              emptyTitle = "No matches found";
              emptyDescription = "Try different keywords or clear your search";
            }
            
            return (
              <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmptyContent
                  title={emptyTitle}
                  description={emptyDescription}
                  imgUrl="/assets/illustrations/illustration_empty_content.svg"
                  sx={{ 
                    py: 3, 
                    '& img': { height: 120 }
                  }}
                />
              </Box>
            );
          }
          
          return (
            <AnimatePresence initial={false}>
              <List disablePadding>
                {filteredSessions.map((session) => {
                  const isActive = activeSession?.id === session.id;
                  const isSessionLoading = loadingSessionId === session.id;
                  const isHovered = hoveredSession === session.id;
                  
                  return (
                    <SessionItem 
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      whileHover={{ scale: 0.99 }}
                      onMouseEnter={() => setHoveredSession(session.id)}
                      onMouseLeave={() => setHoveredSession(null)}
                      onClick={() => {
                        if (!isActive && !isSessionLoading) {
                          onSessionSelect(session);
                        }
                      }}
                    >
                      <ListItem
                        sx={{
                          borderRadius: 3,
                          p: 1.5,
                          gap: 1,
                          backgroundColor: isActive 
                            ? (theme) => alpha(theme.palette.primary.main, 0.1)
                            : 'transparent',
                          border: isActive 
                            ? (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                            : '1px solid transparent',
                          '&:hover': {
                            backgroundColor: isActive 
                              ? (theme) => alpha(theme.palette.primary.main, 0.12)
                              : (theme) => alpha(theme.palette.primary.main, 0.05),
                          },
                          opacity: isSessionLoading && !isActive ? 0.7 : 1,
                          pointerEvents: isSessionLoading && !isActive ? 'none' : 'auto',
                        }}
                      >
                        <Box sx={{ 
                          mr: 1.5,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Iconify 
                            icon="eva:message-square-outline" 
                            width={20} 
                            height={20} 
                            sx={{ 
                              color: isActive ? 'primary.main' : 'text.secondary',
                              opacity: isActive ? 1 : 0.7
                            }}
                          />
                          {isActive && (
                            <Box
                              component={m.div}
                              animate={{
                                scale: [1, 1.1, 1],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: 'loop',
                              }}
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                position: 'absolute',
                                right: -2,
                                top: -2,
                              }}
                            />
                          )}
                        </Box>
                        
                        <ListItemText
                          primary={
                            <Typography 
                              variant="subtitle2" 
                              noWrap 
                              sx={{ 
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? 'primary.main' : 'text.primary'
                              }}
                            >
                              {session.title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                              {session.messageCount > 0 && (
                                <Chip
                                  label={`${Math.ceil(session.messageCount / 2)}`}
                                  size="small"
                                  color={isActive ? 'primary' : 'default'}
                                  variant={isActive ? 'filled' : 'outlined'}
                                  sx={{ 
                                    height: 18, 
                                    fontSize: '0.65rem', 
                                    '& .MuiChip-label': { 
                                      px: 0.8,
                                      py: 0.1
                                    }
                                  }}
                                />
                              )}
                              <Typography 
                                variant="caption" 
                                noWrap 
                                sx={{ 
                                  color: isActive ? 'primary.light' : 'text.secondary',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {formatDate(session.lastActivity)}
                              </Typography>
                            </Box>
                          }
                        />
                        
                        <Fade in={isSessionLoading}>
                          <CircularProgress size={16} thickness={4} sx={{ mr: 0.5 }} />
                        </Fade>
                        
                        <Fade in={isHovered && !isSessionLoading && !!onDeleteSession}>
                          <Tooltip title="Delete conversation">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={(e) => handleDelete(session.id, e)}
                              sx={{ 
                                width: 28,
                                height: 28,
                                opacity: 0.7,
                                '&:hover': { 
                                  opacity: 1,
                                  transform: 'scale(1.1)'
                                },
                              }}
                            >
                              <Iconify icon="eva:trash-2-outline" width={16} height={16} />
                            </IconButton>
                          </Tooltip>
                        </Fade>
                      </ListItem>
                    </SessionItem>
                  );
                })}
              </List>
            </AnimatePresence>
          );
        })()}
      </Box>
      
      <Divider />
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={cancelDelete}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>Delete Conversation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this conversation? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}