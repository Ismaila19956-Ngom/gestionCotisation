import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'button[g-button]',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="btn-content" *ngIf="!loading">
      <ng-content></ng-content>
    </span>
    <div class="loader" *ngIf="loading"></div>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      gap: 0.5rem;
    }

    :host.primary {
      background: #c9982a;
      color: white;
    }

    :host.primary:hover {
      background: #b38725;
    }

    :host:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .loader {
      width: 1.2rem;
      height: 1.2rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class GButtonComponent {
  @Input() loading: boolean = false;
}
