import { Component, EventEmitter, Input, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Member, Sexe, CategorieCotisation } from '../../models/cotisation.model';

@Component({
    selector: 'app-member-form',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './member-form.component.html',
    styleUrls: ['./member-form.component.scss']
})
export class MemberFormComponent implements OnInit {
    private fb = inject(FormBuilder);

    @Input() memberToEdit?: Member;
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<Partial<Member>>();

    memberForm!: FormGroup;

    ngOnInit(): void {
        this.initForm();
        if (this.memberToEdit) {
            this.memberForm.patchValue(this.memberToEdit);
        }
    }

    private initForm() {
        this.memberForm = this.fb.group({
            prenom: ['', [Validators.required, Validators.minLength(2)]],
            nom: ['', [Validators.required, Validators.minLength(2)]],
            dateNaissance: ['', [Validators.required]],
            sexe: ['', [Validators.required]],
            categorie: ['10000', [Validators.required]],
            dateAdhesion: [new Date().toISOString().split('T')[0], [Validators.required]],
        });
    }

    onSubmit() {
        if (this.memberForm.valid) {
            this.save.emit(this.memberForm.value);
            this.onClose();
        } else {
            this.markFormGroupTouched(this.memberForm);
        }
    }

    onClose() {
        this.close.emit();
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.values(formGroup.controls).forEach(control => {
            control.markAsTouched();
            if ((control as any).controls) {
                this.markFormGroupTouched(control as FormGroup);
            }
        });
    }
}
