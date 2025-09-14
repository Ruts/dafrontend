import '../styles/App.css';

import { observer } from 'mobx-react-lite';
import { questionStore } from '../stores/QuestionStore';
import { useEffect } from 'react';

const Chat = observer(() => {
  useEffect(() => {
    const interval = setInterval(() => {
      questionStore.fetchIncomingMessage();
    }, 2000); // refresh every 5 seconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h2>Ask the AI</h2>
      <textarea
        value={questionStore.question}
        onChange={(e) => questionStore.setQuestion(e.target.value)}
        placeholder="Type your question..."
        style={{ width: '300px', marginRight: '1rem' }}
      />
      <button onClick={() => questionStore.fetchAnswer()} disabled={questionStore.loading}>
        {questionStore.loading ? 'Loading...' : 'Ask'}
      </button>
      <p><strong>Answer:</strong> {questionStore.answer}</p>

      <h2>Send WhatsApp Message</h2>
      <input
        type="text"
        value={questionStore.whatsappNumber}
        onChange={(e) => questionStore.setWhatsappNumber(e.target.value)}
        placeholder="Enter WhatsApp number (e.g. +2547xxxxxxx)"
        style={{ width: '300px', marginRight: '1rem' }}
      />
      <input
        type="text"
        value={questionStore.whatsappMessage}
        onChange={(e) => questionStore.setWhatsappMessage(e.target.value)}
        placeholder="Enter message..."
        style={{ width: '300px', marginTop: '0.5rem', marginRight: '1rem' }}
      />
      <button onClick={() => {
        questionStore.sendWhatsApp();
        questionStore.addSentMessage(); // store sent message
      }} style={{ marginTop: '0.5rem' }}>
        Send WhatsApp
      </button>
      <p>{questionStore.whatsappStatus}</p>

      <h2>Chat History</h2>
      <div className="chatBox">
        {questionStore.chatHistory.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            <span className={`bubble ${msg.type}`}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default Chat;

