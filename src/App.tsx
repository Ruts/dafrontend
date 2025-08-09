import React from 'react';
import { observer } from 'mobx-react-lite';
import { questionStore } from './stores/QuestionStore';

const App = observer(() => {
  return (
    <div style={{ padding: '2rem' }}>
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
    </div>
  );
});

export default App;
