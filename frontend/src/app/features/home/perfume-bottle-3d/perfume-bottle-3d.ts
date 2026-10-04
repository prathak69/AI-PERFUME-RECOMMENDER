import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
  computed,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import * as THREE from 'three';

export interface ScentMood {
  id: string;
  name: string;
  subtitle: string;
  notes: string[];
  liquidColor: number;
  glowColor: string;
  auraIntensity: number;
}

@Component({
  standalone: true,
  selector: 'app-perfume-bottle-3d',
  templateUrl: './perfume-bottle-3d.html',
  styleUrl: './perfume-bottle-3d.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfumeBottle3d implements OnInit, OnDestroy {
  @ViewChild('rendererCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly moods: ScentMood[] = [
    {
      id: 'amber',
      name: 'Amber Solstice',
      subtitle: 'Warm & Sensual',
      notes: ['Bourbon Vanilla', 'Tonka Bean', 'Cinnamon Bark'],
      liquidColor: 0xe59a28,
      glowColor: 'rgba(229, 154, 40, 0.45)',
      auraIntensity: 1.0,
    },
    {
      id: 'rose',
      name: 'Rose Éthérée',
      subtitle: 'Floral & Luminous',
      notes: ['Damask Rose', 'Pink Peppercorn', 'Lychee Elixir'],
      liquidColor: 0xdf4a78,
      glowColor: 'rgba(223, 74, 120, 0.45)',
      auraIntensity: 1.1,
    },
    {
      id: 'midnight',
      name: 'Midnight Velvet',
      subtitle: 'Smoky & Enigmatic',
      notes: ['Black Plum', 'Smoked Iris', 'Tuscan Leather'],
      liquidColor: 0x5b3ab5,
      glowColor: 'rgba(91, 58, 181, 0.45)',
      auraIntensity: 1.0,
    },
    {
      id: 'emerald',
      name: 'Emerald Sylvan',
      subtitle: 'Crisp & Aristocratic',
      notes: ['Calabrian Bergamot', 'French Cypress', 'Haitian Vetiver'],
      liquidColor: 0x1f9468,
      glowColor: 'rgba(31, 148, 104, 0.45)',
      auraIntensity: 0.95,
    },
  ];

  readonly activeMoodIndex = signal<number>(0);
  readonly currentMood = computed(() => this.moods[this.activeMoodIndex()]);
  readonly isSpraying = signal<boolean>(false);
  readonly sprayCount = signal<number>(0);

  // Three.js internals
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;

  private bottleGroup!: THREE.Group;
  private liquidMesh!: THREE.Mesh;
  private liquidMaterial!: THREE.MeshPhysicalMaterial;
  private innerGlowLight!: THREE.PointLight;
  private ambientParticles!: THREE.Points;

  // Spray particle system
  private sprayGeometry!: THREE.BufferGeometry;
  private sprayParticles!: THREE.Points;
  private sprayPositions!: Float32Array;
  private sprayVelocities!: Float32Array;
  private sprayOpacities!: Float32Array;
  private sprayMaterial!: THREE.PointsMaterial;
  private sprayTimer = 0;

  // Interaction & Physics
  private targetRotationX = 0;
  private targetRotationY = 0;
  private isPointerDown = false;
  private previousPointerX = 0;
  private previousPointerY = 0;
  private idleTime = 0;

  // Web Audio Context for synthesized aerosol spray
  private audioCtx: AudioContext | null = null;

  ngOnInit(): void {
    this.initThree();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
    }
  }

  selectMood(index: number): void {
    this.activeMoodIndex.set(index);
    const mood = this.moods[index];

    if (this.liquidMaterial && this.innerGlowLight) {
      // Smooth color shift
      const targetColor = new THREE.Color(mood.liquidColor);
      this.liquidMaterial.color.copy(targetColor);
      this.liquidMaterial.attenuationColor.copy(targetColor);
      this.innerGlowLight.color.copy(targetColor);
    }

    // Trigger subtle spritz upon mood selection
    this.spritzFragrance();
  }

  spritzFragrance(): void {
    this.isSpraying.set(true);
    this.sprayCount.update((c) => c + 1);
    this.triggerSprayParticles();
    this.playSpritzSound();

    setTimeout(() => {
      this.isSpraying.set(false);
    }, 1200);
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth || 480;
    const height = canvas.clientHeight || 560;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.camera.position.set(0, 0.3, 7.8);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // Lighting
    this.setupLighting();

    // Build the 3D Bottle
    this.buildBottle();

    // Build Ambient Dust / Sparkles
    this.buildAmbientDust();

    // Build Spray Particle System
    this.buildSpraySystem();

    // Resize handling
    this.onResize();
  }

  private setupLighting(): void {
    // Warm ambient light
    const ambientLight = new THREE.AmbientLight(0xfff7ea, 1.2);
    this.scene.add(ambientLight);

    // Main Key Light (Golden high angle)
    const keyLight = new THREE.DirectionalLight(0xffebba, 3.2);
    keyLight.position.set(4, 6, 5);
    this.scene.add(keyLight);

    // Rim / Backlight (Cool champagne for crystal reflection)
    const rimLight = new THREE.DirectionalLight(0xd9e5ff, 2.0);
    rimLight.position.set(-5, 4, -4);
    this.scene.add(rimLight);

    // Bottom bounce light for luxury bottom glass refraction
    const bounceLight = new THREE.DirectionalLight(0xd4af37, 1.1);
    bounceLight.position.set(0, -4, 2);
    this.scene.add(bounceLight);

    // Inner liquid glow point light
    this.innerGlowLight = new THREE.PointLight(this.moods[0].liquidColor, 3.5, 6);
    this.innerGlowLight.position.set(0, -0.3, 0);
    this.scene.add(this.innerGlowLight);
  }

  private buildBottle(): void {
    this.bottleGroup = new THREE.Group();

    // 1. Crystal Flacon Body (Faceted Octagonal Glass Flask)
    // Cylinder with 8 segments gives a rich emerald-cut crystal flacon silhouette
    const glassGeometry = new THREE.CylinderGeometry(1.25, 1.35, 3.1, 8, 1, false);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.94,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      metalness: 0.04,
      ior: 1.54, // Fine optical crystal
      thickness: 1.4,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      attenuationColor: new THREE.Color(this.moods[0].liquidColor),
      attenuationDistance: 0.9,
    });

    const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
    glassMesh.position.y = -0.4;
    glassMesh.rotation.y = Math.PI / 8; // Align facet nicely to camera
    this.bottleGroup.add(glassMesh);

    // 2. Thick Crystal Base Block (Hallmark of luxury bottles)
    const baseGeometry = new THREE.CylinderGeometry(1.36, 1.4, 0.45, 8);
    const baseMesh = new THREE.Mesh(baseGeometry, glassMaterial);
    baseMesh.position.y = -2.1;
    baseMesh.rotation.y = Math.PI / 8;
    this.bottleGroup.add(baseMesh);

    // 3. Inner Fragrance Liquid (Golden nectar within)
    const liquidGeometry = new THREE.CylinderGeometry(1.05, 1.1, 2.4, 16);
    this.liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(this.moods[0].liquidColor),
      transmission: 0.65,
      transparent: true,
      opacity: 0.88,
      roughness: 0.12,
      metalness: 0.1,
      ior: 1.38,
      thickness: 0.9,
      attenuationColor: new THREE.Color(this.moods[0].liquidColor),
      attenuationDistance: 0.4,
    });

    this.liquidMesh = new THREE.Mesh(liquidGeometry, this.liquidMaterial);
    this.liquidMesh.position.y = -0.65;
    this.bottleGroup.add(this.liquidMesh);

    // 4. Slanted Crystal Shoulder
    const shoulderGeometry = new THREE.CylinderGeometry(0.68, 1.25, 0.55, 8);
    const shoulderMesh = new THREE.Mesh(shoulderGeometry, glassMaterial);
    shoulderMesh.position.y = 1.38;
    shoulderMesh.rotation.y = Math.PI / 8;
    this.bottleGroup.add(shoulderMesh);

    // 5. Polished Gold Atomizer Collar
    const collarGeometry = new THREE.CylinderGeometry(0.55, 0.58, 0.42, 32);
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xdfba5a,
      metalness: 0.94,
      roughness: 0.16,
    });
    const collarMesh = new THREE.Mesh(collarGeometry, goldMaterial);
    collarMesh.position.y = 1.8;
    this.bottleGroup.add(collarMesh);

    // 6. Gold Spray Atomizer Button
    const nozzleGeometry = new THREE.CylinderGeometry(0.38, 0.38, 0.4, 32);
    const nozzleMesh = new THREE.Mesh(nozzleGeometry, goldMaterial);
    nozzleMesh.position.y = 2.18;
    this.bottleGroup.add(nozzleMesh);

    // 7. Heavy Crystal & Obsidian Magnetic Cap
    const capGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x181822,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const capGeometry = new THREE.CylinderGeometry(0.72, 0.72, 0.85, 8);
    const capMesh = new THREE.Mesh(capGeometry, capGlassMat);
    capMesh.position.y = 2.75;
    capMesh.rotation.y = Math.PI / 8;
    this.bottleGroup.add(capMesh);

    // Gold band on the cap
    const capBandGeo = new THREE.CylinderGeometry(0.73, 0.73, 0.12, 32);
    const capBandMesh = new THREE.Mesh(capBandGeo, goldMaterial);
    capBandMesh.position.y = 2.45;
    this.bottleGroup.add(capBandMesh);

    // 8. Internal Dip Tube
    const tubeGeometry = new THREE.CylinderGeometry(0.035, 0.035, 2.9, 16);
    const tubeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tubeMesh.position.y = -0.55;
    this.bottleGroup.add(tubeMesh);

    // 9. Embossed Luxury Gold Label Plate
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 512;
    const ctx = labelCanvas.getContext('2d');
    if (ctx) {
      // Background rich dark parchment
      ctx.fillStyle = '#0f0f16';
      ctx.fillRect(0, 0, 512, 512);

      // Gold ornate border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, 472, 472);

      ctx.lineWidth = 2;
      ctx.strokeRect(32, 32, 448, 448);

      // Label Typography
      ctx.textAlign = 'center';

      ctx.fillStyle = '#c59b27';
      ctx.font = '22px "Cinzel", Georgia, serif';
      ctx.letterSpacing = '8px';
      ctx.fillText('• ATELIER NOIR •', 256, 120);

      ctx.fillStyle = '#fdf3d1';
      ctx.font = 'bold 78px "Cinzel", Georgia, serif';
      ctx.fillText('A U R A', 256, 235);

      ctx.fillStyle = '#e5c365';
      ctx.font = '24px "Plus Jakarta Sans", sans-serif';
      ctx.letterSpacing = '6px';
      ctx.fillText('EAU DE PARFUM', 256, 310);

      ctx.fillStyle = '#a89865';
      ctx.font = '19px "Cinzel", Georgia, serif';
      ctx.fillText('PARIS  •  50 ML  •  1.7 FL. OZ.', 256, 400);
    }

    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelTexture.needsUpdate = true;

    const labelMat = new THREE.MeshStandardMaterial({
      map: labelTexture,
      roughness: 0.35,
      metalness: 0.3,
    });

    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), labelMat);
    labelMesh.position.set(0, -0.4, 1.25);
    this.bottleGroup.add(labelMesh);

    this.scene.add(this.bottleGroup);
  }

  private buildAmbientDust(): void {
    const particleCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      scales[i] = Math.random() * 0.08 + 0.03;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Circle texture for soft golden bokeh particles
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 236, 175, 1)');
      grad.addColorStop(0.4, 'rgba(212, 175, 55, 0.6)');
      grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.18,
      map: texture,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.ambientParticles = new THREE.Points(geometry, material);
    this.scene.add(this.ambientParticles);
  }

  private buildSpraySystem(): void {
    const count = 450;
    this.sprayGeometry = new THREE.BufferGeometry();
    this.sprayPositions = new Float32Array(count * 3);
    this.sprayVelocities = new Float32Array(count * 3);
    this.sprayOpacities = new Float32Array(count);

    // Initial positions (hidden at nozzle)
    for (let i = 0; i < count; i++) {
      this.sprayPositions[i * 3] = 0;
      this.sprayPositions[i * 3 + 1] = -100; // parked offscreen
      this.sprayPositions[i * 3 + 2] = 0;
    }

    this.sprayGeometry.setAttribute('position', new THREE.BufferAttribute(this.sprayPositions, 3));

    // Soft luminous mist droplet texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(255, 225, 140, 0.8)');
      grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);

    this.sprayMaterial = new THREE.PointsMaterial({
      size: 0.16,
      map: texture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sprayParticles = new THREE.Points(this.sprayGeometry, this.sprayMaterial);
    this.scene.add(this.sprayParticles);
  }

  private triggerSprayParticles(): void {
    const count = this.sprayPositions.length / 3;
    const nozzleY = 2.35;

    for (let i = 0; i < count; i++) {
      // Start near nozzle
      this.sprayPositions[i * 3] = (Math.random() - 0.5) * 0.15;
      this.sprayPositions[i * 3 + 1] = nozzleY + Math.random() * 0.1;
      this.sprayPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;

      // Cone spray velocity: upward and fanning outward
      const speed = 0.08 + Math.random() * 0.14;
      const angle = Math.random() * Math.PI * 2;
      const spread = Math.random() * 0.06;

      this.sprayVelocities[i * 3] = Math.cos(angle) * spread;
      this.sprayVelocities[i * 3 + 1] = speed; // Upwards
      this.sprayVelocities[i * 3 + 2] = Math.sin(angle) * spread + 0.04; // Slightly forward
    }

    this.sprayMaterial.opacity = 1.0;
    this.sprayTimer = 1.0; // Life progress
  }

  private playSpritzSound(): void {
    try {
      if (!this.audioCtx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }

      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // 1. Crisp mechanical atomizer click
      const clickOsc = this.audioCtx.createOscillator();
      const clickGain = this.audioCtx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1400, now);
      clickOsc.frequency.exponentialRampToValueAtTime(320, now + 0.035);
      clickGain.gain.setValueAtTime(0.3, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      clickOsc.connect(clickGain);
      clickGain.connect(this.audioCtx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.04);

      // 2. High-pressure aerosol air hiss (noise buffer through highpass filter)
      const bufferSize = this.audioCtx.sampleRate * 0.45;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      // Filter to simulate aerosol mist
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3400, now);
      filter.Q.setValueAtTime(2.2, now);

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.28, now + 0.04);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);

      whiteNoise.start(now + 0.015);
      whiteNoise.stop(now + 0.45);
    } catch {
      // Audio playback fails gracefully if browser policy blocks autoplay
    }
  }

  // Pointer Interaction
  onPointerDown(event: PointerEvent): void {
    this.isPointerDown = true;
    this.previousPointerX = event.clientX;
    this.previousPointerY = event.clientY;
  }

  onPointerMove(event: PointerEvent): void {
    this.idleTime = 0;
    if (this.isPointerDown) {
      const deltaX = event.clientX - this.previousPointerX;
      const deltaY = event.clientY - this.previousPointerY;
      this.targetRotationY += deltaX * 0.008;
      this.targetRotationX += deltaY * 0.005;

      // Clamp X tilt
      this.targetRotationX = Math.max(-0.4, Math.min(0.4, this.targetRotationX));

      this.previousPointerX = event.clientX;
      this.previousPointerY = event.clientY;
    } else {
      // Subtle parallax tilt towards cursor
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const normX = (event.clientX - rect.left) / rect.width - 0.5;
      const normY = (event.clientY - rect.top) / rect.height - 0.5;

      this.targetRotationY = normX * 0.6;
      this.targetRotationX = normY * 0.4;
    }
  }

  onPointerUp(): void {
    this.isPointerDown = false;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.canvasRef || !this.renderer || !this.camera) return;
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.parentElement?.clientWidth || 480;
    const height = canvas.parentElement?.clientHeight || 560;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const time = performance.now() * 0.001;

    // Smooth lerp rotation
    if (this.bottleGroup) {
      this.idleTime += 0.01;

      // Slow elegant hover breath
      this.bottleGroup.position.y = Math.sin(time * 1.5) * 0.08;

      if (!this.isPointerDown) {
        // Continuous gentle auto-rotation
        this.bottleGroup.rotation.y +=
          (this.targetRotationY + Math.sin(time * 0.8) * 0.15 - this.bottleGroup.rotation.y) * 0.05;
        this.bottleGroup.rotation.x += (this.targetRotationX - this.bottleGroup.rotation.x) * 0.05;
      } else {
        this.bottleGroup.rotation.y += (this.targetRotationY - this.bottleGroup.rotation.y) * 0.1;
        this.bottleGroup.rotation.x += (this.targetRotationX - this.bottleGroup.rotation.x) * 0.1;
      }

      // Gentle liquid slosh effect
      if (this.liquidMesh) {
        this.liquidMesh.rotation.z = Math.sin(time * 2.2) * 0.025;
      }
    }

    // Ambient dust movement
    if (this.ambientParticles) {
      this.ambientParticles.rotation.y = time * 0.05;
      const positions = this.ambientParticles.geometry.attributes[
        'position'
      ] as THREE.BufferAttribute;
      const arr = positions.array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] += Math.sin(time + arr[i - 1]) * 0.003;
      }
      positions.needsUpdate = true;
    }

    // Spray particles animation
    if (this.sprayTimer > 0) {
      this.sprayTimer -= 0.016;
      const count = this.sprayPositions.length / 3;

      for (let i = 0; i < count; i++) {
        this.sprayPositions[i * 3] += this.sprayVelocities[i * 3];
        this.sprayPositions[i * 3 + 1] += this.sprayVelocities[i * 3 + 1];
        this.sprayPositions[i * 3 + 2] += this.sprayVelocities[i * 3 + 2];

        // Decelerate upwards, air turbulence
        this.sprayVelocities[i * 3 + 1] *= 0.95;
        this.sprayVelocities[i * 3] += (Math.random() - 0.5) * 0.004;
      }

      this.sprayMaterial.opacity = Math.max(0, this.sprayTimer * 1.2);
      this.sprayGeometry.attributes['position'].needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  };
}
