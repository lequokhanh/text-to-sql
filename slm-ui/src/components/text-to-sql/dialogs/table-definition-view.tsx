import { m, AnimatePresence } from 'framer-motion';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

// MUI Icons (consolidated imports)
import {
  Key as KeyIcon,
  Link as LinkIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  AddLink as AddLinkIcon,
  AutoFixHigh as AutoFixHighIcon,
  InfoOutlined as InfoOutlinedIcon,
  EditOutlined as EditOutlinedIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';
// MUI Core components
import {
  Box, Card, Chip, Grid,
  alpha, Badge, Paper, Stack, Table, styled, Button,
  Dialog, Select, Divider, Tooltip, useTheme, Collapse,
  TableRow, MenuItem, keyframes, InputBase, TableBody,
  TableCell, TableHead, TextField, CardHeader,
  IconButton, Typography, InputLabel, DialogTitle,
  ButtonGroup, FormControl, DialogActions, DialogContent,
  useMediaQuery, TableContainer, 
  CircularProgress, DialogContentText
} from '@mui/material';

import { useDebounce } from 'src/hooks/use-debounce';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

import { 
  ColumnRelation, 
  TableDefinition, 
  UpdateColumnDTO,
  ColumnDefinition,
  CreateRelationDTO
} from 'src/types/database';

import { SchemaVisualization } from './schema-visualization';

// Define relation type constants
type RelationType = 'OTO' | 'OTM' | 'MTO';

// Define outgoing relation interface for manage datasource
interface OutgoingRelation {
  id: number;
  toColumn: {
    id: number;
    columnIdentifier: string;
    columnType: string;
    columnDescription: string;
    isPrimaryKey: boolean;
  };
  type: RelationType;
}

// Helper function to find table and column by column ID - keep this outside since it's pure
const findTableAndColumnById = (tables: TableDefinition[], columnId: number): { tableIdentifier: string; columnIdentifier: string } | null => {
  const foundTable = tables.find(table => 
    table.columns.some(col => col.id === columnId)
  );

  if (foundTable) {
    const foundColumn = foundTable.columns.find(col => col.id === columnId);
    if (foundColumn) {
      return {
        tableIdentifier: foundTable.tableIdentifier,
        columnIdentifier: foundColumn.columnIdentifier
      };
    }
  }
  return null;
};

// Styled components
interface StyledCardProps {
  selected?: boolean;
}

// Styled Card with optimized theming logic
const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'selected',
})<StyledCardProps>(({ theme, selected }) => {
  const isDark = theme.palette.mode === 'dark';

  // Consolidated shadow variables
  const baseBoxShadow = isDark
    ? `0 8px 16px -8px ${alpha(theme.palette.common.black, 0.3)}, 0 4px 8px -4px ${alpha(theme.palette.common.black, 0.2)}`
    : `0 8px 16px -8px ${alpha(theme.palette.common.black, 0.1)}, 0 4px 8px -4px ${alpha(theme.palette.common.black, 0.06)}`;

  const selectedBoxShadow = isDark
    ? `0 0 0 4px ${alpha(theme.palette.primary.dark, 0.3)}, 0 8px 24px -4px ${alpha(theme.palette.primary.dark, 0.5)}`
    : `0 0 0 4px ${alpha(theme.palette.primary.light, 0.2)}, 0 8px 24px -4px ${alpha(theme.palette.primary.light, 0.4)}`;

  let hoverBoxShadow = '';

  if (selected) {
    if (isDark) {
      hoverBoxShadow = `0 0 0 4px ${alpha(theme.palette.primary.dark, 0.4)}, 0 12px 32px -4px ${alpha(theme.palette.primary.dark, 0.6)}`;
    } else {
      hoverBoxShadow = `0 0 0 4px ${alpha(theme.palette.primary.light, 0.3)}, 0 12px 32px -4px ${alpha(theme.palette.primary.light, 0.5)}`;
    }
  } else if (isDark) {
    hoverBoxShadow = `0 12px 24px -8px ${alpha(theme.palette.common.black, 0.5)}, 0 8px 16px -4px ${alpha(theme.palette.common.black, 0.4)}`;
  } else {
    hoverBoxShadow = `0 12px 24px -8px ${alpha(theme.palette.common.black, 0.15)}, 0 8px 16px -4px ${alpha(theme.palette.common.black, 0.1)}`;
  }

  const background = isDark ? alpha(theme.palette.background.paper, 0.7) : theme.palette.background.paper;

  return {
    transition: 'all 0.3s ease',
    marginBottom: theme.spacing(2),
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    background,
    backdropFilter: 'blur(8px)',
    boxShadow: selected ? selectedBoxShadow : baseBoxShadow,
    '&:hover': {
      boxShadow: hoverBoxShadow,
      transform: 'translateY(-3px)',
    },
    ...(selected && {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
      borderStyle: 'solid',
    }),
  };
});

// Table container with improved styling
const StyledTableContainer = styled(TableContainer)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark';

  return {
    borderRadius: 16,
    overflow: 'hidden',
    border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.3 : 0.7)}`,
    boxShadow: isDark
      ? `0 4px 12px -2px ${alpha(theme.palette.common.black, 0.3)}`
      : `0 4px 12px -2px ${alpha(theme.palette.common.black, 0.05)}`,
    backdropFilter: 'blur(4px)',

    '& .MuiTableCell-root': {
      borderColor: alpha(theme.palette.divider, isDark ? 0.2 : 0.5),
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
      transition: 'background-color 0.2s ease, color 0.2s ease',
    },

    '& .MuiTableCell-head': {
      fontSize: '0.8rem',
      fontWeight: 600,
      backgroundColor: isDark
        ? alpha(theme.palette.background.paper, 0.7)
        : alpha(theme.palette.grey[50], 0.9),
      color: isDark
        ? alpha(theme.palette.common.white, 0.85)
        : theme.palette.grey[800],
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
      paddingTop: 12,
      paddingBottom: 12,
    },

    '& .MuiTableCell-body': {
      fontSize: '0.875rem',
      color: isDark
        ? alpha(theme.palette.common.white, 0.75)
        : theme.palette.grey[700],
    },

    '& .MuiTableRow-root:nth-of-type(even)': {
      backgroundColor: isDark
        ? alpha(theme.palette.common.black, 0.15)
        : alpha(theme.palette.grey[50], 0.5),
    },

    width: '100%',
    maxWidth: '100%',

    '@media (min-width: 960px)': {
      maxWidth: 820,
    },

    '@media (min-width: 1200px)': {
      maxWidth: 920,
    },

    margin: '0 auto',

    '& .column-name': {
      width: '25%',
      minWidth: 120,
      maxWidth: 200,
    },

    '& .column-type': {
      width: '15%',
      minWidth: 80,
      maxWidth: 120,
    },

    '& .column-description': {
      width: '35%',
      minWidth: 180,
      maxWidth: 300,
    },

    '& .column-relations': {
      width: '25%',
      minWidth: 150,
      maxWidth: 250,
      position: 'relative',
    },
  };
});

// Search input with improved styling
const StyledSearchInput = styled(InputBase)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark';

  return {
    borderRadius: 16,
    backgroundColor: isDark
      ? alpha(theme.palette.common.white, 0.06)
      : alpha(theme.palette.common.black, 0.03),
    padding: theme.spacing(0.75, 2),
    width: '100%',
    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.08)
        : alpha(theme.palette.common.black, 0.05),
      borderColor: alpha(theme.palette.primary.main, 0.3),
    },
    '&.Mui-focused': {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.1)
        : alpha(theme.palette.common.black, 0.06),
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  };
});

// Edit actions container with improved styling
const EditActionsContainer = styled(Box)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark';

  return {
    position: 'absolute',
    bottom: theme.spacing(0.5),
    right: theme.spacing(0.5),
    display: 'flex',
    gap: theme.spacing(0.25),
    padding: theme.spacing(0.5),
    zIndex: 10,
    backgroundColor: theme.palette.background.paper,
    borderRadius: 12,
    boxShadow: isDark
      ? `0 4px 8px ${alpha(theme.palette.common.black, 0.3)}`
      : `0 4px 8px ${alpha(theme.palette.common.black, 0.15)}`,
    border: `1px solid ${isDark
      ? alpha(theme.palette.common.white, 0.1)
      : alpha(theme.palette.grey[300], 0.7)}`,
    backdropFilter: 'blur(4px)',
    fontSize: '0.65rem',
    lineHeight: 1,
    minHeight: 'auto',
    opacity: 0.2,
    transform: 'scale(0.6)',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      opacity: 1,
      transform: 'scale(1)',
    },
    '& .MuiIconButton-root': {
      borderRadius: 12,
      transition: 'transform 0.2s ease',
      '&:hover': {
        transform: 'scale(1.1)',
      }
    }
  };
});

// Row action buttons with improved styling
const RowActionButtons = styled(Box)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark';

  // Consolidated color variables
  const backgroundColor = isDark
    ? alpha(theme.palette.grey[900], 0.85)
    : alpha(theme.palette.background.paper, 0.95);

  const borderColor = isDark
    ? alpha(theme.palette.common.white, 0.1)
    : alpha(theme.palette.grey[300], 0.7);

  const boxShadow = isDark
    ? `0 4px 8px ${alpha(theme.palette.common.black, 0.5)}, 0 2px 4px ${alpha(theme.palette.common.black, 0.3)}`
    : `0 4px 8px ${alpha(theme.palette.common.black, 0.1)}, 0 2px 4px ${alpha(theme.palette.common.black, 0.05)}`;

  return {
    position: 'absolute',
    bottom: '50%',
    right: theme.spacing(0.5),
    transform: 'translateY(50%) scale(0.8)',
    display: 'flex',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.5),
    zIndex: 5,
    backgroundColor,
    backdropFilter: 'blur(8px)',
    border: `1px solid ${borderColor}`,
    borderRadius: 8,
    boxShadow,
    opacity: 0,
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',

    '.MuiTableRow-root:hover &': {
      opacity: 1,
      transform: 'translateY(50%) scale(1) translateX(0)',
    },

    '& .MuiIconButton-root': {
      transition: 'all 0.2s ease',
      margin: '0 2px',
      borderRadius: 8,

      '&.MuiIconButton-colorPrimary': {
        backgroundColor: isDark
          ? alpha(theme.palette.primary.dark, 0.2)
          : alpha(theme.palette.primary.light, 0.15),
        '&:hover': {
          backgroundColor: isDark
            ? alpha(theme.palette.primary.dark, 0.3)
            : alpha(theme.palette.primary.light, 0.25),
        }
      },

      '&.MuiIconButton-colorInfo': {
        backgroundColor: isDark
          ? alpha(theme.palette.info.dark, 0.2)
          : alpha(theme.palette.info.light, 0.15),
        '&:hover': {
          backgroundColor: isDark
            ? alpha(theme.palette.info.dark, 0.3)
            : alpha(theme.palette.info.light, 0.25),
        }
      },

      '&.MuiIconButton-colorError': {
        backgroundColor: isDark
          ? alpha(theme.palette.error.dark, 0.2)
          : alpha(theme.palette.error.light, 0.15),
        '&:hover': {
          backgroundColor: isDark
            ? alpha(theme.palette.error.dark, 0.3)
            : alpha(theme.palette.error.light, 0.25),
        }
      },

      '&:hover': {
        transform: 'scale(1.1)',
      }
    },
  };
});

// FadeIn transition component
const FadeInTransition = styled(m.div)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
}));

// Relation chip with improved styling
const StyledRelationChip = styled(Chip)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark';

  // Consolidated color variables
  const backgroundColor = isDark
    ? alpha(theme.palette.info.dark, 0.15)
    : alpha(theme.palette.info.light, 0.12);

  const textColor = isDark
    ? alpha(theme.palette.info.light, 0.9)
    : theme.palette.info.dark;

  const borderColor = isDark
    ? alpha(theme.palette.info.dark, 0.3)
    : alpha(theme.palette.info.light, 0.3);

  const hoverBackgroundColor = isDark
    ? alpha(theme.palette.info.dark, 0.25)
    : alpha(theme.palette.info.light, 0.25);

  const shadowColor = alpha(theme.palette.common.black, isDark ? 0.25 : 0.07);
  const hoverShadowColor = alpha(theme.palette.common.black, isDark ? 0.3 : 0.1);

  const iconColor = isDark
    ? alpha(theme.palette.info.light, 0.8)
    : theme.palette.info.dark;

  const deleteIconColor = isDark
    ? alpha(theme.palette.error.light, 0.7)
    : theme.palette.error.dark;

  const deleteIconHoverColor = isDark
    ? theme.palette.error.light
    : theme.palette.error.main;

  return {
    height: 'auto',
    fontSize: '0.75rem',
    marginRight: 4,
    marginTop: 2,
    marginBottom: 2,
    backgroundColor,
    color: textColor,
    borderRadius: 12,
    whiteSpace: 'normal',
    transition: 'all 0.2s ease',
    border: `1px solid ${borderColor}`,
    backdropFilter: 'blur(4px)',
    boxShadow: `0 2px 4px ${shadowColor}`,
    '&:hover': {
      backgroundColor: hoverBackgroundColor,
      transform: 'translateY(-1px)',
      boxShadow: `0 4px 8px ${hoverShadowColor}`,
    },
    '& .MuiChip-label': {
      paddingLeft: 6,
      paddingRight: 6,
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      lineHeight: 1.3,
      fontWeight: 500,
    },
    '& .MuiChip-icon': {
      color: iconColor,
    },
    '& .MuiChip-deleteIcon': {
      color: deleteIconColor,
      borderRadius: 12,
      '&:hover': {
        color: deleteIconHoverColor,
        backgroundColor: isDark
          ? alpha(theme.palette.error.dark, 0.2)
          : alpha(theme.palette.error.light, 0.2),
      },
    },
  };
});

// Column type chip with improved styling
const StyledColumnTypeChip = styled(Chip)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark';

  // Consolidated color variables
  const backgroundColor = isDark
    ? alpha(theme.palette.grey[800], 0.7)
    : alpha(theme.palette.grey[100], 0.9);

  const textColor = isDark
    ? alpha(theme.palette.common.white, 0.85)
    : theme.palette.grey[700];

  const borderColor = isDark
    ? alpha(theme.palette.grey[700], 0.5)
    : alpha(theme.palette.grey[300], 0.8);

  const innerShadow = isDark
    ? `inset 0 1px 1px ${alpha(theme.palette.common.white, 0.05)}`
    : `inset 0 1px 1px ${alpha(theme.palette.common.white, 0.9)}`;

  const hoverBackground = isDark
    ? alpha(theme.palette.grey[700], 0.8)
    : alpha(theme.palette.grey[200], 0.9);

  return {
    height: 22,
    fontSize: '0.7rem',
    fontWeight: 500,
    backgroundColor,
    color: textColor,
    borderRadius: 12,
    border: `1px solid ${borderColor}`,
    transition: 'all 0.2s ease',
    boxShadow: innerShadow,
    '& .MuiChip-label': {
      paddingLeft: 6,
      paddingRight: 6,
      lineHeight: 1.2,
      letterSpacing: '0.01em',
    },
    '&:hover': {
      backgroundColor: hoverBackground,
      transform: 'translateY(-1px)',
    },
  };
});

// Badge with improved styling
const StyledBadge = styled(Badge)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark';

  return {
    '& .MuiBadge-badge': {
      right: -10,
      top: 8,
      border: `2px solid ${theme.palette.background.paper}`,
      padding: '0 4px',
      borderRadius: 12,
      fontSize: '0.7rem',
      minWidth: 18,
      height: 18,
      boxShadow: isDark
        ? `0 0 0 1px ${alpha(theme.palette.common.black, 0.3)}`
        : `0 0 0 1px ${alpha(theme.palette.common.white, 0.3)}`,
    },
  };
});

// Icon styling
const StyledPrimaryKeyIcon = styled(KeyIcon)(({ theme }) => ({
  fontSize: 16,
  color: theme.palette.warning.main,
  verticalAlign: 'middle',
  marginRight: theme.spacing(0.5),
}));

const StyledRelationIcon = styled(LinkIcon)(({ theme }) => ({
  fontSize: 14,
  color: theme.palette.info.main,
  verticalAlign: 'middle',
  marginRight: theme.spacing(0.5),
}));

// Motion table row
const MotionTableRow = m(TableRow);

// Relations container
const RelationsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'nowrap',
  gap: theme.spacing(0.5),
  overflowX: 'auto',
  padding: theme.spacing(0.5, 0),
  scrollbarWidth: 'thin',
  '&::-webkit-scrollbar': {
    height: 4,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: alpha(theme.palette.common.black, 0.05),
    borderRadius: 3,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.primary.main, 0.3),
    borderRadius: 3,
  },
}));

// Description text field
const DescriptionTextField = styled(TextField)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark';

  return {
    '& .MuiInputBase-root': {
      minHeight: 48,
      alignItems: 'start',
      borderRadius: 16,
    },
    '& .MuiInputBase-inputMultiline': {
      padding: theme.spacing(1),
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: 16,
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: isDark
          ? alpha(theme.palette.primary.light, 0.5)
          : alpha(theme.palette.primary.main, 0.5),
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
      }
    }
  };
});

// Pulse animation for AI button
const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 var(--pulse-color-start);
  }
  50% {
    box-shadow: 0 0 0 12px var(--pulse-color-mid);
  }
  100% {
    box-shadow: 0 0 0 0 var(--pulse-color-end);
  }
`;

// AI Button wrapper
interface AIButtonWrapperProps {
  isAnimating: boolean;
}

const AIButtonWrapper = styled('div')<AIButtonWrapperProps>(({ theme, isAnimating }) => {
  const isDark = theme.palette.mode === 'dark';

  return {
    position: 'relative',
    display: 'inline-flex',
    borderRadius: 12,
    '--pulse-color-start': isDark
      ? alpha(theme.palette.primary.dark, 0.7)
      : alpha(theme.palette.primary.main, 0.7),
    '--pulse-color-mid': isDark
      ? alpha(theme.palette.primary.dark, 0)
      : alpha(theme.palette.primary.main, 0),
    '--pulse-color-end': isDark
      ? alpha(theme.palette.primary.dark, 0)
      : alpha(theme.palette.primary.main, 0),
    ...(isAnimating && {
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 12,
        animation: `${pulseAnimation} 1.8s infinite cubic-bezier(0.45, 0.05, 0.55, 0.95)`,
      }
    })
  };
});

// AI Fill Button
const AIFillButton = styled(Button)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark';

  // Enhanced gradient variables for more vibrant look
  const background = isDark
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${theme.palette.primary.main} 50%, ${alpha(theme.palette.primary.dark, 0.85)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${theme.palette.primary.dark} 50%, ${alpha(theme.palette.primary.main, 0.85)} 100%)`;

  const hoverBackground = isDark
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.95)} 0%, ${theme.palette.primary.main} 60%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`
    : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 60%, ${theme.palette.primary.main} 100%)`;

  // Enhanced shadow variables
  const boxShadow = isDark
    ? `0 4px 12px ${alpha(theme.palette.primary.dark, 0.5)}, 0 2px 4px ${alpha(theme.palette.common.black, 0.3)}, 0 0 0 1px ${alpha(theme.palette.primary.dark, 0.3)}`
    : `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}, 0 2px 4px ${alpha(theme.palette.common.black, 0.1)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`;

  const hoverBoxShadow = isDark
    ? `0 6px 16px ${alpha(theme.palette.primary.dark, 0.6)}, 0 3px 6px ${alpha(theme.palette.common.black, 0.4)}, 0 0 0 1px ${alpha(theme.palette.primary.dark, 0.4)}`
    : `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}, 0 3px 6px ${alpha(theme.palette.common.black, 0.15)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}`;

  const activeBoxShadow = isDark
    ? `0 2px 8px ${alpha(theme.palette.primary.dark, 0.4)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.3)}`
    : `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.08)}`;

  // Enhanced border and disabled styles
  const border = 'none';

  const disabledBackground = isDark
    ? `linear-gradient(135deg, ${alpha(theme.palette.grey[800], 0.7)} 0%, ${alpha(theme.palette.grey[700], 0.7)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.grey[300], 0.8)} 0%, ${alpha(theme.palette.grey[400], 0.8)} 100%)`;

  const disabledColor = isDark
    ? theme.palette.grey[500]
    : theme.palette.grey[400];

  const disabledBorder = isDark
    ? `1px solid ${alpha(theme.palette.common.white, 0.05)}`
    : `1px solid ${alpha(theme.palette.common.black, 0.05)}`;

  return {
    color: theme.palette.common.white,
    padding: theme.spacing(0.75, 2),
    height: 40,
    fontSize: '0.8125rem',
    fontWeight: 600,
    textTransform: 'none',
    whiteSpace: 'nowrap',
    letterSpacing: '0.03em',
    borderRadius: 20,
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    overflow: 'hidden',
    background,
    backdropFilter: 'blur(10px)',
    boxShadow,
    border,

    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: `linear-gradient(to right, ${alpha(theme.palette.common.white, 0)} 0%, ${alpha(theme.palette.common.white, 0.2)} 50%, ${alpha(theme.palette.common.white, 0)} 100%)`,
      transform: 'skewX(-25deg)',
      transition: 'all 0.75s ease',
    },

    '&:hover': {
      boxShadow: hoverBoxShadow,
      transform: 'translateY(-2px)',
      background: hoverBackground,

      '&::before': {
        left: '100%',
        transition: 'all 0.75s ease',
      },
    },

    '&:active': {
      boxShadow: activeBoxShadow,
      transform: 'translateY(0)',
    },

    '&.Mui-disabled': {
      background: disabledBackground,
      color: disabledColor,
      boxShadow: 'none',
      border: disabledBorder,
    },

    '& .MuiButton-startIcon, & .MuiButton-endIcon': {
      filter: `drop-shadow(0 1px 1px ${alpha(theme.palette.common.black, 0.5)})`,
    },
  };
});

// Empty state component
const EmptyStateMessage = styled(Paper)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark';

  // Background gradient
  const background = isDark
    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.4)} 0%, ${alpha(theme.palette.background.default, 0.5)} 100%)`
    : `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.grey[50], 0.9)} 100%)`;

  // Border color
  const borderColor = isDark
    ? alpha(theme.palette.grey[700], 0.3)
    : alpha(theme.palette.grey[300], 0.7);

  // Shadow
  const boxShadow = isDark
    ? `inset 0 1px 1px ${alpha(theme.palette.common.white, 0.05)}, 0 6px 12px -6px ${alpha(theme.palette.common.black, 0.4)}`
    : `inset 0 1px 1px ${alpha(theme.palette.common.white, 0.9)}, 0 6px 12px -6px ${alpha(theme.palette.common.black, 0.1)}`;

  // Typography colors  
  const titleColor = isDark
    ? alpha(theme.palette.common.white, 0.85)
    : theme.palette.grey[800];

  const bodyColor = isDark
    ? alpha(theme.palette.common.white, 0.6)
    : theme.palette.grey[600];

  // Icon color
  const iconColor = isDark
    ? alpha(theme.palette.primary.main, 0.3)
    : alpha(theme.palette.primary.light, 0.4);

  const iconShadow = `drop-shadow(0 2px 4px ${alpha(theme.palette.common.black, isDark ? 0.4 : 0.1)})`;

  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
    borderRadius: 20,
    background,
    border: `1px solid ${borderColor}`,
    backdropFilter: 'blur(8px)',
    boxShadow,
    textAlign: 'center',
    height: '100%',
    minHeight: 240,

    '& .MuiTypography-subtitle1': {
      marginTop: theme.spacing(2),
      fontWeight: 600,
      color: titleColor,
      letterSpacing: '0.01em',
    },

    '& .MuiTypography-body2': {
      marginTop: theme.spacing(1),
      color: bodyColor,
      maxWidth: '80%',
    },

    '& .MuiSvgIcon-root, & .iconify': {
      fontSize: 48,
      marginBottom: theme.spacing(2),
      color: iconColor,
      filter: iconShadow,
    }
  };
});

// RelationTypeSelector component
interface RelationTypeSelectorProps {
  value: RelationType;
  onChange: (newType: RelationType) => void;
  disabled?: boolean;
}

/* eslint-disable react/prop-types */
const RelationTypeSelector: React.FC<RelationTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const relationTypes = [
    { value: 'OTO' as RelationType, label: '1:1', tooltip: 'One-to-One' },
    { value: 'OTM' as RelationType, label: '1:n', tooltip: 'One-to-Many' },
    { value: 'MTO' as RelationType, label: 'n:1', tooltip: 'Many-to-One' }
  ];

  return (
    <ButtonGroup
      size="small"
      aria-label="relation type selector"
      disabled={disabled}
      sx={{
        borderRadius: 24,
        overflow: 'hidden',
        '.MuiButtonGroup-grouped': {
          minWidth: 36,
          px: 0.5,
          py: 0.25,
          fontSize: '0.7rem',
          fontWeight: 'medium',
          '&:first-of-type': {
            borderTopLeftRadius: 24,
            borderBottomLeftRadius: 24,
          },
          '&:last-of-type': {
            borderTopRightRadius: 24,
            borderBottomRightRadius: 24,
          }
        }
      }}
    >
      {relationTypes.map(type => (
        <Tooltip key={type.value} title={type.tooltip} arrow>
          <Button
            variant={value === type.value ? "contained" : "outlined"}
            color={value === type.value ? "primary" : "inherit"}
            onClick={() => onChange(type.value)}
          >
            {type.label}
          </Button>
        </Tooltip>
      ))}
    </ButtonGroup>
  );
};

// Animation variants
const toastVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.8,
    filter: 'blur(8px)',
    x: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25,
      mass: 1.1,
      delayChildren: 0.1,
      staggerChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.9,
    filter: 'blur(4px)',
    transition: {
      duration: 0.3,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  }
};

const toastChildVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 }
};

const tableVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    filter: 'blur(4px)'
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1.0],
      scale: {
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1]
      }
    }
  }),
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    filter: 'blur(4px)',
    transition: {
      duration: 0.3,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  }
};

const rowVariants = {
  hidden: {
    opacity: 0,
    x: -5
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0]
    }
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.2,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  }
};

// State type definitions
interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

interface RelationDialogState {
  open: boolean;
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  relationType: RelationType;
}

interface AppState {
  expandedTables: Record<string, boolean>;
  selectedTable: string | null;
  editingTableId: string | null;
  editingColumnId: string | null;
  editingTableDescription: boolean;
  searchQuery: string;
  filteredTables: TableDefinition[];
  editableTables: TableDefinition[];
  aiLoading: boolean;
  aiButtonTooltipOpen: boolean;
  hoveredTableId: string | null;
  hoveredColumnId: string | null;
  toast: ToastState;
  relationDialog: RelationDialogState;
}

// Main component interface
interface TableDefinitionViewProps {
  tables: TableDefinition[];
  onTablesUpdate?: (updatedTables: TableDefinition[]) => void;
}

// Add search highlight component
const HighlightedText = ({ text, searchQuery }: { text: string | undefined | null, searchQuery: string | undefined | null }) => {
  const theme = useTheme();
  
  if (!searchQuery?.trim() || !text) return <>{text || ''}</>;

  try {
    const query = searchQuery.trim();
    const safeText = String(text);
    const parts = safeText.split(new RegExp(`(${query})`, 'gi'));

    return (
      <m.span
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <m.span
              key={index}
              initial={{ backgroundColor: 'transparent' }}
              animate={{ 
                backgroundColor: alpha(theme.palette.primary.main, 0.2)
              }}
              transition={{ duration: 0.2 }}
              style={{
                color: theme.palette.primary.main,
                padding: '2px 4px',
                borderRadius: '4px',
                fontWeight: 500
              }}
            >
              {part}
            </m.span>
          ) : (
            part
          )
        )}
      </m.span>
    );
  } catch (error) {
    console.error('Error in HighlightedText:', error);
    return <>{text || ''}</>;
  }
};

// Add skeleton loader component
const TableRowSkeleton = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <TableRow
      sx={{
        '& .MuiTableCell-root': {
          py: 1.5,
          px: { xs: 1, sm: 1.5 },
          borderColor: alpha(theme.palette.divider, isDark ? 0.2 : 0.5),
        }
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <TableCell key={i}>
          <Box sx={{
            height: i === 1 ? 24 : 20,
            width: () => {
              if (i === 2) return '85%';
              if (i === 3) return '60%';
              return '70%';
            },
            borderRadius: 1,
            animation: 'pulse 1.5s ease-in-out 0.5s infinite',
            bgcolor: (t: any) => alpha(t.palette.text.disabled, 0.1),
            '@keyframes pulse': {
              '0%': {
                opacity: 0.6,
              },
              '50%': {
                opacity: 0.3,
              },
              '100%': {
                opacity: 0.6,
              }
            }
          }} />
        </TableCell>
      ))}
    </TableRow>
  );
};

// Add table row loader
const TableSkeleton = () => (
  <StyledTableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell className="column-name">Column</TableCell>
          <TableCell className="column-type">Type</TableCell>
          <TableCell className="column-description">Description</TableCell>
          <TableCell className="column-relations">Relations</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[...Array(5)].map((_, index) => (
          <TableRowSkeleton key={index} />
        ))}
      </TableBody>
    </Table>
  </StyledTableContainer>
);

// Add keyboard handler for accessibility
const useKeyboardNavigation = (
  tables: TableDefinition[],
  selectedTable: string | null,
  toggleTable: (tableId: string) => void,
  expandedTables: Record<string, boolean>,
  editingTableId: string | null,
  editingColumnId: string | null,
  cancelEditing: () => void,
  saveColumnChanges: (tableId: string, columnId: string, column: ColumnDefinition) => Promise<void>,
  getEditingColumn: () => ColumnDefinition | null
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if we're not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (!selectedTable || !tables.length) return;

      const currentIndex = tables.findIndex(t => t.tableIdentifier === selectedTable);
      if (currentIndex === -1) return;

      // Arrow up/down for table navigation
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        toggleTable(tables[currentIndex - 1].tableIdentifier);
        e.preventDefault();
      } else if (e.key === 'ArrowDown' && currentIndex < tables.length - 1) {
        toggleTable(tables[currentIndex + 1].tableIdentifier);
        e.preventDefault();
      }

      // Space or Enter to expand/collapse table
      if ((e.key === ' ' || e.key === 'Enter') && !editingTableId && !editingColumnId) {
        e.preventDefault();
        toggleTable(selectedTable);
      }

      // Escape to cancel editing or collapse table
      if (e.key === 'Escape') {
        if (editingTableId && editingColumnId) {
          cancelEditing();
        } else if (expandedTables[selectedTable]) {
          toggleTable(selectedTable);
        }
      }

      // Ctrl/Cmd + S to save changes when editing
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && editingTableId && editingColumnId) {
        e.preventDefault();
        const currentEditingColumn = getEditingColumn();
        if (currentEditingColumn) {
          saveColumnChanges(editingTableId, editingColumnId, currentEditingColumn);
        }
      }

      // Tab navigation between tables
      if (e.key === 'Tab') {
        e.preventDefault();
        const nextIndex = e.shiftKey 
          ? (currentIndex - 1 + tables.length) % tables.length 
          : (currentIndex + 1) % tables.length;
        toggleTable(tables[nextIndex].tableIdentifier);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [tables, selectedTable, toggleTable, expandedTables, editingTableId, editingColumnId, cancelEditing, saveColumnChanges, getEditingColumn]);
};

// Add StyledTableHeader component definition after other styled components
const StyledTableHeader = styled(CardHeader)(({ theme }) => ({
  padding: theme.spacing(2),
  transition: 'all 0.2s ease',
  '& .MuiCardHeader-content': {
    width: '100%',
  },
  '& .table-stats': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    '& span': {
      '&:nth-of-type(even)': {
        opacity: 0.5,
      },
    },
  },
  '& .table-description': {
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  },
}));

// Main component
export function TableDefinitionView({ tables, onTablesUpdate }: TableDefinitionViewProps): JSX.Element {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getBackgroundColor = (t: any, selected: boolean): string => {
    if (!selected) return 'transparent';
    const isDark = t.palette.mode === 'dark';
    return isDark
      ? alpha(t.palette.primary.dark, 0.1)
      : alpha(t.palette.primary.lighter, 0.2);
  };
  // Enhanced responsive grid layout
  const gridSizes = useMemo(() => ({
    tableList: { xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }, // 50%
    diagram: { xs: 12, sm: 12, md: 6, lg: 6, xl: 6 },   // 50%
  }), []);

  // Add keyboard shortcuts dialog state
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);

  // Unified state management
  const [state, setState] = useState<AppState>({
    expandedTables: {},
    selectedTable: null,
    editingTableId: null,
    editingColumnId: null,
    editingTableDescription: false,
    searchQuery: '',
    filteredTables: [],
    editableTables: [],
    aiLoading: false,
    aiButtonTooltipOpen: false,
    hoveredTableId: null,
    hoveredColumnId: null,
    toast: {
      message: '',
      type: 'info',
      visible: false,
    },
    relationDialog: {
      open: false,
      sourceTableId: '',
      sourceColumnId: '',
      targetTableId: '',
      targetColumnId: '',
      relationType: 'OTO',
    }
  });

  // Add a tablesLoading state
  const [tablesLoading, setTablesLoading] = useState(true);

  // Destructured state for easier access
  const {
    expandedTables, selectedTable, editingTableId, editingColumnId,
    editingTableDescription, searchQuery, filteredTables, editableTables, aiLoading,
    aiButtonTooltipOpen, hoveredTableId, hoveredColumnId,
    toast, relationDialog
  } = state;

  // Refs
  const tableListRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Initialize tables on component mount
  useEffect(() => {
    if (tables?.length > 0) {
      // Only initialize tables if they haven't been set yet or if props.tables actually changed
      setState(prev => {
        const tablesDeepCopy = JSON.parse(JSON.stringify(tables));
        return {
          ...prev,
          editableTables: tablesDeepCopy,
          filteredTables: tablesDeepCopy,
          // Auto-expand first table if none selected
          ...(Object.keys(prev.expandedTables).length === 0 && !prev.selectedTable && {
            expandedTables: { [tables[0].tableIdentifier]: true },
            selectedTable: tables[0].tableIdentifier
          })
        };
      });
      setTablesLoading(false);
    }
  }, [tables]); // Only depend on tables prop

  // Filter tables based on search query
  useEffect(() => {
    if (!debouncedSearchQuery?.trim()) {
      setState(prev => ({ ...prev, filteredTables: prev.editableTables || [] }));
      return;
    }

    try {
      const query = debouncedSearchQuery.toLowerCase().trim();
      const filtered = (editableTables || []).filter(table => {
        // Safely check if table exists and has required properties
        if (!table || typeof table !== 'object') return false;

        // Check table identifier
        const tableId = table.tableIdentifier?.toLowerCase() || '';
        if (tableId.includes(query)) {
          return true;
        }

        // Check table description
        const tableDesc = table.tableDescription?.toLowerCase() || '';
        if (tableDesc.includes(query)) {
          return true;
        }

        // Check columns
        if (!Array.isArray(table.columns)) return false;
        
        return table.columns.some(col => {
          if (!col || typeof col !== 'object') return false;
          
          const colId = col.columnIdentifier?.toLowerCase() || '';
          const colDesc = col.columnDescription?.toLowerCase() || '';
          const colType = col.columnType?.toLowerCase() || '';
          
          return (
            colId.includes(query) ||
            colDesc.includes(query) ||
            colType.includes(query)
          );
        });
      });

      setState(prev => ({ ...prev, filteredTables: filtered }));
    } catch (error) {
      console.error('Error filtering tables:', error);
      // In case of error, show all tables
      setState(prev => ({ ...prev, filteredTables: editableTables || [] }));
    }
  }, [debouncedSearchQuery, editableTables]);

  // Core helper functions
  const showToast = useCallback((message: string, type: ToastState['type']) => {
    setState(prev => ({ ...prev, toast: { message, type, visible: true } }));
    setTimeout(() => {
      setState(prev => ({ ...prev, toast: { ...prev.toast, visible: false } }));
    }, 3000);
  }, []);

  const toggleTable = useCallback((tableId: string) => {
    setState(prev => ({
      ...prev,
      expandedTables: { ...prev.expandedTables, [tableId]: !prev.expandedTables[tableId] },
      selectedTable: tableId
    }));

    // Scroll to the selected table
    setTimeout(() => {
      const tableElement = document.getElementById(`table-${tableId}`);
      if (tableElement && tableListRef.current) {
        const containerRect = tableListRef.current.getBoundingClientRect();
        const tableRect = tableElement.getBoundingClientRect();

        if (tableRect.top < containerRect.top || tableRect.bottom > containerRect.bottom) {
          tableElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }, 100);
  }, []);

  const startEditing = useCallback((tableId: string, columnId: string) => {
    setState(prev => ({ ...prev, editingTableId: tableId, editingColumnId: columnId }));
  }, []);

  const cancelEditing = useCallback(() => {
    setState(prev => ({
      ...prev,
      editingTableId: null,
      editingColumnId: null,
      editableTables: JSON.parse(JSON.stringify(tables))
    }));
    showToast('Editing canceled', 'info');
  }, [tables, showToast]);

  const saveColumnChanges = useCallback(async (
    tableId: string,
    columnId: string,
    updatedColumn: ColumnDefinition
  ): Promise<void> => {
    try {
      const tablesDeepCopy = JSON.parse(JSON.stringify(editableTables));

      // Find the table and column IDs before updating state
      const sourceTable = editableTables.find(t => t.tableIdentifier === tableId);
      const sourceColumn = sourceTable?.columns.find(c => c.columnIdentifier === columnId);

      if (!sourceTable?.id) {
        throw new Error('Table ID not found');
      }

      if (!sourceColumn?.id) {
        throw new Error('Column ID not found');
      }

      const updatedTables = tablesDeepCopy.map((table: TableDefinition) => {
        if (table.tableIdentifier === tableId) {
          return {
            ...table,
            columns: table.columns.map((column: ColumnDefinition) =>
              column.columnIdentifier === columnId ? updatedColumn : column
            )
          };
        }
        return table;
      });

      // Call API to update the column if we're in management mode
      const sourceId = window.location.pathname.split('/')[2];
      const isManagementPage = window.location.pathname.includes('/manage');
      
      if (isManagementPage && sourceId) {
        try {
          const updateColumnDTO: UpdateColumnDTO = {
            columnIdentifier: updatedColumn.columnIdentifier,
            columnType: updatedColumn.columnType,
            columnDescription: updatedColumn.columnDescription,
            isPrimaryKey: updatedColumn.isPrimaryKey
          };

          await axiosInstance.put(
            endpoints.dataSource.tables.columns.update(
              sourceId.toString(), 
              sourceTable.id.toString(), 
              sourceColumn.id.toString()
            ),
            updateColumnDTO
          );
        } catch (error: any) {
          console.error('Error updating column:', error);
          showToast('Failed to update column on server', 'error');
          return;
        }
      }

      setState(prev => ({
        ...prev,
        editableTables: updatedTables,
        filteredTables: updatedTables,
        editingTableId: null,
        editingColumnId: null
      }));

      if (onTablesUpdate) {
        onTablesUpdate(updatedTables);
      }

      showToast('Column updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error saving column changes:', error);
      showToast('Failed to save changes', 'error');
    }
  }, [editableTables, onTablesUpdate, showToast]);

  const handleColumnChange = useCallback((
    tableId: string,
    columnId: string,
    field: keyof ColumnDefinition,
    value: any
  ) => {
    setState(prev => {
      const updatedTables = JSON.parse(JSON.stringify(prev.editableTables));

      const result = updatedTables.map((table: TableDefinition) => {
        if (table.tableIdentifier === tableId) {
          return {
            ...table,
            columns: table.columns.map((column: ColumnDefinition) =>
              column.columnIdentifier === columnId
                ? { ...column, [field]: value }
                : column
            )
          };
        }
        return table;
      });

      return {
        ...prev,
        editableTables: result
      };
    });
  }, []);

  // Data processing functions
  const getColumnCount = useCallback((tableId: string): number => {
    const table = editableTables.find(t => t.tableIdentifier === tableId);
    return table?.columns.length || 0;
  }, [editableTables]);

  const getPrimaryKeyCount = useCallback((tableId: string): number => {
    const table = editableTables.find(t => t.tableIdentifier === tableId);
    return table?.columns.filter(c => c.isPrimaryKey).length || 0;
  }, [editableTables]);

  // Move normalizeRelations inside component and wrap with useCallback
  const normalizeRelations = useCallback((column: ColumnDefinition, tablesToSearch: TableDefinition[]): ColumnRelation[] => {
    const relations: ColumnRelation[] = [];
    
    // Handle standard relations
    if (column.relations && Array.isArray(column.relations)) {
      relations.push(...column.relations);
    }
    
    // Handle outgoing relations if they exist
    if ('outgoingRelations' in column && Array.isArray((column as any).outgoingRelations)) {
      const outgoingRelations = (column as any).outgoingRelations as OutgoingRelation[];
      relations.push(...outgoingRelations.map(rel => {
        const targetInfo = findTableAndColumnById(tablesToSearch, rel.toColumn.id);
        return {
          id: rel.id, // Use the outgoing relation's ID
          tableIdentifier: targetInfo?.tableIdentifier || 'Unknown Table',
          toColumn: targetInfo?.columnIdentifier || rel.toColumn.columnIdentifier,
          type: rel.type || 'OTO' // Default to OTO if type is not specified
        };
      }));
    }
    
    return relations;
  }, []); // Empty dependency array since it's a pure function

  const getRelationCount = useCallback((tableId: string): number => {
    const table = editableTables.find(t => t.tableIdentifier === tableId);
    if (!table) return 0;
    
    return table.columns.reduce((count, column) => {
      const normalizedRelations = normalizeRelations(column, editableTables);
      return count + normalizedRelations.length;
    }, 0);
  }, [editableTables, normalizeRelations]);

  const getRelationTypeDisplay = useCallback((relationType: string): string => {
    if (relationType === 'OTM') return '1:n';
    if (relationType === 'MTO') return 'n:1';
    if (relationType === 'OTO') return '1:1';
    return relationType;
  }, []);

  const getRelationshipName = useCallback((key: string): string => {
    if (key === 'OTM') return 'One-to-Many';
    if (key === 'MTO') return 'Many-to-One';
    if (key === 'OTO') return 'One-to-One';
    return key;
  }, []);

  // AI description generation
const generateAIDescription = useCallback(async (column: ColumnDefinition, table: TableDefinition): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Context-aware descriptions
  const isForeignKey = column.relations && column.relations.length > 0;
  const colName = column.columnIdentifier.toLowerCase();

  if (column.isPrimaryKey) {
    return `Unique identifier for each record in the ${table.tableIdentifier} table`;
  }

  if (isForeignKey) {
    const relations = column.relations || [];
    const targetTables = relations.map(r => r.tableIdentifier).join(', ');
    return `Foreign key referencing ${targetTables} ${relations.length > 1 ? 'tables' : 'table'}`;
  }

  if (colName.includes('id') && colName.endsWith('id')) {
    return `Reference to ${colName.replace(/_?id$/, '')} record`;
  }

  if (colName.includes('name')) {
    return `Name or title of the ${table.tableIdentifier} record`;
  }

  if (colName.includes('date') || colName.includes('time')) {
    let action = 'event occurred';
    if (colName.includes('created')) action = 'record was created';
    else if (colName.includes('updated')) action = 'record was last modified';
    else if (colName.includes('deleted')) action = 'record was removed';

    return `Timestamp indicating when the ${action}`;
  }

  if (/price|cost|amount/.test(colName)) {
    return `Monetary value representing the ${colName.replace(/_/g, ' ')}`;
  }

  if (colName.includes('status')) {
    return `Current state of the ${table.tableIdentifier} record`;
  }

  if (colName.includes('description')) {
    return `Detailed description of the ${table.tableIdentifier} record`;
  }

  if (/bool|flag/.test(column.columnType.toLowerCase())) {
    const flagDescription = colName
      .replace(/^is_|^has_/, '')
      .replace(/_/g, ' ');
    return `Flag indicating whether the ${table.tableIdentifier} ${flagDescription}`;
  }

  return `Stores ${column.columnType} data for ${table.tableIdentifier} records`;
}, []);

  // Add this before the fillAllDescriptionsWithAI function
const generateAITableDescription = useCallback(async (table: TableDefinition): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const columnTypes = table.columns.map(col => `${col.columnIdentifier} (${col.columnType})`).join(', ');
  const primaryKeys = table.columns.filter(col => col.isPrimaryKey).map(col => col.columnIdentifier).join(', ');
  const hasRelations = table.columns.some(col => (col.relations && col.relations.length > 0));

  let description = `Table storing ${table.tableIdentifier} records with columns: ${columnTypes}.`;
  
  if (primaryKeys) {
    description += ` Primary key(s): ${primaryKeys}.`;
  }

  if (hasRelations) {
    description += ` Contains relationships with other tables.`;
  }

  return description;
}, []);

  // Update the fillAllDescriptionsWithAI function
const fillAllDescriptionsWithAI = useCallback(async () => {
  try {
    setState(prev => ({ ...prev, aiLoading: true, aiButtonTooltipOpen: false }));

    const tablesDeepCopy = JSON.parse(JSON.stringify(editableTables));
    let generatedCount = 0;

    // Generate table descriptions first
    await Promise.all(
      tablesDeepCopy.map(async (table: TableDefinition) => {
        if (!table.tableDescription) {
          table.tableDescription = await generateAITableDescription(table);
          generatedCount += 1;
        }
      })
    );

    // Then generate column descriptions
    await Promise.all(
      tablesDeepCopy.flatMap((table: TableDefinition) =>
        table.columns.map(async (column: ColumnDefinition) => {
          if (!column.columnDescription) {
            column.columnDescription = await generateAIDescription(column, table);
            generatedCount += 1;
          }
        })
      )
    );

    setState(prev => ({
      ...prev,
      editableTables: tablesDeepCopy,
      filteredTables: tablesDeepCopy,
      aiLoading: false
    }));

    if (onTablesUpdate && generatedCount > 0) {
      onTablesUpdate(tablesDeepCopy);
    }

    showToast(
      generatedCount > 0
        ? `Successfully generated ${generatedCount} descriptions!`
        : 'All tables and columns already have descriptions',
      generatedCount > 0 ? 'success' : 'info'
    );
  } catch (error) {
    console.error('AI description generation failed:', error);
    showToast('Failed to generate AI descriptions', 'error');
    setState(prev => ({ ...prev, aiLoading: false }));
  }
}, [editableTables, onTablesUpdate, showToast, generateAITableDescription, generateAIDescription]);

  // Relation management
  const openRelationDialog = useCallback((tableId: string, columnId: string) => {
    setState(prev => ({
      ...prev,
      relationDialog: {
        ...prev.relationDialog,
        open: true,
        sourceTableId: tableId,
        sourceColumnId: columnId,
        targetTableId: '',
        targetColumnId: '',
        relationType: 'OTO'
      }
    }));
  }, []);

  const handleRelationDialogClose = useCallback(() => {
    setState(prev => ({
      ...prev,
      relationDialog: { ...prev.relationDialog, open: false }
    }));
  }, []);

  const updateRelationDialog = useCallback((field: keyof RelationDialogState, value: string) => {
    setState(prev => ({
      ...prev,
      relationDialog: { ...prev.relationDialog, [field]: value }
    }));
  }, []);

  const addNewRelation = useCallback(async (): Promise<void> => {
    try {
      const { sourceTableId, sourceColumnId, targetTableId, targetColumnId, relationType } = relationDialog;

      if (!sourceTableId || !sourceColumnId || !targetTableId || !targetColumnId) {
        showToast('Please fill all relation fields', 'error');
        return;
      }

      // Find the source and target table/column IDs
      const sourceTable = editableTables.find(t => t.tableIdentifier === sourceTableId);
      const sourceColumn = sourceTable?.columns.find(c => c.columnIdentifier === sourceColumnId);
      const targetTable = editableTables.find(t => t.tableIdentifier === targetTableId);
      const targetColumn = targetTable?.columns.find(c => c.columnIdentifier === targetColumnId);

      if (!sourceTable?.id || !sourceColumn?.id) {
        throw new Error('Source table or column ID not found');
      }

      if (!targetTable?.id || !targetColumn?.id) {
        throw new Error('Target table or column ID not found');
      }

      const relationToAdd: CreateRelationDTO = {
        tableIdentifier: targetTable.tableIdentifier.toString(),
        toColumn: targetColumn.columnIdentifier.toString(),
        type: relationType,
      };

      const tablesDeepCopy = JSON.parse(JSON.stringify(editableTables));

      // Check if relation already exists
      if (sourceColumn?.relations?.some((r: ColumnRelation) =>
        r.tableIdentifier === relationToAdd.tableIdentifier &&
        r.toColumn === relationToAdd.toColumn
      )) {
        showToast('This relation already exists', 'error');
        return;
      }

      // Add relation
      const updatedTables = tablesDeepCopy.map((table: TableDefinition) => {
        if (table.tableIdentifier === sourceTableId) {
          return {
            ...table,
            columns: table.columns.map((column: ColumnDefinition) => {
              if (column.columnIdentifier === sourceColumnId) {
                return {
                  ...column,
                  relations: [...(column.relations || []), relationToAdd]
                };
              }
              return column;
            })
          };
        }
        return table;
      });

      // Call API to update the relation if we're in management mode
      const sourceId = window.location.pathname.split('/')[2];
      const isManagementPage = window.location.pathname.includes('/manage');
      
      if (isManagementPage && sourceId) {
        try {
          await axiosInstance.post(
            endpoints.dataSource.tables.columns.relations.base(
              sourceId.toString(), 
              sourceTable.id.toString(), 
              sourceColumn.id.toString()
            ),
            relationToAdd
          );
        } catch (error: any) {
          console.error('Error adding relation:', error);
          showToast('Failed to add relation on server', 'error');
          return;
        }
      }

      setState(prev => ({
        ...prev,
        editableTables: updatedTables,
        filteredTables: updatedTables,
        relationDialog: { ...prev.relationDialog, open: false }
      }));

      if (onTablesUpdate) {
        onTablesUpdate(updatedTables);
      }

      showToast('Relation added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding relation:', error);
      showToast('Failed to add relation', 'error');
    }
  }, [relationDialog, editableTables, onTablesUpdate, showToast]);

  const deleteRelation = useCallback(async (
    tableId: string,
    columnId: string,
    targetTableId: string,
    targetColumnId: string
  ): Promise<void> => {
    try {
      const tablesDeepCopy = JSON.parse(JSON.stringify(editableTables));

      // Find all necessary IDs before updating state
      const sourceTable = editableTables.find(t => t.tableIdentifier === tableId);
      const sourceColumn = sourceTable?.columns.find(c => c.columnIdentifier === columnId);
      const targetTableObj = editableTables.find(t => t.tableIdentifier === targetTableId);
      const targetColumnObj = targetTableObj?.columns.find(c => c.columnIdentifier === targetColumnId);

      if (!sourceTable?.id || !sourceColumn?.id) {
        throw new Error('Source table or column ID not found');
      }

      if (!targetTableObj?.id || !targetColumnObj?.id) {
        throw new Error('Target table or column ID not found');
      }

      // Find the relation - handle both standard relations and outgoing relations
      let relationId: number | undefined;
      
      // Check standard relations first
      const standardRelation = sourceColumn.relations?.find(r => 
        r.tableIdentifier === targetTableId && r.toColumn === targetColumnId
      );
      
      if (standardRelation?.id) {
        relationId = standardRelation.id;
      } else {
        // Check outgoing relations if standard relation not found
        const outgoingRelation = (sourceColumn as any).outgoingRelations?.find((r: OutgoingRelation) => 
          r.toColumn.columnIdentifier === targetColumnId && r.toColumn.id === targetColumnObj.id
        );
        
        if (outgoingRelation?.id) {
          relationId = outgoingRelation.id;
        }
      }

      if (!relationId) {
        throw new Error('Relation ID not found');
      }

      const updatedTables = tablesDeepCopy.map((table: TableDefinition) => {
        if (table.tableIdentifier === tableId) {
          return {
            ...table,
            columns: table.columns.map((column: ColumnDefinition) => {
              if (column.columnIdentifier === columnId) {
                // Remove from both standard relations and outgoing relations
                const updatedColumn = { ...column };
                
                // Update standard relations
                if (updatedColumn.relations) {
                  updatedColumn.relations = updatedColumn.relations.filter(
                    (r: ColumnRelation) => r.id !== relationId
                  );
                }
                
                // Update outgoing relations if they exist
                if ((updatedColumn as any).outgoingRelations) {
                  (updatedColumn as any).outgoingRelations = (updatedColumn as any).outgoingRelations.filter(
                    (r: OutgoingRelation) => r.id !== relationId
                  );
                }
                
                return updatedColumn;
              }
              return column;
            })
          };
        }
        return table;
      });

      // Call API to delete the relation if we're in management mode and we have a relation ID
      const sourceId = window.location.pathname.split('/')[2];
      const isManagementPage = window.location.pathname.includes('/manage');
      
      if (isManagementPage && sourceId && relationId) {
        try {
          await axiosInstance.delete(
            endpoints.dataSource.tables.columns.relations.delete(
              sourceId.toString(), 
              sourceTable.id.toString(), 
              sourceColumn.id.toString(),
              relationId.toString()
            )
          );
        } catch (error: any) {
          console.error('Error deleting relation:', error);
          showToast('Failed to delete relation on server', 'error');
          return;
        }
      }

      setState(prev => ({
        ...prev,
        editableTables: updatedTables,
        filteredTables: updatedTables
      }));

      if (onTablesUpdate) {
        onTablesUpdate(updatedTables);
      }

      showToast('Relation deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting relation:', error);
      showToast('Failed to delete relation', 'error');
    }
  }, [editableTables, onTablesUpdate, showToast]);

  // Get current editing column
  const getEditingColumn = useCallback(() => {
    if (!editingTableId || !editingColumnId) return null;

    const table = editableTables.find(t => t.tableIdentifier === editingTableId);
    if (!table) return null;

    return table.columns.find(c => c.columnIdentifier === editingColumnId) || null;
  }, [editingTableId, editingColumnId, editableTables]);

  const updateRelation = useCallback(async (
    tableId: string,
    columnId: string,
    relationId: number,
    newType: RelationType
  ): Promise<void> => {
    try {
      // Find the source table and column IDs
      const sourceTable = editableTables.find(t => t.tableIdentifier === tableId);
      const sourceColumn = sourceTable?.columns.find(c => c.columnIdentifier === columnId);

      if (!sourceTable?.id || !sourceColumn?.id) {
        throw new Error('Source table or column ID not found');
      }

      const sourceId = window.location.pathname.split('/')[2];
      const isManagementPage = window.location.pathname.includes('/manage');

      // Update relation type in the backend if in management mode
      if (isManagementPage && sourceId) {
        try {
          await axiosInstance.put(
            endpoints.dataSource.tables.columns.relations.update(
              sourceId.toString(),
              sourceTable.id.toString(),
              sourceColumn.id.toString(),
              relationId.toString()
            ),
            { type: newType }
          );
        } catch (error: any) {
          console.error('Error updating relation:', error);
          showToast('Failed to update relation on server', 'error');
          return;
        }
      }

      // Update relation type in the frontend state
      const tablesDeepCopy = JSON.parse(JSON.stringify(editableTables));
      const updatedTables = tablesDeepCopy.map((table: TableDefinition) => {
        if (table.tableIdentifier === tableId) {
          return {
            ...table,
            columns: table.columns.map((column: ColumnDefinition) => {
              if (column.columnIdentifier === columnId) {
                // Update both standard relations and outgoing relations
                const updatedColumn = { ...column };
                
                // Update standard relations if they exist
                if (updatedColumn.relations) {
                  updatedColumn.relations = updatedColumn.relations.map(r => 
                    r.id === relationId ? { ...r, type: newType } : r
                  );
                }
                
                // Update outgoing relations if they exist
                if ((updatedColumn as any).outgoingRelations) {
                  (updatedColumn as any).outgoingRelations = (updatedColumn as any).outgoingRelations.map(
                    (r: OutgoingRelation) => r.id === relationId ? { ...r, type: newType } : r
                  );
                }
                
                return updatedColumn;
              }
              return column;
            })
          };
        }
        return table;
      });

      setState(prev => ({
        ...prev,
        editableTables: updatedTables,
        filteredTables: updatedTables
      }));

      if (onTablesUpdate) {
        onTablesUpdate(updatedTables);
      }

      showToast('Relation updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating relation:', error);
      showToast('Failed to update relation', 'error');
    }
  }, [editableTables, onTablesUpdate, showToast]);

  // Render column row
  const renderColumnRow = useCallback((table: TableDefinition, column: ColumnDefinition, index: number) => {
    const isEditing = editingTableId === table.tableIdentifier && editingColumnId === column.columnIdentifier;
    const isHovered = hoveredTableId === table.tableIdentifier && hoveredColumnId === column.columnIdentifier;
    const currentEditingColumn = isEditing ? getEditingColumn() : null;
    const searchActive = searchQuery.trim().length > 0;

    const handleKeyPress = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (currentEditingColumn) {
          saveColumnChanges(table.tableIdentifier, column.columnIdentifier, currentEditingColumn);
        }
      }
    };

    return (
      <MotionTableRow
        key={column.columnIdentifier}
        custom={index}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={rowVariants}
        onMouseEnter={() => {
          setState(prev => ({
            ...prev,
            hoveredTableId: table.tableIdentifier,
            hoveredColumnId: column.columnIdentifier
          }));
        }}
        onMouseLeave={() => {
          setState(prev => ({
            ...prev,
            hoveredTableId: null,
            hoveredColumnId: null
          }));
        }}
        onClick={() => {
          // Add click handler to start editing when row is clicked
          if (!isEditing) {
            startEditing(table.tableIdentifier, column.columnIdentifier);
          }
        }}
        sx={{
          position: 'relative',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: (t) => alpha(t.palette.primary.main, 0.05),
            '& .MuiTableCell-root': { color: 'primary.main' }
          },
          '& .MuiTableCell-root': {
            py: 1.5,
            px: { xs: 1, sm: 1.5 },
            ...(isEditing && {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            }),
            ...(searchActive && column.columnIdentifier.toLowerCase().includes(searchQuery.toLowerCase()) && {
              bgcolor: (t) => alpha(t.palette.primary.main, 0.05),
            }),
          },
          transition: 'all 0.15s ease-in-out',
        }}
      >
        {/* Column Name Cell */}
        <TableCell className="column-name" sx={{ pl: { xs: 1, sm: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {isEditing ? (
              <TextField
                size="small"
                value={column.columnIdentifier}
                onChange={(e) => handleColumnChange(
                  table.tableIdentifier,
                  column.columnIdentifier,
                  'columnIdentifier',
                  e.target.value
                )}
                onKeyPress={handleKeyPress}
                fullWidth
                autoFocus
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                aria-label="Edit column name"
              />
            ) : (
              <Typography variant="body2" fontWeight={column.isPrimaryKey ? 'medium' : 'normal'}>
                {column.isPrimaryKey && <StyledPrimaryKeyIcon />}
                <HighlightedText text={column.columnIdentifier} searchQuery={searchQuery} />
              </Typography>
            )}
          </Stack>
        </TableCell>

        {/* Column Type Cell */}
        <TableCell className="column-type">
          {isEditing ? (
            <TextField
              size="small"
              value={column.columnType}
              onChange={(e) => handleColumnChange(
                table.tableIdentifier,
                column.columnIdentifier,
                'columnType',
                e.target.value
              )}
              onKeyPress={handleKeyPress}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              aria-label="Edit column type"
            />
          ) : (
            <StyledColumnTypeChip label={<HighlightedText text={column.columnType} searchQuery={searchQuery} />} size="small" />
          )}
        </TableCell>

        {/* Description Cell */}
        <TableCell className="column-description">
          {isEditing ? (
            <DescriptionTextField
              size="small"
              value={column.columnDescription || ''}
              onChange={(e) => handleColumnChange(
                table.tableIdentifier,
                column.columnIdentifier,
                'columnDescription',
                e.target.value
              )}
              onKeyPress={handleKeyPress}
              fullWidth
              multiline
              rows={2}
              placeholder="Enter column description..."
              aria-label="Edit column description"
            />
          ) : (
            <Typography
              variant="body2"
              color={column.columnDescription ? 'text.primary' : 'text.secondary'}
              sx={{
                fontStyle: column.columnDescription ? 'normal' : 'italic',
                wordBreak: 'break-word',
              }}
            >
              {column.columnDescription ? (
                <HighlightedText text={column.columnDescription} searchQuery={searchQuery} />
              ) : (
                'No description provided'
              )}
            </Typography>
          )}
        </TableCell>

        {/* Relations Cell */}
        <TableCell className="column-relations">
          <RelationsContainer>
            {((): React.ReactNode => {
              const normalizedRelations = normalizeRelations(column, editableTables);
              if (normalizedRelations.length) {
                return normalizedRelations.map((relation, relationIndex) => (
                  <Box key={`${relation.tableIdentifier}-${relation.toColumn}-${relationIndex}`} sx={{ mb: 1 }}>
                    {isEditing ? (
                      <Stack direction="column" spacing={1} alignItems="center">
                        <RelationTypeSelector
                          value={relation.type as RelationType}
                          onChange={(newType) => {
                            if (relation.id) {
                              updateRelation(
                                table.tableIdentifier,
                                column.columnIdentifier,
                                relation.id,
                                newType
                              );
                            }
                          }}
                          disabled={false}
                        />
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="caption">
                            {relation.tableIdentifier}.{relation.toColumn}
                          </Typography>
                          <Tooltip title="Remove relation">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={async () => {
                                await deleteRelation(
                                  table.tableIdentifier,
                                  column.columnIdentifier,
                                  relation.tableIdentifier,
                                  relation.toColumn
                                );
                              }}
                              sx={{
                                bgcolor: (t) => alpha(t.palette.error.main, 0.1),
                                '&:hover': {
                                  bgcolor: (t) => alpha(t.palette.error.main, 0.2),
                                },
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    ) : (
                      <Tooltip
                        title={`${getRelationTypeDisplay(relation.type)} → ${relation.tableIdentifier}.${relation.toColumn} (${getRelationshipName(relation.type)})`}
                        arrow
                      >
                        <span>
                          <StyledRelationChip
                            size="small"
                            icon={<StyledRelationIcon />}
                            label={`${getRelationTypeDisplay(relation.type)} → ${relation.tableIdentifier}.${relation.toColumn}`}
                            onDelete={isEditing ? () => deleteRelation(
                              table.tableIdentifier,
                              column.columnIdentifier,
                              relation.tableIdentifier,
                              relation.toColumn
                            ) : undefined}
                          />
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                ));
              }
              return (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No relations
                </Typography>
              );
            })()}
          </RelationsContainer>

          {/* Row action buttons */}
          {!isEditing && isHovered && (
            <RowActionButtons>
              <Tooltip title="Edit column">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => startEditing(table.tableIdentifier, column.columnIdentifier)}
                  sx={{
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add relation">
                <IconButton
                  size="small"
                  color="info"
                  onClick={(e) => {
                    e.stopPropagation();
                    openRelationDialog(table.tableIdentifier, column.columnIdentifier);
                  }}
                  sx={{
                    bgcolor: (t) => alpha(t.palette.info.main, 0.1),
                    '&:hover': {
                      bgcolor: (t) => alpha(t.palette.info.main, 0.2),
                    },
                  }}
                >
                  <AddLinkIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </RowActionButtons>
          )}
        </TableCell>

        {/* Save/cancel buttons when editing */}
        {isEditing && (
          <EditActionsContainer>
            <Tooltip title="Save changes">
              <IconButton
                size="small"
                color="primary"
                onClick={async () => {
                  if (currentEditingColumn) {
                    await saveColumnChanges(
                      table.tableIdentifier,
                      column.columnIdentifier,
                      currentEditingColumn
                    );
                  }
                }}
                sx={{
                  bgcolor: (t) => alpha(t.palette.success.main, 0.1),
                  '&:hover': {
                    bgcolor: (t) => alpha(t.palette.success.main, 0.2),
                  },
                }}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Discard changes">
              <IconButton
                size="small"
                color="error"
                onClick={cancelEditing}
                sx={{
                  bgcolor: (t) => alpha(t.palette.error.main, 0.1),
                  '&:hover': {
                    bgcolor: (t) => alpha(t.palette.error.main, 0.2),
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </EditActionsContainer>
        )}
      </MotionTableRow>
    );
  }, [
    theme,
    editingTableId,
    editingColumnId,
    hoveredTableId,
    hoveredColumnId,
    searchQuery,
    getEditingColumn,
    handleColumnChange,
    saveColumnChanges,
    cancelEditing,
    getRelationTypeDisplay,
    getRelationshipName,
    deleteRelation,
    openRelationDialog,
    startEditing,
    normalizeRelations,
    editableTables,
    updateRelation
  ]);

  // Apply keyboard navigation
  useKeyboardNavigation(
    filteredTables, 
    selectedTable, 
    toggleTable,
    expandedTables,
    editingTableId,
    editingColumnId,
    cancelEditing,
    saveColumnChanges,
    getEditingColumn
  );

  // Simulate a loading state briefly for better UX
  useEffect(() => {
    if (tables?.length > 0) {
      setTablesLoading(true);
      const timer = setTimeout(() => {
        setTablesLoading(false);
      }, 800);

      return () => clearTimeout(timer);
    }
    return undefined; // Add explicit return for linter
  }, [tables]);

  // Search input ref for focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Add keyboard shortcut for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current.focus();
      }

      // Escape key to clear search if it's not empty
      if (e.key === 'Escape' && searchQuery && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        setState(prev => ({ ...prev, searchQuery: '' }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchQuery]);

  // Add this function to handle table description changes
  const handleTableDescriptionChange = useCallback((
    tableId: string,
    value: string
  ) => {
    setState(prev => {
      const updatedTables = JSON.parse(JSON.stringify(prev.editableTables));

      const result = updatedTables.map((table: TableDefinition) => {
        if (table.tableIdentifier === tableId) {
          return {
            ...table,
            tableDescription: value
          };
        }
        return table;
      });

      return {
        ...prev,
        editableTables: result
      };
    });
  }, []);

  // Add this function to save table description
  const saveTableDescription = useCallback(async (tableId: string): Promise<void> => {
    try {
      const tablesDeepCopy = JSON.parse(JSON.stringify(editableTables));
      const sourceTable = editableTables.find(t => t.tableIdentifier === tableId);

      if (!sourceTable?.id) {
        throw new Error('Table ID not found');
      }

      const updatedTables = tablesDeepCopy.map((table: TableDefinition) => {
        if (table.tableIdentifier === tableId) {
          return table;
        }
        return table;
      });

      // Call API to update the table if we're in management mode
      const sourceId = window.location.pathname.split('/')[2];
      const isManagementPage = window.location.pathname.includes('/manage');
      
      if (isManagementPage && sourceId) {
        try {
          await axiosInstance.put(
            endpoints.dataSource.tables.update(
              sourceId.toString(),
              sourceTable.id.toString()
            ),
            { tableDescription: sourceTable.tableDescription }
          );
        } catch (error: any) {
          console.error('Error updating table description:', error);
          showToast('Failed to update table description on server', 'error');
          return;
        }
      }

      setState(prev => ({
        ...prev,
        editableTables: updatedTables,
        filteredTables: updatedTables,
        editingTableDescription: false
      }));

      if (onTablesUpdate) {
        onTablesUpdate(updatedTables);
      }

      showToast('Table description updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error saving table description:', error);
      showToast('Failed to save table description', 'error');
    }
  }, [editableTables, onTablesUpdate, showToast]);

  // Render component
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', width: '100%' }}>
      {/* Toast notification */}
      <AnimatePresence>
        {toast.visible && (
          <m.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={toastVariants}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 9999,
            }}
          >
            <Paper
              elevation={4}
              sx={{
                px: 2.5,
                py: 1.75,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(theme.palette[toast.type].dark, 0.95)
                  : alpha(theme.palette[toast.type].light, 0.95),
                color: theme.palette[toast.type].contrastText,
                maxWidth: { xs: '90vw', sm: 400 },
              }}
            >
              <m.div variants={toastChildVariants}>
                <Iconify
                  icon={(() => {
                    if (toast.type === 'success') return 'eva:checkmark-circle-2-fill';
                    if (toast.type === 'error') return 'eva:alert-circle-fill';
                    return 'eva:info-fill';
                  })()}
                  width={24}
                  height={24}
                  sx={{
                    filter: `drop-shadow(0 1px 2px ${alpha(theme.palette.common.black, 0.3)})`,
                  }}
                />
              </m.div>
              <m.div variants={toastChildVariants} style={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {toast.message}
                </Typography>
              </m.div>
            </Paper>
          </m.div>
        )}
      </AnimatePresence>

      {/* Relation dialog */}
      <Dialog
        open={relationDialog.open}
        onClose={handleRelationDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 24px rgba(0, 0, 0, 0.4)'
              : '0 12px 24px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.primary.dark, 0.1)
            : alpha(theme.palette.primary.lighter, 0.2),
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '& .MuiTypography-root': {
            fontSize: '1.25rem',
            fontWeight: 600,
          }
        }}>
          <AddLinkIcon sx={{ color: 'primary.main' }} />
          Add New Relation
        </DialogTitle>

        <DialogContent sx={{ py: 3.5, px: { xs: 2.5, sm: 3 } }}>
          <DialogContentText sx={{ mb: 3 }}>
            Create a relationship between database columns. Choose the target table and column, then select the type of relationship.
          </DialogContentText>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{ color: 'primary.main' }}>Source</Box>
                <Chip 
                  size="small" 
                  label="Starting point" 
                  color="primary" 
                  variant="outlined"
                  sx={{ height: 20 }}
                />
              </Typography>
              <Paper variant="outlined" sx={{
                p: 2.5,
                borderRadius: 3,
                mb: 2,
                border: `1px solid ${alpha(theme.palette.grey[theme.palette.mode === 'dark' ? 700 : 300], 0.7)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Table:</strong> {relationDialog.sourceTableId}
                </Typography>
                <Typography variant="body2">
                  <strong>Column:</strong> {relationDialog.sourceColumnId}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{ color: 'info.main' }}>Target</Box>
                <Chip 
                  size="small" 
                  label="Destination" 
                  color="info" 
                  variant="outlined"
                  sx={{ height: 20 }}
                />
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="target-table-label">Target Table</InputLabel>
                <Select
                  labelId="target-table-label"
                  value={relationDialog.targetTableId}
                  label="Target Table"
                  onChange={(e) => updateRelationDialog('targetTableId', e.target.value as string)}
                  sx={{ borderRadius: 3 }}
                >
                  {editableTables.map((table) => (
                    <MenuItem 
                      key={table.tableIdentifier} 
                      value={table.tableIdentifier}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box component="span" sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%',
                        bgcolor: table.tableIdentifier === relationDialog.sourceTableId ? 'warning.main' : 'success.main',
                        flexShrink: 0
                      }} />
                      {table.tableIdentifier}
                      {table.tableIdentifier === relationDialog.sourceTableId && (
                        <Chip 
                          size="small" 
                          label="Current" 
                          color="warning" 
                          variant="outlined"
                          sx={{ ml: 'auto', height: 20 }}
                        />
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!relationDialog.targetTableId}>
                <InputLabel id="target-column-label">Target Column</InputLabel>
                <Select
                  labelId="target-column-label"
                  value={relationDialog.targetColumnId}
                  label="Target Column"
                  onChange={(e) => updateRelationDialog('targetColumnId', e.target.value as string)}
                  sx={{ borderRadius: 3 }}
                >
                  {editableTables
                    .find((t) => t.tableIdentifier === relationDialog.targetTableId)
                    ?.columns.map((column) => (
                      <MenuItem 
                        key={column.columnIdentifier} 
                        value={column.columnIdentifier}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        {column.isPrimaryKey && <KeyIcon fontSize="small" sx={{ color: 'warning.main' }} />}
                        <span>{column.columnIdentifier}</span>
                        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                          ({column.columnType})
                        </Typography>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Relation Type
                <Tooltip title="Choose how the tables are related to each other">
                  <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </Tooltip>
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <RelationTypeSelector
                  value={relationDialog.relationType}
                  onChange={(type) => updateRelationDialog('relationType', type)}
                  disabled={!relationDialog.targetTableId || !relationDialog.targetColumnId}
                />

                <Box sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.info.main, 0.1)
                }}>
                  <InfoOutlinedIcon color="info" fontSize="small" sx={{ mt: 0.25 }} />
                  <Box>
                    <Typography variant="body2" color="info.main" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {(() => {
                        if (relationDialog.relationType === 'OTO') return 'One-to-One Relationship';
                        if (relationDialog.relationType === 'OTM') return 'One-to-Many Relationship';
                        if (relationDialog.relationType === 'MTO') return 'Many-to-One Relationship';
                        return '';
                      })()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      {(() => {
                        const source = relationDialog.sourceTableId;
                        const target = relationDialog.targetTableId || 'target';
                        
                        if (relationDialog.relationType === 'OTO') {
                          return `Each record in ${source} corresponds to exactly one record in ${target}, and vice versa.`;
                        }
                        if (relationDialog.relationType === 'OTM') {
                          return `Each record in ${source} can be associated with multiple records in ${target}, but each ${target} record links to only one ${source}.`;
                        }
                        if (relationDialog.relationType === 'MTO') {
                          return `Multiple records in ${source} can be associated with one record in ${target}, but each ${source} record links to only one ${target}.`;
                        }
                        return '';
                      })()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ 
          px: 3, 
          py: 2.5,
          bgcolor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.5)
            : alpha(theme.palette.grey[50], 0.8),
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Button
            onClick={handleRelationDialogClose}
            color="inherit"
            variant="outlined"
            sx={{ borderRadius: 3 }}
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await addNewRelation();
            }}
            color="primary"
            variant="contained"
            sx={{ borderRadius: 3 }}
            startIcon={<AddLinkIcon />}
            disabled={!relationDialog.targetTableId || !relationDialog.targetColumnId}
          >
            Add Relation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main layout grid */}
      <Grid
        container
        spacing={{ xs: 2, sm: 3 }}
        sx={{ alignItems: 'stretch' }}
      >
        {/* Table List Panel */}
        <Grid 
          item 
          {...gridSizes.tableList}
          key="table-list-panel"
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', md: 700 },
            minHeight: { xs: 500, sm: 600, md: 700 },
          }}>
            {/* Search and AI Button row */}
            <Box sx={{
              mb: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              width: '100%',
            }}>
              <Box sx={{ flexGrow: 1, position: 'relative' }}>
                <StyledSearchInput
                  placeholder={`Search ${filteredTables.length} tables or columns...`}
                  value={searchQuery}
                  onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                  startAdornment={
                    <m.div
                      animate={{
                        scale: searchQuery ? [1, 1.2, 1] : 1,
                        color: searchQuery ? theme.palette.primary.main : theme.palette.text.secondary,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <SearchIcon
                        fontSize="small"
                        sx={{
                          mr: 1,
                          transition: 'color 0.2s ease'
                        }}
                      />
                    </m.div>
                  }
                  endAdornment={
                    <AnimatePresence mode="wait">
                      {searchQuery ? (
                        <m.div
                          key="clear"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => setState(prev => ({ ...prev, searchQuery: '' }))}
                            edge="end"
                            sx={{
                              opacity: 0.7,
                              '&:hover': { opacity: 1 },
                              transition: 'opacity 0.2s ease'
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </m.div>
                      ) : (
                        <m.div
                          key="shortcut"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Tooltip title="Ctrl/⌘+F to focus">
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.disabled',
                                mr: 1,
                                display: { xs: 'none', sm: 'block' }
                              }}
                            >
                              ⌘F
                            </Typography>
                          </Tooltip>
                        </m.div>
                      )}
                    </AnimatePresence>
                  }
                  fullWidth
                  inputRef={searchInputRef}
                  aria-label="Search tables or columns"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <m.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          right: 0,
                          bottom: -20,
                          color: filteredTables.length > 0 ? 'text.secondary' : 'error.main',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {filteredTables.length > 0 ? (
                          <>Found {filteredTables.length} tables</>
                        ) : (
                          <>No matches found</>
                        )}
                      </Typography>
                    </m.div>
                  )}
                </AnimatePresence>
              </Box>

              {/* AI tooltip and button */}
              <Tooltip
                title={aiLoading ? "Generating descriptions..." : "Auto-generate descriptions for all columns"}
                arrow
                placement="top-end"
                open={aiButtonTooltipOpen}
                onOpen={() => setState(prev => ({ ...prev, aiButtonTooltipOpen: true }))}
                onClose={() => setState(prev => ({ ...prev, aiButtonTooltipOpen: false }))}
              >
                <AIButtonWrapper isAnimating={aiLoading}>
                  <AIFillButton
                    onClick={fillAllDescriptionsWithAI}
                    onMouseEnter={() => setState(prev => ({ ...prev, aiButtonTooltipOpen: true }))}
                    onMouseLeave={() => setState(prev => ({ ...prev, aiButtonTooltipOpen: false }))}
                    disabled={aiLoading || !editableTables.length}
                    startIcon={aiLoading ? <CircularProgress size={16} color="inherit" /> : <AutoFixHighIcon />}
                    aria-label="Auto-generate descriptions"
                    sx={{ px: { xs: 1.5, sm: 2 } }}
                  >
                    {isMobile ? "Auto-fill" : "Auto-fill Descriptions"}
                  </AIFillButton>
                </AIButtonWrapper>
              </Tooltip>
            </Box>

            {/* Table list with scrolling */}
            <Box
              ref={tableListRef}
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                pt: 2,
                pr: 1,
                height: { xs: '500px', sm: '600px', md: 'calc(700px - 64px)' },
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': { width: 8 },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: alpha(theme.palette.common.black, 0.05),
                  borderRadius: 4,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  borderRadius: 4,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.5),
                  }
                },
              }}
            >
              <AnimatePresence>
                {(() => {
                  // Handle loading state
                  if (tablesLoading) {
                    return (
                      <FadeInTransition
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Stack spacing={2.5}>
                          {[...Array(3)].map((_, index) => (
                            <StyledCard key={`skeleton-${index}`}>
                              <CardHeader
                                title={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                      width: 180,
                                      height: 24,
                                      borderRadius: 1,
                                      animation: 'pulse 1.5s ease-in-out 0.5s infinite',
                                      bgcolor: (t: any) => alpha(t.palette.text.disabled, 0.1),
                                      '@keyframes pulse': {
                                        '0%': {
                                          opacity: 0.6,
                                        },
                                        '50%': {
                                          opacity: 0.3,
                                        },
                                        '100%': {
                                          opacity: 0.6,
                                        }
                                      }
                                    }} />
                                  </Box>
                                }
                                sx={{ p: 2 }}
                              />
                              <Box sx={{ p: { xs: 1, sm: 2 } }}>
                                <TableSkeleton />
                              </Box>
                            </StyledCard>
                          ))}
                        </Stack>
                      </FadeInTransition>
                    );
                  }

                  // Handle empty tables state
                  if (filteredTables.length === 0) {
                    // Helper functions for conditional text/icons
                    const getEmptyStateIcon = () => {
                      if (searchQuery) return "eva:search-outline";
                      return "eva:database-outline";
                    };

                    const getEmptyStateMessage = () => {
                      if (searchQuery) return "Try a different search term";
                      return "Tables will appear here when available";
                    };

                    return (
                      <FadeInTransition
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <EmptyStateMessage>
                          <Iconify
                            icon={getEmptyStateIcon()}
                            sx={{
                              width: 40,
                              height: 40,
                              color: 'text.secondary',
                              opacity: 0.5,
                              mb: 1
                            }}
                          />
                          <Typography variant="subtitle1" color="text.secondary">
                            {searchQuery ? "No matches found" : "No tables found"}
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            {getEmptyStateMessage()}
                          </Typography>
                          {searchQuery && (
                            <Button
                              variant="text"
                              color="primary"
                              size="small"
                              onClick={() => setState(prev => ({ ...prev, searchQuery: '' }))}
                              sx={{ mt: 2 }}
                              startIcon={<CloseIcon />}
                            >
                              Clear search
                            </Button>
                          )}
                        </EmptyStateMessage>
                      </FadeInTransition>
                    );
                  }

                  // Handle populated tables state
                  return (
                    <Stack key="tables" spacing={2.5}>
                      {filteredTables.map((table, index) => (
                        <m.div
                          key={table.tableIdentifier}
                          id={`table-${table.tableIdentifier}`}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={tableVariants}
                          layout
                        >
                          <StyledCard
                            selected={selectedTable === table.tableIdentifier}
                            sx={{ cursor: 'default' }} // Changed from pointer to default
                          >
                            <StyledTableHeader
                              onClick={() => toggleTable(table.tableIdentifier)}
                              sx={{
                                pb: expandedTables[table.tableIdentifier] ? 1 : 2,
                                ...(expandedTables[table.tableIdentifier] && {
                                  borderBottom: (t: any) => `1px dashed ${t.palette.divider}`,
                                }),
                                background: (t: any) => getBackgroundColor(t, selectedTable === table.tableIdentifier),
                                cursor: 'pointer',
                              }}
                              title={
                                <Box>
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                  >
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleTable(table.tableIdentifier);
                                        }}
                                        sx={{
                                          transition: 'transform 0.3s ease, background-color 0.2s ease',
                                          transform: expandedTables[table.tableIdentifier] ? 'rotate(-180deg)' : 'rotate(0deg)',
                                          color: expandedTables[table.tableIdentifier] ? 'primary.main' : 'text.secondary',
                                          bgcolor: (t: any) => alpha(
                                            expandedTables[table.tableIdentifier]
                                              ? t.palette.primary.main
                                              : t.palette.action.selected,
                                            expandedTables[table.tableIdentifier] ? 0.15 : 0.05
                                          ),
                                          '&:hover': {
                                            bgcolor: (t: any) => alpha(t.palette.primary.main, 0.2),
                                          },
                                        }}
                                        aria-label={`Toggle table ${table.tableIdentifier}`}
                                        aria-expanded={expandedTables[table.tableIdentifier]}
                                      >
                                        <KeyboardArrowDownIcon />
                                      </IconButton>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative' }}>
                                        <Typography
                                          variant="subtitle1"
                                          sx={{
                                            fontWeight: selectedTable === table.tableIdentifier ? 700 : 500,
                                            color: selectedTable === table.tableIdentifier ? 'primary.main' : 'text.primary',
                                            transition: 'color 0.2s ease, font-weight 0.2s ease',
                                            ...(searchQuery?.trim() && table?.tableIdentifier?.toLowerCase().includes(searchQuery.toLowerCase()) && {
                                              position: 'relative',
                                              '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                bottom: -2,
                                                left: 0,
                                                width: '100%',
                                                height: '2px',
                                                backgroundColor: 'primary.main',
                                                opacity: 0.5,
                                              }
                                            })
                                          }}
                                        >
                                          <HighlightedText text={table?.tableIdentifier} searchQuery={searchQuery} />
                                        </Typography>
                                        {searchQuery?.trim() && Array.isArray(table?.columns) && table?.columns.some(col => {
                                          if (!col) return false;
                                          const query = searchQuery?.toLowerCase() || '';
                                          return (
                                            (col?.columnIdentifier?.toLowerCase() || '').includes(query) ||
                                            (col?.columnDescription?.toLowerCase() || '').includes(query) ||
                                            (col?.columnType?.toLowerCase() || '').includes(query)
                                          );
                                        }) && (
                                          <Chip
                                            size="small"
                                            label="Has matches"
                                            color="primary"
                                            variant="outlined"
                                            sx={{
                                              height: 20,
                                              ml: 1,
                                              '& .MuiChip-label': {
                                                px: 1,
                                                fontSize: '0.7rem',
                                              }
                                            }}
                                          />
                                        )}
                                      </Box>
                                    </Stack>
                                    <Stack
                                      direction="row"
                                      spacing={{ xs: 2, sm: 3, md: 4 }}
                                      alignItems="center"
                                    >
                                      <StyledBadge
                                        badgeContent={getPrimaryKeyCount(table.tableIdentifier)}
                                        color="warning"
                                        showZero
                                      >
                                        <Tooltip title="Primary keys">
                                          <KeyIcon
                                            fontSize="small"
                                            sx={{
                                              color: 'warning.main',
                                              opacity: getPrimaryKeyCount(table.tableIdentifier) > 0 ? 1 : 0.4
                                            }}
                                          />
                                        </Tooltip>
                                      </StyledBadge>
                                      <StyledBadge
                                        badgeContent={getRelationCount(table.tableIdentifier)}
                                        color="info"
                                        showZero
                                      >
                                        <Tooltip title="Relations">
                                          <LinkIcon
                                            fontSize="small"
                                            sx={{
                                              color: 'info.main',
                                              opacity: getRelationCount(table.tableIdentifier) > 0 ? 1 : 0.4
                                            }}
                                          />
                                        </Tooltip>
                                      </StyledBadge>
                                      <Chip
                                        label={getColumnCount(table.tableIdentifier)}
                                        size="small"
                                        color={selectedTable === table.tableIdentifier ? 'primary' : 'default'}
                                        sx={{
                                          height: 20,
                                          borderRadius: 10,
                                          '& .MuiChip-label': { px: 1, fontSize: '0.75rem' }
                                        }}
                                      />
                                    </Stack>
                                  </Stack>
                                  {!expandedTables[table.tableIdentifier] && (
                                    <Box className="table-stats">
                                      <span>{getColumnCount(table.tableIdentifier)} columns</span>
                                      <span>•</span>
                                      <span>{getPrimaryKeyCount(table.tableIdentifier)} keys</span>
                                      <span>•</span>
                                      <span>{getRelationCount(table.tableIdentifier)} relations</span>
                                    </Box>
                                  )}
                                  <Box className="table-description">
                                    {editingTableDescription && editingTableId === table.tableIdentifier ? (
                                      <DescriptionTextField
                                        size="small"
                                        value={table.tableDescription || ''}
                                        onChange={(e) => handleTableDescriptionChange(table.tableIdentifier, e.target.value)}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            saveTableDescription(table.tableIdentifier);
                                          }
                                        }}
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder="Enter table description..."
                                        aria-label="Edit table description"
                                      />
                                    ) : (
                                      <Box
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setState(prev => ({
                                            ...prev,
                                            editingTableDescription: true,
                                            editingTableId: table.tableIdentifier
                                          }));
                                        }}
                                        sx={{ cursor: 'text' }}
                                      >
                                        <Typography
                                          variant="body2"
                                          color={table.tableDescription ? 'text.primary' : 'text.secondary'}
                                          sx={{
                                            fontStyle: table.tableDescription ? 'normal' : 'italic',
                                            wordBreak: 'break-word',
                                          }}
                                        >
                                          {table.tableDescription ? (
                                            <HighlightedText text={table.tableDescription} searchQuery={searchQuery} />
                                          ) : (
                                            'No table description provided'
                                          )}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              }
                            />
                            <Collapse in={expandedTables[table.tableIdentifier]}>
                              <Box sx={{ p: { xs: 1, sm: 2 } }}>
                                <StyledTableContainer>
                                  <Table size="small" aria-label={`${table.tableIdentifier} columns`}>
                                    <TableHead>
                                      <TableRow>
                                        <TableCell scope="col" className="column-name">Column</TableCell>
                                        <TableCell scope="col" className="column-type">Type</TableCell>
                                        <TableCell scope="col" className="column-description">Description</TableCell>
                                        <TableCell scope="col" className="column-relations">Relations</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      <AnimatePresence>
                                        {table.columns
                                          .filter(column => column && column.columnIdentifier) // Filter out null or invalid columns
                                          .map((column, colIndex) =>
                                            renderColumnRow(table, column, colIndex)
                                          )}
                                      </AnimatePresence>
                                    </TableBody>
                                  </Table>
                                </StyledTableContainer>
                              </Box>
                            </Collapse>
                          </StyledCard>
                        </m.div>
                      ))}
                    </Stack>
                  );
                })()}
              </AnimatePresence>
            </Box>
          </Box>
        </Grid>

        {/* Schema Diagram Panel */}
        <Grid 
          item 
          {...gridSizes.diagram}
          key="schema-diagram-panel"
        >
          <Paper
            elevation={4}
            sx={{
              height: { xs: 'auto', md: 700 },
              minHeight: { xs: 500, sm: 600, md: 700 },
              overflow: 'hidden',
              p: { xs: 2, sm: 3 },
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              position: 'relative',
              background: (() => {
                if (theme.palette.mode === 'dark') {
                  return `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.grey[900], 0.8)} 100%)`;
                }
                return `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.grey[50], 0.85)} 100%)`;
              })(),
              border: `1px solid ${alpha(theme.palette.grey[theme.palette.mode === 'dark' ? 700 : 300], theme.palette.mode === 'dark' ? 0.3 : 0.7)}`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{
              mb: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1
            }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify
                  icon="eva:diagram-fill"
                  width={24}
                  height={24}
                  sx={{ color: 'primary.main' }}
                />
                <Typography variant="h6">Schema Diagram</Typography>
              </Stack>

              <Stack direction="row" spacing={1}>
                {tablesLoading && (
                  <Box
                    sx={{
                      width: 80,
                      height: 28,
                      borderRadius: 2,
                      animation: 'pulse 1.5s ease-in-out 0.5s infinite',
                      bgcolor: (t: any) => alpha(t.palette.text.disabled, 0.1),
                      '@keyframes pulse': {
                        '0%': { opacity: 0.6 },
                        '50%': { opacity: 0.3 },
                        '100%': { opacity: 0.6 },
                      },
                    }}
                  />
                )}

                {!tablesLoading && selectedTable && (
                  <Chip
                    label={selectedTable}
                    color="primary"
                    size="small"
                    onDelete={() => setState(prev => ({ ...prev, selectedTable: null }))}
                    sx={{ height: 28, borderRadius: 8 }}
                  />
                )}

                {!tablesLoading && !selectedTable && filteredTables.length > 0 && (
                  <Chip
                    label="Select a table"
                    variant="outlined"
                    size="small"
                    icon={<KeyboardArrowDownIcon fontSize="small" />}
                    sx={{ height: 28, borderRadius: 8 }}
                  />
                )}

                <Tooltip title="Keyboard shortcuts">
                  <IconButton
                    size="small"
                    sx={{ color: 'text.secondary' }}
                    onClick={() => setShortcutsDialogOpen(true)}
                  >
                    <Iconify icon="eva:info-outline" width={20} height={20} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box
              sx={{
                flexGrow: 1,
                position: 'relative',
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.2 : 0.5)}`,
                height: { xs: '400px', sm: '500px', md: 'calc(700px - 100px)' },
                overflow: 'hidden',
                background: (() => {
                  if (theme.palette.mode === 'dark') {
                    return `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.5)} 0%, ${alpha(theme.palette.grey[900], 0.4)} 100%)`;
                  }
                  return `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.3)} 0%, ${alpha(theme.palette.grey[100], 0.2)} 100%)`;
                })(),
                backgroundImage: (() => {
                  if (theme.palette.mode === 'dark') {
                    return `radial-gradient(${alpha(theme.palette.grey[800], 0.4)} 1px, transparent 1px), 
                     radial-gradient(${alpha(theme.palette.grey[800], 0.3)} 1px, transparent 1px)`;
                  }
                  return `radial-gradient(${alpha(theme.palette.grey[400], 0.2)} 1px, transparent 1px), 
                     radial-gradient(${alpha(theme.palette.grey[400], 0.15)} 1px, transparent 1px)`;
                })(),
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
                backdropFilter: 'blur(2px)',
              }}
            >
              {tablesLoading && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}
                >
                  <CircularProgress size={40} />
                </Box>
              )}

              {!tablesLoading && filteredTables.length > 0 && (
                <Box
                  sx={{
                    width: '92%',
                    height: '92%',
                    margin: 'auto',
                    position: 'relative',
                    top: '4%',
                  }}
                >
                  <SchemaVisualization
                    tables={editableTables.map(table => {
                      const normalizedTable: TableDefinition = {
                        ...table,
                        columns: table.columns.map(column => ({
                          ...column,
                          relations: normalizeRelations(column, editableTables)
                        }))
                      };
                      return normalizedTable;
                    })}
                    selectedTable={selectedTable}
                    onTableClick={toggleTable}
                  />
                </Box>
              )}

              {!tablesLoading && filteredTables.length === 0 && (
                <EmptyStateMessage>
                  <Iconify
                    icon="eva:layers-outline"
                    sx={{ width: 48, height: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }}
                  />
                  <Typography variant="subtitle1" color="text.secondary">
                    No schema to visualize
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Tables will appear here when available
                  </Typography>
                </EmptyStateMessage>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Keyboard shortcuts helper */}
      <Dialog
        open={shortcutsDialogOpen}
        maxWidth="xs"
        onClose={() => setShortcutsDialogOpen(false)}
      >
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>Navigation</Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">↑ / ↓ - Navigate between tables</Typography>
                <Typography variant="body2">Tab / Shift+Tab - Cycle through tables</Typography>
                <Typography variant="body2">Space / Enter - Expand/collapse selected table</Typography>
                <Typography variant="body2">Escape - Collapse table or exit editing</Typography>
              </Stack>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>Search & Edit</Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">Ctrl/⌘ + F - Focus search</Typography>
                <Typography variant="body2">Escape - Clear search or cancel editing</Typography>
                <Typography variant="body2">Click/Enter - Edit column</Typography>
                <Typography variant="body2">Ctrl/⌘ + S - Save changes</Typography>
              </Stack>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>Relations</Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">Click + icon - Add new relation</Typography>
                <Typography variant="body2">Hover + click X - Remove relation</Typography>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShortcutsDialogOpen(false)}
            color="primary"
            variant="contained"
            startIcon={<Iconify icon="eva:checkmark-fill" />}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}