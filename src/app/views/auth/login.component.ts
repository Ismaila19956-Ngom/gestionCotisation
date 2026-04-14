import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private router = inject(Router);

    // View state: Welcome vs Form
    showForm = signal(false);

    // Password visibility
    showPassword = signal(false);

    loginForm = this.fb.group({
        username: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(4)]]
    });

    toggleView() {
        this.showForm.set(!this.showForm());
    }

    togglePassword() {
        this.showPassword.set(!this.showPassword());
    }

    onSubmit() {
        if (this.loginForm.valid) {
            const { username, password } = this.loginForm.value;

            // Hardcoded check pour l'utilisateur demandé
            if (username === 'admin' && password === 'pass') {
                this.router.navigate(['/membres']);
            } else {
                alert('Identifiants incorrects. Essayez: admin / pass');
            }
        } else {
            this.loginForm.markAllAsTouched();
        }
    }
}
