import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CreatePerfumeDto, Perfume } from '../../core/models/perfume.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PerfumeService } from '../../core/services/perfume-api';
import { ToastService } from '../../core/services/toast.service';
import { ModalService } from '../../core/services/modal.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  selector: 'app-inventory',
  styleUrl: './inventory.scss',
  templateUrl: './inventory.html',
})
export class Inventory implements OnInit {
  private readonly requestService = inject(PerfumeService);
  private readonly fb = inject(FormBuilder);
  readonly toastService = inject(ToastService);
  readonly modalService = inject(ModalService);

  perfumes = signal<Perfume[]>([]);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  perfumeForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    brand: ['', Validators.required],
    image_url: [''],
  });

  ngOnInit(): void {
    this.getInventory();
  }

  getInventory() {
    this.isLoading.set(true);
    this.requestService.getInventory().subscribe({
      next: (resp) => {
        this.perfumes.set(resp.data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Something went wrong');
        this.isLoading.set(false);
      },
    });
  }

  onSubmit() {
    if (this.perfumeForm.invalid) {
      return;
    }

    const { name, brand, image_url } = this.perfumeForm.value;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const payload: CreatePerfumeDto = { name, brand };
    if (image_url && image_url.trim()) {
      payload.image_url = image_url.trim();
    }

    this.requestService.addPerfume(payload).subscribe({
      next: () => {
        this.perfumeForm.reset();
        this.isSubmitting.set(false);
        this.toastService.success(
          'Flacon Archived!',
          `${name} by ${brand} has been added to your wardrobe.`,
        );
        this.getInventory();
      },
      error: (err) => {
        const errorDetail = err.error?.detail || 'Failed to archive flacon';
        this.errorMessage.set(errorDetail);
        this.toastService.error('Olfactory Extraction Error', errorDetail);
        this.isSubmitting.set(false);
      },
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src =
        'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80';
    }
  }

  async deletePerfume(perfume: Perfume) {
    if (!perfume.id) return;

    const confirmed = await this.modalService.confirm({
      title: 'Remove Flacon from Wardrobe',
      message: `Are you sure you want to remove ${perfume.name} by ${perfume.brand}? This action will permanently remove its olfactory profile from your collection.`,
      confirmText: 'Remove Flacon',
      cancelText: 'Keep in Wardrobe',
      type: 'danger',
      flaconName: perfume.name,
      flaconBrand: perfume.brand,
      flaconImage: perfume.image_url,
    });

    if (!confirmed) return;

    this.requestService.deletePerfumeById(perfume.id).subscribe({
      next: () => {
        this.toastService.success(
          'Flacon Removed',
          `${perfume.name} has been archived from your wardrobe.`,
        );
        this.getInventory();
      },
      error: (err) => {
        const msg = err.error?.detail || 'Could not delete perfume';
        this.toastService.error('De-archive Error', msg);
      },
    });
  }
}
