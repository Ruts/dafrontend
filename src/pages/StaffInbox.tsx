import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography,
} from '@mui/material';

type Interaction = {
  id: string;
  owner: string;
  direction: 'inbound' | 'outbound';
  type: string;
  message: string;
  timestamp: string;
  status: string;
  mediaId?: string;
};
type Page = { items: Interaction[]; cursor: string | null };

export default function StaffInbox({ token }: { token: string }) {
  const [source, setSource] = useState('whatsapp');
  const [phone, setPhone] = useState('');
  const [filter, setFilter] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [items, setItems] = useState<Interaction[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError('');
    setItems([]);
    setCursor(null);
    setPhoto(null);
    const query = new URLSearchParams({ source, limit: '50' });
    if (filter) query.set('phone', filter);
    fetch(`${import.meta.env.VITE_API_BASE}/staff/interactions?${query}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error(response.status === 403
        ? 'Access is restricted to server-authorised staff.' : `Unable to load messages (${response.status}).`);
      return response.json() as Promise<Page>;
    }).then(page => {
      if (!controller.signal.aborted) {
        setItems(page.items);
        setCursor(page.cursor);
      }
    }).catch(cause => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Unable to load messages.');
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, [token, source, filter, refresh]);

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.url);
  }, [photo]);

  async function loadMore() {
    if (!cursor) return;
    setBusy(true);
    setError('');
    const query = new URLSearchParams({ source, cursor, limit: '50' });
    if (filter) query.set('phone', filter);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/staff/interactions?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Unable to load older messages (${response.status}).`);
      const page: Page = await response.json();
      setItems(previous => {
        const existing = new Set(previous.map(item => item.id));
        return [...previous, ...page.items.filter(item => !existing.has(item.id))];
      });
      setCursor(page.cursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load older messages.');
    } finally {
      setBusy(false);
    }
  }

  async function viewPhoto(id: string) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/staff/interactions/${encodeURIComponent(id)}/image?source=${source}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error(`Photo unavailable (${response.status}); Meta may have expired older media.`);
      setPhoto({ id, url: URL.createObjectURL(await response.blob()) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to retrieve photo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box p={3} maxWidth={1000}>
      <Typography variant="h4" gutterBottom>Staff conversation inbox</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Private farmer information. Read-only, newest first. WhatsApp includes registration,
        advice and forecasts from inbox activation onward. Accepted means Meta accepted the
        send, not confirmed delivery. Login codes are redacted. Refresh to see new activity.
      </Alert>
      <Stack direction="row" spacing={2} mb={2} flexWrap="wrap" useFlexGap>
        <TextField select label="Message source" value={source} disabled={busy}
          onChange={event => setSource(event.target.value)} sx={{ minWidth: 240 }}>
          <MenuItem value="whatsapp">WhatsApp interactions</MenuItem>
          <MenuItem value="advice">Advice / portal history</MenuItem>
        </TextField>
        <TextField label="Farmer phone (blank for everyone)" value={phone} disabled={busy}
          onChange={event => setPhone(event.target.value)} />
        <Button disabled={busy} onClick={() => {
          setFilter(phone.trim());
          setRefresh(value => value + 1);
        }}>Search / Refresh</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {busy && <Typography>Loading...</Typography>}
      {!busy && !error && items.length === 0 && <Typography>No recorded interactions found.</Typography>}
      <Stack spacing={2}>
        {items.map(item => (
          <Card key={item.id} variant="outlined">
            <CardContent>
              <Typography variant="subtitle2">
                {item.owner} | {item.direction === 'inbound' ? 'Farmer' : 'Digital Agronomist'}
                {' | '}{new Date(item.timestamp).toLocaleString()} | {item.status}
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mt: 1 }}>
                {item.message}
              </Typography>
              {item.mediaId && <Button disabled={busy} onClick={() => void viewPhoto(item.id)}>View photo</Button>}
              {photo?.id === item.id && (
                <Box component="img" src={photo.url} alt="Farmer-submitted crop photo"
                  sx={{ display: 'block', maxWidth: '100%', maxHeight: 450, mt: 1 }} />
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
      {cursor && <Button sx={{ mt: 2 }} disabled={busy} onClick={() => void loadMore()}>Load older messages</Button>}
    </Box>
  );
}
