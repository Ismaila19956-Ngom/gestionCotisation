import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import { Match } from '../../../models/match.model';
import Swal from 'sweetalert2';

import { FormsModule } from '@angular/forms';
import { GTextFieldComponent } from '../../../shared/components/gravity/g-text-field.component';

@Component({
  selector: 'app-match-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, GTextFieldComponent],
  templateUrl: './match-list.component.html',
  styleUrls: ['./match-list.component.scss']
})
export class MatchListComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  matches = signal<Match[]>([]);
  isLoading = signal(false);

  // Modal State
  isAddModalOpen = false;
  newMatchName = '';

  async ngOnInit() {
    await this.loadMatches();
  }

  async loadMatches() {
    this.isLoading.set(true);
    try {
      const data = await this.supabase.getMatches();
      this.matches.set(data);
    } catch (e) {
      console.error('Error loading matches:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  openAddMatchModal() {
    this.newMatchName = '';
    this.isAddModalOpen = true;
  }

  closeAddMatchModal() {
    this.isAddModalOpen = false;
  }

  async confirmAddMatch() {
    if (!this.newMatchName) {
      Swal.fire('Erreur', 'Le nom du match est obligatoire.', 'error');
      return;
    }

    try {
      const newMatch = await this.supabase.addMatch(this.newMatchName);
      this.matches.update(prev => [newMatch, ...prev]);
      this.closeAddMatchModal();
      this.router.navigate(['/matchs', newMatch.id]);
    } catch (e) {
      Swal.fire('Erreur', 'Impossible de créer le match.', 'error');
    }
  }

  goToMatch(id: string) {
    this.router.navigate(['/matchs', id]);
  }
}
