import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Categorie } from '../../models/cotisation-campaign.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametres.component.html',
  styleUrls: ['./parametres.component.scss']
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
