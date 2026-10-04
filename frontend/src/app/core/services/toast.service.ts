import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration: number; // in milliseconds
  createdAt: number;
  icon?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);
  private nextId = 1;

  show(type: ToastType, title: string, message?: string, duration = 4500, icon?: string): number {
    const id = this.nextId++;
    const defaultIcon =
      icon || (type === 'success' ? '✦' : type === 'error' ? '⚠' : type === 'warning' ? '✧' : '◆');

    const toast: ToastMessage = {
      id,
      type,
      title,
      message,
      duration,
      createdAt: Date.now(),
      icon: defaultIcon,
    };

    this.toasts.update((current) => [toast, ...current].slice(0, 4));

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  success(title: string, message?: string, duration = 4500): number {
    return this.show('success', title, message, duration, '✦');
  }

  error(title: string, message?: string, duration = 5000): number {
    return this.show('error', title, message, duration, '⚠');
  }

  info(title: string, message?: string, duration = 4500): number {
    return this.show('info', title, message, duration, '✧');
  }

  warning(title: string, message?: string, duration = 4800): number {
    return this.show('warning', title, message, duration, '◆');
  }

  remove(id: number): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
