import { useEffect, useState } from 'react';
import {
  Alert, Box, Card, CardContent, LinearProgress, MenuItem, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { FarmForm, Harvest, Environment } from './FarmManager';
import { request, message } from '../api';

export default function Reports({ token, farms }: { token: string; farms: FarmForm[] }) {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [farmId, setFarmId] = useState('');
  const [crop, setCrop] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    Promise.all([
      request<Harvest[]>(token, '/harvests', 'GET', undefined, controller.signal),
      request<Environment[]>(token, '/environments', 'GET', undefined, controller.signal),
    ]).then(([harvests, environments]) => {
      setHarvests(harvests); setEnvironments(environments);
    }).catch(error => { if (!controller.signal.aborted) setError(message(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token]);
  const selected = harvests.filter(h => (!farmId || h.farmId === farmId) && (!crop || h.crop === crop));
  const selectedEnvironment = environments.filter(e => !farmId || e.farmId === farmId);
  const byDate = new Map<string, { date: string; yield?: number; soilPH?: number }>();
  selected.forEach(h => byDate.set(h.date, { date: h.date, yield: h.yield }));
  selectedEnvironment.forEach(e => byDate.set(e.date, { ...byDate.get(e.date), date: e.date, soilPH: e.soilPH }));
  const chart = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return <Stack spacing={3}>
    <Typography variant="h5" component="h2" fontWeight={750}>Farm reports</Typography>
    {loading && <LinearProgress />}
    {error && <Alert severity="error">{error}</Alert>}
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <TextField select label="Farm" value={farmId} fullWidth onChange={e => setFarmId(e.target.value)}>
        <MenuItem value="">All farms</MenuItem>{farms.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
      </TextField>
      <TextField select label="Crop" value={crop} fullWidth onChange={e => setCrop(e.target.value)}>
        <MenuItem value="">All crops</MenuItem>{[...new Set(harvests.map(h => h.crop))].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
      </TextField>
    </Stack>
    {!loading && !error && !selected.length && !selectedEnvironment.length && <Alert severity="info">
      No matching records yet. Add a harvest from My farms to start building your reports.
    </Alert>}
    {!loading && !error && (selected.length > 0 || selectedEnvironment.length > 0) && <>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 2 }}>
        <Card variant="outlined"><CardContent>
          <Typography variant="h6">Yield over time</Typography>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={selected}><CartesianGrid stroke="#e0e5d7" /><XAxis dataKey="date" /><YAxis />
              <Tooltip /><Line dataKey="yield" stroke="#124e38" dot={false} /></LineChart>
          </ResponsiveContainer>
        </CardContent></Card>
        <Card variant="outlined"><CardContent>
          <Typography variant="h6">Soil pH and yield</Typography>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chart}><CartesianGrid stroke="#e0e5d7" /><XAxis dataKey="date" />
              <YAxis yAxisId="left" /><YAxis yAxisId="right" orientation="right" /><Tooltip />
              <Line yAxisId="left" dataKey="yield" stroke="#124e38" dot={false} />
              <Line yAxisId="right" dataKey="soilPH" stroke="#a78128" dot={false} /></LineChart>
          </ResponsiveContainer>
        </CardContent></Card>
      </Box>
      <TableContainer component={Card} variant="outlined"><Table size="small">
        <TableHead><TableRow>{['Date', 'Farm', 'Crop', 'Yield (kg)'].map(t => <TableCell key={t}>{t}</TableCell>)}</TableRow></TableHead>
        <TableBody>{selected.map(h => <TableRow key={h.id}><TableCell>{h.date}</TableCell>
          <TableCell>{farms.find(f => f.id === h.farmId)?.name || h.farmId}</TableCell>
          <TableCell>{h.crop}</TableCell><TableCell>{h.yield}</TableCell></TableRow>)}</TableBody>
      </Table></TableContainer>
    </>}
  </Stack>;
}
