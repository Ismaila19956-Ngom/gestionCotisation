import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GButtonComponent } from '../../../shared/components/gravity/g-button.component';

@Component({
  selector: 'app-cotisation-pay',
  standalone: true,
  imports: [CommonModule, GButtonComponent],
  template: `
    <div class="payment-modal-content" [style.font-family]="'Sora, sans-serif'">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-titles">
          <h1 class="title">Paiement Cotisation</h1>
          <span class="pill-badge">Session 2024 / 2025</span>
        </div>
        <button class="close-circle-btn" (click)="onClose()">×</button>
      </div>

      <!-- Payment Method Selection -->
      <div class="selection-section">
        <div 
          class="method-card wave" 
          [class.active]="selectedMethod === 'WAVE'"
          (click)="selectMethod('WAVE')"
        >
          <div class="method-icon-bg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
          </div>
          <span class="method-name">Wave</span>
          <div class="checkmark-dot"></div>
        </div>

        <div 
          class="method-card om" 
          [class.active]="selectedMethod === 'OM'"
          (click)="selectMethod('OM')"
        >
          <div class="method-icon-bg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
          </div>
          <span class="method-name">Orange Money</span>
          <div class="checkmark-dot"></div>
        </div>
      </div>

      <!-- QR Code Section -->
      <div class="qr-section" *ngIf="selectedMethod" [class.show]="selectedMethod">
        <div class="qr-container">
          <div class="corner top-left"></div>
          <div class="corner top-right"></div>
          <div class="corner bottom-left"></div>
          <div class="corner bottom-right"></div>
          
          <svg width="130" height="130" viewBox="0 0 160 160" class="qr-svg">
            <!-- Mock QR pattern -->
            <rect x="20" y="20" width="30" height="30" fill="currentColor" opacity="0.8"/>
            <rect x="110" y="20" width="30" height="30" fill="currentColor" opacity="0.8"/>
            <rect x="20" y="110" width="30" height="30" fill="currentColor" opacity="0.8"/>
            <path d="M60 20h40v40H60zM20 60h40v40H20zM100 100h40v40h-40z" fill="currentColor" opacity="0.5"/>
            <circle cx="80" cy="80" r="10" fill="currentColor" opacity="0.3"/>
          </svg>

          <div class="scan-line" *ngIf="!paymentConfirmed"></div>
        </div>
        
        <p class="qr-caption">
          Scannez avec votre app <strong>{{ selectedMethod === 'WAVE' ? 'Wave' : 'Orange Money' }}</strong> pour lier votre numéro automatiquement.
        </p>

        <!-- Auto-fill row -->
        <div class="phone-detected-row" *ngIf="detectedPhone" [class.slide-in]="detectedPhone">
          <div class="detected-content">
            <span class="phone-number">{{ detectedPhone }}</span>
            <div class="success-dot">✓</div>
          </div>
        </div>
      </div>

      <!-- CTA Button -->
      <div class="actions">
        <button 
          class="cta-button" 
          [class.active]="selectedMethod"
          [class.ready]="isReadyToPay"
          [class.confirmed]="paymentConfirmed"
          [disabled]="!selectedMethod || (selectedMethod && !isReadyToPay && !paymentConfirmed)"
          (click)="confirmPayment()"
          [style.--brand-color]="brandColor"
        >
          <span *ngIf="!selectedMethod">Sélectionner un mode</span>
          <span *ngIf="selectedMethod && !isReadyToPay && !paymentConfirmed">Scan en attente…</span>
          <span *ngIf="isReadyToPay && !paymentConfirmed">Payer avec {{ selectedMethod === 'WAVE' ? 'Wave' : 'Orange Money' }}</span>
          <span *ngIf="paymentConfirmed" class="confirmed-text">✓ Paiement confirmé</span>
        </button>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        <span>Paiement sécurisé — montant débité automatiquement</span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --wave-blue: #2563EB;
      --wave-bg: #EFF6FF;
      --om-orange: #EA580C;
      --om-bg: #FFF7ED;
      --success: #16a34a;
      --gray-muted: #f8fafc;
      --text-main: #1e293b;
      --text-muted: #64748b;
    }

    .payment-modal-content {
      padding: 1.25rem;
      background: #fff;
      border-radius: 22px;
      border: 0.5px solid #e2e8f0;
      color: var(--text-main);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.9rem;
    }

    .title {
      font-size: 19px;
      font-weight: 800;
      margin: 0 0 0.25rem 0;
    }

    .pill-badge {
      font-size: 11px;
      font-weight: 700;
      background: #dcfce7;
      color: #166534;
      padding: 0.25rem 0.75rem;
      border-radius: 50px;
      letter-spacing: 0.5px;
    }

    .close-circle-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #f1f5f9;
      border: none;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      transition: all 0.2s;
      &:hover { background: #e2e8f0; color: var(--text-main); }
    }

    .selection-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 0.9rem;
    }

    .method-card {
      position: relative;
      border: 1.5px solid #f1f5f9;
      border-radius: 16px;
      padding: 1.25rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #fff;

      .checkmark-dot {
        position: absolute; top: 12px; right: 12px;
        width: 14px; height: 14px;
        border: 1.5px solid #e2e8f0;
        border-radius: 50%;
        transition: all 0.2s;
      }

      .method-icon-bg {
        width: 44px; height: 44px;
        border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 0.75rem;
        transition: all 0.2s;
      }

      .method-name { font-size: 13px; font-weight: 700; color: var(--text-main); }

      &.wave {
        .method-icon-bg { background: #f0f7ff; color: var(--wave-blue); }
        &.active {
          border-color: var(--wave-blue); background: var(--wave-bg);
          .checkmark-dot { background: var(--wave-blue); border-color: var(--wave-blue); }
        }
      }

      &.om {
        .method-icon-bg { background: #fff8f1; color: var(--om-orange); }
        &.active {
          border-color: var(--om-orange); background: var(--om-bg);
          .checkmark-dot { background: var(--om-orange); border-color: var(--om-orange); }
        }
      }
    }

    .qr-section {
      text-align: center;
      animation: fadeIn 0.4s ease-out;
      margin-bottom: 0.9rem;
    }

    .qr-container {
      position: relative;
      width: 130px;
      height: 130px;
      margin: 0 auto 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .corner {
        position: absolute; width: 20px; height: 20px;
        border: 2px solid #e2e8f0;
        &.top-left { top: 0; left: 0; border-right: none; border-bottom: none; }
        &.top-right { top: 0; right: 0; border-left: none; border-bottom: none; }
        &.bottom-left { bottom: 0; left: 0; border-right: none; border-top: none; }
        &.bottom-right { bottom: 0; right: 0; border-left: none; border-top: none; }
      }

      .qr-svg { color: var(--text-main); }

      .scan-line {
        position: absolute;
        top: 0; left: 10%; width: 80%; height: 2px;
        background: var(--brand-color, var(--success));
        box-shadow: 0 0 8px var(--brand-color, var(--success));
        animation: scanMove 2.5s ease-in-out infinite;
        z-index: 5;
      }
    }

    .qr-caption {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.5;
      margin: 0 1rem 0.75rem;
      strong { color: var(--text-main); }
    }

    .phone-detected-row {
      background: #f0fdf4;
      padding: 0.6rem 1rem;
      border-radius: 12px;
      margin: 0 1rem;
      border: 1px dashed #bbf7d0;
      animation: slideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      
      .detected-content {
        display: flex; justify-content: center; align-items: center; gap: 0.5rem;
      }
      .phone-number { font-weight: 700; font-size: 14px; color: #166534; }
      .success-dot {
        width: 16px; height: 16px; background: var(--success);
        color: white; font-size: 10px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
      }
    }

    .actions { margin-top: 0.9rem; }

    .cta-button {
      width: 100%; height: 52px;
      border-radius: 13px;
      border: none;
      background: #e2e8f0;
      color: var(--text-muted);
      font-weight: 700;
      font-size: 15px;
      cursor: not-allowed;
      transition: all 0.3s ease;
      display: flex; align-items: center; justify-content: center;

      &.active {
        background: var(--brand-color);
        color: #fff;
        opacity: 0.5;
      }

      &.ready {
        opacity: 1;
        cursor: pointer;
        background: linear-gradient(135deg, var(--brand-color), rgba(0,0,0,0.1));
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        &:hover { transform: translateY(-1px); }
      }

      &.confirmed {
        background: var(--success) !important;
        opacity: 1;
        cursor: default;
      }
    }

    .confirmed-text { display: flex; align-items: center; gap: 0.5rem; }

    .modal-footer {
      display: flex; justify-content: center; align-items: center; gap: 0.5rem;
      margin-top: 1rem; font-size: 10px; color: var(--text-muted);
    }

    @keyframes scanMove {
      0%, 100% { top: 0; }
      50% { top: 100%; }
    }

    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CotisationPayComponent {
  @Output() close = new EventEmitter<void>();

  selectedMethod: 'WAVE' | 'OM' | null = null;
  isReadyToPay = false;
  paymentConfirmed = false;
  detectedPhone: string | null = null;
  brandColor = '#e2e8f0';

  selectMethod(method: 'WAVE' | 'OM') {
    if (this.paymentConfirmed) return;
    
    this.selectedMethod = method;
    this.brandColor = method === 'WAVE' ? '#2563EB' : '#EA580C';
    this.isReadyToPay = false;
    this.detectedPhone = null;

    // Simulation de détection après 3 secondes
    setTimeout(() => {
      if (this.selectedMethod === method) {
        this.detectedPhone = method === 'WAVE' ? '77 423 89 12' : '76 891 34 57';
        this.isReadyToPay = true;
      }
    }, 3000);
  }

  confirmPayment() {
    if (!this.isReadyToPay) return;
    
    this.paymentConfirmed = true;
    this.isReadyToPay = false;
  }

  onClose() {
    this.close.emit();
  }
}
