import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'g-text-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="g-field">
      <label class="g-label" *ngIf="label">{{ label }}</label>
      <div class="g-input-wrapper">
        <input 
          [type]="type" 
          [placeholder]="placeholder" 
          [value]="value" 
          (input)="onInput($event)"
          class="g-input"
        >
      </div>
    </div>
  `,
  styles: [`
    .g-field {
      margin-bottom: 1.5rem;
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
    .g-input {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
      transition: all 0.2s ease;
      color: #212a3a;
      
      &:focus {
        outline: none;
        border-color: #c9982a;
        box-shadow: 0 0 0 3px rgba(201, 152, 42, 0.1);
      }
    }
  `]
})
export class GTextFieldComponent {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() value: any;
  @Output() valueChange = new EventEmitter<any>();

  onInput(event: any) {
    const val = event.target.value;
    this.value = val;
    this.valueChange.emit(val);
  }
}
