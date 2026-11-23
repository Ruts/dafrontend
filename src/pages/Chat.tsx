import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, List, ListItem, Paper, Stack, Typography } from '@mui/material';
import { request, message } from '../api';

type Message = {
  id: string; role: string; message: string; timestamp: string; status: string;
  channel: string; type: string; senderType?: string;
};
type Page = { items: Message[]; cursor: string | null };
type Scroll = { bottom: true } | { height: number; top: number };

function merge(older: Message[], newer: Message[]) {
  const messages = new Map(older.map(item => [item.id, item]));
  newer.forEach(item => messages.set(item.id, item));
  return [...messages.values()].sort((a, b) =>
    Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

function formatted(text: string) {
  return text.split('\n').filter(line => line.trim()).map((line, index) =>
    <Typography key={index} variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mt: 0.5 }}>
      {line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong>
          : part.startsWith('*') && part.endsWith('*') ? <strong key={i}>{part.slice(1, -1)}</strong> : part)}
    </Typography>);
}

export default function Chat({ token }: { token: string }) {
  const [history, setHistory] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState('');
  const [newMessages, setNewMessages] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const messages = useRef<Message[]>([]);
  const olderCursor = useRef<string | null>(null);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const scroll = useRef<Scroll | null>(null);
  const refreshNeeded = useRef(false);

  const load = useCallback(async (mode: 'initial' | 'older' | 'poll') => {
    if (busy.current || mode === 'older' && !olderCursor.current) return;
    if (mode === 'poll' && document.visibilityState === 'hidden') return;
    busy.current = true;
    const abort = new AbortController();
    controller.current = abort;
    if (mode === 'initial') setLoading(true);
    if (mode === 'older') setLoadingOlder(true);
    try {
      const query = mode === 'older' ? `?cursor=${encodeURIComponent(olderCursor.current ?? '')}` : '';
      const page = await request<Page>(token, '/chat-history/page' + query, 'GET', undefined, abort.signal);
      if (abort.signal.aborted) return;
      const current = messages.current;
      const box = viewport.current;
      const atBottom = !box || box.scrollHeight - box.clientHeight - box.scrollTop < 80;
      const known = new Set(current.map(item => item.id));
      const added = page.items.some(item => !known.has(item.id));
      if (mode === 'poll' && current.length && added && page.cursor && !page.items.some(item => known.has(item.id))) {
        refreshNeeded.current = true; setNewMessages(true); setError('');
        return;
      }
      if (mode === 'initial') {
        scroll.current = { bottom: true }; refreshNeeded.current = false; setNewMessages(false);
      } else if (mode === 'older' && box) {
        scroll.current = { height: box.scrollHeight, top: box.scrollTop };
      } else if (mode === 'poll' && added) {
        if (atBottom) scroll.current = { bottom: true };
        else setNewMessages(true);
      }
      const next = mode === 'initial' ? page.items : mode === 'older' ? merge(page.items, current) : merge(current, page.items);
      messages.current = next; setHistory(next); setError('');
      if (mode !== 'poll') { olderCursor.current = page.cursor; setCursor(page.cursor); }
    } catch (error) {
      if (!abort.signal.aborted) setError(message(error));
    } finally {
      if (!abort.signal.aborted) { busy.current = false; setLoading(false); setLoadingOlder(false); }
    }
  }, [token]);

  useEffect(() => {
    messages.current = []; olderCursor.current = null; busy.current = false;
    setHistory([]); setCursor(null); setError(''); setNewMessages(false); refreshNeeded.current = false;
    void load('initial');
    const timer = window.setInterval(() => void load('poll'), 5000);
    function visible() { if (document.visibilityState === 'visible') void load('poll'); }
    document.addEventListener('visibilitychange', visible);
    return () => { controller.current?.abort(); window.clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [load]);

  useLayoutEffect(() => {
    const box = viewport.current;
    const change = scroll.current;
    if (box && change) {
      box.scrollTop = 'bottom' in change ? box.scrollHeight : change.top + box.scrollHeight - change.height;
      scroll.current = null;
    }
  }, [history]);

  useEffect(() => {
    const box = viewport.current;
    if (box && cursor && !loading && !loadingOlder && !error && box.scrollHeight <= box.clientHeight) void load('older');
  }, [cursor, history.length, loading, loadingOlder, error, load]);

  function latest() {
    if (refreshNeeded.current) { void load('initial'); return; }
    const box = viewport.current;
    if (box) box.scrollTop = box.scrollHeight;
    setNewMessages(false);
  }

  return <Stack spacing={2}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
      <Typography variant="h5" component="h2">Chat history</Typography>
      <Button disabled={loading || loadingOlder} onClick={() => void load('initial')}>Refresh conversation</Button>
    </Stack>
    <Typography variant="body2" color="text.secondary">
      WhatsApp conversations and earlier portal messages. Scroll up to load older messages.
    </Typography>
    {error && <Alert severity="error">{error}</Alert>}
    <Paper ref={viewport} role="log" aria-label="Conversation messages" tabIndex={0}
      onScroll={() => {
        const box = viewport.current;
        if (box && box.scrollTop < 80 && !loading) void load('older');
      }}
      variant="outlined" sx={{ height: 'min(65vh, 680px)', minHeight: 320, overflowY: 'auto', overflowAnchor: 'none', p: { xs: 1, sm: 2 } }}>
      {loading && <Stack alignItems="center" p={3}><CircularProgress size={24} /><Typography>Loading latest messages...</Typography></Stack>}
      {cursor && <Box textAlign="center">
        <Button disabled={loadingOlder || loading} onClick={() => void load('older')}>
          {loadingOlder ? 'Loading older messages...' : 'Load older messages'}</Button>
      </Box>}
      {!loading && !error && !history.length && <Alert severity="info">
        No conversations yet. Ask a question or share a crop photo on WhatsApp.
      </Alert>}
      <List disablePadding>
        {history.map(item => <ListItem key={item.id} data-message-id={item.id} disableGutters sx={{ py: 1.5 }}>
          <Stack sx={{ width: '100%' }} alignItems={item.role === 'user' ? 'flex-end' : 'flex-start'} spacing={0.75}>
            <Box sx={{ bgcolor: item.role === 'user' ? '#dcecdf' : '#f0f2eb', p: 2,
              borderRadius: 2.5, maxWidth: { xs: '100%', sm: '88%' }, minWidth: 0 }}>
              {item.type === 'image' && <Typography variant="caption" fontWeight={700}>Photo</Typography>}
              {formatted(item.message)}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {item.role === 'user' ? 'You' : item.senderType === 'staff' ? 'Support team' : 'Digital Agronomist'}
              {' - '}{new Date(item.timestamp).toLocaleString()}
              {item.channel === 'portal' ? ' - Portal' : ''}
              {item.status === 'delivery_unknown' ? ' - Delivery not confirmed' : ''}
            </Typography>
          </Stack>
        </ListItem>)}
      </List>
    </Paper>
    {newMessages && <Button variant="contained" sx={{ alignSelf: 'center' }} onClick={latest}>New messages - go to latest</Button>}
  </Stack>;
}
