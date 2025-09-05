import { ReactNode } from 'react';

import { Box, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { IconContainer, EmptyStateContainer } from './styled-components';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  iconColor?: string;
}

export function EmptyState({ 
  icon = 'eva:file-text-outline', 
  title, 
  description, 
  action,
  iconColor = 'primary.main' 
}: EmptyStateProps) {
  return (
    <EmptyStateContainer>
      <IconContainer>
        <Iconify 
          icon={icon} 
          width={32} 
          height={32} 
          sx={{ 
            color: iconColor,
            opacity: 0.8,
          }} 
        />
      </IconContainer>
      <Typography 
        variant="subtitle1" 
        sx={{ 
          mb: 1,
          color: 'text.primary',
          fontWeight: 700,
          letterSpacing: '-0.5px',
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            mb: 3,
            opacity: 0.8,
          }}
        >
          {description}
        </Typography>
      )}
      {action && (
        <Box sx={{ mt: 2 }}>
          {action}
        </Box>
      )}
    </EmptyStateContainer>
  );
}