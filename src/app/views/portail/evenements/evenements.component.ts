import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-evenements',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './evenements.component.html',
  styleUrls: ['./evenements.component.scss']
})
export class EvenementsComponent implements OnInit {
  private supabase = inject(SupabaseService);
  
  photos = signal<any[]>([]);
  
  stats = [
    { value: '4',  label: 'À venir' },
    { value: '18', label: 'Cette année' },
    { value: '6',  label: 'Catégories' },
  ];

  tabs = ['Tous', 'Sport', 'Culture', 'Social', 'Navétanes', 'Éducation'];
  activeTab = 'Tous';

  evenements = [
    { jour: '18', mois: 'Mai', titre: 'Finale Navétanes 2026',     lieu: "Terrain de l'ASC",     heure: '16h00', categorie: 'Navétanes' },
    { jour: '25', mois: 'Mai', titre: 'Soirée Culturelle Annuelle', lieu: 'Salle communautaire',  heure: '19h00', categorie: 'Culture'   },
    { jour: '02', mois: 'Jun', titre: 'Atelier Soutien Scolaire',   lieu: 'Maison des jeunes',    heure: '09h00', categorie: 'Éducation' },
    { jour: '07', mois: 'Jun', titre: 'Tournoi Football Jeunes',    lieu: 'Terrain municipal',    heure: '09h00', categorie: 'Sport'     },
    { jour: '14', mois: 'Jun', titre: 'Collecte de solidarité',     lieu: 'Quartier Natangué',    heure: '10h00', categorie: 'Social'    },
  ];

  get evenementsFiltres() {
    return this.activeTab === 'Tous'
      ? this.evenements
      : this.evenements.filter(e => e.categorie === this.activeTab);
  }

  async ngOnInit() {
    // Récupération des 3 dernières photos publiées pour la galerie
    const { data } = await this.supabase.client
      .from('galerie')
      .select('*')
      .eq('statut', 'publier')
      .order('created_at', { ascending: false })
      .limit(3);
    
    this.photos.set(data || []);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
