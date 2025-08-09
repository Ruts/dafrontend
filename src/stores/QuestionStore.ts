import { makeAutoObservable } from 'mobx';

class QuestionStore {
  question = '';
  answer = '';
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  setQuestion(value: string) {
    this.question = value;
  }

  async fetchAnswer() {
    this.loading = true;
    try {
      const res = await fetch('https://dabackend-c8fcgxdhdyfff7am.canadacentral-01.azurewebsites.net/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: this.question }),
      });
      const data = await res.json();
      this.answer = data.answer;
    } catch (e) {
      this.answer = 'Error fetching answer.' + e;
    } finally {
      this.loading = false;
    }
  }
}

export const questionStore = new QuestionStore();
