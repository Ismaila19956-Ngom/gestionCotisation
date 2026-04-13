import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
    label: string;
    icon: string;
    route: string;
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
    currentYear = new Date().getFullYear();

    menuItems = signal<NavItem[]>([
        { label: 'Tableau de Bord', icon: 'grid', route: '/dashboard' },
        { label: 'Membres', icon: 'users', route: '/membres' },
        { label: 'Comptabilité', icon: 'bar-chart', route: '/comptabilite' },
        { label: 'Paramètres', icon: 'settings', route: '/parametres' },
    ]);
}
