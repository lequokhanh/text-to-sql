import { m, AnimatePresence } from 'framer-motion';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Badge from '@mui/material/Badge';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
// Icons
import KeyIcon from '@mui/icons-material/Key';
import AddIcon from '@mui/icons-material/Add';
import InputBase from '@mui/material/InputBase';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import LinkIcon from '@mui/icons-material/Link';
import SaveIcon from '@mui/icons-material/Save';
import Search from '@mui/icons-material/Search';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import CloseIcon from '@mui/icons-material/Close';
import DialogTitle from '@mui/material/DialogTitle';
import ButtonGroup from '@mui/material/ButtonGroup';
import FormControl from '@mui/material/FormControl';
import AddLinkIcon from '@mui/icons-material/AddLink';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DialogContentText from '@mui/material/DialogContentText';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { alpha, styled, useTheme, keyframes } from '@mui/material/styles';

import { useDebounce } from 'src/hooks/use-debounce';

import Iconify from 'src/components/iconify';

import { TableDefinition, ColumnDefinition } from 'src/types/database';

import { SchemaVisualization } from './schema-visualization';

// Define relation type constants to avoid typos
type RelationType = 'OTO' | 'OTM' | 'MTO' | 'MTM';

// Define relation interface
interface RelationDefinition {
  tableIdentifier: string;
  columnIdentifier?: string;
  toColumn: string;
  type: RelationType;
}


// ----------------------------------------------------------------------
// Styled components
interface StyledCardProps {
  selected?: boolean;
}

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'selected',
})<StyledCardProps>(({ theme, selected }) => {
  const isDark = theme.palette.mode === 'dark';

  let baseBoxShadow = '';
  let selectedBoxShadow = '';
  let hoverBoxShadow = '';
  let background = '';

  if (isDark) {
    baseBoxShadow = `0 8px 16px -8px ${alpha(theme.palette.common.black, 0.3)}, 0 4px 8px -4px ${alpha(theme.palette.common.black, 0.2)}`;
    selectedBoxShadow = `0 0 0 4px ${alpha(theme.palette.primary.dark, 0.3)}, 0 8px 24px -4px ${alpha(theme.palette.primary.dark, 0.5)}`;
    background = alpha(theme.palette.background.paper, 0.7);

    if (selected) {
      hoverBoxShadow = `0 0 0 4px ${alpha(theme.palette.primary.dark, 0.4)}, 0 12px 32px -4px ${alpha(theme.palette.primary.dark, 0.6)}`;
    } else {
      hoverBoxShadow = `0 12px 24px -8px ${alpha(theme.palette.common.black, 0.5)}, 0 8px 16px -4px ${alpha(theme.palette.common.black, 0.4)}`;
    }
  } else {
    baseBoxShadow = `0 8px 16px -8px ${alpha(theme.palette.common.black, 0.1)}, 0 4px 8px -4px ${alpha(theme.palette.common.black, 0.06)}`;
    selectedBoxShadow = `0 0 0 4px ${alpha(theme.palette.primary.light, 0.2)}, 0 8px 24px -4px ${alpha(theme.palette.primary.light, 0.4)}`;
    background = theme.palette.background.paper;

    if (selected) {
      hoverBoxShadow = `0 0 0 4px ${alpha(theme.palette.primary.light, 0.3)}, 0 12px 32px -4px ${alpha(theme.palette.primary.light, 0.5)}`;
    } else {
      hoverBoxShadow = `0 12px 24px -8px ${alpha(theme.palette.common.black, 0.15)}, 0 8px 16px -4px ${alpha(theme.palette.common.black, 0.1)}`;
    }
  }

  const styles: Record<string, any> = {
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
  };

  if (selected) {
    styles.borderColor = theme.palette.primary.main;
    styles.borderWidth = 2;
    styles.borderStyle = 'solid';
  }

  return styles;
});

const StyledTableContainer = styled(TableContainer)`
  border-radius: 4; // Removed rounded corners
  overflow: hidden;
  border: 1px solid ${props => alpha(props.theme.palette.divider, props.theme.palette.mode === 'dark' ? 0.3 : 0.7)};
  box-shadow: ${props => {
    if (props.theme.palette.mode === 'dark') {
      return `0 4px 12px -2px ${alpha(props.theme.palette.common.black, 0.3)}`;
    }
    return `0 4px 12px -2px ${alpha(props.theme.palette.common.black, 0.05)}`;
  }};
  backdrop-filter: blur(4px);
  
  & .MuiTableCell-root {
    border-color: ${props => alpha(props.theme.palette.divider, props.theme.palette.mode === 'dark' ? 0.2 : 0.5)};
    white-space: normal;
    word-break: break-word;
    overflow-wrap: break-word;
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  
  & .MuiTableCell-head {
    font-size: 0.8rem;
    font-weight: 600;
    background-color: ${props => {
    if (props.theme.palette.mode === 'dark') {
      return alpha(props.theme.palette.background.paper, 0.7);
    }
    return alpha(props.theme.palette.grey[50], 0.9);
  }};
    color: ${props => {
    if (props.theme.palette.mode === 'dark') {
      return alpha(props.theme.palette.common.white, 0.85);
    }
    return props.theme.palette.grey[800];
  }};
    letter-spacing: 0.03em;
    text-transform: uppercase;
    padding-top: 12px;
    padding-bottom: 12px;
  }
  
  & .MuiTableCell-body {
    font-size: 0.875rem;
    color: ${props => {
    if (props.theme.palette.mode === 'dark') {
      return alpha(props.theme.palette.common.white, 0.75);
    }
    return props.theme.palette.grey[700];
  }};
  }
  
  & .MuiTableRow-root:nth-of-type(even) {
    background-color: ${props => {
    if (props.theme.palette.mode === 'dark') {
      return alpha(props.theme.palette.common.black, 0.15);
    }
    return alpha(props.theme.palette.grey[50], 0.5);
  }};
  }
  
  width: 100%;
  max-width: 100%;
  
  @media (min-width: 960px) {
    max-width: 820px;
  }
  
  @media (min-width: 1200px) {
    max-width: 920px;
  }
  
  margin: 0 auto;
  
  & .column-name {
    width: 25%;
    min-width: 120px;
    max-width: 200px;
  }
  
  & .column-type {
    width: 15%;
    min-width: 80px;
    max-width: 120px;
  }
  
  & .column-description {
    width: 35%;
    min-width: 180px;
    max-width: 300px;
  }
  
  & .column-relations {
    width: 25%;
    min-width: 150px;
    max-width: 250px;
    position: relative;
  }
`;

const StyledSearchInput = styled(InputBase)(({ theme }) => ({
  borderRadius: 16,
  backgroundColor: theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.06)
    : alpha(theme.palette.common.black, 0.03),
  padding: theme.spacing(0.75, 2),
  width: '100%',
  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.08)
      : alpha(theme.palette.common.black, 0.05),
    borderColor: alpha(theme.palette.primary.main, 0.3),
  },
  '&.Mui-focused': {
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.1)
      : alpha(theme.palette.common.black, 0.06),
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
  },
}));

const EditActionsContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(0.5),
  right: theme.spacing(0.5),
  display: 'flex',
  gap: theme.spacing(0.25),
  padding: theme.spacing(0.5),
  zIndex: 10,
  backgroundColor: theme.palette.background.paper,
  borderRadius: 12,
  boxShadow: theme.palette.mode === 'dark'
    ? `0 4px 8px ${alpha(theme.palette.common.black, 0.3)}`
    : `0 4px 8px ${alpha(theme.palette.common.black, 0.15)}`,
  border: `1px solid ${theme.palette.mode === 'dark'
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
}));

const RowActionButtons = styled(Box)(({ theme }) => {
  const isDarkMode = theme.palette.mode === 'dark';
  const backgroundColor = isDarkMode
    ? alpha(theme.palette.grey[900], 0.85)
    : alpha(theme.palette.background.paper, 0.95);
  const borderColor = isDarkMode
    ? alpha(theme.palette.common.white, 0.1)
    : alpha(theme.palette.grey[300], 0.7);
  const boxShadow = isDarkMode
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

    // Enhanced backdrop style for better visibility in both modes
    backgroundColor,

    // Glass effect
    backdropFilter: 'blur(8px)',

    // Better border definition
    border: `1px solid ${borderColor}`,

    borderRadius: 8, // Kept border radius for buttons container

    // Enhanced shadow for better depth perception
    boxShadow,

    opacity: 0,
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    // transform: 'translateY(50%) scale(0.8) translateX(10px)',

    // Enhanced hover animation
    '.MuiTableRow-root:hover &': {
      opacity: 1,
      transform: 'translateY(50%) scale(1) translateX(0)',
    },

    // Button styles within container
    '& .MuiIconButton-root': {
      transition: 'all 0.2s ease',
      margin: '0 2px',
      borderRadius: 8, // Kept rounded corners for buttons

      // Better defined background colors
      '&.MuiIconButton-colorPrimary': {
        backgroundColor: isDarkMode
          ? alpha(theme.palette.primary.dark, 0.2)
          : alpha(theme.palette.primary.light, 0.15),
        '&:hover': {
          backgroundColor: isDarkMode
            ? alpha(theme.palette.primary.dark, 0.3)
            : alpha(theme.palette.primary.light, 0.25),
        }
      },

      '&.MuiIconButton-colorInfo': {
        backgroundColor: isDarkMode
          ? alpha(theme.palette.info.dark, 0.2)
          : alpha(theme.palette.info.light, 0.15),
        '&:hover': {
          backgroundColor: isDarkMode
            ? alpha(theme.palette.info.dark, 0.3)
            : alpha(theme.palette.info.light, 0.25),
        }
      },

      '&.MuiIconButton-colorError': {
        backgroundColor: isDarkMode
          ? alpha(theme.palette.error.dark, 0.2)
          : alpha(theme.palette.error.light, 0.15),
        '&:hover': {
          backgroundColor: isDarkMode
            ? alpha(theme.palette.error.dark, 0.3)
            : alpha(theme.palette.error.light, 0.25),
        }
      },

      // Enhanced hover effect
      '&:hover': {
        transform: 'scale(1.1)',
      }
    },
  };
});

const FadeInTransition = styled(m.div)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
}));

const StyledRelationChip = styled(Chip)(({ theme }) => {
  const isDarkMode = theme.palette.mode === 'dark';
  const backgroundColor = isDarkMode
    ? alpha(theme.palette.info.dark, 0.15)
    : alpha(theme.palette.info.light, 0.12);
  const textColor = isDarkMode
    ? alpha(theme.palette.info.light, 0.9)
    : theme.palette.info.dark;
  const borderColor = isDarkMode
    ? alpha(theme.palette.info.dark, 0.3)
    : alpha(theme.palette.info.light, 0.3);
  const hoverBackgroundColor = isDarkMode
    ? alpha(theme.palette.info.dark, 0.25)
    : alpha(theme.palette.info.light, 0.25);
  const shadowColor = alpha(theme.palette.common.black, isDarkMode ? 0.25 : 0.07);
  const hoverShadowColor = alpha(theme.palette.common.black, isDarkMode ? 0.3 : 0.1);
  const iconColor = isDarkMode
    ? alpha(theme.palette.info.light, 0.8)
    : theme.palette.info.dark;
  const deleteIconColor = isDarkMode
    ? alpha(theme.palette.error.light, 0.7)
    : theme.palette.error.dark;
  const deleteIconHoverColor = isDarkMode
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
    borderRadius: 12, // Increased border radius for chips
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
        backgroundColor: isDarkMode
          ? alpha(theme.palette.error.dark, 0.2)
          : alpha(theme.palette.error.light, 0.2),
      },
    },
  };
});

const StyledColumnTypeChip = styled(Chip)(({ theme }) => {
  const isDarkMode = theme.palette.mode === 'dark';
  const backgroundColor = isDarkMode
    ? alpha(theme.palette.grey[800], 0.7)
    : alpha(theme.palette.grey[100], 0.9);
  const textColor = isDarkMode
    ? alpha(theme.palette.common.white, 0.85)
    : theme.palette.grey[700];
  const borderColor = isDarkMode
    ? alpha(theme.palette.grey[700], 0.5)
    : alpha(theme.palette.grey[300], 0.8);
  const innerShadow = isDarkMode
    ? `inset 0 1px 1px ${alpha(theme.palette.common.white, 0.05)}`
    : `inset 0 1px 1px ${alpha(theme.palette.common.white, 0.9)}`;
  const hoverBackground = isDarkMode
    ? alpha(theme.palette.grey[700], 0.8)
    : alpha(theme.palette.grey[200], 0.9);

  return {
    height: 22,
    fontSize: '0.7rem',
    fontWeight: 500,
    backgroundColor,
    color: textColor,
    borderRadius: 12, // Increased border radius for chips
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

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -10,
    top: 8,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
    borderRadius: 12, // Increased border radius
    fontSize: '0.7rem',
    minWidth: 18,
    height: 18,
    boxShadow: theme.palette.mode === 'dark'
      ? `0 0 0 1px ${alpha(theme.palette.common.black, 0.3)}`
      : `0 0 0 1px ${alpha(theme.palette.common.white, 0.3)}`,
  },
}));

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

const MotionTableRow = m(TableRow);

// Relations container with improved scrolling
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

const DescriptionTextField = styled(TextField)(({ theme }) => ({
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
      borderColor: theme.palette.mode === 'dark'
        ? alpha(theme.palette.primary.light, 0.5)
        : alpha(theme.palette.primary.main, 0.5),
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
    }
  }
}));

// Enhanced animation for AI button with theme-aware colors
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

// AI Fill Button with glow effect
interface AIButtonWrapperProps {
  isAnimating: boolean;
  children: React.ReactNode;
}

const AIButtonWrapper = styled('div')<AIButtonWrapperProps>(({ theme, isAnimating }) => ({
  position: 'relative',
  display: 'inline-flex',
  borderRadius: 12,
  // Set CSS variables based on theme mode for the pulse animation
  '--pulse-color-start': theme.palette.mode === 'dark'
    ? alpha(theme.palette.primary.dark, 0.7)
    : alpha(theme.palette.primary.main, 0.7),
  '--pulse-color-mid': theme.palette.mode === 'dark'
    ? alpha(theme.palette.primary.dark, 0)
    : alpha(theme.palette.primary.main, 0),
  '--pulse-color-end': theme.palette.mode === 'dark'
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
}));

// AI Fill Button
const AIFillButton = styled(Button)(({ theme }) => {
  const isDarkMode = theme.palette.mode === 'dark';

  // Background gradient
  const background = isDarkMode
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${theme.palette.primary.main} 50%, ${alpha(theme.palette.primary.dark, 0.85)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${theme.palette.primary.dark} 50%, ${alpha(theme.palette.primary.main, 0.85)} 100%)`;

  // Hover background
  const hoverBackground = isDarkMode
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.95)} 0%, ${theme.palette.primary.main} 60%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`
    : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 60%, ${theme.palette.primary.main} 100%)`;

  // Shadow
  const boxShadow = isDarkMode
    ? `0 4px 12px ${alpha(theme.palette.primary.dark, 0.5)}, 0 2px 4px ${alpha(theme.palette.common.black, 0.3)}`
    : `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}, 0 2px 4px ${alpha(theme.palette.common.black, 0.1)}`;

  // Hover shadow
  const hoverBoxShadow = isDarkMode
    ? `0 6px 16px ${alpha(theme.palette.primary.dark, 0.6)}, 0 3px 6px ${alpha(theme.palette.common.black, 0.4)}`
    : `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}, 0 3px 6px ${alpha(theme.palette.common.black, 0.15)}`;

  // Active shadow
  const activeBoxShadow = isDarkMode
    ? `0 2px 8px ${alpha(theme.palette.primary.dark, 0.4)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.3)}`
    : `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.08)}`;

  // Border
  const border = isDarkMode
    ? `1px solid ${alpha(theme.palette.primary.light, 0.2)}`
    : `1px solid ${alpha(theme.palette.primary.dark, 0.1)}`;

  // Disabled background
  const disabledBackground = isDarkMode
    ? `linear-gradient(135deg, ${alpha(theme.palette.grey[800], 0.7)} 0%, ${alpha(theme.palette.grey[700], 0.7)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.grey[300], 0.8)} 0%, ${alpha(theme.palette.grey[400], 0.8)} 100%)`;

  // Disabled color
  const disabledColor = isDarkMode
    ? theme.palette.grey[500]
    : theme.palette.grey[400];

  // Disabled border
  const disabledBorder = isDarkMode
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
    borderRadius: 16, // Increased border radius for buttons
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    overflow: 'hidden',

    // Enhanced gradient for both light and dark modes
    background,

    // Modern glass morphism effect
    backdropFilter: 'blur(10px)',

    // Improved shadow for depth
    boxShadow,

    // Subtle border for definition
    border,

    // Add subtle shimmer effect with pseudo-element
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

      // Animate shimmer on hover
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

    // Add subtle text shadow for better readability
    '& .MuiButton-startIcon, & .MuiButton-endIcon': {
      filter: `drop-shadow(0 1px 1px ${alpha(theme.palette.common.black, 0.5)})`,
    },
  };
});

// // Action Button
// const ActionButton = styled(Button)(({ theme }) => {
//   const isDarkMode = theme.palette.mode === 'dark';

//   // Base colors
//   const backgroundColor = isDarkMode
//     ? alpha(theme.palette.grey[800], 0.7)
//     : theme.palette.common.white;

//   const textColor = isDarkMode
//     ? theme.palette.common.white
//     : theme.palette.grey[800];

//   // Shadow
//   const boxShadow = isDarkMode
//     ? `0 2px 6px ${alpha(theme.palette.common.black, 0.3)}, 0 1px 2px ${alpha(theme.palette.common.black, 0.2)}`
//     : `0 2px 6px ${alpha(theme.palette.common.black, 0.08)}, 0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`;

//   // Border
//   const border = isDarkMode
//     ? `1px solid ${alpha(theme.palette.common.white, 0.1)}`
//     : `1px solid ${alpha(theme.palette.grey[300], 0.7)}`;

//   // Hover state
//   const hoverBackgroundColor = isDarkMode
//     ? alpha(theme.palette.grey[700], 0.9)
//     : alpha(theme.palette.common.white, 0.95);

//   const hoverBoxShadow = isDarkMode
//     ? `0 4px 10px ${alpha(theme.palette.common.black, 0.35)}, 0 2px 4px ${alpha(theme.palette.common.black, 0.25)}`
//     : `0 4px 10px ${alpha(theme.palette.common.black, 0.1)}, 0 2px 4px ${alpha(theme.palette.common.black, 0.06)}`;

//   // Active state
//   const activeBoxShadow = isDarkMode
//     ? `0 1px 3px ${alpha(theme.palette.common.black, 0.3)}`
//     : `0 1px 3px ${alpha(theme.palette.common.black, 0.07)}`;

//   // Primary variant
//   const primaryBackground = isDarkMode
//     ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.85)} 0%, ${theme.palette.primary.main} 100%)`
//     : `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`;

//   const primaryHoverBackground = isDarkMode
//     ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(theme.palette.primary.main, 1.1)} 100%)`
//     : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 1.1)} 0%, ${alpha(theme.palette.primary.main, 1.1)} 100%)`;

//   // Error variant
//   const errorBackground = isDarkMode
//     ? `linear-gradient(135deg, ${alpha(theme.palette.error.dark, 0.85)} 0%, ${theme.palette.error.main} 100%)`
//     : `linear-gradient(135deg, ${theme.palette.error.light} 0%, ${theme.palette.error.main} 100%)`;

//   return {
//     borderRadius: 16, // Increased border radius for buttons
//     padding: theme.spacing(0.75, 1.5),
//     textTransform: 'none',
//     fontSize: '0.8rem',
//     fontWeight: 500,
//     letterSpacing: '0.02em',

//     // Background based on theme mode
//     backgroundColor,

//     // Better color contrast based on theme
//     color: textColor,

//     // Enhanced shadows by theme
//     boxShadow,

//     // Better defined borders by theme
//     border,

//     // Subtle glass effect
//     backdropFilter: 'blur(4px)',

//     transition: 'all 0.2s ease-in-out',

//     '&:hover': {
//       transform: 'translateY(-1px)',
//       boxShadow: hoverBoxShadow,
//       backgroundColor: hoverBackgroundColor,
//     },

//     '&:active': {
//       transform: 'translateY(0)',
//       boxShadow: activeBoxShadow,
//     },

//     // Button variants
//     '&.MuiButton-containedPrimary': {
//       background: primaryBackground,
//       color: theme.palette.common.white,
//       border: 'none',
//       '&:hover': {
//         background: primaryHoverBackground,
//       },
//       '& .MuiButton-startIcon, & .MuiButton-endIcon': {
//         filter: `drop-shadow(0 1px 1px ${alpha(theme.palette.common.black, 0.3)})`,
//       },
//     },

//     '&.MuiButton-containedError': {
//       background: errorBackground,
//       color: theme.palette.common.white,
//       border: 'none',
//     },
//   };
// });

// Empty state component
const EmptyStateMessage = styled(Paper)(({ theme }) => {
  const isDarkMode = theme.palette.mode === 'dark';

  // Background gradient
  const background = isDarkMode
    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.4)} 0%, ${alpha(theme.palette.background.default, 0.5)} 100%)`
    : `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.grey[50], 0.9)} 100%)`;

  // Border color
  const borderColor = isDarkMode
    ? alpha(theme.palette.grey[700], 0.3)
    : alpha(theme.palette.grey[300], 0.7);

  // Shadow
  const boxShadow = isDarkMode
    ? `inset 0 1px 1px ${alpha(theme.palette.common.white, 0.05)}, 0 6px 12px -6px ${alpha(theme.palette.common.black, 0.4)}`
    : `inset 0 1px 1px ${alpha(theme.palette.common.white, 0.9)}, 0 6px 12px -6px ${alpha(theme.palette.common.black, 0.1)}`;

  // Typography colors  
  const titleColor = isDarkMode
    ? alpha(theme.palette.common.white, 0.85)
    : theme.palette.grey[800];

  const bodyColor = isDarkMode
    ? alpha(theme.palette.common.white, 0.6)
    : theme.palette.grey[600];

  // Icon color
  const iconColor = isDarkMode
    ? alpha(theme.palette.primary.main, 0.3)
    : alpha(theme.palette.primary.light, 0.4);

  const iconShadow = `drop-shadow(0 2px 4px ${alpha(theme.palette.common.black, isDarkMode ? 0.4 : 0.1)})`;

  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
    borderRadius: 20, // Added border radius for empty state
    // Enhanced background with subtle gradient
    background,

    // Improved border for better definition
    border: `1px solid ${borderColor}`,

    // Glass effect
    backdropFilter: 'blur(8px)',

    // Enhanced shadow
    boxShadow,

    textAlign: 'center',
    height: '100%',
    minHeight: 240,

    // Enhanced typography styles
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

    // Enhanced icon styles
    '& .MuiSvgIcon-root, & .iconify': {
      fontSize: 48,
      marginBottom: theme.spacing(2),
      color: iconColor,
      filter: iconShadow,
    }
  };
});

// Define proper types for the RelationTypeSelector component
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
    { value: 'OTO' as const, label: '1:1', tooltip: 'One-to-One' },
    { value: 'OTM' as const, label: '1:n', tooltip: 'One-to-Many' },
    { value: 'MTO' as const, label: 'n:1', tooltip: 'Many-to-One' },
    { value: 'MTM' as const, label: 'n:n', tooltip: 'Many-to-Many' }
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

// Enhanced toast message animations
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
      stiffness: 400,
      damping: 25,
      mass: 1.2,
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
      ease: [0.43, 0.13, 0.23, 0.96] // Custom easing for smooth exit
    }
  }
};

// Variants for child elements in toast
const toastChildVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 }
};

// Enhanced table animations
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
      ease: [0.25, 0.1, 0.25, 1.0], // Custom easing for more natural motion
      scale: {
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1] // Custom spring-like easing for scale
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
      ease: [0.43, 0.13, 0.23, 0.96] // Custom easing for smooth exit
    }
  }
};

// Enhanced row variants for table rows
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
      ease: [0.25, 0.1, 0.25, 1.0] // Custom easing
    }
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.2,
      ease: [0.43, 0.13, 0.23, 0.96] // Custom easing
    }
  }
};

interface Props {
  tables: TableDefinition[];
  onTablesUpdate?: (updatedTables: TableDefinition[]) => void;
}

export function TableDefinitionView({ tables, onTablesUpdate }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Main state
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTables, setFilteredTables] = useState<TableDefinition[]>([]);
  const [editableTables, setEditableTables] = useState<TableDefinition[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiButtonTooltipOpen, setAiButtonTooltipOpen] = useState(false);
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);
  const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null);

  // New relation dialog state
  const [relationDialogOpen, setRelationDialogOpen] = useState(false);
  const [newRelation, setNewRelation] = useState<{
    sourceTableId: string;
    sourceColumnId: string;
    targetTableId: string;
    targetColumnId: string;
    relationType: RelationType;
  }>({
    sourceTableId: '',
    sourceColumnId: '',
    targetTableId: '',
    targetColumnId: '',
    relationType: 'OTO',
  });

  // Toast message state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({
    message: '',
    type: 'info',
    visible: false,
  });

  // Refs
  const tableListRef = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Initialize editable tables when component mounts or tables prop changes
  useEffect(() => {
    if (tables && tables.length > 0) {
      setEditableTables(JSON.parse(JSON.stringify(tables)));

      // Auto-expand the first table if none is expanded
      if (Object.keys(expandedTables).length === 0 && !selectedTable) {
        setExpandedTables({ [tables[0].tableIdentifier]: true });
        setSelectedTable(tables[0].tableIdentifier);
      }
    }
  }, [tables, expandedTables, selectedTable]);

  // Filter tables based on search query
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setFilteredTables(editableTables);
      return;
    }

    const query = debouncedSearchQuery.toLowerCase();
    const filtered = editableTables.filter(
      (table) =>
        table.tableIdentifier.toLowerCase().includes(query) ||
        table.columns.some(
          (col) =>
            col.columnIdentifier.toLowerCase().includes(query) ||
            (col.columnDescription && col.columnDescription.toLowerCase().includes(query)) ||
            col.columnType.toLowerCase().includes(query)
        )
    );
    setFilteredTables(filtered);
  }, [debouncedSearchQuery, editableTables]);

  // Initialize filtered tables
  useEffect(() => {
    setFilteredTables(editableTables);
  }, [editableTables]);

  // Show success toast
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({
      message,
      type,
      visible: true,
    });

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Toggle table expansion and selection
  const toggleTable = useCallback((tableId: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableId]: !prev[tableId]
    }));
    setSelectedTable(tableId);

    // Scroll to the selected table if it's not in view
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

  // Start editing a column
  const startEditing = useCallback((tableId: string, columnId: string) => {
    setEditingTableId(tableId);
    setEditingColumnId(columnId);
  }, []);

  // Cancel editing for a specific column
  const cancelEditing = useCallback(() => {
    setEditingTableId(null);
    setEditingColumnId(null);

    // Reset the editable tables to their original state
    setEditableTables(JSON.parse(JSON.stringify(tables)));

    showToast('Editing canceled', 'info');
  }, [tables]);

  // Save changes for a specific column
  const saveColumnChanges = useCallback((
    tableId: string,
    columnId: string,
    updatedColumn: ColumnDefinition
  ) => {
    try {
      // Update the tables state
      const updatedTables = editableTables.map(table => {
        if (table.tableIdentifier === tableId) {
          return {
            ...table,
            columns: table.columns.map(column =>
              column.columnIdentifier === columnId ? updatedColumn : column
            )
          };
        }
        return table;
      });

      // Update the editable tables state
      setEditableTables(updatedTables);

      // Call the onTablesUpdate callback if provided
      if (onTablesUpdate) {
        onTablesUpdate(updatedTables);
      }

      // Clear editing state
      setEditingTableId(null);
      setEditingColumnId(null);

      // Show success notification
      showToast('Column updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving column changes:', error);
      showToast('Failed to save changes', 'error');
    }
  }, [editableTables, onTablesUpdate]);

  // Handle column changes
  const handleColumnChange = useCallback((
    tableId: string,
    columnId: string,
    field: keyof ColumnDefinition,
    value: any
  ) => {
    setEditableTables(prevTables =>
      prevTables.map(table => {
        if (table.tableIdentifier === tableId) {
          return {
            ...table,
            columns: table.columns.map(column =>
              column.columnIdentifier === columnId
                ? { ...column, [field]: value }
                : column
            )
          };
        }
        return table;
      })
    );
  }, []);

  // Get column count for a table
  const getColumnCount = useCallback((tableId: string): number => {
    const table = editableTables.find(t => t.tableIdentifier === tableId);
    return table?.columns.length || 0;
  }, [editableTables]);

  // Get primary key count for a table
  const getPrimaryKeyCount = useCallback((tableId: string): number => {
    const table = editableTables.find(t => t.tableIdentifier === tableId);
    return table?.columns.filter(c => c.isPrimaryKey).length || 0;
  }, [editableTables]);

  // Get relation count for a table
  const getRelationCount = useCallback((tableId: string): number => {
    const table = editableTables.find(t => t.tableIdentifier === tableId);
    return table?.columns.reduce((count, column) =>
      count + (column.relations ? column.relations.length : 0), 0) || 0;
  }, [editableTables]);

  // Get relation type display
  const getRelationTypeDisplay = useCallback((relationType: string): string => {
    switch (relationType) {
      case 'OTM': return '1:n';
      case 'MTO': return 'n:1';
      case 'OTO': return '1:1';
      case 'MTM': return 'n:n';
      default: return relationType;
    }
  }, []);

  // Get relation name
  const getRelationshipName = useCallback((key: string): string => {
    if (key === 'OTM') return 'One-to-Many';
    if (key === 'MTO') return 'Many-to-One';
    if (key === 'OTO') return 'One-to-One';
    return 'Many-to-Many';
  }, []);

  // Generate AI description for a column
  const generateAIDescription = async (column: ColumnDefinition, table: TableDefinition): Promise<string> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate more context-aware descriptions based on column type and name
    let baseDescription = '';

    // Check if column is a foreign key (has relations)
    const isForeignKey = column.relations && column.relations.length > 0;

    // Check common column name patterns
    const colName = column.columnIdentifier.toLowerCase();

    if (column.isPrimaryKey) {
      baseDescription = `Unique identifier for each record in the ${table.tableIdentifier} table`;
    } else if (isForeignKey) {
      const relations = column.relations || [];
      const targetTables = relations.map(r => r.tableIdentifier).join(', ');
      baseDescription = `Foreign key referencing ${targetTables} ${relations.length > 1 ? 'tables' : 'table'}`;
    } else if (colName.includes('id') && colName.endsWith('id')) {
      baseDescription = `Reference to ${colName.replace(/_?id$/, '')} record`;
    } else if (colName.includes('name')) {
      baseDescription = `Name or title of the ${table.tableIdentifier} record`;
    } else if (colName.includes('date') || colName.includes('time')) {
      let action = 'event occurred';
      if (colName.includes('created')) action = 'record was created';
      else if (colName.includes('updated')) action = 'record was last modified';
      else if (colName.includes('deleted')) action = 'record was removed';

      baseDescription = `Timestamp indicating when the ${action}`;
    } else if (colName.includes('price') || colName.includes('cost') || colName.includes('amount')) {
      baseDescription = `Monetary value representing the ${colName.replace(/_/g, ' ')}`;
    } else if (colName.includes('status')) {
      baseDescription = `Current state of the ${table.tableIdentifier} record`;
    } else if (colName.includes('description')) {
      baseDescription = `Detailed description of the ${table.tableIdentifier} record`;
    } else if (column.columnType.toLowerCase().includes('bool')) {
      const flagDescription = colName
        .replace(/^is_/, '')
        .replace(/^has_/, '')
        .replace(/_/g, ' ');
      baseDescription = `Flag indicating whether the ${table.tableIdentifier} ${flagDescription}`;
    } else {
      baseDescription = `Stores ${column.columnType} data for ${table.tableIdentifier} records`;
    }

    return baseDescription;
  };

  // Fill all column descriptions with AI
  const fillAllDescriptionsWithAI = async () => {
    try {
      setAiLoading(true);
      setAiButtonTooltipOpen(false);

      const updatedTables = [...editableTables];
      let generatedCount = 0;

      await Promise.all(
        updatedTables.map(async (table) => {
          await Promise.all(
            table.columns.map(async (column) => {
              if (column.columnDescription) return;
              const aiDescription = await generateAIDescription(column, table);
              column.columnDescription = aiDescription;
              generatedCount += 1;
            })
          );
        })
      );

      // Update state with new descriptions
      setEditableTables(updatedTables);

      // Show different messages based on how many descriptions were generated
      if (generatedCount > 0) {
        showToast(`Successfully generated ${generatedCount} column descriptions!`, 'success');

        // Notify the parent component of the changes
        if (onTablesUpdate) {
          onTablesUpdate(updatedTables);
        }
      } else {
        showToast('All columns already have descriptions', 'info');
      }
    } catch (error) {
      console.error('AI description generation failed:', error);
      showToast('Failed to generate AI descriptions', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Open relation dialog
  const openRelationDialog = useCallback((tableId: string, columnId: string) => {
    setNewRelation({
      sourceTableId: tableId,
      sourceColumnId: columnId,
      targetTableId: '',
      targetColumnId: '',
      relationType: 'OTO',
    });
    setRelationDialogOpen(true);
  }, []);

  // Handle relation dialog close
  const handleRelationDialogClose = () => {
    setRelationDialogOpen(false);
  };

  // Add new relation
  const addNewRelation = () => {
    try {
      // Validate relation inputs
      if (!newRelation.sourceTableId || !newRelation.sourceColumnId ||
        !newRelation.targetTableId || !newRelation.targetColumnId) {
        showToast('Please fill all relation fields', 'error');
        return;
      }

      // Create new relation object
      const relationToAdd: RelationDefinition = {
        tableIdentifier: newRelation.targetTableId,
        columnIdentifier: newRelation.sourceColumnId,
        toColumn: newRelation.targetColumnId,
        type: newRelation.relationType,
      };

      // Check if relation already exists
      const sourceTable = editableTables.find(t => t.tableIdentifier === newRelation.sourceTableId);
      const sourceColumn = sourceTable?.columns.find(c => c.columnIdentifier === newRelation.sourceColumnId);

      if (sourceColumn?.relations?.some(r =>
        r.tableIdentifier === relationToAdd.tableIdentifier &&
        r.toColumn === relationToAdd.toColumn
      )) {
        showToast('This relation already exists', 'error');
        return;
      }

      // Update tables with new relation
      const updatedTables = editableTables.map(table => {
        if (table.tableIdentifier === newRelation.sourceTableId) {
          return {
            ...table,
            columns: table.columns.map(column => {
              if (column.columnIdentifier === newRelation.sourceColumnId) {
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

      // Update state
      setEditableTables(updatedTables);

      // Call the onTablesUpdate callback if provided
      if (onTablesUpdate) {
        onTablesUpdate(updatedTables);
      }

      // Show success notification
      showToast('Relation added successfully!', 'success');

      // Close dialog
      setRelationDialogOpen(false);
    } catch (error) {
      console.error('Error adding relation:', error);
      showToast('Failed to add relation', 'error');
    }
  };

  // Delete relation
  const deleteRelation = useCallback((
    tableId: string,
    columnId: string,
    targetTableId: string,
    targetColumnId: string
  ) => {
    try {
      // Update tables by removing the relation
      const updatedTables = editableTables.map(table => {
        if (table.tableIdentifier === tableId) {
          return {
            ...table,
            columns: table.columns.map(column => {
              if (column.columnIdentifier === columnId) {
                return {
                  ...column,
                  relations: (column.relations || []).filter(
                    r => !(r.tableIdentifier === targetTableId && r.toColumn === targetColumnId)
                  )
                };
              }
              return column;
            })
          };
        }
        return table;
      });

      // Update state
      setEditableTables(updatedTables);

      // Call the onTablesUpdate callback if provided
      if (onTablesUpdate) {
        onTablesUpdate(updatedTables);
      }

      // Show success notification
      showToast('Relation deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting relation:', error);
      showToast('Failed to delete relation', 'error');
    }
  }, [editableTables, onTablesUpdate]);

  // Get the current editing column
  const getEditingColumn = useCallback(() => {
    if (!editingTableId || !editingColumnId) return null;

    const table = editableTables.find(t => t.tableIdentifier === editingTableId);
    if (!table) return null;

    return table.columns.find(c => c.columnIdentifier === editingColumnId) || null;
  }, [editingTableId, editingColumnId, editableTables]);

  // Render a column row
  const renderColumnRow = useCallback((table: TableDefinition, column: ColumnDefinition, index: number) => {
    const isEditing =
      editingTableId === table.tableIdentifier && editingColumnId === column.columnIdentifier;
    const isHovered =
      hoveredTableId === table.tableIdentifier && hoveredColumnId === column.columnIdentifier;

    // Get the current editing column to save
    const currentEditingColumn = isEditing ? getEditingColumn() : null;

    // Handle Enter key press
    const handleKeyPress = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (currentEditingColumn) {
          saveColumnChanges(
            table.tableIdentifier,
            column.columnIdentifier,
            currentEditingColumn
          );
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
          setHoveredTableId(table.tableIdentifier);
          setHoveredColumnId(column.columnIdentifier);
        }}
        onMouseLeave={() => {
          setHoveredTableId(null);
          setHoveredColumnId(null);
        }}
        sx={{
          position: 'relative', // Essential for absolute positioned children
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: (t) => alpha(t.palette.primary.main, 0.05),
            '& .MuiTableCell-root': {
              color: 'primary.main'
            }
          },
          '& .MuiTableCell-root': {
            py: 1.5, // Increased vertical padding to accommodate the buttons
            px: { xs: 1, sm: 1.5 },
            ...(isEditing && {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
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
                onChange={(e) =>
                  handleColumnChange(
                    table.tableIdentifier,
                    column.columnIdentifier,
                    'columnIdentifier',
                    e.target.value
                  )
                }
                onKeyPress={handleKeyPress}
                fullWidth
                autoFocus
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
                aria-label="Edit column name"
              />
            ) : (
              <Typography variant="body2" fontWeight={column.isPrimaryKey ? 'medium' : 'normal'}>
                {column.isPrimaryKey && <StyledPrimaryKeyIcon />}
                {column.columnIdentifier}
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
              onChange={(e) =>
                handleColumnChange(
                  table.tableIdentifier,
                  column.columnIdentifier,
                  'columnType',
                  e.target.value
                )
              }
              onKeyPress={handleKeyPress}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
              aria-label="Edit column type"
            />
          ) : (
            <StyledColumnTypeChip label={column.columnType} size="small" />
          )}
        </TableCell>

        {/* Description Cell */}
        <TableCell className="column-description">
          {isEditing ? (
            <DescriptionTextField
              size="small"
              value={column.columnDescription || ''}
              onChange={(e) =>
                handleColumnChange(
                  table.tableIdentifier,
                  column.columnIdentifier,
                  'columnDescription',
                  e.target.value
                )
              }
              onKeyPress={handleKeyPress}
              fullWidth
              multiline
              rows={2}
              placeholder="Enter column description..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
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
              {column.columnDescription || 'No description provided'}
            </Typography>
          )}
        </TableCell>

        {/* Relations Cell with Relationship Type Editor */}
        <TableCell className="column-relations">
          <RelationsContainer>
            {column.relations?.length ? (
              column.relations.map((relation, relationIndex) => (
                <Box key={`${relation.tableIdentifier}-${relation.toColumn}-${relationIndex}`} sx={{ mb: 1 }}>
                  {isEditing ? (
                    <Stack direction="column" spacing={1} alignItems="center">
                      <RelationTypeSelector
                        value={relation.type as RelationType}
                        onChange={(newType) => {
                          // Create a deep copy of relations
                          const updatedRelations = [...(column.relations || [])];
                          updatedRelations[relationIndex] = {
                            ...updatedRelations[relationIndex],
                            type: newType
                          };

                          handleColumnChange(
                            table.tableIdentifier,
                            column.columnIdentifier,
                            'relations',
                            updatedRelations
                          );
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
                            onClick={(e) => {
                              e.stopPropagation();
                              const updatedRelations = [...(column.relations || [])];
                              updatedRelations.splice(relationIndex, 1);
                              handleColumnChange(
                                table.tableIdentifier,
                                column.columnIdentifier,
                                'relations',
                                updatedRelations
                              );
                            }}
                            sx={{ p: 0.25 }}
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
                          onDelete={
                            isHovered ?
                              () => deleteRelation(
                                table.tableIdentifier,
                                column.columnIdentifier,
                                relation.tableIdentifier,
                                relation.toColumn
                              ) : undefined
                          }
                        />
                      </span>
                    </Tooltip>
                  )}
                </Box>
              ))
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No relations
              </Typography>
            )}
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

        {/* Add the save/cancel buttons when editing */}
        {isEditing && (
          <EditActionsContainer>
            <Tooltip title="Save changes">
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  if (currentEditingColumn) {
                    saveColumnChanges(
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
    startEditing,
    editingTableId,
    editingColumnId,
    hoveredTableId,
    hoveredColumnId,
    getEditingColumn,
    handleColumnChange,
    saveColumnChanges,
    cancelEditing,
    getRelationTypeDisplay,
    getRelationshipName,
    deleteRelation,
    openRelationDialog
  ]);

  // Adjust grid layout based on screen size
  const gridSizes = useMemo(() => ({
    tableList: { xs: 12, sm: 12, md: 5.5, lg: 4.5 },  // Slightly wider table list
    diagram: { xs: 12, sm: 12, md: 6.5, lg: 7.5 },    // Slightly narrower diagram
  }), []);

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      {/* Toast message */}
      <AnimatePresence>
        {toast.visible && (
          <m.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={toastVariants}
            style={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 9999,
            }}
          >
            <Paper
              elevation={4}
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: (({ type }) => {
                  const tone = theme.palette.mode === 'dark' ? 'dark' : 'light';
                  if (type === 'success') return alpha(theme.palette.success[tone], 0.95);
                  if (type === 'error') return alpha(theme.palette.error[tone], 0.95);
                  return alpha(theme.palette.info[tone], 0.95);
                })(toast),
                color: (({ type }) => {
                  if (type === 'success') return theme.palette.success.contrastText;
                  if (type === 'error') return theme.palette.error.contrastText;
                  return theme.palette.info.contrastText;
                })(toast),
              }}
            >
              <m.div variants={toastChildVariants}>
                <Iconify
                  icon={(type => {
                    if (type === 'success') return 'eva:checkmark-circle-2-fill';
                    if (type === 'error') return 'eva:alert-circle-fill';
                    return 'eva:info-fill';
                  })(toast.type)}
                  width={22}
                  height={22}
                  sx={{
                    filter: `drop-shadow(0 1px 2px ${alpha(theme.palette.common.black, 0.3)})`,
                    animation: (type => {
                      if (type === 'success') return 'pulse-success 2s infinite';
                      if (type === 'error') return 'pulse-error 2s infinite';
                      return 'pulse-info 2s infinite';
                    })(toast.type),
                    '@keyframes pulse-success': {
                      '0%, 100%': { color: theme.palette.success.light },
                      '50%': { color: theme.palette.common.white }
                    },
                    '@keyframes pulse-error': {
                      '0%, 100%': { color: theme.palette.error.light },
                      '50%': { color: theme.palette.common.white }
                    },
                    '@keyframes pulse-info': {
                      '0%, 100%': { color: theme.palette.info.light },
                      '50%': { color: theme.palette.common.white }
                    }
                  }}
                />
              </m.div>
              <m.div variants={toastChildVariants} style={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    textShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.3)}`
                  }}
                >
                  {toast.message}
                </Typography>
              </m.div>
            </Paper>
          </m.div>
        )}
      </AnimatePresence>

      {/* Add Relation Dialog */}
      <Dialog
        open={relationDialogOpen}
        onClose={handleRelationDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: (t) => t.palette.mode === 'dark'
              ? '0 12px 24px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.3)'
              : '0 12px 24px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06)',
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.primary.dark, 0.1)
            : alpha(theme.palette.primary.lighter, 0.2),
          py: 2,
          '& .MuiTypography-root': {
            fontSize: '1.25rem',
            fontWeight: 600,
          }
        }}>
          Add New Relation
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <DialogContentText sx={{ mb: 3 }}>
            Create a new relationship between columns in your database schema.
          </DialogContentText>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Source
              </Typography>
              <Paper variant="outlined" sx={{
                p: 2,
                borderRadius: 16,
                mb: 2,
                border: theme.palette.mode === 'dark'
                  ? `1px solid ${alpha(theme.palette.grey[700], 0.5)}`
                  : `1px solid ${alpha(theme.palette.grey[300], 0.8)}`,
              }}>
                <Typography variant="body2">
                  <strong>Table:</strong> {newRelation.sourceTableId}
                </Typography>
                <Typography variant="body2">
                  <strong>Column:</strong> {newRelation.sourceColumnId}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="target-table-label">Target Table</InputLabel>
                <Select
                  labelId="target-table-label"
                  value={newRelation.targetTableId}
                  label="Target Table"
                  onChange={(e) => setNewRelation({ ...newRelation, targetTableId: e.target.value as string })}
                  sx={{
                    borderRadius: 16,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.grey[500], 0.32)
                        : alpha(theme.palette.grey[300], 0.8),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2,
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 16,
                        mt: 1,
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
                      }
                    }
                  }}
                >
                  {editableTables.map((table) => (
                    <MenuItem key={table.tableIdentifier} value={table.tableIdentifier}>
                      {table.tableIdentifier}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!newRelation.targetTableId}>
                <InputLabel id="target-column-label">Target Column</InputLabel>
                <Select
                  labelId="target-column-label"
                  value={newRelation.targetColumnId}
                  label="Target Column"
                  onChange={(e) => setNewRelation({ ...newRelation, targetColumnId: e.target.value as string })}
                  sx={{
                    borderRadius: 16,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.grey[500], 0.32)
                        : alpha(theme.palette.grey[300], 0.8),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2,
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 16,
                        mt: 1,
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
                      }
                    }
                  }}
                >
                  {editableTables
                    .find((t) => t.tableIdentifier === newRelation.targetTableId)
                    ?.columns.map((column) => (
                      <MenuItem key={column.columnIdentifier} value={column.columnIdentifier}>
                        {column.columnIdentifier} ({column.columnType})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Relation Type
              </Typography>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}>
                <RelationTypeSelector
                  value={newRelation.relationType}
                  onChange={(type) => setNewRelation({ ...newRelation, relationType: type })}
                  disabled={!newRelation.targetTableId || !newRelation.targetColumnId}
                />

                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.5,
                  borderRadius: 16,
                  bgcolor: alpha(theme.palette.info.main, 0.1)
                }}>
                  <InfoOutlinedIcon color="info" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    {newRelation.relationType === 'OTO' && 'One record in the source table corresponds to exactly one record in the target table.'}
                    {newRelation.relationType === 'OTM' && 'One record in the source table corresponds to many records in the target table.'}
                    {newRelation.relationType === 'MTO' && 'Many records in the source table correspond to one record in the target table.'}
                    {newRelation.relationType === 'MTM' && 'Many records in the source table correspond to many records in the target table.'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleRelationDialogClose}
            color="inherit"
            variant="outlined"
            sx={{ borderRadius: 16 }}
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
          <Button
            onClick={addNewRelation}
            color="primary"
            variant="contained"
            sx={{ borderRadius: 16 }}
            startIcon={<AddLinkIcon />}
            disabled={!newRelation.targetTableId || !newRelation.targetColumnId}
          >
            Add Relation
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={3} sx={{ overflow: 'hidden' }}>
        {/* Table List Column */}
        <Grid item {...gridSizes.tableList}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: 700, // Fixed height for the container
          }}>
            {/* Search Box and AI Button Row */}
            <Box sx={{
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
            }}>
              <Box sx={{ flexGrow: 1, position: 'relative' }}>
                <StyledSearchInput
                  placeholder="Search tables or columns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startAdornment={<Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
                  fullWidth
                  aria-label="Search tables or columns"
                />
              </Box>

              {/* AI Button - Now next to search box */}
              <Tooltip
                title={aiLoading ? "Generating descriptions..." : "Auto-generate descriptions for all columns"}
                arrow
                open={aiButtonTooltipOpen}
                onOpen={() => setAiButtonTooltipOpen(true)}
                onClose={() => setAiButtonTooltipOpen(false)}
              >
                <AIButtonWrapper isAnimating={aiLoading}>
                  <AIFillButton
                    onClick={fillAllDescriptionsWithAI}
                    onMouseEnter={() => setAiButtonTooltipOpen(true)}
                    onMouseLeave={() => setAiButtonTooltipOpen(false)}
                    disabled={aiLoading || !editableTables.length}
                    startIcon={aiLoading ? <CircularProgress size={16} color="inherit" /> : <AutoFixHighIcon />}
                    aria-label="Auto-generate descriptions"
                    sx={{
                      boxShadow: aiLoading ?
                        `0 0 12px ${alpha(theme.palette.primary.main, 0.4)}` :
                        undefined,
                    }}
                  >
                    {isMobile ? "Auto-fill" : "Auto-fill Descriptions"}
                  </AIFillButton>
                </AIButtonWrapper>
              </Tooltip>
            </Box>

            {/* Scrollable Table List */}
            <Box
              ref={tableListRef}
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                pr: 1,
                height: 'calc(700px - 60px)', // Fixed height minus search bar
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  width: 6,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: alpha(theme.palette.common.black, 0.05),
                  borderRadius: 3,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  borderRadius: 3,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.5),
                  }
                },
              }}
            >
              <AnimatePresence>
                {filteredTables.length === 0 ? (
                  <FadeInTransition
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <EmptyStateMessage>
                      <Iconify
                        icon="eva:search-outline"
                        sx={{
                          width: 40,
                          height: 40,
                          color: 'text.secondary',
                          opacity: 0.5,
                          mb: 1
                        }}
                      />
                      <Typography variant="subtitle1" color="text.secondary">
                        No tables found
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        Try adjusting your search query
                      </Typography>
                    </EmptyStateMessage>
                  </FadeInTransition>
                ) : (
                  <Stack spacing={2}>
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
                        <StyledCard selected={selectedTable === table.tableIdentifier}>
                          <CardHeader
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
                                      onClick={() => toggleTable(table.tableIdentifier)}
                                      sx={{
                                        transition: 'transform 0.3s ease',
                                        transform: expandedTables[table.tableIdentifier]
                                          ? 'rotate(-180deg)'
                                          : 'rotate(0deg)',
                                        color: 'primary.main',
                                        bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                                        '&:hover': {
                                          bgcolor: (t) => alpha(t.palette.primary.main, 0.2),
                                        }
                                      }}
                                      aria-label={`Toggle table ${table.tableIdentifier}`}
                                    >
                                      <Iconify icon="eva:arrow-ios-downward-fill" />
                                    </IconButton>
                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        fontWeight: selectedTable === table.tableIdentifier
                                          ? 'bold'
                                          : 'medium',
                                        color: selectedTable === table.tableIdentifier
                                          ? 'primary.main'
                                          : 'text.primary',
                                      }}
                                    >
                                      {table.tableIdentifier}
                                    </Typography>
                                  </Stack>
                                  <Stack direction="row" spacing={4}>
                                    <StyledBadge
                                      badgeContent={getPrimaryKeyCount(table.tableIdentifier)}
                                      color="warning"
                                      showZero
                                      aria-label={`Primary keys: ${getPrimaryKeyCount(table.tableIdentifier)}`}
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
                                      aria-label={`Relations: ${getRelationCount(table.tableIdentifier)}`}
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
                                        '& .MuiChip-label': {
                                          px: 1,
                                          fontSize: '0.75rem'
                                        }
                                      }}
                                      aria-label={`Columns: ${getColumnCount(table.tableIdentifier)}`}
                                    />
                                  </Stack>
                                </Stack>
                                {/* Additional information row */}
                                {!expandedTables[table.tableIdentifier] && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: 'block',
                                      mt: 0.5,
                                      ml: 4,
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    {getColumnCount(table.tableIdentifier)} columns,{' '}
                                    {getPrimaryKeyCount(table.tableIdentifier)} keys,{' '}
                                    {getRelationCount(table.tableIdentifier)} relations
                                  </Typography>
                                )}
                              </Box>
                            }
                            sx={{
                              p: 2,
                              pb: expandedTables[table.tableIdentifier] ? 1 : 2,
                              '& .MuiCardHeader-action': { alignSelf: 'center' },
                              ...(expandedTables[table.tableIdentifier] && {
                                borderBottom: (t) => `1px dashed ${t.palette.divider}`,
                              }),
                              background: (t) => {
                                if (selectedTable === table.tableIdentifier) {
                                  if (t.palette.mode === 'dark') {
                                    return alpha(t.palette.primary.dark, 0.1);
                                  }
                                  return alpha(t.palette.primary.lighter, 0.2);
                                }
                                return 'transparent';
                              }
                            }}
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
                                      <TableCell scope="col" className="column-relations">
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                          <span>Relations</span>
                                          <Tooltip title="Add a new relation">
                                            <IconButton
                                              size="small"
                                              color="primary"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Get the first column as default
                                                const firstColumn = table.columns[0];
                                                if (firstColumn) {
                                                  openRelationDialog(table.tableIdentifier, firstColumn.columnIdentifier);
                                                }
                                              }}
                                              sx={{
                                                bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                                                '&:hover': {
                                                  bgcolor: (t) => alpha(t.palette.primary.main, 0.2),
                                                },
                                                width: 24,
                                                height: 24,
                                              }}
                                            >
                                              <AddIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </Stack>
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    <AnimatePresence>
                                      {table.columns.map((column, colIndex) => renderColumnRow(table, column, colIndex))}
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
                )}
              </AnimatePresence>
            </Box>
          </Box>
        </Grid>

        {/* Diagram Preview Column - NO SCROLL HERE */}
        <Grid item {...gridSizes.diagram}>
          <Paper
            elevation={4}
            sx={{
              height: 700, // Fixed height to match table list
              overflow: 'hidden', // Prevent any scrolling
              p: { xs: 2, sm: 3 },
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2, // Removed rounded corners
              position: 'relative',
              // Enhanced background with subtle gradient
              background: (t) => {
                if (t.palette.mode === 'dark') {
                  return `linear-gradient(145deg, ${alpha(t.palette.background.paper, 0.9)} 0%, ${alpha(t.palette.grey[900], 0.8)} 100%)`;
                }
                return `linear-gradient(145deg, ${t.palette.background.paper} 0%, ${alpha(t.palette.grey[50], 0.85)} 100%)`;
              },
              // Enhanced border definition
              border: (t) => {
                if (t.palette.mode === 'dark') {
                  return `1px solid ${alpha(t.palette.grey[700], 0.3)}`;
                }
                return `1px solid ${alpha(t.palette.grey[300], 0.7)}`;
              },
              // Enhanced shadow
              boxShadow: (t) => {
                if (t.palette.mode === 'dark') {
                  return `0 12px 24px -12px ${alpha(t.palette.common.black, 0.5)}, 0 8px 16px -8px ${alpha(t.palette.common.black, 0.4)}`;
                }
                return `0 12px 24px -12px ${alpha(t.palette.common.black, 0.1)}, 0 8px 16px -8px ${alpha(t.palette.common.black, 0.06)}`;
              },
              // Glass effect
              backdropFilter: 'blur(10px)',
              // Enhanced inner shadow for depth
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 6,
                background: (t) => {
                  if (t.palette.mode === 'dark') {
                    return `linear-gradient(to bottom, ${alpha(t.palette.common.white, 0.07)}, ${alpha(t.palette.common.white, 0)})`;
                  }
                  return `linear-gradient(to bottom, ${alpha(t.palette.common.white, 0.7)}, ${alpha(t.palette.common.white, 0)})`;
                },
                zIndex: 1,
              },
            }}
          >
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify
                  icon="eva:diagram-fill"
                  width={24}
                  height={24}
                  sx={{ color: 'primary.main' }}
                />
                <Typography variant="h6">Schema Diagram</Typography>
              </Stack>
              {selectedTable && (
                <Chip
                  label={selectedTable}
                  color="primary"
                  size="small"
                  onDelete={() => setSelectedTable(null)}
                  sx={{
                    height: 28,
                    borderRadius: 8,
                    '& .MuiChip-deleteIcon': {
                      fontSize: '1rem',
                    }
                  }}
                  aria-label={`Selected table: ${selectedTable}`}
                />
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                flexGrow: 1,
                position: 'relative',
                borderRadius: 2, // Removed rounded corners
                border: (t) => {
                  if (t.palette.mode === 'dark') {
                    return `1px solid ${alpha(t.palette.divider, 0.2)}`;
                  }
                  return `1px solid ${alpha(t.palette.divider, 0.5)}`;
                },
                height: 'calc(700px - 100px)', // Fixed height minus header and padding
                overflow: 'hidden',
                // Enhanced background style with subtle pattern
                bgcolor: 'transparent',
                background: (t) => {
                  if (t.palette.mode === 'dark') {
                    return `linear-gradient(135deg, ${alpha(t.palette.background.default, 0.5)} 0%, ${alpha(t.palette.grey[900], 0.4)} 100%)`;
                  }
                  return `linear-gradient(135deg, ${alpha(t.palette.background.default, 0.3)} 0%, ${alpha(t.palette.grey[100], 0.2)} 100%)`;
                },
                // Background pattern
                backgroundImage: (t) => {
                  if (t.palette.mode === 'dark') {
                    return `radial-gradient(${alpha(t.palette.grey[800], 0.4)} 1px, transparent 1px), radial-gradient(${alpha(t.palette.grey[800], 0.3)} 1px, transparent 1px)`;
                  }
                  return `radial-gradient(${alpha(t.palette.grey[400], 0.2)} 1px, transparent 1px), radial-gradient(${alpha(t.palette.grey[400], 0.15)} 1px, transparent 1px)`;
                },
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
                // Glass effect
                backdropFilter: 'blur(2px)',
                // Enhanced inner shadow for depth
                boxShadow: (t) => {
                  if (t.palette.mode === 'dark') {
                    return `inset 0 0 20px ${alpha(t.palette.common.black, 0.2)}`;
                  }
                  return `inset 0 0 20px ${alpha(t.palette.common.black, 0.05)}`;
                },
              }}
            >
              {filteredTables.length > 0 ? (
                <Box sx={{
                  width: '92%',
                  height: '92%',
                  margin: 'auto',
                  position: 'relative',
                  top: '4%'
                }}>
                  <SchemaVisualization
                    tables={editableTables}
                    selectedTable={selectedTable}
                    onTableClick={(tableId: string) => {
                      toggleTable(tableId);
                    }}
                  />
                </Box>
              ) : (
                <EmptyStateMessage>
                  <Iconify
                    icon="eva:layers-outline"
                    sx={{
                      width: 48,
                      height: 48,
                      color: 'text.secondary',
                      opacity: 0.5,
                      mb: 2
                    }}
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
    </Box>
  );
}