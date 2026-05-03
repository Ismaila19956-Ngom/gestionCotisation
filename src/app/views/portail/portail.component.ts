import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { CotisationPayComponent } from './cotisations/cotisation-pay.component';

@Component({
  selector: 'app-portail',
  standalone: true,
  imports: [CommonModule, RouterModule, CotisationPayComponent],
  templateUrl: './portail.component.html',
  styleUrls: ['./portail.component.scss']
})
export class PortailComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  
  photos = signal<any[]>([]);

  categories = [
    { name: 'Cotisations & Finances', description: 'Consultez les bilans et cotisations.', link: '/portail-cotisations' },
    { name: 'Événements & Culture', description: 'Activités culturelles et sorties.', link: '/portail-evenements' },
    { name: 'Sport & Navétanes', description: 'Suivi de l\'équipe et entraînements.' },
    { name: 'Démarches Administratives', description: 'Inscriptions et formulaires.' }
  ];

  isDropdownOpen = false;
  isMobileMenuOpen = false;
  isPaymentModalOpen = false;

  /**
   * Configuration du Slider Hero
   * Les images doivent être présentes dans src/assets/images/
   */
  slides = [
    { image: '/assets/images/image.jpg', alt: 'Activités sportives' },
    { image: '/assets/images/image1.jpeg', alt: 'Vie culturelle' },
    { image: '/assets/images/image3.jpeg', alt: 'La communauté' },
  ];
  
  // Index du slide actuellement affiché (Signal pour la réactivité Zoneless)
  currentSlide = signal(0);
  private sliderInterval: any;

  async ngOnInit() {
    this.startSlider();
    await this.loadPublicPhotos();
  }

  ngOnDestroy() {
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
    }
  }

  // Démarre le défilement automatique toutes les 6 secondes
  startSlider() {
    this.sliderInterval = setInterval(() => {
      this.currentSlide.update(val => (val + 1) % this.slides.length);
    }, 6000);
  }

  // Navigation manuelle vers un slide spécifique
  goToSlide(index: number) {
    this.currentSlide.set(index);
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
    }
    this.startSlider(); // Reset le timer après action manuelle
  }

  // Slide suivant
  nextSlide() {
    this.goToSlide((this.currentSlide() + 1) % this.slides.length);
  }

  // Slide précédent
  prevSlide() {
    this.goToSlide((this.currentSlide() - 1 + this.slides.length) % this.slides.length);
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

  openPaymentModal(event?: Event) {
    if (event) event.preventDefault();
    this.isPaymentModalOpen = true;
    this.isMobileMenuOpen = false; // Fermer le menu mobile si ouvert
  }

  closePaymentModal() {
    this.isPaymentModalOpen = false;
  }
}
