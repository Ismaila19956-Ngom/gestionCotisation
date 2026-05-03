import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cotisations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cotisations.component.html',
  styleUrls: ['./cotisations.component.scss']
})
export class CotisationsComponent {
  categories = [
    { montant: 1000,  label: 'Catégorie 1 000 FCFA',  desc: 'Accès aux activités et événements de l\'ASC', popular: false },
    { montant: 2000,  label: 'Catégorie 2 000 FCFA',  desc: 'Participation renforcée aux projets communautaires', popular: false },
    { montant: 3000,  label: 'Catégorie 3 000 FCFA',  desc: 'Soutien aux activités sportives et culturelles', popular: false },
    { montant: 5000,  label: 'Catégorie 5 000 FCFA',  desc: 'Engagement fort — navétanes, sorties et événements', popular: true },
    { montant: 10000, label: 'Catégorie 10 000 FCFA', desc: 'Membre bienfaiteur — soutien exceptionnel à l\'ASC', popular: false },
  ];

  faqs = [
    { q: 'La cotisation est-elle obligatoire ?', a: 'Oui, elle est obligatoire pour participer aux activités et voter lors des assemblées générales.', open: false },
    { q: 'Peut-on payer en plusieurs fois ?', a: 'Des arrangements peuvent être faits en cas de difficulté. Contactez directement le trésorier.', open: false },
    { q: 'Puis-je changer de catégorie ?', a: 'Oui, à chaque renouvellement annuel vous pouvez choisir une catégorie différente.', open: false },
    { q: 'À quoi servent les cotisations ?', a: 'Navétanes, événements culturels, soutien social aux membres et frais de fonctionnement de l\'ASC.', open: false }
  ];

  toggleFaq(i: number) {
    this.faqs[i].open = !this.faqs[i].open;
  }
}
