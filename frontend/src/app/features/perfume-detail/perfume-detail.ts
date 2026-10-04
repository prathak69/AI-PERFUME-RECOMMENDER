import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  input,
  computed,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Perfume } from '../../core/models/perfume.model';
import { PerfumeService } from '../../core/services/perfume-api';
import { ToastService } from '../../core/services/toast.service';
import { ModalService } from '../../core/services/modal.service';

export interface FloatingNote {
  id: number;
  name: string;
  type: 'top' | 'heart' | 'base';
  topPercent: number;
  leftPercent: number;
  delaySec: number;
  durationSec: number;
  offsetX: number;
  offsetY: number;
}

interface ScentDroplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

@Component({
  standalone: true,
  imports: [RouterLink, CommonModule],
  selector: 'app-perfume-detail',
  styleUrl: './perfume-detail.scss',
  templateUrl: './perfume-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfumeDetail implements OnInit, AfterViewInit, OnDestroy {
  private readonly requestService = inject(PerfumeService);
  private readonly router = inject(Router);
  readonly toastService = inject(ToastService);
  readonly modalService = inject(ModalService);

  @ViewChild('stageRef') stageRef?: ElementRef<HTMLDivElement>;

  @ViewChild('vaporCanvas') set vaporCanvas(canvas: ElementRef<HTMLCanvasElement> | undefined) {
    if (canvas) {
      this.vaporCanvasRef = canvas;
      // Initialize particle canvas once mounted in the DOM
      setTimeout(() => this.initVaporCanvas(), 0);
    }
  }
  private vaporCanvasRef?: ElementRef<HTMLCanvasElement>;

  readonly perfume = signal<Perfume | null>(null);
  readonly errorMessage = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  readonly isDeleting = signal<boolean>(false);
  readonly isBursting = signal<boolean>(false);

  // Parallax mouse tilt
  readonly mouseTiltX = signal<number>(0);
  readonly mouseTiltY = signal<number>(0);

  // Dynamic note repulsion offsets
  readonly noteOffsets = signal<{ [key: number]: { x: number; y: number } }>({});

  readonly id = input.required<string>();

  // Canvas internal animation
  private animFrameId: number | null = null;
  private droplets: ScentDroplet[] = [];
  private lastMouseX = 0;
  private lastMouseY = 0;

  readonly topNotes = computed<string[]>(() => {
    const p = this.perfume();
    return p?.notes?.top || p?.notes?.top_notes || [];
  });

  readonly heartNotes = computed<string[]>(() => {
    const p = this.perfume();
    return p?.notes?.heart || p?.notes?.heart_notes || [];
  });

  readonly baseNotes = computed<string[]>(() => {
    const p = this.perfume();
    return p?.notes?.base || p?.notes?.base_notes || [];
  });

  readonly seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];

  readonly floatingNotes = computed<FloatingNote[]>(() => {
    const tops = this.topNotes()
      .slice(0, 3)
      .map((name) => ({ name, type: 'top' as const }));
    const hearts = this.heartNotes()
      .slice(0, 3)
      .map((name) => ({ name, type: 'heart' as const }));
    const bases = this.baseNotes()
      .slice(0, 3)
      .map((name) => ({ name, type: 'base' as const }));

    const combined = [...tops, ...hearts, ...bases];
    const sourceList =
      combined.length > 0
        ? combined
        : [
            { name: 'Calabrian Bergamot', type: 'top' as const },
            { name: 'Sichuan Pepper', type: 'heart' as const },
            { name: 'Damask Rose', type: 'heart' as const },
            { name: 'Ambroxan', type: 'base' as const },
            { name: 'Bourbon Vanilla', type: 'base' as const },
            { name: 'Cedarwood', type: 'base' as const },
          ];

    const presets = [
      { top: 18, left: 12, delay: 0, dur: 5.8 },
      { top: 22, left: 74, delay: 1.1, dur: 6.5 },
      { top: 46, left: 8, delay: 0.5, dur: 7.2 },
      { top: 50, left: 78, delay: 1.7, dur: 6.0 },
      { top: 74, left: 14, delay: 0.8, dur: 5.5 },
      { top: 76, left: 72, delay: 2.1, dur: 6.8 },
      { top: 32, left: 80, delay: 1.4, dur: 6.3 },
      { top: 64, left: 10, delay: 0.3, dur: 5.9 },
    ];

    return sourceList.slice(0, 8).map((item, idx) => {
      const pos = presets[idx % presets.length];
      return {
        id: idx,
        name: item.name,
        type: item.type,
        topPercent: pos.top,
        leftPercent: pos.left,
        delaySec: pos.delay,
        durationSec: pos.dur,
        offsetX: 0,
        offsetY: 0,
      };
    });
  });

  ngOnInit(): void {
    this.loadPerfume();
  }

  ngAfterViewInit(): void {
    this.initVaporCanvas();
  }

  ngOnDestroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
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
    return (
      p?.image_url ||
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1000&q=80'
    );
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src =
        'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1000&q=80';
    }
  }

  isSeasonActive(season: string): boolean {
    const activeSeasons = this.perfume()?.seasonality || [];
    return activeSeasons.some((s) => s.toLowerCase().includes(season.toLowerCase()));
  }

  /**
   * Interactive Cursor Movement:
   * 1. 3D perspective tilt on the bottle frame.
   * 2. Physical repulsion of floating note pills away from the cursor.
   * 3. Spawns glowing aerosol vapor droplets in the canvas.
   */
  onMouseMove(event: MouseEvent) {
    const stage = (event.currentTarget as HTMLElement) || this.stageRef?.nativeElement;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    this.lastMouseX = mouseX;
    this.lastMouseY = mouseY;

    // 3D bottle tilt
    const normX = mouseX / rect.width - 0.5;
    const normY = mouseY / rect.height - 0.5;
    this.mouseTiltX.set(normX * 18);
    this.mouseTiltY.set(normY * -18);

    // Repulsion physics on note pills
    const stageWidth = rect.width;
    const stageHeight = rect.height;
    const radius = 220; // repulsion sphere radius
    const currentOffsets = { ...this.noteOffsets() };

    this.floatingNotes().forEach((note) => {
      const noteX = (note.leftPercent / 100) * stageWidth;
      const noteY = (note.topPercent / 100) * stageHeight;

      const dx = noteX - mouseX;
      const dy = noteY - mouseY;
      const dist = Math.hypot(dx, dy);

      if (dist < radius && dist > 0.1) {
        // Disperse outwards away from cursor with responsive spring force
        const force = Math.pow(1 - dist / radius, 1.2) * 110;
        currentOffsets[note.id] = {
          x: (dx / dist) * force,
          y: (dy / dist) * force,
        };
      } else {
        // Gently decay back to 0
        const prev = currentOffsets[note.id] || { x: 0, y: 0 };
        currentOffsets[note.id] = {
          x: prev.x * 0.75,
          y: prev.y * 0.75,
        };
      }
    });

    this.noteOffsets.set(currentOffsets);

    // Spawn subtle fragrance vapor particles at cursor
    this.spawnVaporDroplet(mouseX, mouseY, 2);
  }

  onMouseLeave() {
    this.mouseTiltX.set(0);
    this.mouseTiltY.set(0);

    // Smoothly spring all notes back to origin
    const currentOffsets = { ...this.noteOffsets() };
    Object.keys(currentOffsets).forEach((key) => {
      currentOffsets[Number(key)] = { x: 0, y: 0 };
    });
    this.noteOffsets.set(currentOffsets);
  }

  /**
   * Clicking the stage triggers a dramatic scent shockwave
   * that blasts notes outward in all directions before returning.
   */
  triggerScentShockwave(target?: HTMLElement | MouseEvent) {
    this.isBursting.set(true);
    let stage: HTMLElement | null = null;
    if (target instanceof HTMLElement) {
      stage = target;
    } else if (target && 'currentTarget' in target) {
      stage = target.currentTarget as HTMLElement;
    } else {
      stage = this.stageRef?.nativeElement || null;
    }
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const currentOffsets: { [key: number]: { x: number; y: number } } = {};

    this.floatingNotes().forEach((note) => {
      const noteX = (note.leftPercent / 100) * rect.width;
      const noteY = (note.topPercent / 100) * rect.height;
      const dx = noteX - centerX;
      const dy = noteY - centerY;
      const dist = Math.hypot(dx, dy) || 1;

      // Blast outwards
      currentOffsets[note.id] = {
        x: (dx / dist) * 120,
        y: (dy / dist) * 120,
      };
    });

    this.noteOffsets.set(currentOffsets);

    // Spawn burst of vapor droplets from center
    for (let i = 0; i < 40; i++) {
      this.spawnVaporDroplet(centerX, centerY, 1, true);
    }

    // Spring back over 750ms
    setTimeout(() => {
      this.isBursting.set(false);
      const reset: { [key: number]: { x: number; y: number } } = {};
      this.floatingNotes().forEach((note) => {
        reset[note.id] = { x: 0, y: 0 };
      });
      this.noteOffsets.set(reset);
    }, 750);
  }

  getNoteTransform(noteId: number): string {
    const offset = this.noteOffsets()[noteId] || { x: 0, y: 0 };
    return `translate3d(${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px, 0)`;
  }

  // --- Scent Vapor Droplets Canvas System ---
  private initVaporCanvas() {
    const canvas = this.vaporCanvasRef?.nativeElement;
    if (!canvas) return;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const resize = () => {
      const parent = canvas.parentElement || this.stageRef?.nativeElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width || 450;
        canvas.height = rect.height || 580;
      }
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      this.animFrameId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = this.droplets.length - 1; i >= 0; i--) {
        const d = this.droplets[i];
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= 0.96;
        d.vy *= 0.96;
        d.alpha = Math.max(0, 1 - d.life / d.maxLife);
        d.life++;

        if (d.life >= d.maxLife) {
          this.droplets.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = d.color.replace('ALPHA', d.alpha.toString());
        ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }
    };
    render();
  }

  private spawnVaporDroplet(x: number, y: number, count = 1, radial = false) {
    const palette = [
      'rgba(247, 230, 181, ALPHA)',
      'rgba(212, 175, 55, ALPHA)',
      'rgba(244, 114, 182, ALPHA)',
      'rgba(192, 132, 252, ALPHA)',
    ];

    for (let i = 0; i < count; i++) {
      const angle = radial ? Math.random() * Math.PI * 2 : Math.random() * Math.PI - Math.PI / 2;
      const speed = radial ? Math.random() * 4 + 2 : Math.random() * 2 + 0.5;

      this.droplets.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (radial ? 0 : 0.8), // drift upwards
        size: Math.random() * 2.8 + 1.2,
        alpha: 1,
        life: 0,
        maxLife: Math.floor(Math.random() * 45 + 30),
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    }

    if (this.droplets.length > 90) {
      this.droplets.splice(0, this.droplets.length - 90);
    }
  }

  async deleteFlacon() {
    const item = this.perfume();
    if (!item) return;

    const confirmed = await this.modalService.confirm({
      title: 'Remove Flacon from Wardrobe',
      message: `Are you sure you want to remove ${item.name} by ${item.brand}? This action will permanently remove its olfactory profile from your collection.`,
      confirmText: 'Remove Flacon',
      cancelText: 'Keep in Wardrobe',
      type: 'danger',
      flaconName: item.name,
      flaconBrand: item.brand,
      flaconImage: this.bottleImage,
    });

    if (!confirmed) return;

    this.isDeleting.set(true);
    this.requestService.deletePerfumeById(this.id()).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.success(
          'Flacon Removed',
          `${item.name} has been de-archived from your wardrobe.`,
        );
        this.router.navigate(['/perfume']);
      },
      error: (err) => {
        this.isDeleting.set(false);
        const msg = err.error?.detail || 'Failed to delete perfume';
        this.toastService.error('De-archive Error', msg);
      },
    });
  }
}
