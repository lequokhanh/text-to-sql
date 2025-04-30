// File: src/sections/database-management/components/chat/SqlQueryResults.tsx

import { useState } from 'react';

import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  Paper,
  alpha,
  Theme,
  styled,
  Tooltip,
  TableRow,
  useTheme,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  CardHeader,
  CardContent,
  TableContainer,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import Markdown from 'src/components/markdown';

import { IChatMessage } from 'src/types/chat';

import { exportToCSV, generateCsvFilename } from '../../../../utils/format-utils';

// Styled components
const StickyTableHead = styled(TableHead)(({ theme }) => ({
  '& th': {
    fontWeight: 'bold',
    backgroundColor: theme.palette.background.neutral,
    position: 'sticky',
    top: 0,
    zIndex: 1,
    backdropFilter: 'blur(8px)',
  },
}));

interface SqlQueryResultsProps {
  message: IChatMessage;
}

export function SqlQueryResults({ message }: SqlQueryResultsProps) {
  const theme = useTheme();
  const [showFullResults, setShowFullResults] = useState(false);

  // Split message body to extract SQL and results sections
  const sqlSection = message.body.split('## Results')[0];
  const resultsSection = `## Results${message.body.split('## Results')[1]}`;

  // Check if we have table data in the message metadata
  const hasTableData =
    message.metadata?.results &&
    Array.isArray(message.metadata.results) &&
    message.metadata.results.length > 0;

  // Handle CSV export
  const handleExportCSV = () => {
    if (hasTableData) {
      const filename = generateCsvFilename();
      exportToCSV(message.metadata?.results, filename);
    }
  };

  return (
    <Stack direction="row" sx={{ mb: 3 }}>
      <Box sx={{ width: '80%' }}>
        {/* SQL Query Card */}
        <Card
          sx={{
            mb: 2,
            borderRadius: 2,
            borderLeft: `4px solid ${theme.palette.info.main}`,
            boxShadow: theme.customShadows?.z8,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.customShadows?.z12,
            },
          }}
        >
          <CardHeader
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="mdi:database-search" width={22} height={22} color="info.main" />
                <Typography variant="subtitle1" fontWeight={600}>
                  SQL Query
                </Typography>
              </Stack>
            }
            sx={{ pb: 1 }}
          />
          <CardContent sx={{ pt: 0 }}>
            <Markdown>{sqlSection.replace('## SQL Query', '')}</Markdown>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card
          sx={{
            borderRadius: 2,
            borderLeft: `4px solid ${theme.palette.success.main}`,
            boxShadow: theme.customShadows?.z8,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.customShadows?.z12,
            },
          }}
        >
          <CardHeader
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="mdi:table" width={22} height={22} color="success.main" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Results
                </Typography>
                {message.metadata?.rowCount !== undefined && (
                  <Chip
                    label={`${message.metadata.rowCount} ${
                      message.metadata.rowCount === 1 ? 'row' : 'rows'
                    }`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 24, fontWeight: 500 }}
                  />
                )}
              </Stack>
            }
            action={
              <Stack direction="row" spacing={1}>
                {hasTableData && (
                  <Tooltip title="Export to CSV">
                    <IconButton
                      size="small"
                      onClick={handleExportCSV}
                      sx={{
                        color: theme.palette.success.main,
                        '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) },
                      }}
                    >
                      <Iconify icon="mdi:file-export" />
                    </IconButton>
                  </Tooltip>
                )}
                {hasTableData && (
                  <Tooltip title={showFullResults ? 'Show less' : 'Show all results'}>
                    <IconButton size="small" onClick={() => setShowFullResults(!showFullResults)}>
                      <Iconify icon={showFullResults ? 'mdi:chevron-up' : 'mdi:chevron-down'} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            }
            sx={{ pb: 1 }}
          />
          <CardContent sx={{ pt: 0 }}>
            {/* Render as a proper table if we have the data in metadata */}
            {hasTableData ? (
              <Box>
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    maxHeight: showFullResults ? 'none' : 300,
                    border: `1px solid ${theme.palette.divider}`,
                    scrollBehavior: 'smooth',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                      height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: (t: Theme) => alpha(t.palette.grey[500], 0.08),
                      borderRadius: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: (t: Theme) => alpha(t.palette.grey[500], 0.24),
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: (t: Theme) => alpha(t.palette.grey[500], 0.32),
                      },
                    },
                    // Firefox scrollbar styling
                    scrollbarWidth: 'thin',
                    scrollbarColor: (t: Theme) =>
                      `${alpha(t.palette.grey[500], 0.24)} ${alpha(t.palette.grey[500], 0.08)}`,
                  }}
                >
                  <Table size="small" stickyHeader>
                    <StickyTableHead>
                      <TableRow
                        sx={{
                          bgcolor: theme.palette.background.neutral,
                          '& th': { fontWeight: 'bold' },
                        }}
                      >
                        {Object.keys(message.metadata?.results[0]).map((column) => (
                          <TableCell key={column}>
                            <Typography variant="subtitle2">{column}</Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    </StickyTableHead>
                    <TableBody>
                      {message.metadata?.results.map((row: Record<string, any>, index: number) => (
                        <TableRow
                          key={index}
                          sx={{
                            '&:nth-of-type(odd)': {
                              bgcolor: alpha(theme.palette.background.neutral, 0.3),
                            },
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.lighter, 0.3),
                            },
                          }}
                        >
                          {Object.keys(row).map((column) => {
                            const value = row[column];
                            let cellContent;

                            if (value === null) {
                              cellContent = (
                                <Typography variant="body2" color="text.disabled">
                                  NULL
                                </Typography>
                              );
                            } else if (typeof value === 'object') {
                              cellContent = (
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                  {JSON.stringify(value)}
                                </Typography>
                              );
                            } else {
                              cellContent = (
                                <Typography variant="body2">{String(value)}</Typography>
                              );
                            }

                            return <TableCell key={column}>{cellContent}</TableCell>;
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {!showFullResults && message.metadata?.results.length > 5 && (
                  <Box
                    sx={{
                      mt: 1,
                      textAlign: 'center',
                      cursor: 'pointer',
                      color: 'primary.main',
                      p: 1,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                        textDecoration: 'underline',
                      },
                    }}
                    onClick={() => setShowFullResults(true)}
                  >
                    <Typography variant="caption" fontWeight={500}>
                      Show all {message.metadata?.results.length} rows
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Markdown>{resultsSection.replace('## Results', '')}</Markdown>
            )}
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}
