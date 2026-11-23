import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField, Typography,
} from '@mui/material';

type Weather = {
  enabled: boolean;
  consent: boolean;
  farmId: string;
  frequency: 'daily' | 'alternate' | 'weekly';
  time: string;
  timezone: string;
  weekday: number;
};
type Farmer = {
  phoneNumber: string;
  name: string;
  language: 'en' | 'sw';
  isStaff: boolean;
  onboardingStep: string | null;
  weather: (Weather & { nextDueAt?: string }) | null;
};
type Farm = {
  id: string;
  name: string;
  crop: string;
  acreage: number;
  locationName?: string;
  latitude?: number | null;
  longitude?: number | null;
  plantingDate?: string | null;
};

const initialWeather: Weather = {
  enabled: false, consent: false, farmId: '', frequency: 'daily',
  time: '07:00', timezone: 'Africa/Nairobi', weekday: 0,
};

async function api<T>(path: string, token: string, method = 'GET', body?: object): Promise<T> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(typeof result.detail === 'string' ? result.detail : `Request failed (${response.status}). Check the fields.`);
  }
  return result;
}

export default function Profile({ token, targetPhone, showWeather = true, initialFarmId }: {
  token: string; targetPhone?: string; showWeather?: boolean; initialFarmId?: string;
}) {
  const [profile, setProfile] = useState<Farmer | null>(null);
  const [staff, setStaff] = useState(false);
  const [lookup, setLookup] = useState('');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [weather, setWeather] = useState<Weather>(initialWeather);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const display = useCallback((person: Farmer, records: Farm[]) => {
    setProfile(person);
    setFarms(records);
    setFarm(records.find(f => f.id === initialFarmId) ?? records[0] ?? null);
    const saved = person.weather;
    setWeather(saved ? {
      enabled: saved.enabled, consent: saved.consent, farmId: saved.farmId,
      frequency: saved.frequency, time: saved.time, timezone: saved.timezone, weekday: saved.weekday,
    } : { ...initialWeather, farmId: records[0]?.id ?? '' });
  }, [initialFarmId]);

  useEffect(() => {
    let active = true;
    setBusy(true);
    async function load() {
      try {
        const person = await api<Farmer>(targetPhone ? `/profiles/${encodeURIComponent(targetPhone)}` : '/me', token);
        const records = await api<Farm[]>(`/profiles/${encodeURIComponent(person.phoneNumber)}/farms`, token);
        if (active) {
          setStaff(!targetPhone && person.isStaff);
          setLookup(person.phoneNumber);
          display(person, records);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load records.');
      } finally {
        if (active) setBusy(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [token, targetPhone, display]);

  async function perform(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed. Please retry.');
    } finally {
      setBusy(false);
    }
  }

  const path = `/profiles/${encodeURIComponent(profile?.phoneNumber ?? '')}`;
  return (
    <Box p={3} maxWidth={800}>
      <Typography variant="h5" component="h2" gutterBottom>{showWeather ? 'Profile, farms and weather' : 'Profile and farms'}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
      {staff && (
        <Stack direction="row" spacing={2} mb={3}>
          <TextField label="Farmer phone including country code" value={lookup} onChange={e => setLookup(e.target.value)} />
          <Button disabled={busy} onClick={() => void perform(async () => {
            const target = `/profiles/${encodeURIComponent(lookup.trim())}`;
            const [person, records] = await Promise.all([
              api<Farmer>(target, token), api<Farm[]>(`${target}/farms`, token),
            ]);
            display(person, records);
          })}>Load farmer</Button>
        </Stack>
      )}
      {profile && (
        <Stack spacing={2}>
          <Typography>{profile.phoneNumber} | Registration: {profile.onboardingStep ?? 'legacy account'}</Typography>
          <TextField label="Name" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
          <TextField select label="Language" value={profile.language ?? 'en'} onChange={e => setProfile({ ...profile, language: e.target.value as Farmer['language'] })}>
            <MenuItem value="en">English</MenuItem><MenuItem value="sw">Kiswahili</MenuItem>
          </TextField>
          <Button disabled={busy} variant="contained" onClick={() => void perform(async () => {
            const saved = await api<Farmer>(path, token, 'PATCH', { name: profile.name, language: profile.language });
            setProfile(saved);
            setNotice('Profile saved.');
          })}>Save profile</Button>
          <Typography variant="h5">Farm records</Typography>
          <Typography variant="body2">Add another farm by messaging ADD FARM on WhatsApp, or through My farms.</Typography>
          {farms.length > 0 && (
            <TextField select label="Farm to edit" value={farm?.id ?? ''} onChange={e => setFarm(farms.find(f => f.id === e.target.value) ?? null)}>
              {farms.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
            </TextField>
          )}
          {farm && <>
            <TextField label="Farm name" value={farm.name} onChange={e => setFarm({ ...farm, name: e.target.value })} />
            <TextField label="Crop" value={farm.crop} onChange={e => setFarm({ ...farm, crop: e.target.value })} />
            <TextField label="Area (acres)" type="number" value={farm.acreage} onChange={e => setFarm({ ...farm, acreage: Number(e.target.value) })} />
            <TextField label="Location description" value={farm.locationName ?? ''} onChange={e => setFarm({ ...farm, locationName: e.target.value })} />
            <TextField label="Latitude" type="number" value={farm.latitude ?? ''} onChange={e => setFarm({ ...farm, latitude: e.target.value === '' ? null : Number(e.target.value) })} />
            <TextField label="Longitude" type="number" value={farm.longitude ?? ''} onChange={e => setFarm({ ...farm, longitude: e.target.value === '' ? null : Number(e.target.value) })} />
            <TextField label="Planting date" type="date" InputLabelProps={{ shrink: true }} value={farm.plantingDate ?? ''} onChange={e => setFarm({ ...farm, plantingDate: e.target.value || null })} />
            <Button disabled={busy} variant="outlined" onClick={() => void perform(async () => {
              const saved = await api<Farm>(`${path}/farms/${farm.id}`, token, 'PATCH', {
                name: farm.name, crop: farm.crop, acreage: farm.acreage,
                locationName: farm.locationName ?? '', latitude: farm.latitude ?? null,
                longitude: farm.longitude ?? null, plantingDate: farm.plantingDate ?? null,
              });
              setFarm(saved);
              setFarms(farms.map(f => f.id === saved.id ? saved : f));
              setNotice('Farm saved. New WhatsApp questions use these details.');
            })}>Save farm</Button>
          </>}
          {showWeather && <>
          <Typography variant="h5">Weather notifications</Typography>
          {weather.enabled && weather.farmId && !farms.some(f => f.id === weather.farmId) && <Alert severity="warning">
            Forecasts are paused because the selected farm is archived. Restore it, select an active farm,
            or uncheck scheduled forecasts to unsubscribe.
          </Alert>}
          <Alert severity="info">Select a farm with a location pin. Forecasts are estimates, not guarantees. Powered by Open-Meteo.</Alert>
          <FormControlLabel control={<Checkbox checked={weather.enabled} onChange={e => setWeather({ ...weather, enabled: e.target.checked, consent: e.target.checked })} />} label={staff ? 'The farmer has explicitly consented to scheduled WhatsApp forecasts' : 'I agree to receive scheduled WhatsApp forecasts'} />
          <TextField select label="Forecast farm" value={weather.farmId} onChange={e => setWeather({ ...weather, farmId: e.target.value })}>
            <MenuItem value="">Select a farm</MenuItem>
            {weather.farmId && !farms.some(f => f.id === weather.farmId) &&
              <MenuItem value={weather.farmId} disabled>Archived farm - select an active farm</MenuItem>}
            {farms.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
          </TextField>
          <TextField select label="Frequency" value={weather.frequency} onChange={e => setWeather({ ...weather, frequency: e.target.value as Weather['frequency'] })}>
            <MenuItem value="daily">Daily</MenuItem><MenuItem value="alternate">Every two days</MenuItem><MenuItem value="weekly">Weekly</MenuItem>
          </TextField>
          {weather.frequency === 'weekly' && (
            <TextField select label="Day" value={weather.weekday} onChange={e => setWeather({ ...weather, weekday: Number(e.target.value) })}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => <MenuItem key={day} value={i}>{day}</MenuItem>)}
            </TextField>
          )}
          <TextField label="Delivery time" type="time" value={weather.time} onChange={e => setWeather({ ...weather, time: e.target.value })} />
          <TextField label="Timezone (IANA)" value={weather.timezone} onChange={e => setWeather({ ...weather, timezone: e.target.value })} />
          <Button disabled={busy} variant="contained" onClick={() => void perform(async () => {
            const saved = await api<Weather & { nextDueAt?: string }>(`${path}/weather`, token, 'PUT', weather);
            setProfile({ ...profile, weather: saved });
            setNotice(saved.enabled ? `Weather enabled. Next scheduled: ${saved.nextDueAt}` : 'Weather notifications stopped.');
          })}>Save weather preferences</Button>
          <Typography variant="body2">Change preferences here or send WEATHER on WhatsApp. Send STOP to unsubscribe.</Typography>
          </>}
        </Stack>
      )}
    </Box>
  );
}
