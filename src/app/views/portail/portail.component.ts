import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-portail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './portail.component.html',
  styleUrls: ['./portail.component.scss']
})
export class PortailComponent {
  categories = [
    { name: 'Cotisations & Finances', description: 'Consultez les bilans et cotisations.' },
    { name: 'Événements & Culture', description: 'Activités culturelles et sorties.' },
    { name: 'Sport & Navétanes', description: 'Suivi de l\'équipe et entraînements.' },
    { name: 'Démarches Administratives', description: 'Inscriptions et formulaires.' }
  ];

  isDropdownOpen = false;
  isMobileMenuOpen = false;

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
