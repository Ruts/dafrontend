import { makeAutoObservable, runInAction } from 'mobx';

class QuestionStore {
  url = import.meta.env.VITE_API_BASE;

  question = '';
  answer = '';
  loading = false;

  whatsappNumber = '';
  whatsappMessage = '';
  whatsappStatus = '';
  incomingMessage = '';

  // chatHistory: { type: 'sent' | 'received', text: string }[] = [];
  chatHistory: any[] = [];
  error: string | null = null;
  user: { name: string; phone: string; } = { name: '', phone: '' };

  constructor() {
    makeAutoObservable(this);
  }

  setQuestion(value: string) {
    this.question = value;
  }

  async fetchAnswer() {
    this.loading = true;
    try {
      const res = await fetch(this.url + '/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: this.question }),
      });
      const data = await res.json();
      runInAction(() => {
        this.answer = data.answer;
      });
    } catch (err) {
      runInAction(() => {
        this.answer = 'Error fetching answer.' +err;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  setWhatsappNumber(value: string) {
    this.whatsappNumber = value;
  }

  setWhatsappMessage(value: string) {
    this.whatsappMessage = value;
  }

  async sendWhatsApp() {
    try {
      const res = await fetch(this.url + '/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: this.whatsappNumber,
          message: this.whatsappMessage,
        }),
      });
      const data = await res.json();
      runInAction(() => {
        this.whatsappStatus = data.status === 'sent'
          ? `Message sent! SID: ${data.sid}`
          : `Error: ${data.detail}`;
      });
    } catch (err) {
      runInAction(() => {
        this.whatsappStatus = 'Failed to send message.' + err;
      });
    }
  }

  addSentMessage() {
    if (this.whatsappMessage.trim()) {
      this.chatHistory.push({ type: 'sent', text: this.whatsappMessage });
    }
  }

  async fetchIncomingMessage() {
    try {
      const res = await fetch(this.url + '/latest-whatsapp');
      const data = await res.json();
      const incomingText = `From ${data.from}: ${data.message}`;

      // Avoid duplicates
      if (!this.chatHistory.some(msg => msg.type === 'received' && msg.text === incomingText)) {
        runInAction(() => {
          this.chatHistory.push({ type: 'received', text: incomingText });
          this.incomingMessage = incomingText;
        });
      }
    } catch (err) {
      runInAction(() => {
        this.incomingMessage = 'Failed to fetch incoming message.' + err;
      });
    }
  }

  async fetchChatHistory(token: string) {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(`${this.url}/chat-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      runInAction(() => {
        this.chatHistory = Array.isArray(data) ? data : [];
        this.loading = false;
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message || "Failed to fetch chat history";
        this.loading = false;
      });
    }
  }
}

export const questionStore = new QuestionStore();
