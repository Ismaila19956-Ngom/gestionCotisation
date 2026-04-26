import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private supabase = inject(SupabaseService);

    // View state: Welcome vs Form
    showForm = signal(false);

    // Password visibility
    showPassword = signal(false);
    isLoading = signal(false);
    errorMessage = signal('');

    loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(4)]]
    });

    toggleView() {
        this.showForm.set(!this.showForm());
    }

    togglePassword() {
        this.showPassword.set(!this.showPassword());
    }

    async onSubmit() {
        if (this.loginForm.valid) {
            this.isLoading.set(true);
            this.errorMessage.set('');
            const { email, password } = this.loginForm.value;

            try {
                await this.supabase.signIn(email as string, password as string);
                this.router.navigate(['/membres']);
            } catch (err: any) {
                this.errorMessage.set(err.message || 'Identifiants incorrects.');
            } finally {
                this.isLoading.set(false);
            }
        } else {
            this.loginForm.markAllAsTouched();
        }
    }
}
