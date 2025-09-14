import type { FarmForm, Harvest } from '../pages/FarmManager';
import { makeAutoObservable, runInAction } from 'mobx';

class FarmManagerStore {
    url = import.meta.env.VITE_API_BASE;

    step: "Farms" | "AddFarm" | "AddHarvest"  = 'Farms';
    showMap = false;

    setStep(step: "Farms" | "AddFarm"| "AddHarvest" ) {
        this.step = step;
    }

    toggleMap(show: boolean) {
        this.showMap = show;
    }

    loading = false;
    token = "";
    farms: FarmForm[] = [];
    farm: FarmForm = {
        id: '',
        name: '',
        crop: '',
        acreage: 0,
        coordinates: []
    };
    harvests: Harvest[] = [];
    harvest: Harvest = {
        id: "",
        farmId: "",
        owner: "",
        date: "",
        yield: 0,
        crop: ""
    };

    constructor() {
        makeAutoObservable(this);
    }

    async fetchFarms() {
        this.loading = true;
        try {
            const res = await fetch(`${this.url}/farms`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
            });
            const data = await res.json();
            runInAction(() => {
                console.log("data", data);
                console.log("this.farms", this.farms);
                this.farms = data;
                console.log("this.farms", this.farms);
            });
        } catch (err) {
            console.log(err);
            runInAction(() => {
                this.farms = [];
            });
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    async handleSubmit() {
        try {
            const res = await fetch(`${this.url}/farms`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: JSON.stringify(this.farm),
            });
            const data = await res.json();
            runInAction(() => {
                this.farms = data.status === 'created'
                    ? [...this.farms, data.farm]
                    : this.farms;
                this.setStep('Farms');
            });
        } catch (err) {
            console.log(err);
            runInAction(() => {
                this.farms = [];
            });
        }
    }

    async fetchHarvests() {
        this.loading = true;
        try {
            const res = await fetch(`${this.url}/harvests`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
            });
            const data = await res.json();
            runInAction(() => {
                this.harvests = data;
            });
        } catch (err) {
            console.log(err);
            runInAction(() => {
                this.harvests = [];
            });
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    async postHarvest() {
        try {
            const res = await fetch(`${this.url}/harvests`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`
                },
                body: JSON.stringify(this.harvest),
            });
            const data = await res.json();
            runInAction(() => {
                this.harvests = data.status === 'created'
                    ? [...this.harvests, data.harvest]
                    : this.harvests;
                this.setStep('Farms');
            });
        } catch (err) {
            console.log(err);
            runInAction(() => {
                this.harvests = [...this.harvests];
            });
        }
    }

    getFarmName = (id: string): string => {
        const farm = this.farms.find(f => f.id === id);
        return farm ? farm.name : id;
    };
}

export const farmManagerStore = new FarmManagerStore();