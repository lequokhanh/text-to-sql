import { useState } from 'react';

import { Box, Fade, Stack, alpha, Paper, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

export function NoSourceSelected() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Fade in timeout={800}>
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          p: 3,
        }}
      >
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={2}
          sx={{
            maxWidth: 560,
            textAlign: 'center',
            py: 5,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              mb: 2,
              p: 3,
              borderRadius: '50%',
              transition: 'all 0.3s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              bgcolor: (theme) => alpha(theme.palette.primary.lighter, 0.3),
              border: (theme) => `2px dashed ${theme.palette.primary.main}`,
              boxShadow: (theme) => isHovered ? `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}` : 'none',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Iconify
              icon="material-symbols-light:database-outline"
              width={72}
              height={72}
              sx={{ 
                color: 'primary.main',
                animation: isHovered ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 0.7 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.7 },
                },
              }}
            />
          </Box>
          
          <Typography variant="h4" color="text.primary" gutterBottom fontWeight="600">
            No Data Source Selected
          </Typography>
          
          <Typography
            variant="body1"
            sx={{ 
              color: 'text.secondary',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              mb: 2,
              maxWidth: 480
            }}
          >
            Please select a data source from the first sidebar to begin working with your database queries.
          </Typography>
          
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mt: 2,
              p: 2.5,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.info.lighter, 0.2),
              border: (theme) => `1px dashed ${theme.palette.info.main}`,
              maxWidth: 480,
            }}
          >
            <Iconify
              icon="eva:info-outline"
              width={24}
              height={24}
              sx={{ color: 'info.main', mr: 2, flexShrink: 0 }}
            />
            <Typography variant="body2" color="info.dark">
              {`A data source connection is required to run queries. Your available data sources are listed in the first sidebar. If you don't see any sources, please create a new one or contact your administrator.`}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Fade>
  );
}