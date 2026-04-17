import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {
    private isReady = signal(true);

    constructor() { }

    getReady() {
        return this.isReady.asReadonly();
    }

    save(key: string, data: any) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (err) {
            console.error('Error saving to local storage:', err);
        }
    }

    load(key: string): any {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            console.error('Error loading from local storage:', err);
            return null;
        }
    }
}
