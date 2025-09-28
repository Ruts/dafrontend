import {
  Box,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import React, { useEffect } from 'react';

import { observer } from 'mobx-react';
import { questionStore } from '../stores/QuestionStore';

interface ChatProps {
  token: string;
}

const Chat: React.FC<ChatProps> = observer(({ token }) => {
  useEffect(() => {
    questionStore.fetchChatHistory(token);
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
        const bolded = line.replace(/\*(.*?)\*/g, (_, match) => `<strong>${match}</strong>`);
        return (
          <Typography
            key={index}
            variant="body2"
            sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}
            dangerouslySetInnerHTML={{ __html: bolded }}
          />
        );
      }
    });
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>💬 Chat History</Typography>

      {questionStore.loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
          <Typography>Loading chat history...</Typography>
        </Box>
      ) : (
        <Paper elevation={3} sx={{ maxHeight: 600, overflowY: 'auto', padding: 2 }}>
          <List>
            {questionStore.chatHistory.map((msg, index) => (
              <React.Fragment key={msg.id || index}>
                <ListItem
                  sx={{
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                  }}
                >
                  <ListItemText
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
});

export default Chat;

