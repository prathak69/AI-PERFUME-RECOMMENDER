import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthApi } from '../../../core/services/auth-api';
import { Router } from '@angular/router';

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
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
}
