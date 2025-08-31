import { makeAutoObservable, runInAction } from 'mobx';

class QuestionStore {
  // url = "http://127.0.0.1:8000";
  url = "https://dabackend-c8fcgxdhdyfff7am.canadacentral-01.azurewebsites.net";

  question = '';
  answer = '';
  loading = false;

  whatsappNumber = '';
  whatsappMessage = '';
  whatsappStatus = '';
  incomingMessage = '';

  constructor() {
    makeAutoObservable(this);
    this.startPolling();
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

  async fetchIncomingMessage() {
    try {
      const res = await fetch(this.url + '/receive-whatsapp', {
        method: 'POST',
      });
      const data = await res.json();
      runInAction(() => {
        this.incomingMessage = `From: ${data.from}, Message: ${data.message}`;
      });
    } catch (err) {
      runInAction(() => {
        this.incomingMessage = 'Failed to fetch incoming message.' + err;
      });
    }
  }

  startPolling() {
    setInterval(() => {
      this.fetchIncomingMessage();
    }, 5000); // Poll every 5 seconds
  }
}

export const questionStore = new QuestionStore();
