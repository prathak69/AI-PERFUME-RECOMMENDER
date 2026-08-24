import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PerfumeService } from '../../core/services/perfume-api';
import { RecommendResult, RecommendRequestDto, RecommendResponse, WeatherContext } from '../../core/models/recommend.model';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-recommendation',
  styleUrl: './recommendation.scss',
  templateUrl: './recommendation.html',
})
export class Recommendation {
  private readonly fb = inject(FormBuilder);
  private readonly requestService = inject(PerfumeService);

  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  recommendation = signal<RecommendResult | null>(null);
  weather = signal<WeatherContext | null>(null);
  time_of_day = signal<string>('');

  recommendForm: FormGroup = this.fb.group({
    city: ['', Validators.required],
    occasion: ['', Validators.required]
  })

  onSubmit() {
    if (this.recommendForm.invalid) {
      return;
    }

    const { city, occasion } = this.recommendForm.value;
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.requestService.recommendPerfume({ city, occasion }).subscribe({
      next: (resp) => {
        this.weather.set(resp.weather)
        this.time_of_day.set(resp.time_of_day)
        this.recommendation.set(resp.recommendation)
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || "Something went wrong");
        this.isLoading.set(false);
      }
    });
  }

  getWeatherIcon(): string {
    const rawCode = this.weather()?.w_code;
    if (rawCode === undefined || rawCode === null) return "";

    const code = Number(rawCode);
    if (isNaN(code)) return "";

    if (code === 0 || code === 800) return "☀️";
    if ((code >= 1 && code <= 3) || (code >= 801 && code <= 804)) return "🌤️";
    if ((code >= 45 && code <= 48) || (code >= 701 && code <= 781)) return "🌫️";
    if ((code >= 51 && code <= 67) || (code >= 300 && code <= 531)) return "🌧️";
    if ((code >= 71 && code <= 86) || (code >= 600 && code <= 622)) return "🌨️";
    if (code >= 95 || (code >= 200 && code <= 232)) return "🌩️";

    return "";
  }
}
