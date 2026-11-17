import { makeAutoObservable, runInAction } from 'mobx';

type AuthStep = "verify" | "login";

export class AuthStore {
    // Observables (State)
    step: AuthStep = "login";
    phone: string = "";
    name: string = "";
    code: string = "";
    error: string = "";
    isLoading: boolean = false;
    
    // API Base URL from environment variable
    url = import.meta.env.VITE_API_BASE;

    constructor() {
      makeAutoObservable(this);
    }

    // Actions to mutate state
    setStep(newStep: AuthStep) {
        this.step = newStep;
        this.error = ''; // Clear error on step change
    }

    setPhone(newPhone: string) {
        this.phone = newPhone;
        this.error = '';
    }

    setName(newName: string) {
        this.name = newName;
        this.error = '';
    }

    setCode(newCode: string) {
        this.code = newCode;
        this.error = '';
    }
    
    setError(newError: string) {
        this.error = newError;
    }

    // Async Actions
    async login() {
        this.setError('');
        this.isLoading = true;
        try {
            const data = await this.request('/login', { phone: this.phone });
            runInAction(() => {
                if (data.status !== 'verify') throw new Error('Unable to request a code.');
                this.setStep('verify');
            });
        } catch (error) {
            runInAction(() => this.setError(error instanceof Error ? error.message : 'Login failed.'));
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    async verifyCode(setToken: (token: string) => void, navigate: (path: string) => void) {
        this.setError('');
        this.isLoading = true;
        try {
            const data = await this.request('/verify-code', { phone: this.phone, code: this.code });
            if (data.status !== 'verified' || typeof data.token !== 'string') {
                throw new Error('Verification failed.');
            }
            localStorage.setItem('jwt', data.token);
            setToken(data.token);
            navigate('/dashboard');
        } catch (error) {
            runInAction(() => this.setError(error instanceof Error ? error.message : 'Verification failed.'));
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    private async request(path: string, body: object): Promise<{ status: string; token?: string }> {
        const res = await fetch(this.url + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(typeof data.detail === 'string' ? data.detail : 'Request failed. Please retry.');
        }
        return data;
    }
}

// Export a single instance of the store
export const authStore = new AuthStore();