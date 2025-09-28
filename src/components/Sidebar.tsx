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
} from '@mui/material';

import AgricultureIcon from '@mui/icons-material/Agriculture';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChatIcon from '@mui/icons-material/Chat';
import FlightIcon from '@mui/icons-material/Flight';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({
  user,
  setFarm,
  setChat,
  setReport,
  setDroneSim,
}: {
  user: { name: string; phone: string };
  setFarm: () => void;
  setChat: () => void;
  setReport: () => void;
  setDroneSim: () => void;
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('jwt');
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

