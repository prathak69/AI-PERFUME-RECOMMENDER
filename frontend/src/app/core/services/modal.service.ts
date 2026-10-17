import { Injectable, signal } from '@angular/core';

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  flaconName?: string;
  flaconBrand?: string;
  flaconImage?: string;
  icon?: string;
}

export interface ModalInstance {
  id: number;
  options: ConfirmModalOptions;
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  readonly activeModal = signal<ModalInstance | null>(null);
  private nextId = 1;

  confirm(options: ConfirmModalOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.activeModal.set({
        id: this.nextId++,
        options: {
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          type: options.type || 'danger',
          ...options,
        },
        resolve,
      });
    });
  }

  handleAction(confirmed: boolean): void {
    const current = this.activeModal();
    if (current) {
      current.resolve(confirmed);
      this.activeModal.set(null);
    }
  }

  dismiss(): void {
    this.handleAction(false);
  }
}
