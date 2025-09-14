import { makeAutoObservable, runInAction } from "mobx";

export interface SoilSample {
    id: string;
    farmId: string;
    date: string;
    pH: number;
    electricalConductivity: number;
    organicMatter: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    calcium: number;
    magnesium: number;
    sulfur: number;
    zinc: number;
    iron: number;
    soilTexture: string;
    moistureContent: number;
};

class SoilSampleStore {
    url = import.meta.env.VITE_API_BASE;
    
    sample: SoilSample  = {
        id: "",
        farmId: "",
        date: "",
        pH: 0,
        electricalConductivity: 0,
        organicMatter: 0,
        nitrogen: 0,
        phosphorus: 0,
        potassium: 0,
        calcium: 0,
        magnesium: 0,
        sulfur: 0,
        zinc: 0,
        iron: 0,
        soilTexture: "",
        moistureContent: 0
    };
    loading = false;

    filter = {
        farmId: "",
        startDate: "",
        endDate: ""
    };

    samples: SoilSample[] = []

    submitting = false;
    success = false;

    constructor() {
        makeAutoObservable(this);
    }

    setFilter<K extends keyof typeof this.filter>(key: K, value: string) {
        this.filter[key] = value;
    }

    setField<K extends keyof typeof this.sample>(key: K, value: typeof this.sample[K]) {
        this.sample[key] = value;
    }

    async submitSample(token: string) {
        this.submitting = true;
        try {
            const res = await fetch(`${this.url}/soil-samples`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(this.sample)
            });
            this.success = res.ok;
        } finally {
            this.submitting = false;
        }
    }

    async fetchSamples(token: string) {
        this.loading = true;
        const params = new URLSearchParams();

        if (this.filter.farmId) params.append("farmId", this.filter.farmId);
        if (this.filter.startDate) params.append("startDate", this.filter.startDate);
        if (this.filter.endDate) params.append("endDate", this.filter.endDate);

        try {
            const res = await fetch(`${this.url}/soil-samples?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            runInAction(() => {
                this.samples = data;
            });
        } finally {
            this.loading = false;
        }
    }
}

export const soilSampleStore = new SoilSampleStore();
