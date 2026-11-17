import {
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Alert,
} from '@mui/material';

import AgricultureIcon from '@mui/icons-material/Agriculture';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChatIcon from '@mui/icons-material/Chat';
import FlightIcon from '@mui/icons-material/Flight';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Sidebar = ({
  user,
  setFarm,
  setChat,
  setReport,
  setDroneSim,
  setProfile,
  setInbox,
  token,
}: {
  user: { name: string; phone: string };
  setFarm: () => void;
  setChat: () => void;
  setReport: () => void;
  setDroneSim: () => void;
  setProfile: () => void;
  setInbox: () => void;
  token: string;
}) => {
  const navigate = useNavigate();
  const [isStaff, setIsStaff] = useState(false);
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setIsStaff(false);
    setAccessError('');
    fetch(`${import.meta.env.VITE_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error('Unable to check staff access. Reload after signing in.');
      const profile: { isStaff: boolean } = await response.json();
      if (!controller.signal.aborted) setIsStaff(profile.isStaff);
    }).catch(cause => {
      if (!controller.signal.aborted) setAccessError(cause instanceof Error ? cause.message : 'Unable to check staff access.');
    });
    return () => controller.abort();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    window.dispatchEvent(new Event('storage'));
    navigate('/');
  };

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          padding: 2,
        },
      }}
    >
      <Box mb={2}>
        <Typography variant="h6">Welcome, {user.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {user.phone}
        </Typography>
      </Box>

      <List>
        {accessError && <Alert severity="error">{accessError}</Alert>}
        {isStaff && <ListItem disablePadding>
          <ListItemButton onClick={setInbox}>
            <ListItemIcon><ChatIcon /></ListItemIcon>
            <ListItemText primary="Staff Inbox" />
          </ListItemButton>
        </ListItem>}
        <ListItem disablePadding>
          <ListItemButton onClick={setProfile}>
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Profile & Weather" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={setFarm}>
            <ListItemIcon><AgricultureIcon /></ListItemIcon>
            <ListItemText primary="Farm Management" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={setReport}>
            <ListItemIcon><AssessmentIcon /></ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={setChat}>
            <ListItemIcon><ChatIcon /></ListItemIcon>
            <ListItemText primary="Chat History" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={setDroneSim}>
            <ListItemIcon><FlightIcon /></ListItemIcon>
            <ListItemText primary="Drone Simulation" />
          </ListItemButton>
        </ListItem>
      </List>

      <Box mt={4}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          fullWidth
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
    </Drawer>
  );
};

export default Sidebar;

