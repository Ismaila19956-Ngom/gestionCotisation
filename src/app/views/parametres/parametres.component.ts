import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Categorie } from '../../models/cotisation-campaign.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header fade-in" style="margin-bottom: 2rem;">
      <h4 style="margin:0; color:#1b5e20;">Paramètres</h4>
      <p style="margin:0.5rem 0 0 0; color:#555;">Gestion de la configuration de l'ASC Natangué</p>
    </div>
    
    <div class="card fade-in" style="background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 2rem;">
      <h3 style="color:#2e7d32; margin-top:0;">Gestion des Catégories de Cotisation</h3>
      <p style="color:#666; font-size:0.9rem; margin-bottom:1.5rem;">Définissez les différents montants de cotisation possibles pour les campagnes.</p>
      
      <div style="display:flex; gap:1rem; margin-bottom: 2rem; align-items: flex-end;">
         <div style="flex:1;">
            <label style="display:block; margin-bottom:0.5rem; font-weight:600; font-size:0.9rem;">Nouveau Montant (FCFA)</label>
            <input type="number" [(ngModel)]="nouveauMontant" style="width:100%; padding:0.6rem; border:1px solid #ccc; border-radius:4px;">
         </div>
         <button (click)="ajouterCategorie()" style="background:#2e7d32; color:white; border:none; padding:0.6rem 1.2rem; border-radius:4px; font-weight:600; cursor:pointer;">
            + Ajouter
         </button>
      </div>

      <table style="width:100%; border-collapse:collapse; text-align:left;">
        <thead>
          <tr style="background:#f1f8e9; border-bottom:1px solid #ddd;">
            <th style="padding:1rem;">ID</th>
            <th style="padding:1rem;">Montant (FCFA)</th>
            <th style="padding:1rem;">Statut</th>
            <th style="padding:1rem;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let cat of categories; let i = index" style="border-bottom:1px solid #eee;">
            <td style="padding:1rem;">{{ cat.id }}</td>
            <td style="padding:1rem; font-weight:600; color:#2e7d32;">{{ cat.montant }} FCFA</td>
            <td style="padding:1rem;">
              <span style="background:#e8f5e9; color:#2e7d32; padding:0.3rem 0.6rem; border-radius:20px; font-size:0.8rem; font-weight:600;" *ngIf="cat.actif">Actif</span>
              <span style="background:#ffebee; color:#c62828; padding:0.3rem 0.6rem; border-radius:20px; font-size:0.8rem; font-weight:600;" *ngIf="!cat.actif">Inactif</span>
            </td>
            <td style="padding:1rem;">
              <button (click)="toggleStatut(cat)" style="background:#e0e0e0; border:none; padding:0.4rem 0.8rem; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.85rem;">
                {{ cat.actif ? 'Désactiver' : 'Activer' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class ParametresComponent {
  nouveauMontant: number | null = null;
  categories: Categorie[] = [
    { id: 1, montant: 1000, actif: true },
    { id: 2, montant: 2000, actif: true },
    { id: 3, montant: 3000, actif: true },
    { id: 4, montant: 5000, actif: true },
    { id: 5, montant: 10000, actif: true },
  ];

  ajouterCategorie() {
    if (this.nouveauMontant && this.nouveauMontant > 0) {
      if (!this.categories.find(c => c.montant === this.nouveauMontant)) {
        this.categories.push({
          id: this.categories.length + 1,
          montant: this.nouveauMontant,
          actif: true
        });
        this.nouveauMontant = null;
      }
    }
  }

  toggleStatut(cat: Categorie) {
    cat.actif = !cat.actif;
  }
}
