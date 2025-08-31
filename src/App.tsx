import { observer } from 'mobx-react-lite';
import { questionStore } from './stores/QuestionStore';

const App = observer(() => {
  return (
    <div style={{ padding: '2rem' }}>
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
      <button onClick={() => questionStore.sendWhatsApp()} style={{ marginTop: '0.5rem' }}>
        Send WhatsApp
      </button>
      <p>{questionStore.whatsappStatus}</p>

      <h2>Incoming WhatsApp Message</h2>
      <p>{questionStore.incomingMessage}</p>
    </div>
  );
});

export default App;
