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
import { useEffect, useState } from 'react';

const AuthPage = observer(({ setToken }: { setToken: (token: string) => void }) => {
  const navigate = useNavigate();

  const handleLogin = () => authStore.login();
  const handleVerifyCode = () => authStore.verifyCode(setToken, navigate);
  const [whatsapp, setWhatsapp] = useState('');
  const [setupError, setSetupError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE}/service-info`);
        if (!response.ok) throw new Error('WhatsApp service details are unavailable.');
        const data = await response.json();
        if (typeof data.whatsappNumber !== 'string' || !/^[1-9]\d{7,14}$/.test(data.whatsappNumber)) {
          throw new Error('WhatsApp service number is not configured.');
        }
        if (active) setWhatsapp(data.whatsappNumber);
      } catch (error) {
        if (active) setSetupError(error instanceof Error ? error.message : 'Unable to load WhatsApp details.');
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  return (
    <Grid container justifyContent="center" alignItems="center" minHeight="100vh" width="100%">
      <Grid container spacing={2}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography variant="body1" gutterBottom>
            Start on WhatsApp to register and add your farm. After registration, send
            <strong> LOGIN</strong> on WhatsApp to get your portal code.
          </Typography>
          {whatsapp && <Button href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">Open WhatsApp: +{whatsapp}</Button>}
          {setupError && <Alert severity="warning">{setupError}</Alert>}

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
              <Button disabled={authStore.isLoading} variant="contained" color="primary" fullWidth onClick={handleLogin}>
                Send login code
              </Button>
              <Button variant="text" fullWidth onClick={() => authStore.setStep('verify')}>
                I already have a WhatsApp code
              </Button>
            </Box>
          )}

          {authStore.step === 'verify' && (
            <Box mt={3}>
              <Typography variant="h5" gutterBottom>Enter Verification Code</Typography>
              <TextField fullWidth label="Phone including country code" margin="normal" value={authStore.phone} onChange={e => authStore.setPhone(e.target.value)} />
              <TextField
                fullWidth
                label="Code from WhatsApp"
                margin="normal"
                value={authStore.code}
                onChange={(e) => authStore.setCode(e.target.value)}
              />
              <Button disabled={authStore.isLoading} variant="contained" color="success" fullWidth onClick={handleVerifyCode}>
                Verify
              </Button>
              <Button fullWidth onClick={() => authStore.setStep('login')}>Back to login</Button>
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