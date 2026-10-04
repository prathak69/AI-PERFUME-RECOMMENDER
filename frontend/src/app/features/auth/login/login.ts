import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApi } from '../../../core/services/auth-api';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  imports: [FormsModule, RouterLink, ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private authService = inject(AuthApi);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  readonly toastService = inject(ToastService);

  loginForm: any;

  ngOnInit(): void {
    this.createLoginForm();
  }

  createLoginForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  login() {
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.toastService.success('Welcome to AURA', 'Your fragrance wardrobe is now unlocked.');
        this.router.navigate(['/perfume']);
      },
      error: (err) => {
        const msg =
          err.error?.detail || 'Invalid credentials. Please verify your email and password.';
        this.toastService.error('Authentication Error', msg);
      },
    });
  }
}
