import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-management.component.html',
  styleUrls: ['./dashboard-management.component.scss']
})
export class DashboardManagementComponent {
  // Static example data matching the specification
  year = 2026;
  
  // KPI values
  totalRecu = 1239000;
  totalAttendu = 286000;
  arrieres = 763000;
  avances = 0;

  // Categories definition
  categories = [
    { id: 'all',     nom: "Vue d'Ensemble",   montant: null },
    { id: 'cat10',   nom: 'Groupe 10 000 F',  montant: '10000' },
    { id: 'honneur', nom: 'Groupe 5 000 F',   montant: '5000' },
    { id: 'cat3',    nom: 'Groupe 3 000 F',   montant: '3000' },
    { id: 'cat2',    nom: 'Groupe 2 000 F',   montant: '2000' },
    { id: 'simples', nom: 'Groupe 1 000 F',   montant: '1000' }
  ];

  // Groups detailed stats
  groups = [
    { label: '10 000 F', montant: 10000, membres: 14, recu: 750000, attendu: 140000, arrieres: 230000 },
    { label: '5 000 F', montant: 5000, membres: 19, recu: 315000, attendu: 95000, arrieres: 350000 },
    { label: '3 000 F', montant: 3000, membres: 6, recu: 66000, attendu: 18000, arrieres: 60000 },
    { label: '2 000 F', montant: 2000, membres: 13, recu: 90000, attendu: 26000, arrieres: 92000 },
    { label: '1 000 F', montant: 1000, membres: 7, recu: 18000, attendu: 7000, arrieres: 31000 }
  ];

  // Example recent payments matching the HTML expectations
  recentPayments = [
    { id: 1, memberName: 'Mouhamadou Jacques Diouf', montantVerse: 50000, mois: 'Jan', status: 'À jour' },
    { id: 2, memberName: 'Fatou Bâ', montantVerse: 30000, mois: 'Fév', status: 'Rappel' },
    { id: 3, memberName: 'Abdoulaye Ndoye', montantVerse: 10000, mois: 'Mar', status: 'À jour' }
  ];

  // Signals used in the template
  filteredStats = computed(() => ({
    totalRecu: this.totalRecu,
    totalAttendu: this.totalAttendu,
    arrieres: this.arrieres,
    avances: this.avances
  }));

  filteredRecentPayments = signal(this.recentPayments);

  // Helper for formatting amount
  format(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value) + ' F';
  }

  formatMontant(value: number): string {
    return this.format(value);
  }

  // Compute percentage recouvrement per group
  getRecouvrement(group: any): number {
    if (group.attendu === 0) return 0;
    return Math.min(Math.round((group.recu / group.attendu) * 100), 100);
  }

  // Category stats getter for template
  getCatStats(montant: any): { recu: number; attendu: number; arrieres: number } {
    const m = Number(montant);
    const found = this.groups.find(g => g.montant === m);
    if (found) {
      return {
        recu: found.recu,
        attendu: found.attendu,
        arrieres: found.arrieres
      };
    }
    return { recu: 0, attendu: 0, arrieres: 0 };
  }

  // Member count per category getter for template
  getMemberCount(montant: any): number {
    const m = Number(montant);
    const found = this.groups.find(g => g.montant === m);
    return found ? found.membres : 0;
  }
}
