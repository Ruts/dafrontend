import type { Environment, Harvest } from '../pages/FarmManager';
import { makeAutoObservable, runInAction } from 'mobx';

class FarmReportStore {
    url = import.meta.env.VITE_API_BASE;
    harvests: Harvest[] = [];
    environments: Environment[] = [];
    filteredHarvest: Harvest[] = [];
    filteredEnvironment: Environment[] = [];
    loading = true;

    selectedFarmId: string = '';
    selectedCrop: string = '';

    constructor() {
        makeAutoObservable(this);
    }

    async fetchReportData(token: string) {
        console.log("this.url", this.url);
        this.loading = true;
        try {
        const [harvestRes, envRes] = await Promise.all([
            fetch(`${this.url}/harvests`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${this.url}/environments`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const harvests = await harvestRes.json();
        const environment = await envRes.json();

        runInAction(() => {
            this.harvests = harvests;
            this.environments = environment;
            this.filteredHarvest = harvests;
            this.filteredEnvironment = environment;
            this.loading = false;
        });
        } catch {
        runInAction(() => {
            this.harvests = [];
            this.environments = [];
            this.loading = false;
        });
        }
    }

    setFarmFilter(farmId: string) {
        console.log("farmId", farmId);
        this.selectedFarmId = farmId;
        this.filteredHarvests();        
    }

    setCropFilter(crop: string) {
        console.log("crop", crop);
        this.selectedCrop = crop;
        this.filteredHarvests();        
    }

    public filteredHarvests() {
        console.log("this.harvests", this.harvests);
        this.filteredHarvest = this.harvests.filter(h =>
        (!this.selectedFarmId || h.farmId === this.selectedFarmId) &&
        (!this.selectedCrop || h.crop === this.selectedCrop)
        );
    }

    public filteredEnvironments() {
        this.filteredEnvironment = this.environments.filter(e =>
        !this.selectedFarmId || e.farmId === this.selectedFarmId
        );
    }

    get hasData() {
        return this.filteredHarvest.length > 0 || this.filteredEnvironment.length > 0;
    }
}

export const farmReportStore = new FarmReportStore();