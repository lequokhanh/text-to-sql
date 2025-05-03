import { Box, Stack, Typography, alpha, Paper, Fade } from '@mui/material';
import { useState } from 'react';
import Iconify from 'src/components/iconify';

export function SelectDataSource() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Fade in timeout={700}>
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          p: 2.5,
        }}
      >
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={2}
          sx={{
            maxWidth: 440,
            textAlign: 'center',
            py: 3,
          }}
        >
          <Box
            sx={{
              mb: 2,
              p: 2,
              borderRadius: '50%',
              transition: 'all 0.25s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              bgcolor: (theme) => alpha(theme.palette.info.lighter, 0.3),
              border: (theme) => `1px dashed ${theme.palette.info.main}`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Iconify
              icon="eva:info-outline"
              width={48}
              height={48}
              sx={{ 
                color: 'info.main',
                transition: 'all 0.25s ease',
                opacity: isHovered ? 1 : 0.8,
              }}
            />
          </Box>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'text.primary', 
              fontWeight: 600,
              mb: 1,
            }}
          >
            No Conversations to Display
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary', 
              textAlign: 'center',
              lineHeight: 1.6,
              mb: 1,
            }}
          >
            Please select a data source from the sidebar to view its associated conversations.
          </Typography>
          
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mt: 1,
              px: 2,
              py: 1.5,
              borderRadius: 1.5,
              bgcolor: (theme) => alpha(theme.palette.background.neutral, 0.6),
              border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              maxWidth: 360,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
                p: 0.75,
                borderRadius: '50%',
                bgcolor: (theme) => alpha(theme.palette.primary.lighter, 0.3),
              }}
            >
              <Iconify
                icon="eva:arrow-ios-back-fill"
                width={18}
                height={18}
                sx={{ color: 'primary.main' }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Select a data source to get started
            </Typography>
          </Box>
          
        </Stack>
      </Paper>
    </Fade>
  );
}