// File: src/sections/database-management/components/layout/TabHeader.tsx

import { Tab, Tabs, alpha, styled } from '@mui/material';

const TabsContainerStyle = styled('div')(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: alpha(theme.palette.background.paper, 0.95),
  backdropFilter: 'blur(8px)',
  position: 'sticky',
  top: 0,
  zIndex: 8,
  width: '100%',
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: 48,
  fontWeight: 500,
  transition: theme.transitions.create('all', {
    duration: theme.transitions.duration.shorter,
  }),
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
}));

interface TabItem {
  label: string;
  value: number;
  icon?: string | React.ReactElement;
}

interface TabHeaderProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  tabs: TabItem[];
}

export function TabHeader({ value, onChange, tabs }: TabHeaderProps) {
  return (
    <TabsContainerStyle>
      <Tabs
        value={value}
        onChange={onChange}
        aria-label="database view tabs"
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTabs-indicator': {
            height: 3,
          },
        }}
      >
        {tabs.map((tab) => (
          <StyledTab key={tab.value} label={tab.label} icon={tab.icon} iconPosition="start" />
        ))}
      </Tabs>
    </TabsContainerStyle>
  );
}
