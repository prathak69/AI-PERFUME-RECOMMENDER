import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApi } from '../../../core/services/auth-api';
import { PerfumeService } from '../../../core/services/perfume-api';

@Component({
  imports: [FormsModule, RouterLink, ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private authService = inject(AuthApi);
  private apiService = inject(PerfumeService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

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
      next: (res) => {
        console.log(res);
        this.router.navigate(['/perfume']);
      },
      error: (err) => {
        console.log('error: ', err);
      },
    });
  }
}
