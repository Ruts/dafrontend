import { useState } from 'react';
import {
  Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import GrassRounded from '@mui/icons-material/GrassRounded';
import type { Availability } from './Dashboard';
import { request, message } from '../api';

export interface Coordinates { lat: number; lng: number }
export interface FarmForm {
  id: string; name: string; crop: string; acreage: number; coordinates: Coordinates[];
  latitude?: number | null; longitude?: number | null; locationName?: string;
  active?: boolean; revision?: string;
}
export interface Harvest {
  id: string; farmId: string; owner: string; date: string; yield: number; crop: string;
}
export interface Environment {
  id: string; farmId: string; owner: string; date: string; soilMoisture: string; soilPH: number; temperature: number;
}

function location(farm: FarmForm) {
  if (farm.latitude != null && farm.longitude != null) return { lat: farm.latitude, lng: farm.longitude };
  const points = farm.coordinates ?? [];
  return points.length ? {
    lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
    lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length,
  } : null;
}

export default function FarmManager({ token, data, onChanged, onProfile }: {
  token: string; data: Availability; onChanged: () => void; onProfile: (farmId: string) => void;
}) {
  const [dialog, setDialog] = useState<'farm' | 'harvest' | null>(null);
  const [farm, setFarm] = useState({ name: '', crop: '', acreage: '', locationName: '', latitude: '', longitude: '' });
  const [harvest, setHarvest] = useState({ farmId: '', crop: '', date: '', yield: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [archiveTarget, setArchiveTarget] = useState<FarmForm | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const reportFarms = data.farms.filter(f => f.services.includes('reports'));
  const primaryNeedsReplacement = archiveTarget?.active !== false &&
    archiveTarget?.id === data.primaryFarmId && data.farms.length > 1;

  async function save() {
    setBusy(true); setError('');
    try {
      if (dialog === 'farm') {
        await request(token, '/farms', 'POST', {
          ...farm, acreage: Number(farm.acreage), latitude: farm.latitude === '' ? null : Number(farm.latitude),
          longitude: farm.longitude === '' ? null : Number(farm.longitude),
        });
      } else {
        await request(token, '/harvests', 'POST', { ...harvest, yield: Number(harvest.yield) });
      }
      setDialog(null); onChanged();
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function primary(farmId: string) {
    setBusy(true); setError('');
    try {
      const person = await request<{ phoneNumber: string }>(token, '/me');
      await request(token, `/profiles/${encodeURIComponent(person.phoneNumber)}/primary-farm`, 'PUT', { farmId });
      onChanged();
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function changeStatus() {
    if (!archiveTarget) return;
    if (!archiveTarget.revision) { setError('Farm revision is missing. Refresh your records and retry.'); return; }
    setBusy(true); setError('');
    try {
      const person = await request<{ phoneNumber: string }>(token, '/me');
      await request(token, `/profiles/${encodeURIComponent(person.phoneNumber)}/farms/${archiveTarget.id}/status`, 'PUT', {
        active: archiveTarget.active === false, revision: archiveTarget.revision,
      });
      setArchiveTarget(null); onChanged();
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }

  return <Stack spacing={2.5}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap gap={1.5}>
      <div><Typography variant="h5" component="h2" fontWeight={750}>My farms</Typography>
        <Typography variant="body2" color="text.secondary">Keep your records rooted in the right place.</Typography></div>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {reportFarms.length > 0 && <Button variant="outlined" onClick={() => {
          setError(''); setHarvest({ farmId: reportFarms[0].id, crop: reportFarms[0].crop, date: '', yield: '' });
          setDialog('harvest');
        }}>Add harvest</Button>}
        <Button startIcon={<AddRounded />} variant="contained" onClick={() => {
          setError(''); setFarm({ name: '', crop: '', acreage: '', locationName: '', latitude: '', longitude: '' });
          setDialog('farm');
        }}>Add farm</Button>
      </Stack>
    </Stack>
    {error && !dialog && <Alert severity="error">{error}</Alert>}
    {!data.farms.length && <Alert severity="info">Your farm story starts here. Add a farm, or message ADD FARM on WhatsApp.</Alert>}
    <div className="da-farm-grid">
      {data.farms.map(farm => {
        const point = location(farm);
        return <article className="da-farm-card" key={farm.id}>
          <div className="da-farm-location"><PlaceOutlined />
            <div><Typography fontWeight={650}>{farm.locationName || (point ? 'Farm location recorded' : 'Add your farm location')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {point ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : 'A location unlocks nearby station services.'}
              </Typography>
              {point && <Button component="a" size="small" target="_blank" rel="noopener noreferrer"
                href={`https://www.google.com/maps?q=${point.lat},${point.lng}`}>View location</Button>}
            </div>
          </div>
          <div className="da-farm-card-body">
            <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
              <Typography component="h3">{farm.name}</Typography>
              {data.primaryFarmId === farm.id && <Chip size="small" label="Primary farm" color="success" variant="outlined" />}
            </Stack>
            <div className="da-farm-card-facts">
              <div><span>Crop</span><Typography fontWeight={650}>{farm.crop}</Typography></div>
              <div><span>Farm size</span><Typography fontWeight={650}>{farm.acreage} acres</Typography></div>
            </div>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {farm.stations.length ? `Nearby: ${farm.stations.map(s => s.name).join(', ')}` : 'No station coverage confirmed.'}
            </Typography>
            {farm.services.includes('drones') && <Chip size="small" label="Drone services in your area" sx={{ mb: 2 }} />}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="outlined" onClick={() => onProfile(farm.id)} startIcon={<GrassRounded />}>Edit farm records</Button>
              {data.primaryFarmId !== farm.id && <Button disabled={busy} onClick={() => void primary(farm.id)}>Make primary</Button>}
              <Button color="error" disabled={busy} onClick={() => { setError(''); setArchiveTarget(farm); }}>Archive farm</Button>
            </Stack>
          </div>
        </article>;
      })}
    </div>
    {data.archivedFarms.length > 0 && <>
      <Button sx={{ alignSelf: 'flex-start' }} aria-expanded={showArchived} onClick={() => setShowArchived(v => !v)}>
        {showArchived ? 'Hide' : 'View'} archived farms ({data.archivedFarms.length})
      </Button>
      {showArchived && <Stack spacing={2} aria-label="Archived farms">
        {data.archivedFarms.map(farm => <Stack key={farm.id} className="da-farm-card" p={2.5}
          direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
          <div><Typography component="h3" variant="h6">{farm.name}</Typography>
            <Typography variant="body2" color="text.secondary">{farm.crop} | {farm.acreage} acres | Archived</Typography></div>
          <Button disabled={busy} onClick={() => { setError(''); setArchiveTarget(farm); }}>Restore farm</Button>
        </Stack>)}
      </Stack>}
    </>}
    <Typography variant="body2" color="text.secondary">
      Your primary farm determines your support station unless an administrator has assigned one.
      Physical services always depend on each farm's own location.
    </Typography>
    <Dialog open={archiveTarget !== null} onClose={() => { if (!busy) setArchiveTarget(null); }} fullWidth maxWidth="sm">
      <DialogTitle>{archiveTarget?.active === false ? 'Restore farm?' : 'Archive farm?'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography mb={2}>{archiveTarget?.name}</Typography>
        <Typography>Archiving hides the farm from active management, station coverage and WhatsApp farm selection.
          Records and chat history are retained. Scheduled forecasts for this farm pause while archived and resume
          when restored if the subscription is still enabled.</Typography>
        {primaryNeedsReplacement && <Alert severity="warning" sx={{ mt: 2 }}>
          Choose another primary farm using Make primary before archiving this one.
        </Alert>}
      </DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setArchiveTarget(null)}>Cancel</Button>
        <Button variant="contained" disabled={busy || primaryNeedsReplacement} onClick={() => void changeStatus()}>
          {archiveTarget?.active === false ? 'Restore farm' : 'Archive farm'}
        </Button></DialogActions>
    </Dialog>
    <Dialog open={dialog !== null} onClose={() => { if (!busy) setDialog(null); }} fullWidth maxWidth="sm">
      <DialogTitle>{dialog === 'farm' ? 'Add a farm' : 'Record a harvest'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack component="form" id="farm-record-form" spacing={2} mt={1} onSubmit={event => {
          event.preventDefault(); void save();
        }}>
          {dialog === 'farm' ? <>
            <TextField required label="Farm name" value={farm.name} onChange={e => setFarm({ ...farm, name: e.target.value })} />
            <TextField required label="Crop" value={farm.crop} onChange={e => setFarm({ ...farm, crop: e.target.value })} />
            <TextField required label="Area (acres)" type="number" value={farm.acreage} slotProps={{ htmlInput: { min: 0.001, step: 'any' } }}
              onChange={e => setFarm({ ...farm, acreage: e.target.value })} />
            <TextField label="Location description" value={farm.locationName} onChange={e => setFarm({ ...farm, locationName: e.target.value })} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Latitude" type="number" value={farm.latitude} slotProps={{ htmlInput: { min: -90, max: 90, step: 'any' } }}
                onChange={e => setFarm({ ...farm, latitude: e.target.value })} />
              <TextField label="Longitude" type="number" value={farm.longitude} slotProps={{ htmlInput: { min: -180, max: 180, step: 'any' } }}
                onChange={e => setFarm({ ...farm, longitude: e.target.value })} />
            </Stack>
            <Typography variant="body2" color="text.secondary">Optional: provide both coordinates, or add a location later.
              Farms without coordinates do not qualify for location-based services.</Typography>
          </> : <>
            <TextField select required label="Farm" value={harvest.farmId} onChange={e => {
              const selected = reportFarms.find(f => f.id === e.target.value);
              setHarvest({ ...harvest, farmId: e.target.value, crop: selected?.crop ?? '' });
            }}>{reportFarms.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}</TextField>
            <TextField required label="Crop" value={harvest.crop} onChange={e => setHarvest({ ...harvest, crop: e.target.value })} />
            <TextField required label="Harvest date" type="date" slotProps={{ inputLabel: { shrink: true } }}
              value={harvest.date} onChange={e => setHarvest({ ...harvest, date: e.target.value })} />
            <TextField required label="Yield (kg)" type="number" slotProps={{ htmlInput: { min: 0, step: 'any' } }}
              value={harvest.yield} onChange={e => setHarvest({ ...harvest, yield: e.target.value })} />
          </>}
        </Stack>
      </DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setDialog(null)}>Cancel</Button>
        <Button disabled={busy} type="submit" form="farm-record-form" variant="contained">Save {dialog === 'farm' ? 'farm' : 'harvest'}</Button></DialogActions>
    </Dialog>
  </Stack>;
}
