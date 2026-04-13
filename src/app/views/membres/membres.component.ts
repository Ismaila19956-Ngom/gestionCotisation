import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-membres',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="page-header fade-in">
      <h4>Membres</h4>
      <ol class="breadcrumb">
        <li class="breadcrumb-item">ASC Natangué</li>
        <li class="breadcrumb-item active">Membres</li>
      </ol>
    </div>
    <div class="card fade-in">
      <div class="card-body" style="text-align:center; padding: 3rem;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#aeb7c5"
             stroke-width="1.5" style="margin-bottom:1rem;">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p style="color:#7987a1; font-size:0.9rem;">Module Membres — En cours de développement</p>
      </div>
    </div>
  `
})
export class MembresComponent { }
