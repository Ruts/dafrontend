import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, LinearProgress, Stack, ThemeProvider, Typography } from '@mui/material';
import GrassRounded from '@mui/icons-material/GrassRounded';
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import ChatBubbleOutlineRounded from '@mui/icons-material/ChatBubbleOutlineRounded';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import WhatsApp from '@mui/icons-material/WhatsApp';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import FarmManager from './FarmManager';
import type { FarmForm } from './FarmManager';
import Reports from './Reports';
import Chat from './Chat';
import Profile from './Profile';
import { request, message } from '../api';
import { portalTheme } from '../theme';
import { useWhatsAppService } from '../hooks/useWhatsAppService';
import '../styles/FarmerDashboard.css';

export type Station = {
  id: string; name: string; locationName: string; latitude: number; longitude: number;
  radiusKm: number; contact: string; active: boolean; revision: string;
};
export type ServiceFarm = FarmForm & { services: string[]; stations: Station[]; droneStations: Station[]; locationName?: string };
export type Availability = {
  primaryFarmId: string | null; station: Station | null; services: string[]; farms: ServiceFarm[]; archivedFarms: FarmForm[];
};
type Page = 'farms' | 'profile' | 'reports' | 'chat' | 'services';
type Person = { name: string; phoneNumber: string; weather: { enabled: boolean; farmId: string } | null };

export default function Dashboard({ token }: { token: string }) {
  const navigate = useNavigate();
  const [page, setPage] = useState<Page>('farms');
  const [editFarmId, setEditFarmId] = useState<string>();
  const [person, setPerson] = useState<Person | null>(null);
  const [data, setData] = useState<Availability | null>(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const { whatsapp } = useWhatsAppService();

  useEffect(() => {
    try {
      if (jwtDecode<{ accountId?: string }>(token).accountId) {
        navigate('/admin', { replace: true }); return;
      }
    } catch {
      setError('Invalid session. Sign out and sign in again.'); setLoading(false); return;
    }
    const controller = new AbortController();
    setError(''); setLoading(true);
    Promise.all([
      request<Person>(token, '/me', 'GET', undefined, controller.signal),
      request<Availability>(token, '/farmer-services', 'GET', undefined, controller.signal),
    ]).then(([profile, availability]) => {
      setPerson(profile); setData(availability);
    }).catch(error => {
      if (!controller.signal.aborted) { setError(message(error)); setData(null); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, page, refresh, navigate]);

  const enabled = (key: string) => Boolean(data?.services.includes(key));
  const navigation = [
    { id: 'farms' as const, label: 'My farms', icon: <GrassRounded /> },
    { id: 'profile' as const, label: enabled('weather') ? 'Profile & weather' : 'Profile & farms', icon: <PersonOutlineRounded /> },
    ...(enabled('reports') ? [{ id: 'reports' as const, label: 'Farm reports', icon: <BarChartRounded /> }] : []),
    ...(enabled('chat') ? [{ id: 'chat' as const, label: 'Chat history', icon: <ChatBubbleOutlineRounded /> }] : []),
    ...(enabled('drones') ? [{ id: 'services' as const, label: 'Station services', icon: <PlaceOutlined /> }] : []),
  ];
  function logout() {
    localStorage.removeItem('jwt'); window.dispatchEvent(new Event('storage'));
    navigate('/login', { replace: true });
  }

  return <ThemeProvider theme={portalTheme}>
    <div className="da-farmer">
      <a className="da-farmer-skip" href="#farmer-content">Skip to content</a>
      <aside className="da-farmer-sidebar">
        <Link className="da-farmer-brand" to="/">
          <img src="/images/digital-agronomist-mark.png" alt="" width="58" height="52" />
          <span>Digital Agronomist<small>by KROM</small></span>
        </Link>
        <div className="da-farmer-workspace">YOUR FARM WORKSPACE</div>
        <nav aria-label="Farmer navigation">
          {navigation.map(item => <Button key={item.id} startIcon={item.icon}
            className={page === item.id ? 'is-selected' : ''} aria-current={page === item.id ? 'page' : undefined}
            onClick={() => setPage(item.id)}>{item.label}</Button>)}
        </nav>
        <div className="da-farmer-help">
          <GrassRounded />
          <Typography fontWeight={700}>Good farming starts with a conversation.</Typography>
          <Typography variant="body2">Ask about your crops or share a farm photo on WhatsApp.</Typography>
          {whatsapp && <Button component="a" href={whatsapp} target="_blank" rel="noopener noreferrer"
            variant="contained" startIcon={<WhatsApp />}>Ask your agronomist</Button>}
        </div>
        <Button onClick={logout} className="da-farmer-signout">Sign out</Button>
      </aside>
      <div className="da-farmer-main">
        <header className="da-farmer-header">
          <div><Typography variant="overline">FARMER PORTAL</Typography>
            <Typography fontWeight={650}>{person?.name || 'Your farm, connected.'}</Typography></div>
          <Chip label="Digital Agronomist" variant="outlined" />
        </header>
        <main id="farmer-content" className="da-farmer-content" tabIndex={-1}>
          <section className="da-farmer-welcome">
            <div><Typography variant="overline">GROW WITH CONFIDENCE</Typography>
              <Typography variant="h4" component="h1" fontWeight={750}>
                Welcome{person?.name ? `, ${person.name.split(' ')[0]}` : ' to your farm'}.
              </Typography>
              <Typography>One place for your farm records, advice and the services available near you.</Typography>
            </div>
            <Button variant="outlined" disabled={loading} onClick={() => setRefresh(v => v + 1)}>Refresh records</Button>
          </section>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error} Records and availability could not be loaded.</Alert>}
          {loading && <LinearProgress aria-label="Loading farm workspace" />}
          {data && !loading && <>
            <div className="da-farmer-stats">
              <div><GrassRounded /><span>Registered farms<strong>{data.farms.length}</strong></span></div>
              <div><PlaceOutlined /><span>Your support station<strong>{data.station?.name || 'Not yet assigned'}</strong></span></div>
              <div><ChatBubbleOutlineRounded /><span>{enabled('weather') ? 'Weather notifications' : 'Farm support'}
                <strong>{enabled('weather') ? (person?.weather?.enabled
                  ? (data.farms.some(f => f.id === person.weather?.farmId) ? 'Subscribed' : 'Paused - farm archived')
                  : 'Set your preferences') : 'WhatsApp-first'}</strong></span></div>
            </div>
            {page === 'farms' && <FarmManager token={token} data={data}
              onChanged={() => setRefresh(v => v + 1)} onProfile={farmId => { setEditFarmId(farmId); setPage('profile'); }} />}
            {page === 'profile' && <Profile token={token} showWeather={enabled('weather')} initialFarmId={editFarmId} />}
            {page === 'reports' && enabled('reports') && <Reports token={token} farms={data.farms} />}
            {page === 'chat' && enabled('chat') && <Chat token={token} />}
            {page === 'services' && enabled('drones') && <Stack spacing={2}>
              <Typography component="h2" variant="h5">Station services</Typography>
              <Alert severity="info">Availability is checked separately for each farm. Contact the covering station
                to confirm appointments and operating capacity. Online drone booking and flight control are not available.</Alert>
              {data.farms.filter(f => f.services.includes('drones')).map(f => <Box key={f.id} className="da-farm-card" p={3}>
                <Typography variant="h6">{f.name}</Typography>
                <Typography>Drone services in your area</Typography>
                {f.droneStations.map(s => <Typography key={s.id}>{s.name}{s.contact ? ` - ${s.contact}` : ''}</Typography>)}
              </Box>)}
            </Stack>}
            {!navigation.some(item => item.id === page) && <Alert severity="info">
              This service is no longer available for your farms. Choose another section.
            </Alert>}
          </>}
          <footer className="da-farmer-footer">Digital Agronomist by KROM
            <a href="https://www.kromsystems.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy policy</a>
          </footer>
        </main>
      </div>
    </div>
  </ThemeProvider>;
}
