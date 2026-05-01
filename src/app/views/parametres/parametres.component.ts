import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametres.component.html',
  styleUrls: ['./parametres.component.scss']
})
export class ParametresComponent implements OnInit {
  private supabase = inject(SupabaseService);
  
  nouveauMontant: number | null = null;
  categories: any[] = [];

  async ngOnInit() {
    await this.loadCategories();
  }

  async loadCategories() {
    try {
        this.categories = await this.supabase.getCategories();
    } catch (e) {
        console.error('Failed to load categories', e);
    }
  }

  async ajouterCategorie() {
    if (this.nouveauMontant && this.nouveauMontant > 0) {
      if (this.categories.find(c => c.montant === this.nouveauMontant)) {
        Swal.fire('Info', 'Cette catégorie existe déjà.', 'info');
        return;
      }

      try {
        await this.supabase.saveCategory({
          montant: this.nouveauMontant,
          actif: true
        });
        Swal.fire({
          title: 'Enregistré !',
          text: `La catégorie ${this.nouveauMontant} FCFA est maintenant disponible.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.nouveauMontant = null;
        await this.loadCategories();
      } catch (e: any) {
        // Normalement le catch du service gère déjà le fallback, mais on garde une sécurité
        this.nouveauMontant = null;
        await this.loadCategories();
      }
    }
  }

  async toggleStatut(cat: any) {
    try {
      cat.actif = !cat.actif;
      await this.supabase.saveCategory(cat);
      Swal.fire({
        title: 'Mis à jour',
        text: `Statut modifié avec succès.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire('Erreur', 'Impossible de modifier le statut.', 'error');
    }
  }

  async supprimerCategorie(id: number) {
    try {
        const result = await Swal.fire({
            title: 'Supprimer ?',
            text: 'Voulez-vous vraiment supprimer cette catégorie ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
            await this.supabase.deleteCategory(id);
            await this.loadCategories();
            Swal.fire('Supprimé', 'Catégorie supprimée.', 'success');
        }
    } catch (e) {
        Swal.fire('Erreur', 'Impossible de supprimer la catégorie.', 'error');
    }
  }
}
