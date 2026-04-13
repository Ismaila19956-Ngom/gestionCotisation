import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class MenuService {
    isSidebarOpen = signal(false);

    toggleSidebar() {
        this.isSidebarOpen.set(!this.isSidebarOpen());
    }

    closeSidebar() {
        this.isSidebarOpen.set(false);
    }

    openSidebar() {
        this.isSidebarOpen.set(true);
    }
}
