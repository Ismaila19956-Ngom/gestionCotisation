import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import { Match, MatchExpense } from '../../../models/match.model';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { GTextFieldComponent } from '../../../shared/components/gravity/g-text-field.component';

@Component({
  selector: 'app-match-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, GTextFieldComponent],
  templateUrl: './match-detail.component.html',
  styleUrls: ['./match-detail.component.scss']
})
export class MatchDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);

  match = signal<Match | null>(null);
  expenses = signal<MatchExpense[]>([]);
  activeTab = signal<'restauration' | 'mystique' | 'mercenaire'>('restauration');
  isLoading = signal(true);

  // Modal State
  isExpenseModalOpen = false;
  newExpenseMotif = '';
  newExpenseMontant = 0;

  // Totaux
  totalRestauration = computed(() => 
    this.expenses().filter(e => e.categorie === 'restauration')
      .reduce((sum, e) => sum + e.montant, 0)
  );
  
  totalMystique = computed(() => 
    this.expenses().filter(e => e.categorie === 'mystique')
      .reduce((sum, e) => sum + e.montant, 0)
  );
  
  totalMercenaires = computed(() => 
    this.expenses().filter(e => e.categorie === 'mercenaire')
      .reduce((sum, e) => sum + e.montant, 0)
  );

  totalGeneral = computed(() => 
    this.totalRestauration() + this.totalMystique() + this.totalMercenaires()
  );

  filteredExpenses = computed(() => 
    this.expenses().filter(e => e.categorie === this.activeTab())
  );

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadData(id);
    }
  }

  async loadData(id: string) {
    this.isLoading.set(true);
    try {
      const matchData = await this.supabase.getMatchById(id);
      this.match.set(matchData);
      
      const expensesData = await this.supabase.getMatchExpenses(id);
      this.expenses.set(expensesData);
    } catch (e) {
      console.error('Error loading match data:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  setTab(tab: 'restauration' | 'mystique' | 'mercenaire') {
    this.activeTab.set(tab);
  }

  openAddExpenseModal() {
    this.newExpenseMotif = '';
    this.newExpenseMontant = 0;
    this.isExpenseModalOpen = true;
  }

  closeExpenseModal() {
    this.isExpenseModalOpen = false;
  }

  async confirmAddExpense() {
    if (!this.newExpenseMotif || !this.newExpenseMontant) {
      Swal.fire('Erreur', 'Veuillez remplir tous les champs.', 'error');
      return;
    }

    try {
      const newExpense = await this.supabase.addMatchExpense({
        match_id: this.match()?.id,
        categorie: this.activeTab(),
        motif: this.newExpenseMotif,
        montant: this.newExpenseMontant
      });
      this.expenses.update(prev => [...prev, newExpense]);
      this.closeExpenseModal();
      Swal.fire({
        icon: 'success',
        title: 'Dépense ajoutée',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire('Erreur', 'Impossible d\'ajouter la dépense.', 'error');
    }
  }

  async deleteExpense(id: string) {
    const result = await Swal.fire({
      title: 'Supprimer cette dépense ?',
      text: "Cette action est irréversible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await this.supabase.deleteMatchExpense(id);
        this.expenses.update(prev => prev.filter(e => e.id !== id));
      } catch (e) {
        Swal.fire('Erreur', 'Impossible de supprimer la dépense.', 'error');
      }
    }
  }

  formatMontant(v: number) {
    return new Intl.NumberFormat('fr-FR').format(v) + ' F CFA';
  }
}
