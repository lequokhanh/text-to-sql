import Box from '@mui/material/Box';

import { usePathname } from 'src/routes/hooks';

import Sidebar from './side-bar';

// Define sidebar width constant - same as in Sidebar component
const SIDEBAR_WIDTH = 80; // ensure this matches the width in your Sidebar component

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  const pathname = usePathname();

  const homePage = pathname === '/';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 1 }}>
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main content with proper margin to avoid sidebar overlap */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { sm: `calc(100% - ${SIDEBAR_WIDTH}px)` },
            ml: { sm: `${SIDEBAR_WIDTH}px` }, // Add margin equal to sidebar width
            ...(!homePage && {
              pt: { xs: 8, md: 10 },
            }),
            transition: (theme) => theme.transitions.create(['margin']),
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
