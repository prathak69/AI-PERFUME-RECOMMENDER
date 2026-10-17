import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PerfumeBottle3d } from './perfume-bottle-3d/perfume-bottle-3d';
import { AuthApi } from '../../core/services/auth-api';

export interface FragranceFamily {
  title: string;
  category: string;
  description: string;
  notes: string[];
  gradient: string;
  tag: string;
}

@Component({
  standalone: true,
  imports: [RouterLink, PerfumeBottle3d],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  readonly auth = inject(AuthApi);

  readonly fragranceFamilies: FragranceFamily[] = [
    {
      title: 'Woody & Smoky Amber',
      category: 'Regal & Magnetic',
      description:
        'Opulent blends of aged Cambodian oud, Mysore sandalwood, and warm resins that leave an indelible signature trail.',
      notes: ['Aged Oud', 'Sandalwood', 'Golden Amber', 'Incense'],
      gradient: 'linear-gradient(135deg, rgba(212, 175, 55, 0.18), rgba(120, 60, 20, 0.25))',
      tag: 'Evening & Formal',
    },
    {
      title: 'Fresh Citrus & Mineral Water',
      category: 'Crisp & Invigorating',
      description:
        'Sun-drenched Mediterranean bergamot, coastal sea salt, and sheer ambergris engineered for high-heat projection.',
      notes: ['Calabrian Bergamot', 'Sea Salt', 'Neroli Petals', 'White Musk'],
      gradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(20, 90, 130, 0.25))',
      tag: 'Daytime & Summer',
    },
    {
      title: 'Velvet Floral & Gourmand',
      category: 'Sensual & Enveloping',
      description:
        'Centifolia roses steeped in bourbon vanilla, roasted tonka bean, and delicate spices for irresistible intimacy.',
      notes: ['Damask Rose', 'Bourbon Vanilla', 'Praline', 'Pink Pepper'],
      gradient: 'linear-gradient(135deg, rgba(244, 114, 182, 0.18), rgba(140, 30, 80, 0.25))',
      tag: 'Romantic & Cozy',
    },
    {
      title: 'Aromatic Leather & Spices',
      category: 'Sophisticated & Daring',
      description:
        'Supple Tuscan leather kissed with Persian saffron, cardamom pods, and smoky birch tar for modern aristocrats.',
      notes: ['Tuscan Leather', 'Persian Saffron', 'Cardamom', 'Birch Tar'],
      gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18), rgba(60, 20, 100, 0.25))',
      tag: 'Night & Autumn',
    },
  ];

  readonly marqueeNotes: string[] = [
    'Calabrian Bergamot',
    'Damask Rose',
    'Bourbon Vanilla',
    'Cambodian Oud',
    'Tonka Bean',
    'Pink Peppercorn',
    'Mysore Sandalwood',
    'Ambroxan',
    'White Musk',
    'Persian Saffron',
    'Iris Florentina',
    'Cardamom Pods',
    'French Cypress',
    'Neroli Blossom',
  ];
}
