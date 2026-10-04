import { Component, OnInit, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Perfume } from '../../core/models/perfume.model';
import { PerfumeService } from '../../core/services/perfume-api';

@Component({
  imports: [RouterLink, CommonModule],
  selector: 'app-perfume-detail',
  styleUrl: './perfume-detail.scss',
  templateUrl: './perfume-detail.html',
})
export class PerfumeDetail implements OnInit {
  private readonly requestService = inject(PerfumeService);

  perfume = signal<Perfume | null>(null);
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(true);

  id = input.required<string>();

  ngOnInit(): void {
    this.loadPerfume();
  }

  loadPerfume() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.requestService.getPerfumeById(this.id()).subscribe({
      next: (resp) => {
        this.perfume.set(resp.data || null);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Could not load perfume details.');
        this.isLoading.set(false);
      },
    });
  }

  get bottleImage(): string {
    const p = this.perfume();
    if (!p) return '';
    return (
      p.image_url ||
      `https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80`
    );
  }

  get bottlePlaceholder(): string {
    return this.bottleImage;
  }
}
