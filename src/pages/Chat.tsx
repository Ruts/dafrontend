import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { request, message } from '../api';

interface ChatProps {
  token: string;
}

type Message = { id: string; role: string; message: string; timestamp: string };

const Chat: React.FC<ChatProps> = ({ token }) => {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    request<Message[]>(token, '/chat-history', 'GET', undefined, controller.signal)
      .then(setChatHistory).catch(error => { if (!controller.signal.aborted) setError(message(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token]);

  const formatTimestamp = (ts: string) => new Date(ts).toLocaleString();

  const renderFormattedMessage = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');

    return lines.map((line, index) => {
      if (line.startsWith('***') && line.endsWith('***')) {
        return (
          <Typography key={index} variant="h6" sx={{ fontWeight: 'bold', mt: 2 }}>
            {line.replace(/\*\*\*/g, '').trim()}
          </Typography>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <Typography key={index} variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>
            {line.replace(/\*\*/g, '').trim()}
          </Typography>
        );
      } else {
        return (
          <Typography
            key={index}
            variant="body2"
            sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}
          >
            {line.split(/(\*[^*]+\*)/g).map((part, i) =>
              part.startsWith('*') && part.endsWith('*')
                ? <strong key={i}>{part.slice(1, -1)}</strong>
                : part
            )}
          </Typography>
        );
      }
    });
  };

  return (
    <Box p={3}>
      <Typography variant="h5" component="h2" gutterBottom>Chat history</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && !chatHistory.length && <Alert severity="info">
        No conversations yet. Ask a question or share a crop photo on WhatsApp.
      </Alert>}

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
          <Typography>Loading chat history...</Typography>
        </Box>
      ) : (
        <Paper elevation={3} sx={{ maxHeight: 600, overflowY: 'auto', padding: 2 }}>
          <List>
            {chatHistory.map((msg, index) => (
              <React.Fragment key={msg.id || index}>
                <ListItem
                  sx={{
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                  }}
                >
                  <ListItemText
                    disableTypography
                    primary={
                      <Box
                        sx={{
                          backgroundColor: msg.role === 'user' ? '#d1e7dd' : '#f0f0f0',
                          padding: 1.5,
                          borderRadius: 2,
                          maxWidth: '80%',
                        }}
                      >
                        {renderFormattedMessage(msg.message)}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {msg.role === 'user' ? 'You' : 'Assistant'} • {formatTimestamp(msg.timestamp)}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default Chat;

