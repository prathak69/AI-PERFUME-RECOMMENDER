import { Component, inject, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  standalone: true,
  selector: 'app-modal-container',
  imports: [CommonModule],
  templateUrl: './modal-container.html',
  styleUrl: './modal-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalContainer {
  readonly modalService = inject(ModalService);

  @HostListener('window:keydown.escape')
  onEscape() {
    if (this.modalService.activeModal()) {
      this.modalService.dismiss();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('luxury-modal-backdrop')) {
      this.modalService.dismiss();
    }
  }

  confirm() {
    this.modalService.handleAction(true);
  }

  cancel() {
    this.modalService.handleAction(false);
  }
}
