import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
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
export class PortailComponent implements OnInit, OnDestroy {
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

  // Slider state
  slides = [
    { image: '/assets/images/image.jpg', alt: 'Activités sportives' },
    { image: '/assets/images/image1.jpeg', alt: 'Vie culturelle' },
    { image: '/assets/images/image3.jpeg', alt: 'La communauté' },
  ];
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

  startSlider() {
    this.sliderInterval = setInterval(() => {
      this.currentSlide.update(val => (val + 1) % this.slides.length);
    }, 6000);
  }

  goToSlide(index: number) {
    this.currentSlide.set(index);
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
    }
    this.startSlider();
  }

  nextSlide() {
    this.goToSlide((this.currentSlide() + 1) % this.slides.length);
  }

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
}
