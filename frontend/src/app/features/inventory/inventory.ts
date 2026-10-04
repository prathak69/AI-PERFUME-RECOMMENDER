import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CreatePerfumeDto, Perfume } from '../../core/models/perfume.model';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validator,
  Validators,
} from '@angular/forms';
import { PerfumeService } from '../../core/services/perfume-api';

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

  perfumes = signal<Perfume[]>([]);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  perfumeForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    brand: ['', Validators.required],
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
        this.errorMessage.set(err.error.detail || 'Something went wrong');
        this.isLoading.set(false);
      },
    });
  }

  onSubmit() {
    if (this.perfumeForm.invalid) {
      return;
    }

    const { name, brand } = this.perfumeForm.value;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.requestService.addPerfume({ name, brand }).subscribe({
      next: (resp) => {
        this.perfumeForm.reset();
        this.isSubmitting.set(false);
        this.getInventory();
      },
      error: (err) => {
        this.errorMessage.set(err.error.detail || 'Something went wrong');
        this.isSubmitting.set(false);
      },
    });
  }

  deletePerfume(perfumeId: string | undefined) {
    if (!perfumeId) return;

    this.requestService.deletePerfumeById(perfumeId).subscribe({
      next: (resp) => {
        console.log('Response of delete: ', resp);
        this.getInventory();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Could not delete perfume');
      },
    });
  }
}
