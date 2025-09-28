import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

import { authStore } from '../stores/AuthStore';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';

const AuthPage = observer(({ setToken }: { setToken: (token: string) => void }) => {
  const navigate = useNavigate();

  const handleCreateAccount = () => authStore.createAccount();
  const handleLogin = () => authStore.login();
  const handleVerifyCode = () => authStore.verifyCode(setToken, navigate);

  return (
    <Grid container justifyContent="center" alignItems="center" minHeight="100vh">
      <Grid container spacing={2}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography variant="body1" gutterBottom>
            To receive messages from WhatsApp, start by texting the words
            <strong> "join related-girl"</strong> to <strong>+14155238886</strong> on your WhatsApp messaging application.
          </Typography>

          {authStore.step === 'signup' && (
            <Box mt={3}>
              <Typography variant="h5" gutterBottom>Create Account</Typography>
              <TextField
                fullWidth
                label="Name"
                margin="normal"
                value={authStore.name}
                onChange={(e) => authStore.setName(e.target.value)}
              />
              <TextField
                fullWidth
                label="Phone (e.g. 2547xxxxxxx)"
                margin="normal"
                value={authStore.phone}
                onChange={(e) => authStore.setPhone(e.target.value)}
              />
              <Button variant="contained" color="primary" fullWidth onClick={handleCreateAccount}>
                Send Verification Code
              </Button>
            </Box>
          )}

          {authStore.step === 'login' && (
            <Box mt={3}>
              <Typography variant="h5" gutterBottom>Login</Typography>
              <TextField
                fullWidth
                label="Phone (e.g. 2547xxxxxxx)"
                margin="normal"
                value={authStore.phone}
                onChange={(e) => authStore.setPhone(e.target.value)}
              />
              <Button variant="contained" color="primary" fullWidth onClick={handleLogin}>
                Login
              </Button>
              <Button variant="text" fullWidth onClick={() => authStore.setStep('signup')}>
                Create Account
              </Button>
            </Box>
          )}

          {authStore.step === 'verify' && (
            <Box mt={3}>
              <Typography variant="h5" gutterBottom>Enter Verification Code</Typography>
              <TextField
                fullWidth
                label="Code from WhatsApp"
                margin="normal"
                value={authStore.code}
                onChange={(e) => authStore.setCode(e.target.value)}
              />
              <Button variant="contained" color="success" fullWidth onClick={handleVerifyCode}>
                Verify
              </Button>
            </Box>
          )}

          {authStore.error && (
            <Box mt={3}>
              <Alert severity="error">{authStore.error}</Alert>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
});

export default AuthPage;