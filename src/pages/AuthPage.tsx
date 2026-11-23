import {
  Alert,
  Box,
  Button,
  Tab,
  Tabs,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CloudOutlined from '@mui/icons-material/CloudOutlined';
import GrassRounded from '@mui/icons-material/GrassRounded';
import LockOutlined from '@mui/icons-material/LockOutlined';
import SupportAgentRounded from '@mui/icons-material/SupportAgentRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';

import { authStore } from '../stores/AuthStore';
import { observer } from 'mobx-react-lite';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useWhatsAppService } from '../hooks/useWhatsAppService';
import '../styles/LandingPage.css';
import '../styles/AuthPage.css';

const authTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#124e38', dark: '#0c3b29' },
    success: { main: '#124e38' },
    text: { primary: '#193c30', secondary: '#52665c' },
    background: { default: '#fcfbf6', paper: '#fffefa' },
  },
  typography: {
    fontFamily: '"Segoe UI", Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 650 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 48, padding: '11px 16px' } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: '#fffefa', '& fieldset': { borderColor: '#cbd6c2' } },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', minHeight: 46, fontWeight: 650, fontSize: '.84rem', minWidth: 0 },
      },
    },
  },
});

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
    <ThemeProvider theme={authTheme}>
    <div className="da-landing da-auth">
      <a className="da-skip" href="#sign-in">Skip to sign in</a>
      <header className="da-header">
        <Link className="da-brand" to="/" aria-label="Digital Agronomist home">
          <img src="/images/digital-agronomist-mark.png" alt="" width="58" height="52" />
          <span>Digital Agronomist<small>by KROM</small></span>
        </Link>
        <Link className="da-auth-back" to="/"><ArrowBackRounded aria-hidden="true" /> Back to Digital Agronomist</Link>
      </header>
      <main className="da-auth-main da-container">
        <section className="da-auth-story" aria-labelledby="welcome-title">
          <p className="da-eyebrow">{mode === 'admin' ? 'The people behind the guidance' : 'Your farming companion, connected'}</p>
          <h1 id="welcome-title">{mode === 'admin'
            ? <>Better support.<br /><span>Stronger connections.</span></>
            : <>Your farm.<br /><span>Your space to grow.</span></>}</h1>
          <p>{mode === 'admin'
            ? 'A thoughtful human perspective makes a difference. Sign in to support farmers and keep the conversation growing.'
            : 'From a quick question on WhatsApp to the details that shape your next season. Pick up where you left off.'}</p>
          <ul className="da-auth-highlights">
            <li><GrassRounded aria-hidden="true" /><span>{mode === 'admin' ? 'Keep farmer information connected' : 'Your farms and crops, all in one place'}</span></li>
            <li><CloudOutlined aria-hidden="true" /><span>{mode === 'admin' ? 'Understand activity and notification preferences' : 'Weather updates on a schedule that suits you'}</span></li>
            <li><SupportAgentRounded aria-hidden="true" /><span>{mode === 'admin' ? 'Review conversations and offer a helping hand' : 'Helpful technology, with people behind it'}</span></li>
          </ul>
          <div className="da-auth-brand-note"><img src="/images/digital-agronomist-mark.png" alt="" width="72" height="64" /><div>Rooted in your everyday.<small>Practical guidance. More informed farming.</small></div></div>
        </section>
        <section className="da-auth-card" id="sign-in" aria-labelledby="sign-in-title">
          <span className="da-auth-card-icon">{mode === 'admin' ? <LockOutlined aria-hidden="true" /> : <GrassRounded aria-hidden="true" />}</span>
          <p className="da-eyebrow">{mode === 'admin' ? 'Team access' : 'Farmer portal'}</p>
          <Typography component="h2" variant="h5" id="sign-in-title">
            {mode === 'admin' ? 'Administrator & staff sign-in' : 'Welcome back, farmer.'}
          </Typography>
          <p className="da-auth-card-intro">{mode === 'admin' ? 'Your workspace for supporting farmers.' : 'A familiar place for your farm details.'}</p>
          <Tabs value={mode} onChange={(_, value: 'farmer' | 'admin') =>
            setSearchParams(value === 'admin' ? { mode: 'admin' } : {})}
            variant="fullWidth" aria-label="Choose sign-in type" className="da-auth-tabs">
            <Tab value="farmer" label="Farmer login" id="farmer-tab" aria-controls="farmer-panel" />
            <Tab value="admin" label="Admin / staff login" id="admin-tab" aria-controls="admin-panel" />
          </Tabs>
          <Box role="tabpanel" id={`${mode}-panel`} aria-labelledby={`${mode}-tab`}>
          {mode === 'admin' ? (
            <StackForm email={email} password={password} busy={adminBusy} error={adminError}
              setEmail={setEmail} setPassword={setPassword} submit={() => void adminLogin()} />
          ) : <>
          <Typography variant="body2" color="text.secondary">
            Start on WhatsApp to register and add your farm. After registration, send
            <strong> LOGIN</strong> on WhatsApp to get your portal code.
          </Typography>
          {whatsapp && <Button className="da-auth-whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" startIcon={<WhatsApp />} endIcon={<ArrowForwardRounded />}>Open WhatsApp: +{whatsapp}</Button>}
          {setupError && <Alert severity="warning" sx={{ mt: 2 }}>{setupError}</Alert>}

          {authStore.step === 'login' && (
            <Box component="form" mt={3} onSubmit={event => { event.preventDefault(); void handleLogin(); }}>
              <Typography variant="subtitle1" component="h3" fontWeight={650}>Sign in with WhatsApp</Typography>
              <TextField
                fullWidth
                label="Phone (e.g. 2547xxxxxxx)"
                type="tel"
                autoComplete="tel"
                margin="normal"
                value={authStore.phone}
                onChange={(e) => authStore.setPhone(e.target.value)}
                helperText="Include your country code."
              />
              <Button disabled={authStore.isLoading} type="submit" variant="contained" fullWidth sx={{ mt: 1 }} endIcon={<ArrowForwardRounded />}>
                {authStore.isLoading ? 'Sending code...' : 'Send login code'}
              </Button>
              <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => authStore.setStep('verify')}>
                I already have a WhatsApp code
              </Button>
            </Box>
          )}

          {authStore.step === 'verify' && (
            <Box component="form" mt={3} onSubmit={event => { event.preventDefault(); void handleVerifyCode(); }}>
              <Typography component="h3" variant="subtitle1" fontWeight={650}>Enter Verification Code</Typography>
              <TextField fullWidth type="tel" autoComplete="tel" label="Phone including country code" margin="normal" value={authStore.phone} onChange={e => authStore.setPhone(e.target.value)} />
              <TextField
                fullWidth
                label="Code from WhatsApp"
                autoComplete="one-time-code"
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                margin="normal"
                value={authStore.code}
                onChange={(e) => authStore.setCode(e.target.value)}
              />
              <Button disabled={authStore.isLoading} type="submit" variant="contained" fullWidth sx={{ mt: 1 }} endIcon={<ArrowForwardRounded />}>
                {authStore.isLoading ? 'Verifying...' : 'Verify'}
              </Button>
              <Button fullWidth sx={{ mt: 1 }} onClick={() => authStore.setStep('login')}>Back to login</Button>
            </Box>
          )}

          {authStore.error && (
            <Box mt={3}>
              <Alert severity="error">{authStore.error}</Alert>
            </Box>
          )}
          </>}
          </Box>
          <p className="da-auth-help"><LockOutlined aria-hidden="true" />{mode === 'admin' ? 'Authorised accounts only. Never share your password.' : 'Your login code is personal. Never share it.'}</p>
        </section>
      </main>
      <footer className="da-auth-footer da-container">
        <span>&copy; {new Date().getFullYear()} KROM Systems Kenya Limited</span>
        <nav aria-label="Privacy and support">
          <a href="https://www.kromsystems.com/privacy-policy">Privacy policy</a>
          <a href="https://www.kromsystems.com/terms-of-service">Terms of service</a>
          <a href="mailto:info@kromsystems.com">Need help?</a>
        </nav>
      </footer>
    </div>
    </ThemeProvider>
  );
});

function StackForm({ email, password, busy, error, setEmail, setPassword, submit }: {
  email: string; password: string; busy: boolean; error: string;
  setEmail: (value: string) => void; setPassword: (value: string) => void; submit: () => void;
}) {
  return <Box component="form" onSubmit={event => { event.preventDefault(); submit(); }}>
    <Typography variant="body2" color="text.secondary">Use your authorised email account to manage Digital Agronomist.</Typography>
    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    <TextField required fullWidth type="email" label="Email" autoComplete="username" margin="normal"
      value={email} onChange={event => setEmail(event.target.value)} />
    <TextField required fullWidth type="password" label="Password" autoComplete="current-password" margin="normal"
      value={password} onChange={event => setPassword(event.target.value)} />
    <Button disabled={busy} type="submit" variant="contained" fullWidth sx={{ mt: 2 }} endIcon={<ArrowForwardRounded />}>
      {busy ? 'Signing in...' : 'Sign in to admin / staff portal'}
    </Button>
  </Box>;
}

export default AuthPage;