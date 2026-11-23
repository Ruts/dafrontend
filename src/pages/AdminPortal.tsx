import { useEffect, useState } from 'react';
import {
  Alert, AppBar, Box, Button, Card, CardContent, Checkbox, Chip, Container,
  Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, LinearProgress,
  MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, ThemeProvider, Toolbar, Typography,
} from '@mui/material';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import StaffInbox from './StaffInbox';
import Profile from './Profile';
import { StationsPage, ServicesPage } from './StationAdmin';
import type { Station } from './Dashboard';
import { request, message } from '../api';
import { portalTheme } from '../theme';

type Account = {
  id: string; email: string; name: string; role: 'admin' | 'staff'; active: boolean;
  passwordChangeRequired: boolean; bootstrap: boolean; revision: string;
  stationId: string | null;
};
type Farmer = {
  id: string; phoneNumber: string; name: string; language: 'en' | 'sw'; active: boolean;
  verified: boolean; onboardingStep: string; revision: string; lastInboundAt: string | null;
  stationOverride: string | null; stationName: string | null;
};
type Page<T> = { items: T[]; cursor: string | null };
type Activity = {
  id: string; owner: string; direction: string; type: string; timestamp: string; status: string;
};
type Overview = {
  farmers: number; archivedFarmers: number; farms: number; registered: number;
  weatherSubscribers: number; activeFarmers7Days: number; incoming7Days: number; outgoing7Days: number;
  daily: { date: string; messages: number }[]; recent: Activity[];
};
type Session = { token: string; account: Account };

function dateLabel(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'No activity yet';
}

function OverviewPage({ token }: { token: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    request<Overview>(token, '/admin/dashboard', 'GET', undefined, controller.signal)
      .then(setData).catch(error => { if (!controller.signal.aborted) setError(message(error)); });
    return () => controller.abort();
  }, [token, refresh]);
  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="h4">Farmer activity dashboard</Typography>
        <Button onClick={() => setRefresh(value => value + 1)}>Refresh activity</Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {!data && !error && <LinearProgress />}
      {data && <>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
          {[
            ['Active farmer accounts', data.farmers], ['Completed registration', data.registered],
            ['Farms', data.farms], ['Active farmers / 7 days', data.activeFarmers7Days],
            ['Incoming / 7 days', data.incoming7Days], ['Outgoing / 7 days', data.outgoing7Days],
            ['Weather subscribers', data.weatherSubscribers], ['Archived farmers', data.archivedFarmers],
          ].map(([label, count]) => (
            <Card key={label} variant="outlined"><CardContent>
              <Typography color="text.secondary">{label}</Typography>
              <Typography variant="h3">{count}</Typography>
            </CardContent></Card>
          ))}
        </Box>
        <Card variant="outlined"><CardContent>
          <Typography variant="h6" gutterBottom>Incoming WhatsApp messages by day (UTC)</Typography>
          <Stack spacing={1}>
            {data.daily.map(day => <Stack key={day.date} direction="row" alignItems="center" spacing={2}>
              <Typography sx={{ minWidth: 105 }}>{day.date}</Typography>
              <LinearProgress variant="determinate" value={100 * day.messages / Math.max(1, ...data.daily.map(d => d.messages))}
                sx={{ flex: 1, height: 12, borderRadius: 1 }} />
              <Typography sx={{ minWidth: 35 }}>{day.messages}</Typography>
            </Stack>)}
          </Stack>
        </CardContent></Card>
        <Typography variant="h6">Recent farmer and staff activity</Typography>
        <TableContainer><Table size="small">
          <TableHead><TableRow>{['When', 'Farmer / record', 'Activity', 'Status'].map(label =>
            <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
          <TableBody>{data.recent.map(item => <TableRow key={item.id}>
            <TableCell>{dateLabel(item.timestamp)}</TableCell><TableCell>{item.owner}</TableCell>
            <TableCell>{item.direction} / {item.type}</TableCell><TableCell>{item.status}</TableCell>
          </TableRow>)}</TableBody>
        </Table></TableContainer>
        {!data.recent.length && <Alert severity="info">No recorded activity yet.</Alert>}
      </>}
    </Stack>
  );
}

type StaffDraft = {
  id: string; email: string; name: string; role: 'admin' | 'staff'; password: string;
  active: boolean; revision: string; stationId: string | null;
};
const emptyStaff: StaffDraft = {
  id: '', email: '', name: '', role: 'staff', password: '', active: true, revision: '', stationId: null,
};

function StaffPage({ token, currentId }: { token: string; currentId: string }) {
  const [items, setItems] = useState<Account[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [draft, setDraft] = useState<StaffDraft | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError('');
    Promise.all([
      request<Page<Account>>(token, '/admin/staff', 'GET', undefined, controller.signal),
      request<{ items: Station[] }>(token, '/admin/stations', 'GET', undefined, controller.signal),
    ]).then(([page, sites]) => { setItems(page.items); setCursor(page.cursor); setStations(sites.items); })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [token, refresh]);

  async function loadMore() {
    if (!cursor) return;
    setBusy(true); setError('');
    try {
      const page = await request<Page<Account>>(token, `/admin/staff?cursor=${encodeURIComponent(cursor)}`);
      setItems(value => [...value, ...page.items]); setCursor(page.cursor);
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function save() {
    if (!draft) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const body = { ...(draft.id
        ? { name: draft.name, role: draft.role, active: draft.active, revision: draft.revision,
          ...(draft.password ? { password: draft.password } : {}) }
        : { name: draft.name, email: draft.email, role: draft.role, password: draft.password }),
        stationId: draft.role === 'staff' ? draft.stationId : null };
      await request<Account>(token, `/admin/staff${draft.id ? `/${draft.id}` : ''}`,
        draft.id ? 'PATCH' : 'POST', body);
      setDraft(null);
      setNotice('Staff account saved. New and reset passwords must be changed on first sign-in.');
      setRefresh(value => value + 1);
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function archive() {
    if (!deleting) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await request<Account>(token,
        `/admin/staff/${deleting.id}?revision=${encodeURIComponent(deleting.revision)}`, 'DELETE');
      setDeleting(null); setRefresh(value => value + 1);
      setNotice('Staff account archived and sessions revoked. Edit the account to restore access.');
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  return <Stack spacing={2}>
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="h4">Staff management</Typography>
      <Stack direction="row"><Button disabled={busy} onClick={() => setRefresh(v => v + 1)}>Refresh</Button>
        <Button variant="contained" disabled={busy} onClick={() => { setError(''); setDraft({ ...emptyStaff }); }}>Add staff</Button></Stack>
    </Stack>
    <Alert severity="info">Global administrators manage all stations and accounts. Staff can manage only their assigned station's farmers and inbox.
      Staff without an active station assignment cannot access farmer data.
      Deleting archives access while retaining audit history. The initial administrator cannot be deleted or demoted.</Alert>
    {notice && <Alert severity="success">{notice}</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    {busy && <LinearProgress />}
    <TableContainer><Table>
      <TableHead><TableRow>{['Name', 'Email', 'Role / station', 'Status', 'Actions'].map(label =>
        <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
      <TableBody>{items.map(item => <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell><TableCell>{item.email}</TableCell>
        <TableCell>{item.role}<Typography variant="caption" display="block">
          {item.role === 'admin' ? 'Global access' : stations.find(s => s.id === item.stationId)?.name || 'Unassigned - no data access'}
        </Typography></TableCell><TableCell><Chip size="small"
          label={item.active ? 'Active' : 'Archived'} color={item.active ? 'success' : 'default'} /></TableCell>
        <TableCell><Button disabled={busy} onClick={() => { setError(''); setDraft({ ...item, password: '' }); }}>Edit</Button>
          <Button color="error" disabled={busy || item.bootstrap || item.id === currentId || !item.active}
            onClick={() => { setError(''); setDeleting(item); }}>Delete</Button></TableCell>
      </TableRow>)}</TableBody>
    </Table></TableContainer>
    {!busy && !items.length && <Typography>No staff accounts.</Typography>}
    {cursor && <Button disabled={busy} onClick={() => void loadMore()}>Load more staff</Button>}
    <Dialog open={!!draft} onClose={() => { if (!busy) setDraft(null); }} fullWidth maxWidth="sm">
      <DialogTitle>{draft?.id ? 'Edit staff member' : 'Add staff member'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        {draft && <Stack spacing={2} mt={1} component="form" id="staff-form" onSubmit={event => { event.preventDefault(); void save(); }}>
          <TextField required label="Full name" value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} />
          <TextField required type="email" label="Email" disabled={!!draft.id} value={draft.email}
            onChange={event => setDraft({ ...draft, email: event.target.value })} />
          <TextField select label="Role" value={draft.role}
            disabled={draft.id === currentId || items.some(item => item.id === draft.id && item.bootstrap)}
            onChange={event => setDraft({ ...draft, role: event.target.value === 'admin' ? 'admin' : 'staff' })}>
            <MenuItem value="staff">Staff</MenuItem><MenuItem value="admin">Administrator</MenuItem>
          </TextField>
          {draft.role === 'staff' && <TextField select label="Assigned station" value={draft.stationId ?? ''}
            helperText="One station per staff member. Reassignment signs them out."
            onChange={event => setDraft({ ...draft, stationId: event.target.value || null })}>
            <MenuItem value="">Unassigned - no farmer data access</MenuItem>
            {stations.map(s => <MenuItem key={s.id} value={s.id} disabled={!s.active}>
              {s.name}{s.active ? '' : ' (archived)'}</MenuItem>)}
          </TextField>}
          {draft.id !== currentId && <TextField required={!draft.id} type="password" autoComplete="new-password"
            label={draft.id ? 'Reset temporary password (optional)' : 'Temporary password'}
            helperText="At least 12 characters. Share privately; a change is required at first login."
            slotProps={{ htmlInput: { minLength: 12, maxLength: 256 } }} value={draft.password}
            onChange={event => setDraft({ ...draft, password: event.target.value })} />}
          {!!draft.id && <FormControlLabel label="Active account (uncheck to disable)"
            control={<Checkbox checked={draft.active}
              disabled={draft.id === currentId || items.some(item => item.id === draft.id && item.bootstrap)}
              onChange={event => setDraft({ ...draft, active: event.target.checked })} />} />}
        </Stack>}
      </DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setDraft(null)}>Cancel</Button>
        <Button disabled={busy} type="submit" form="staff-form" variant="contained">Save staff</Button></DialogActions>
    </Dialog>
    <Dialog open={!!deleting} onClose={() => { if (!busy) setDeleting(null); }}>
      <DialogTitle>Delete staff access?</DialogTitle>
      <DialogContent>{error && <Alert severity="error">{error}</Alert>}
        Archive {deleting?.email}? They will be signed out immediately. Audit records are retained.</DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button>
        <Button disabled={busy} color="error" onClick={() => void archive()}>Delete staff access</Button></DialogActions>
    </Dialog>
  </Stack>;
}

type FarmerDraft = {
  phoneNumber: string; name: string; language: 'en' | 'sw'; active: boolean; revision: string; stationOverride: string | null;
};
const emptyFarmer: FarmerDraft = { phoneNumber: '', name: '', language: 'en', active: true, revision: '', stationOverride: null };

function FarmersPage({ token, isAdmin }: { token: string; isAdmin: boolean }) {
  const [items, setItems] = useState<Farmer[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [viewing, setViewing] = useState<Farmer | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [draft, setDraft] = useState<FarmerDraft | null>(null);
  const [deleting, setDeleting] = useState<Farmer | null>(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true); setError('');
    Promise.all([
      request<Page<Farmer>>(token, '/admin/farmers', 'GET', undefined, controller.signal),
      request<{ items: Station[] }>(token, '/admin/stations', 'GET', undefined, controller.signal),
    ]).then(([page, sites]) => { setItems(page.items); setCursor(page.cursor); setStations(sites.items); })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [token, refresh]);
  async function loadMore() {
    if (!cursor) return;
    setBusy(true); setError('');
    try {
      const page = await request<Page<Farmer>>(token, `/admin/farmers?cursor=${encodeURIComponent(cursor)}`);
      setItems(value => [...value, ...page.items]); setCursor(page.cursor);
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function save() {
    if (!draft) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const body = draft.revision
        ? { name: draft.name, language: draft.language, active: draft.active, revision: draft.revision,
          ...(isAdmin ? { stationOverride: draft.stationOverride } : {}) }
        : { phoneNumber: draft.phoneNumber, name: draft.name, language: draft.language };
      await request<Farmer>(token, `/admin/farmers${draft.revision ? `/${encodeURIComponent(draft.phoneNumber)}` : ''}`,
        draft.revision ? 'PATCH' : 'POST', body);
      setNotice(draft.revision ? 'Farmer saved. Restored accounts remain paused until staff resume AI & weather in the inbox.'
        : 'Farmer created. They must message WhatsApp to consent and finish registration.');
      setDraft(null); setRefresh(value => value + 1);
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function archive() {
    if (!deleting) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await request<Farmer>(token,
        `/admin/farmers/${encodeURIComponent(deleting.phoneNumber)}?revision=${encodeURIComponent(deleting.revision)}`, 'DELETE');
      setDeleting(null); setRefresh(value => value + 1);
      setNotice('Farmer archived. Login, automatic replies and weather are disabled. History is retained.');
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  const shown = items.filter(item => `${item.name} ${item.phoneNumber}`.toLowerCase().includes(search.toLowerCase()));
  return <Stack spacing={2}>
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="h4">Farmer management</Typography>
      <Stack direction="row"><Button disabled={busy} onClick={() => setRefresh(v => v + 1)}>Refresh</Button>
        {isAdmin && <Button variant="contained" disabled={busy} onClick={() => { setError(''); setDraft({ ...emptyFarmer }); }}>Add farmer</Button>}</Stack>
    </Stack>
    <Alert severity="info">Admin-created farmers still need to consent and complete WhatsApp registration.
      Deleting archives their account, stops messaging and revokes portal access; farm and conversation history remain available for recovery.
      {!isAdmin && ' Only farmers assigned to your active station are shown.'}</Alert>
    {notice && <Alert severity="success">{notice}</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    <TextField label="Filter loaded farmers by name or phone" value={search} onChange={event => setSearch(event.target.value)} />
    {busy && <LinearProgress />}
    <TableContainer><Table>
      <TableHead><TableRow>{['Name', 'Phone', 'Support station', 'Language', 'Registration', 'Status', 'Last activity', 'Actions'].map(label =>
        <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
      <TableBody>{shown.map(item => <TableRow key={item.id}>
        <TableCell>{item.name || 'Not provided'}</TableCell><TableCell>{item.phoneNumber}</TableCell>
        <TableCell>{item.stationName || 'Not assigned'}<Typography display="block" variant="caption">
          {item.stationOverride ? 'Administrator override' : 'Automatic'}</Typography></TableCell>
        <TableCell>{item.language === 'sw' ? 'Kiswahili' : 'English'}</TableCell>
        <TableCell>{item.verified ? 'Complete' : item.onboardingStep || 'Pending'}</TableCell>
        <TableCell><Chip size="small" label={item.active ? 'Active' : 'Archived'} color={item.active ? 'success' : 'default'} /></TableCell>
        <TableCell>{dateLabel(item.lastInboundAt)}</TableCell>
        <TableCell><Button disabled={busy} onClick={() => { setError(''); setDraft(item); }}>Edit</Button>
          <Button disabled={busy || !item.active} onClick={() => setViewing(item)}>Farm records</Button>
          <Button color="error" disabled={busy || !item.active}
            onClick={() => { setError(''); setDeleting(item); }}>Delete</Button></TableCell>
      </TableRow>)}</TableBody>
    </Table></TableContainer>
    {!busy && !shown.length && <Typography>No matching loaded farmers.</Typography>}
    {cursor && <Button disabled={busy} onClick={() => void loadMore()}>Load more farmers</Button>}
    <Dialog open={!!draft} onClose={() => { if (!busy) setDraft(null); }} fullWidth maxWidth="sm">
      <DialogTitle>{draft?.revision ? 'Edit farmer' : 'Add farmer'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        {draft && <Stack spacing={2} mt={1} component="form" id="farmer-form" onSubmit={event => { event.preventDefault(); void save(); }}>
          <TextField required label="Full name" value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} />
          <TextField required label="Phone including country code" disabled={!!draft.revision} value={draft.phoneNumber}
            onChange={event => setDraft({ ...draft, phoneNumber: event.target.value })} />
          <TextField select label="Language" value={draft.language}
            onChange={event => setDraft({ ...draft, language: event.target.value === 'sw' ? 'sw' : 'en' })}>
            <MenuItem value="en">English</MenuItem><MenuItem value="sw">Kiswahili</MenuItem>
          </TextField>
          {isAdmin && !!draft.revision && <TextField select label="Support station assignment" value={draft.stationOverride ?? ''}
            helperText="Automatic uses the primary farm. An override changes staff ownership, not physical-service eligibility."
            onChange={event => setDraft({ ...draft, stationOverride: event.target.value || null })}>
            <MenuItem value="">Automatic - nearest covering station</MenuItem>
            {stations.map(s => <MenuItem key={s.id} value={s.id} disabled={!s.active}>
              {s.name}{s.active ? '' : ' (archived)'}</MenuItem>)}
          </TextField>}
          {!!draft.revision && <FormControlLabel label="Active account (check to restore)"
            control={<Checkbox checked={draft.active} onChange={event => setDraft({ ...draft, active: event.target.checked })} />} />}
        </Stack>}
      </DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setDraft(null)}>Cancel</Button>
        <Button disabled={busy} type="submit" form="farmer-form" variant="contained">Save farmer</Button></DialogActions>
    </Dialog>
    <Dialog open={viewing !== null} onClose={() => { setViewing(null); setRefresh(v => v + 1); }} fullWidth maxWidth="md">
      <DialogTitle>Farmer records: {viewing?.name}</DialogTitle>
      <DialogContent>{viewing && <Profile token={token} targetPhone={viewing.phoneNumber} />}</DialogContent>
      <DialogActions><Button onClick={() => { setViewing(null); setRefresh(v => v + 1); }}>Close records</Button></DialogActions>
    </Dialog>
    <Dialog open={!!deleting} onClose={() => { if (!busy) setDeleting(null); }}>
      <DialogTitle>Delete farmer access?</DialogTitle>
      <DialogContent>{error && <Alert severity="error">{error}</Alert>}
        Archive {deleting?.name || deleting?.phoneNumber}? Login, AI replies and weather will stop.
        Records are retained, and this action can be reversed by editing the account.</DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button>
        <Button disabled={busy} color="error" onClick={() => void archive()}>Delete farmer access</Button></DialogActions>
    </Dialog>
  </Stack>;
}

function PasswordPage({ token, required, onChanged }: {
  token: string; required: boolean; onChanged: (session: Session) => void;
}) {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    setError('');
    if (password !== confirm) { setError('New passwords do not match.'); return; }
    setBusy(true);
    try {
      const session = await request<Session>(token, '/admin/password', 'POST', {
        currentPassword: current, newPassword: password,
      });
      setCurrent(''); setPassword(''); setConfirm('');
      onChanged(session);
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  return <Box maxWidth={520}>
    <Typography variant="h4" gutterBottom>Change password</Typography>
    {required && <Alert severity="warning" sx={{ mb: 2 }}>Change your temporary password before accessing farmer information.</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    <Stack spacing={2} component="form" onSubmit={event => { event.preventDefault(); void save(); }}>
      <TextField required type="password" label="Current password" autoComplete="current-password"
        value={current} onChange={event => setCurrent(event.target.value)} />
      <TextField required type="password" label="New password" autoComplete="new-password"
        helperText="At least 12 characters. Do not reuse the temporary password."
        slotProps={{ htmlInput: { minLength: 12, maxLength: 256 } }}
        value={password} onChange={event => setPassword(event.target.value)} />
      <TextField required type="password" label="Confirm new password" autoComplete="new-password"
        value={confirm} onChange={event => setConfirm(event.target.value)} />
      <Button disabled={busy} variant="contained" type="submit">Update password</Button>
    </Stack>
  </Box>;
}

export default function AdminPortal({ token, setToken }: {
  token: string; setToken: (token: string | null) => void;
}) {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    request<Account>(token, '/admin/session', 'GET', undefined, controller.signal)
      .then(setAccount).catch(error => { if (!controller.signal.aborted) setError(message(error)); });
    return () => controller.abort();
  }, [token]);
  function logout() {
    localStorage.removeItem('jwt'); setToken(null); navigate('/login?mode=admin');
  }
  function changed(session: Session) {
    localStorage.setItem('jwt', session.token);
    setToken(session.token); setAccount(session.account);
    setNotice('Password changed. Previous sessions have been revoked.');
    navigate('/admin', { replace: true });
  }
  return <ThemeProvider theme={portalTheme}><Box sx={{ minHeight: '100vh', width: '100vw', maxWidth: '100vw', bgcolor: '#fcfbf6', color: 'text.primary' }}>
    <AppBar position="static" sx={{ bgcolor: '#245b36' }}><Toolbar sx={{ gap: 2, flexWrap: 'wrap', py: 1 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>Digital Agronomist | {account?.role === 'admin' ? 'Administration' : 'Staff'}</Typography>
      {account && <Typography>{account.name}</Typography>}
      <Button color="inherit" onClick={logout}>Sign out</Button>
    </Toolbar></AppBar>
    {account && !account.passwordChangeRequired && <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ p: 2 }}>
      <Button component={Link} to="/admin">Dashboard</Button>
      <Button component={Link} to="/admin/farmers">Farmers</Button>
      {account.role === 'admin' && <><Button component={Link} to="/admin/staff">Staff</Button>
        <Button component={Link} to="/admin/stations">Stations</Button>
        <Button component={Link} to="/admin/services">Farmer services</Button></>}
      <Button component={Link} to="/admin/inbox">Staff Inbox</Button>
      <Button component={Link} to="/admin/password">Change password</Button>
    </Stack>}
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error} Sign out and sign in again if your session has expired.</Alert>}
      {notice && <Alert severity="success" onClose={() => setNotice('')} sx={{ mb: 2 }}>{notice}</Alert>}
      {!account && !error && <LinearProgress />}
      {account && (account.passwordChangeRequired
        ? <PasswordPage token={token} required onChanged={changed} />
        : <Routes>
          <Route index element={<OverviewPage token={token} />} />
          <Route path="farmers" element={<FarmersPage token={token} isAdmin={account.role === 'admin'} />} />
          <Route path="stations" element={account.role === 'admin' ? <StationsPage token={token} /> : <Navigate to="/admin" replace />} />
          <Route path="services" element={account.role === 'admin' ? <ServicesPage token={token} /> : <Navigate to="/admin" replace />} />
          <Route path="staff" element={account.role === 'admin' ? <StaffPage token={token} currentId={account.id} /> : <Navigate to="/admin" replace />} />
          <Route path="inbox" element={<StaffInbox token={token} />} />
          <Route path="password" element={<PasswordPage token={token} required={false} onChanged={changed} />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>)}
    </Container>
  </Box></ThemeProvider>;
}
