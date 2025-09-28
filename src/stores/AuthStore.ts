import { makeAutoObservable, runInAction } from 'mobx';

type AuthStep = "signup" | "verify" | "login";

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
    async createAccount() {
        this.setError('');
        this.isLoading = true;
        const res = await fetch(this.url + '/create-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: this.phone, name: this.name }),
        });

        const data = await res.json();

        runInAction(() => {
            if (data.status === 'code_sent') {
                this.setStep('verify');
            } else {
                this.setError("Unable to create account");
            }
            this.isLoading = false;
        })
    }

    async login() {
        this.setError('');
        this.isLoading = true;
        const res = await fetch(this.url + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: this.phone }),
        });

        const data = await res.json();

        runInAction(() => {
            if (data.status === 'verify') {
                this.setStep('verify');
            } else {
                this.setError("Account does not exist. Kindly create account.");
            }
            this.isLoading = false;
        })
    }

    async verifyCode(setToken: (token: string) => void, navigate: (path: string) => void) {
        this.setError('');
        this.isLoading = true;
        const res = await fetch(this.url + '/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: this.phone, code: this.code }),
        });
        const data = await res.json();

        runInAction(() => {
        console.log("data", data);
            if (data.status === 'verified') {
                setToken(data.token);
                console.log("data.token", data.token);
                navigate('/dashboard'); // redirect
            } else {
                this.setStep('login');
                this.setError("Verification failed.");
            }
            this.isLoading = false;
        })
    }
}

// Export a single instance of the store
export const authStore = new AuthStore();