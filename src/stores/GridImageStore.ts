import { makeAutoObservable, runInAction } from "mobx";

export class GridImageStore {
    url = import.meta.env.VITE_API_BASE;

    farmId: string = "";
    date: string = "";
    files: File[] = [];

    gridImages: any[] = [];
    uploading = false;
    uploadSuccess = false

    constructor() {
        makeAutoObservable(this);
    }

    setFarmId(id: string) {
        this.farmId = id;
    }

    setDate(date: string) {
        this.date = date;
    }

    setFiles(files: FileList | File[] | null) {
  this.files = files ? Array.from(files) : [];
    }

    async submitImages(farmId: string, date: string, files: File[], token: string) {
        this.uploading = true;
        this.uploadSuccess = false;

        const formData = new FormData();
        formData.append("farmId", farmId);
        formData.append("dateUploaded", date);
        for (let i = 0; i < files.length; i++) {
            formData.append("files", files[i]);
        }

        try {
            const res = await fetch(`${this.url}/grid-images`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();

            runInAction(() => {
                this.gridImages.push(...data.imageUrl.map((url: string) => ({
                farmId,
                date,
                imageUrl: url
                })));
                this.uploading = false;
                this.uploadSuccess = true;
            });
        } catch (error) {
            console.log(error)
            runInAction(() => {
                this.uploading = false;
                this.uploadSuccess = false;
            });
        }
    }

    async fetchGridImages(token: string) {
        try {
            const res = await fetch(`${this.url}/grid-images`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            runInAction(() => {
                this.gridImages = data;
            });
        } catch {
            runInAction(() => {
                this.gridImages = [];
            });
        }
    }
}

export const gridImageStore = new GridImageStore();
