import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

import { authStore } from '../stores/AuthStore';
import { observer } from 'mobx-react-lite';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useWhatsAppService } from '../hooks/useWhatsAppService';

const AuthPage = observer(({ setToken }: { setToken: (token: string) => void }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'admin' ? 'admin' : 'farmer';

  const handleLogin = () => authStore.login();
  const handleVerifyCode = () => authStore.verifyCode(setToken, navigate);
  const { whatsapp, setupError } = useWhatsAppService();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);

  async function adminLogin() {
    setAdminBusy(true);
    setAdminError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Sign-in failed.');
      if (typeof data.token !== 'string') throw new Error('Invalid sign-in response.');
      localStorage.setItem('jwt', data.token);
      setToken(data.token); setPassword('');
      navigate('/admin');
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally { setAdminBusy(false); }
  }

  return (
    <Grid container justifyContent="center" alignItems="center" minHeight="100vh" width="100%">
      <Grid container spacing={2}>
        <Paper elevation={3} sx={{ padding: 4, width: 'min(900px, calc(100vw - 96px))' }}>
          <Button component={Link} to="/" sx={{ mb: 2 }}>Back to Digital Agronomist</Button>
          <Typography variant="h4" gutterBottom>Digital Agronomist</Typography>
          <Tabs value={mode} onChange={(_, value: 'farmer' | 'admin') =>
            setSearchParams(value === 'admin' ? { mode: 'admin' } : {})} sx={{ mb: 3 }}>
            <Tab value="farmer" label="Farmer login" />
            <Tab value="admin" label="Admin / staff login" />
          </Tabs>
          {mode === 'admin' ? (
            <StackForm email={email} password={password} busy={adminBusy} error={adminError}
              setEmail={setEmail} setPassword={setPassword} submit={() => void adminLogin()} />
          ) : <>
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
          </>}
        </Paper>
      </Grid>
    </Grid>
  );
});

function StackForm({ email, password, busy, error, setEmail, setPassword, submit }: {
  email: string; password: string; busy: boolean; error: string;
  setEmail: (value: string) => void; setPassword: (value: string) => void; submit: () => void;
}) {
  return <Box component="form" onSubmit={event => { event.preventDefault(); submit(); }}>
    <Typography variant="h5" gutterBottom>Administrator & staff sign-in</Typography>
    <Typography>Use your authorised email account to manage Digital Agronomist.</Typography>
    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    <TextField required fullWidth type="email" label="Email" autoComplete="username" margin="normal"
      value={email} onChange={event => setEmail(event.target.value)} />
    <TextField required fullWidth type="password" label="Password" autoComplete="current-password" margin="normal"
      value={password} onChange={event => setPassword(event.target.value)} />
    <Button disabled={busy} type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
      {busy ? 'Signing in...' : 'Sign in to admin / staff portal'}
    </Button>
  </Box>;
}

export default AuthPage;