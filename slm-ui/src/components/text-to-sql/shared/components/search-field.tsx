import { forwardRef } from 'react';

import { InputAdornment, TextFieldProps } from '@mui/material';

import Iconify from 'src/components/iconify';

import { StyledTextField } from './styled-components';

interface SearchFieldProps extends Omit<TextFieldProps, 'variant'> {
  onClear?: () => void;
}

export const SearchField = forwardRef<HTMLDivElement, SearchFieldProps>(
  ({ onClear, value, ...other }, ref) => (
    <StyledTextField
      ref={ref}
      fullWidth
      placeholder="Search..."
      value={value}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Iconify 
              icon="eva:search-fill" 
              width={20} 
              height={20}
              sx={{ color: 'text.secondary' }}
            />
          </InputAdornment>
        ),
        endAdornment: (value && onClear) ? (
          <InputAdornment position="end">
            <Iconify 
              icon="eva:close-fill" 
              width={20} 
              height={20}
              sx={{ 
                color: 'text.secondary',
                cursor: 'pointer',
                '&:hover': {
                  color: 'text.primary',
                },
              }}
              onClick={onClear}
            />
          </InputAdornment>
        ) : undefined,
      }}
      {...other}
    />
  )
);