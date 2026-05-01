import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-portail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './portail.component.html',
  styleUrls: ['./portail.component.scss']
})
export class PortailComponent implements OnInit {
  private supabase = inject(SupabaseService);
  
  photos = signal<any[]>([]);

  categories = [
    { name: 'Cotisations & Finances', description: 'Consultez les bilans et cotisations.' },
    { name: 'Événements & Culture', description: 'Activités culturelles et sorties.' },
    { name: 'Sport & Navétanes', description: 'Suivi de l\'équipe et entraînements.' },
    { name: 'Démarches Administratives', description: 'Inscriptions et formulaires.' }
  ];

  isDropdownOpen = false;
  isMobileMenuOpen = false;

  async ngOnInit() {
    await this.loadPublicPhotos();
  }

  async loadPublicPhotos() {
    try {
      // FILTRE CRITIQUE : Uniquement les photos publiées pour le portail public
      const { data, error } = await this.supabase.client
        .from('galerie')
        .select('*')
        .eq('statut', 'publier')
        .order('created_at', { ascending: false })
        .limit(6); // On affiche les 6 dernières photos

      if (error) throw error;
      this.photos.set(data || []);
    } catch (e) {
      console.error('Erreur chargement photos publiques', e);
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
