import { makeAutoObservable } from 'mobx';

class DashboardStore {
    constructor() {
        makeAutoObservable(this);
    }

    step: "FarmManager" | "Reports" | "Chat" | "DroneSim" | "Profile" | "Inbox" = "FarmManager";
    showMap = false;

    setStep(step: "FarmManager" | "Reports" | "Chat" | "DroneSim" | "Profile" | "Inbox") {
        console.log("this.step", this.step)
        this.step = step;
    }
}

export const dashboardStore = new DashboardStore();