import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography,
} from '@mui/material';

type Interaction = {
  id: string;
  owner: string;
  direction: 'inbound' | 'outbound' | 'internal';
  type: string;
  message: string;
  timestamp: string;
  status: string;
  mediaId?: string;
  senderType?: string;
  staffPhone?: string;
};
type Page = { items: Interaction[]; cursor: string | null };
type Conversation = {
  phone: string;
  name: string;
  paused: boolean;
  revision: string;
  changedBy: string | null;
  replyWindowEndsAt: string | null;
  windowOpen: boolean;
};
type SendAttempt = { message: string; requestId: string; revision: string };

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
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [acting, setActing] = useState(false);
  const [draft, setDraft] = useState('');
  const [sendAttempt, setSendAttempt] = useState<SendAttempt | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setDraft('');
    setSendAttempt(null);
    setNotice('');
  }, [filter]);

  useEffect(() => {
    const controller = new AbortController();
    setConversation(null);
    if (source !== 'whatsapp' || !filter) return () => controller.abort();
    fetch(`${import.meta.env.VITE_API_BASE}/staff/conversations/${encodeURIComponent(filter)}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error(`Unable to load conversation controls (${response.status}).`);
      return response.json() as Promise<Conversation>;
    }).then(value => {
      if (!controller.signal.aborted) setConversation(value);
    }).catch(cause => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Unable to load controls.');
    });
    return () => controller.abort();
  }, [token, source, filter, refresh]);

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

  useEffect(() => {
    if (!conversation?.paused || acting) return;
    const timer = window.setInterval(() => setRefresh(value => value + 1), 15000);
    return () => window.clearInterval(timer);
  }, [conversation?.paused, acting]);

  async function changeTakeover() {
    if (!conversation) return;
    setActing(true);
    setError('');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/staff/conversations/${encodeURIComponent(conversation.phone)}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ paused: !conversation.paused, revision: conversation.revision }),
        },
      );
      if (!response.ok) {
        const result = await response.json();
        throw new Error(typeof result.detail === 'string' ? result.detail : 'Unable to update takeover.');
      }
      setConversation(await response.json() as Conversation);
      setRefresh(value => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update takeover. Refresh to check its state.');
    } finally {
      setActing(false);
    }
  }

  async function sendReply() {
    if (!conversation) return;
    const attempt = sendAttempt ?? {
      message: draft.trim(), requestId: crypto.randomUUID(), revision: conversation.revision,
    };
    setSendAttempt(attempt);
    setActing(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/staff/conversations/${encodeURIComponent(conversation.phone)}/messages`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(attempt),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        if ([409, 422, 503].includes(response.status)) setSendAttempt(null);
        throw new Error(typeof result.detail === 'string' ? result.detail : 'Unable to send. Check the inbox before retrying.');
      }
      if (result.status === 'accepted') {
        setNotice('Meta accepted your message. This does not confirm delivery.');
        setDraft('');
        setSendAttempt(null);
      } else if (result.status === 'cancelled') {
        setNotice('Message cancelled because conversation control changed. It was not sent.');
        setSendAttempt(null);
      } else {
        setError('Send outcome is not confirmed. Check Meta and the inbox; do not send a duplicate. Checking again will not resend this request.');
      }
      setRefresh(value => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Send outcome is uncertain. Check the inbox before sending again.');
    } finally {
      setActing(false);
    }
  }

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
        Private farmer information, newest first. WhatsApp includes registration,
        advice and forecasts from inbox activation onward. Accepted means Meta accepted the
        send, not confirmed delivery. Login codes are redacted. Select one farmer to take over
        and reply as Digital Agronomist. Staff identity is recorded internally.
      </Alert>
      <Stack direction="row" spacing={2} mb={2} flexWrap="wrap" useFlexGap>
        <TextField select label="Message source" value={source} disabled={busy || acting}
          onChange={event => setSource(event.target.value)} sx={{ minWidth: 240 }}>
          <MenuItem value="whatsapp">WhatsApp interactions</MenuItem>
          <MenuItem value="advice">Advice / portal history</MenuItem>
        </TextField>
        <TextField label="Farmer phone (blank for everyone)" value={phone} disabled={busy || acting}
          onChange={event => setPhone(event.target.value)} />
        <Button disabled={busy || acting} onClick={() => {
          setFilter(phone.trim());
          setRefresh(value => value + 1);
        }}>Search / Refresh</Button>
      </Stack>
      {source === 'whatsapp' && conversation && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{conversation.name || 'Farmer'} | {conversation.phone}</Typography>
            <Alert severity={conversation.paused ? 'warning' : 'info'} sx={{ my: 2 }}>
              {conversation.paused
                ? `Staff control is on${conversation.changedBy ? ` (${conversation.changedBy})` : ''}. AI replies and weather notifications are paused until staff resume them.`
                : 'Automatic replies and opted-in weather notifications are enabled. Take over before sending a staff reply.'}
              {' '}A message already being sent may still arrive. New activity refreshes every 15 seconds during takeover.
            </Alert>
            <Button disabled={acting || busy} onClick={() => void changeTakeover()}>
              {conversation.paused ? 'Resume AI & weather' : 'Take over: pause AI & weather'}
            </Button>
            <Typography variant="body2" sx={{ my: 1 }}>
              {conversation.windowOpen && conversation.replyWindowEndsAt
                ? `Free-text replies allowed until ${new Date(conversation.replyWindowEndsAt).toLocaleString()}.`
                : 'The 24-hour WhatsApp reply window is closed. Ask the farmer to message first. Proactive contact outside this window requires an approved Meta template; template outreach is not available in this inbox yet.'}
            </Typography>
            <TextField fullWidth multiline minRows={3} label="Staff reply from Digital Agronomist"
              value={draft} onChange={event => setDraft(event.target.value)}
              disabled={acting || !conversation.paused || !!sendAttempt}
              slotProps={{ htmlInput: { maxLength: 4096 } }} />
            <Button sx={{ mt: 1 }} variant="contained"
              disabled={acting || (!sendAttempt && (!conversation.paused || !conversation.windowOpen || !draft.trim()))}
              onClick={() => void sendReply()}>
              {acting ? 'Working...' : sendAttempt ? 'Check previous send' : 'Send staff reply'}
            </Button>
          </CardContent>
        </Card>
      )}
      {notice && <Alert severity="info" sx={{ mb: 2 }}>{notice}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {busy && <Typography>Loading...</Typography>}
      {!busy && !error && items.length === 0 && <Typography>No recorded interactions found.</Typography>}
      <Stack spacing={2}>
        {items.map(item => (
          <Card key={item.id} variant="outlined">
            <CardContent>
              <Typography variant="subtitle2">
                {item.owner} | {item.direction === 'inbound' ? 'Farmer'
                  : item.senderType === 'staff' ? `Staff ${item.staffPhone ?? ''}` : 'Digital Agronomist'}
                {' | '}{new Date(item.timestamp).toLocaleString()} | {item.status}
              </Typography>
              {source === 'whatsapp' && item.owner !== conversation?.phone && (
                <Button disabled={busy || acting} onClick={() => {
                  setPhone(item.owner);
                  setFilter(item.owner);
                }}>Open conversation</Button>
              )}
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
