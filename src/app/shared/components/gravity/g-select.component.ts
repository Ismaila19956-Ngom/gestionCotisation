import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'g-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="g-field">
      <label class="g-label" *ngIf="label">{{ label }}</label>
      <div class="g-select-wrapper">
        <select 
          [ngModel]="value" 
          (ngModelChange)="onChange($event)"
          class="g-select"
        >
          <option [value]="null" disabled selected>{{ placeholder }}</option>
          <option *ngFor="let option of options" [value]="option.value">
            {{ option.label }}
          </option>
        </select>
        <div class="g-select-arrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .g-field {
      margin-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .g-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #7987a1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .g-select-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .g-select {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
      appearance: none;
      transition: all 0.2s ease;
      color: #212a3a;
      cursor: pointer;
      
      &:focus {
        outline: none;
        border-color: #c9982a;
        box-shadow: 0 0 0 3px rgba(201, 152, 42, 0.1);
      }
    }
    .g-select-arrow {
      position: absolute;
      right: 1rem;
      pointer-events: none;
      color: #7987a1;
    }
  `]
})
export class GSelectComponent {
  @Input() label: string = '';
  @Input() placeholder: string = 'Sélectionner...';
  @Input() options: { label: string, value: any }[] = [];
  @Input() value: any;
  @Output() valueChange = new EventEmitter<any>();

  onChange(val: any) {
    this.value = val;
    this.valueChange.emit(val);
  }
}
