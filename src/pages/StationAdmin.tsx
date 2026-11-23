import { useEffect, useState } from 'react';
import {
  Alert, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, LinearProgress, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import type { Station } from './Dashboard';
import { request, message } from '../api';

type Rule = { id: string; name: string; enabled: boolean; scope: 'all' | 'stations'; stationIds: string[] };
type Rules = { revision: string; items: Rule[] };
type Draft = Omit<Station, 'latitude' | 'longitude' | 'radiusKm'> & { latitude: string; longitude: string; radiusKm: string };
const empty: Draft = {
  id: '', name: '', locationName: '', latitude: '', longitude: '', radiusKm: '20',
  contact: '', active: true, revision: '',
};

export function StationsPage({ token }: { token: string }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true); setError('');
    request<{ items: Station[] }>(token, '/admin/stations', 'GET', undefined, controller.signal)
      .then(data => setStations(data.items))
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [token, refresh]);
  async function save() {
    if (!draft) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await request(token, '/admin/stations' + (draft.id ? `/${draft.id}` : ''), draft.id ? 'PATCH' : 'POST', {
        name: draft.name, locationName: draft.locationName, latitude: Number(draft.latitude),
        longitude: Number(draft.longitude), radiusKm: Number(draft.radiusKm), contact: draft.contact,
        active: draft.active, revision: draft.revision,
      });
      setDraft(null); setRefresh(v => v + 1);
      setNotice('Station saved. Coverage and staff access use these settings immediately.');
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  return <Stack spacing={2.5}>
    <Stack direction="row" justifyContent="space-between" flexWrap="wrap" useFlexGap gap={1}>
      <Typography variant="h4">Stations</Typography>
      <Stack direction="row"><Button disabled={busy} onClick={() => setRefresh(v => v + 1)}>Refresh</Button>
        <Button variant="contained" onClick={() => { setError(''); setDraft({ ...empty }); }}>Add station</Button></Stack>
    </Stack>
    <Alert severity="info">Stations are fixed locations with a coverage radius in kilometres. A farmer's primary farm determines
      their nearest covering station, unless a global administrator overrides it. Archiving a station removes its coverage
      and blocks its staff from farmer data immediately.</Alert>
    {notice && <Alert severity="success">{notice}</Alert>}
    {error && !draft && <Alert severity="error">{error}</Alert>}
    {busy && <LinearProgress />}
    {!busy && !stations.length && <Typography>No stations yet. Add your first physical site to begin assigning staff.</Typography>}
    {stations.map(station => <Card key={station.id} variant="outlined"><CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Typography variant="h6">{station.name}</Typography>
        <Chip size="small" label={station.active ? 'Active' : 'Archived'} color={station.active ? 'success' : 'default'} />
      </Stack>
      <Typography>{station.locationName || 'Fixed service station'}</Typography>
      <Typography color="text.secondary">{station.latitude}, {station.longitude} | {station.radiusKm} km radius</Typography>
      {station.contact && <Typography>Contact: {station.contact}</Typography>}
      <Button disabled={busy} onClick={() => {
        setError(''); setDraft({ ...station, latitude: String(station.latitude), longitude: String(station.longitude), radiusKm: String(station.radiusKm) });
      }}>Edit station</Button>
    </CardContent></Card>)}
    <Dialog open={draft !== null} onClose={() => { if (!busy) setDraft(null); }} fullWidth maxWidth="sm">
      <DialogTitle>{draft?.id ? 'Edit station' : 'Add station'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {draft && <Stack spacing={2} mt={1} component="form" id="station-form" onSubmit={event => {
          event.preventDefault(); void save();
        }}>
          <TextField required label="Station name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
          <TextField label="Location description" value={draft.locationName} onChange={e => setDraft({ ...draft, locationName: e.target.value })} />
          <TextField required type="number" label="Latitude" value={draft.latitude}
            slotProps={{ htmlInput: { min: -90, max: 90, step: 'any' } }} onChange={e => setDraft({ ...draft, latitude: e.target.value })} />
          <TextField required type="number" label="Longitude" value={draft.longitude}
            slotProps={{ htmlInput: { min: -180, max: 180, step: 'any' } }} onChange={e => setDraft({ ...draft, longitude: e.target.value })} />
          <TextField required type="number" label="Coverage radius (km)" value={draft.radiusKm}
            slotProps={{ htmlInput: { min: 0.001, max: 1000, step: 'any' } }} onChange={e => setDraft({ ...draft, radiusKm: e.target.value })} />
          <TextField label="Public contact details" helperText="Shown to farmers eligible for station services."
            value={draft.contact} onChange={e => setDraft({ ...draft, contact: e.target.value })} />
          <FormControlLabel label="Active station (uncheck to archive)" control={<Checkbox checked={draft.active}
            onChange={e => setDraft({ ...draft, active: e.target.checked })} />} />
        </Stack>}
      </DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setDraft(null)}>Cancel</Button>
        <Button type="submit" form="station-form" disabled={busy} variant="contained">Save station</Button></DialogActions>
    </Dialog>
  </Stack>;
}

export function ServicesPage({ token }: { token: string }) {
  const [rules, setRules] = useState<Rules | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true); setError(''); setRules(null);
    Promise.all([
      request<Rules>(token, '/admin/services', 'GET', undefined, controller.signal),
      request<{ items: Station[] }>(token, '/admin/stations', 'GET', undefined, controller.signal),
    ]).then(([rules, stations]) => { setRules(rules); setStations(stations.items); })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [token, refresh]);
  function change(rule: Rule, values: Partial<Rule>) {
    if (rules) setRules({ ...rules, items: rules.items.map(r => r.id === rule.id ? { ...r, ...values } : r) });
  }
  async function save(rule: Rule) {
    if (!rules) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const saved = await request<Rules>(token, '/admin/services/' + rule.id, 'PUT', {
        enabled: rule.enabled, scope: rule.scope, stationIds: rule.scope === 'all' ? [] : rule.stationIds,
        revision: rules.revision,
      });
      setRules(saved); setNotice(`${rule.name} settings saved.`);
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  return <Stack spacing={2.5}>
    <Stack direction="row" justifyContent="space-between" gap={1}>
      <Typography variant="h4">Farmer services</Typography>
      <Button disabled={busy} onClick={() => setRefresh(v => v + 1)}>Refresh settings</Button>
    </Stack>
    <Alert severity="info">Farms and profiles always remain accessible. Choose which optional modules farmers can use.
      Station-limited services require the farm's actual location to fall within a selected active station's radius.
      An administrator's support-station override does not expand physical coverage.</Alert>
    {notice && <Alert severity="success">{notice}</Alert>}
    {error && <Alert severity="error">{error} Refresh settings after resolving a stale edit.</Alert>}
    {busy && <LinearProgress />}
    {rules?.items.map(rule => <Card variant="outlined" key={rule.id}><CardContent>
      <Stack spacing={2}>
        <Typography variant="h6">{rule.name}</Typography>
        {rule.id === 'drones' && <Alert severity="warning">Enable only when a real station can provide the service.
          This publishes station contact availability, not online drone booking or simulation.</Alert>}
        <FormControlLabel label="Visible and available to eligible farmers" control={<Checkbox checked={rule.enabled}
          disabled={busy} onChange={e => change(rule, { enabled: e.target.checked })} />} />
        <TextField select label="Availability" value={rule.scope} disabled={busy || rule.id === 'drones'}
          onChange={e => change(rule, { scope: e.target.value === 'all' ? 'all' : 'stations' })}>
          <MenuItem value="all">All farmers</MenuItem><MenuItem value="stations">Selected station coverage areas</MenuItem>
        </TextField>
        {rule.scope === 'stations' && <Stack>
          <Typography variant="body2">Eligible stations</Typography>
          {!stations.some(s => s.active) && <Typography variant="body2">Add an active station before enabling this service.</Typography>}
          {stations.map(station => <FormControlLabel key={station.id}
            label={`${station.name}${station.active ? '' : ' (archived - no coverage)'}`}
            control={<Checkbox disabled={busy} checked={rule.stationIds.includes(station.id)} onChange={e => change(rule, {
              stationIds: e.target.checked ? [...rule.stationIds, station.id] : rule.stationIds.filter(id => id !== station.id),
            })} />} />)}
        </Stack>}
        <Button variant="contained" disabled={busy} onClick={() => void save(rule)} sx={{ alignSelf: 'flex-start' }}>Save {rule.name.toLowerCase()}</Button>
      </Stack>
    </CardContent></Card>)}
  </Stack>;
}
