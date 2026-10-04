import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthApi } from '../../../core/services/auth-api';
import { Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  imports: [FormsModule, ReactiveFormsModule],
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthApi);
  private router = inject(Router);
  readonly toastService = inject(ToastService);

  registrationForm: any;

  ngOnInit(): void {
    this.createRegistrationForm();
  }

  createRegistrationForm() {
    this.registrationForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  register() {
    this.authService.register(this.registrationForm.value).subscribe({
      next: () => {
        this.toastService.success(
          'Wardrobe Account Created',
          'Welcome to AURA Parfumerie. Please sign in with your credentials.',
        );
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        const msg = err.error?.detail || 'Could not create account';
        this.toastService.error('Registration Error', msg);
      },
    });
  }
}
