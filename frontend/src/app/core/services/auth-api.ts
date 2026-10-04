import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  private currentUser = signal<User | null>(this.getStoredUser());
  private authToken = signal<string | null>(localStorage.getItem('token'));

  user = computed(() => this.currentUser());
  isAuthenticated = computed(() => !!this.authToken());

  login(credentials: { email: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(tap((res) => this.handleAuthSucess(res)));
  }

  register(credentials: { email: string; name: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/register`, credentials)
      .pipe(tap((res) => this.handleAuthSucess(res)));
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.authToken.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this.authToken();
  }

  handleAuthSucess(data: any) {
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.access_token);
    this.authToken.set(data.access_token);
    this.currentUser.set(data.user);
  }

  getStoredUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}
