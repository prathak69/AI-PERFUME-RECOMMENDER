import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthApi } from '../services/auth-api';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthApi);
  const token = authService.getToken();

  if (token && !req.url.includes('/auth')) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  return next(req);
};
