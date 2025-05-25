import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';

import {
  Box,
  List,
  Fade,
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
  onDeleteSession?: (sessionId: string) => void;
}

const SessionHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 2.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
  backdropFilter: 'blur(10px)',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.2)} 50%, transparent 100%)`,
  },
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 2.5),
  position: 'relative',
  background: alpha(theme.palette.background.default, 0.4),
}));

const StyledInput = styled(Input)(({ theme }) => ({
  height: 44,
  width: '100%',
  fontSize: '0.875rem',
  padding: theme.spacing(0.5, 2),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(8px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: theme.palette.background.paper,
    borderColor: alpha(theme.palette.primary.main, 0.2),
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 20px 0 ${alpha(theme.palette.common.black, 0.08)}`,
  },
  '&.Mui-focused': {
    backgroundColor: theme.palette.background.paper,
    borderColor: alpha(theme.palette.primary.main, 0.4),
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}, 0 4px 20px 0 ${alpha(theme.palette.common.black, 0.08)}`,
  },
  '& .MuiInput-input': {
    paddingTop: 0,
    paddingBottom: 0,
    '&::placeholder': {
      color: theme.palette.text.disabled,
      opacity: 0.8,
    },
  },
  '&::before, &::after': {
    display: 'none',
  },
}));

const SessionItem = styled(m.div)(({ theme }) => ({
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.standard,
  }),
  cursor: 'pointer',
  overflow: 'hidden',
  position: 'relative',
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  padding: theme.spacing(2, 2.5),
  gap: 1.5,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 'inherit',
    padding: '1px',
    background: 'linear-gradient(135deg, transparent 0%, transparent 100%)',
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'exclude',
    transition: 'background 0.3s ease',
  },
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  padding: theme.spacing(1, 2.5),
  fontWeight: 600,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&.Mui-disabled': {
    background: theme.palette.action.disabledBackground,
    boxShadow: 'none',
  },
}));

const PulseIcon = styled(Box)(({ theme }) => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: `2px solid ${theme.palette.primary.main}`,
    animation: 'pulse 2s infinite',
  },
  '@keyframes pulse': {
    '0%': {
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 1,
    },
    '100%': {
      transform: 'translate(-50%, -50%) scale(2)',
      opacity: 0,
    },
  },
}));

const getBackgroundColor = (theme: any, isActive: boolean, isHovered: boolean) => {
  if (isActive) {
    return alpha(theme.palette.primary.main, 0.08);
  }
  if (isHovered) {
    return alpha(theme.palette.action.hover, 0.8);
  }
  return 'transparent';
};

const getBackgroundGradient = (theme: any, isActive: boolean, isHovered: boolean) => {
  if (isActive) {
    return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`;
  }
  if (isHovered) {
    return `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)} 0%, ${alpha(theme.palette.primary.dark, 0.3)} 100%)`;
  }
  return 'transparent';
};

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
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '200px',
        background: (theme) => `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 100%)`,
        pointerEvents: 'none',
      },
    }}>
      <SessionHeader>
        <Box>
          <Typography 
            variant="h6" 
            fontWeight={700}
            sx={{ 
              background: (theme) => `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            Chat History
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary', 
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 500,
            }}
          >
            <Iconify icon="eva:message-circle-outline" width={14} />
            {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        
        <Tooltip title="Start a new conversation" placement="bottom">
          <AnimatedButton
            startIcon={<Iconify icon="eva:plus-circle-fill" width={20} />} 
            variant="contained" 
            size="small"
            onClick={onNewSession}
            disabled={!selectedSource || isLoading}
          >
            New Chat
          </AnimatedButton>
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
              <Iconify 
                icon="eva:search-fill" 
                width={20} 
                sx={{ 
                  color: 'text.disabled',
                  transition: 'all 0.2s',
                  ...(searchQuery && { color: 'primary.main' }),
                }} 
              />
            </InputAdornment>
          }
          endAdornment={
            <AnimatePresence>
              {searchQuery && (
                <m.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <InputAdornment position="end">
                    <IconButton 
                      edge="end" 
                      onClick={() => setSearchQuery('')}
                      size="small"
                      sx={{ 
                        p: 0.5,
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'rotate(90deg)',
                          color: 'error.main',
                        },
                      }}
                    >
                      <Iconify icon="eva:close-fill" width={18} />
                    </IconButton>
                  </InputAdornment>
                </m.div>
              )}
            </AnimatePresence>
          }
        />
      </SearchContainer>
      
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        pt: 1, 
        pb: 2,
        px: 0.5,
        '&::-webkit-scrollbar': {
          width: 6,
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: (theme) => alpha(theme.palette.text.disabled, 0.2),
          borderRadius: 3,
          '&:hover': {
            background: (theme) => alpha(theme.palette.text.disabled, 0.3),
          },
        },
      }}>
        {(() => {
          if (isLoading && sessions.length === 0) {
            return (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                flexDirection: 'column',
                gap: 2,
              }}>
                <CircularProgress 
                  size={36} 
                  thickness={3}
                  sx={{
                    color: 'primary.main',
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Loading conversations...
                </Typography>
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
              <Box sx={{ 
                p: 2, 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
              }}>
                <EmptyContent
                  title={emptyTitle}
                  description={emptyDescription}
                  sx={{ 
                    py: 4, 
                    '& img': { 
                      height: 140,
                      opacity: 0.6,
                    },
                    '& .MuiTypography-h5': {
                      fontWeight: 600,
                    },
                  }}
                />
              </Box>
            );
          }
          
          return (
            <AnimatePresence mode="sync">
              <List disablePadding>
                {filteredSessions.map((session, index) => {
                  const isActive = activeSession?.id === session.id;
                  const isSessionLoading = loadingSessionId === session.id;
                  const isHovered = hoveredSession === session.id;
                  
                  return (
                    <SessionItem 
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ 
                        duration: 0.3,
                        delay: index * 0.03,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      whileHover={{ scale: 0.98 }}
                      whileTap={{ scale: 0.95 }}
                      onMouseEnter={() => setHoveredSession(session.id)}
                      onMouseLeave={() => setHoveredSession(null)}
                      onClick={() => {
                        if (!isActive && !isSessionLoading) {
                          onSessionSelect(session);
                        }
                      }}
                    >
                      <StyledListItem
                        sx={{
                          backgroundColor: (theme) => getBackgroundColor(theme, isActive, isHovered),
                          '&::before': {
                            background: (theme) => getBackgroundGradient(theme, isActive, isHovered),
                          },
                          opacity: isSessionLoading && !isActive ? 0.6 : 1,
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
                            icon={isActive ? "eva:message-square-fill" : "eva:message-square-outline"}
                            width={22} 
                            height={22} 
                            sx={{ 
                              color: isActive ? 'primary.main' : 'text.secondary',
                              opacity: isActive ? 1 : 0.8,
                              transition: 'all 0.3s',
                            }}
                          />
                          {isActive && (
                            <Box
                              sx={{
                                position: 'absolute',
                                right: -3,
                                top: -3,
                              }}
                            >
                              <PulseIcon sx={{ bgcolor: 'primary.main' }} />
                            </Box>
                          )}
                        </Box>
                        
                        <ListItemText
                          primary={
                            <Typography 
                              variant="subtitle2" 
                              noWrap 
                              sx={{ 
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? 'primary.main' : 'text.primary',
                                transition: 'all 0.2s',
                                fontSize: '0.9rem',
                              }}
                            >
                              {session.title}
                            </Typography>
                          }
                        />
                        
                        <AnimatePresence>
                          {isSessionLoading && (
                            <m.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                            >
                              <CircularProgress 
                                size={18} 
                                thickness={3} 
                                sx={{ 
                                  mr: 0.5,
                                  color: 'primary.main',
                                }}
                              />
                            </m.div>
                          )}
                        </AnimatePresence>
                        
                        <AnimatePresence>
                          {isHovered && !isSessionLoading && !!onDeleteSession && (
                            <m.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            >
                              <Tooltip title="Delete conversation">
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => handleDelete(session.id, e)}
                                  sx={{ 
                                    width: 32,
                                    height: 32,
                                    color: 'text.secondary',
                                    transition: 'all 0.2s',
                                    '&:hover': { 
                                      color: 'error.main',
                                      bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                                      transform: 'scale(1.1)',
                                    },
                                  }}
                                >
                                  <Iconify icon="eva:trash-2-outline" width={18} height={18} />
                                </IconButton>
                              </Tooltip>
                            </m.div>
                          )}
                        </AnimatePresence>
                      </StyledListItem>
                    </SessionItem>
                  );
                })}
              </List>
            </AnimatePresence>
          );
        })()}
      </Box>
      
      <Divider sx={{ opacity: 0.08 }} />
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={cancelDelete}
        TransitionComponent={Fade}
        PaperProps={{
          sx: { 
            borderRadius: 3,
            minWidth: 320,
            background: (theme) => alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}>
          <Iconify icon="eva:alert-triangle-fill" width={24} sx={{ color: 'error.main' }} />
          Delete Conversation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this conversation? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3, gap: 1 }}>
          <Button 
            onClick={cancelDelete}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              borderColor: (theme) => alpha(theme.palette.divider, 0.2),
            }}
          >
            Cancel
          </Button>
          <AnimatedButton 
            onClick={confirmDelete} 
            color="error" 
            variant="contained" 
            autoFocus
            sx={{
              background: (theme) => `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
              boxShadow: (theme) => `0 4px 14px 0 ${alpha(theme.palette.error.main, 0.3)}`,
              '&:hover': {
                background: (theme) => `linear-gradient(135deg, ${theme.palette.error.light} 0%, ${theme.palette.error.main} 100%)`,
                boxShadow: (theme) => `0 6px 20px 0 ${alpha(theme.palette.error.main, 0.4)}`,
              },
            }}
          >
            Delete
          </AnimatedButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}