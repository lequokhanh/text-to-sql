import { useState } from 'react';

import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { fToNow } from 'src/utils/format-time';

// Import the mock contacts directly instead of using useMockedUser
import { _contacts } from 'src/_mock';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

// const ITEM_HEIGHT = 64;

export default function ContactsPopover() {
  const popover = usePopover();

  const [searchContacts] = useState('');

  const dataFiltered = applyFilter({
    inputData: _contacts,
    query: searchContacts,
  });

  return (
    <>
      <IconButton
        onClick={popover.onOpen}
        sx={{
          ...(popover.open && {
            color: 'primary.main',
          }),
        }}
      >
        <Iconify icon="solar:users-group-rounded-bold" />
      </IconButton>

      <CustomPopover open={popover.open} onClose={popover.onClose} sx={{ width: 320 }}>
        <Typography variant="h6" sx={{ p: 1.5 }}>
          Contacts <Typography component="span">({dataFiltered.length})</Typography>
        </Typography>

        <Divider />

        <Scrollbar sx={{ height: 320 }}>
          {dataFiltered.map((contact) => (
            <MenuItem key={contact.id} sx={{ p: 1 }}>
              <Badge
                variant={contact.status as 'alway' | 'online' | 'busy' | 'offline'}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                sx={{ mr: 2 }}
              >
                <Avatar 
                  alt={contact.name} 
                  src={contact.avatarUrl}
                  imgProps={{
                    onError: () => {
                      console.log(`Avatar image failed to load for ${contact.name}`);
                    },
                  }}
                >
                  {contact.name.charAt(0).toUpperCase()}
                </Avatar>
              </Badge>

              <ListItemText
                primary={contact.name}
                secondary={contact.status === 'offline' ? fToNow(contact.lastActivity) : ''}
                primaryTypographyProps={{ typography: 'subtitle2' }}
                secondaryTypographyProps={{
                  typography: 'caption',
                  color: 'text.disabled',
                }}
              />
            </MenuItem>
          ))}
        </Scrollbar>
      </CustomPopover>
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, query }: { inputData: any[]; query: string }) {
  if (query) {
    return inputData.filter(
      (contact) => contact.name.toLowerCase().indexOf(query.toLowerCase()) !== -1
    );
  }

  return inputData;
}
