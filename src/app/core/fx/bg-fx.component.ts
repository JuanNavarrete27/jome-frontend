import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { prefersReducedMotion } from '../utils/gsap';

type Orb = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
};

@Component({
  selector: 'app-bg-fx',
  standalone: true,
  templateUrl: './bg-fx.component.html',
  styleUrls: ['./bg-fx.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackgroundFxComponent implements AfterViewInit, OnDestroy {
  @ViewChild('c', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx?: CanvasRenderingContext2D | null;
  private dpr = 1;
  private w = 0;
  private h = 0;

  private orbs: Orb[] = [];
  private rafId?: number;
  private t = 0;
  private lastTime = 0;
  private fps = 0;
  private frameCount = 0;
  private lastFpsUpdate = 0;

  private mx = 0.5;
  private my = 0.5;

  ngAfterViewInit(): void {
    if (prefersReducedMotion()) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    this.resize();
    this.seed();
    this.tick();
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  @HostListener('window:resize')
  resize(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth;
    this.h = window.innerHeight;

    canvas.width = Math.floor(this.w * this.dpr);
    canvas.height = Math.floor(this.h * this.dpr);
    canvas.style.width = this.w + 'px';
    canvas.style.height = this.h + 'px';

    this.ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  @HostListener('window:mousemove', ['$event'])
  onMouse(ev: MouseEvent): void {
    this.mx = ev.clientX / Math.max(1, this.w);
    this.my = ev.clientY / Math.max(1, this.h);
  }

  private seed(): void {
    const count = Math.min(24, Math.max(14, Math.floor(this.w / 90)));
    this.orbs = Array.from({ length: count }).map(() => {
      const r = 90 + Math.random() * 220;
      return {
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r,
        vx: (-0.35 + Math.random() * 0.7) * 0.55,
        vy: (-0.35 + Math.random() * 0.7) * 0.55,
        a: 0.12 + Math.random() * 0.22
      };
    });
  }

  private tick = () => {
    this.rafId = requestAnimationFrame(this.tick);
    if (!this.ctx) return;

    const now = performance.now();
    const delta = now - this.lastTime;
    
    // Control de FPS adaptativo
    if (delta < 16 && this.fps > 55) return; // Mantener 60fps si es posible
    this.lastTime = now;

    // Actualizar FPS
    this.frameCount++;
    if (now - this.lastFpsUpdate > 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    this.t += 0.007;

    const ctx = this.ctx;
    
    // Usar clearRect con rectángulo específico en lugar de full clear
    ctx.clearRect(0, 0, this.w, this.h);

    // Base vignette optimizada
    const grd = ctx.createRadialGradient(
      this.w * (0.4 + (this.mx - 0.5) * 0.08),
      this.h * (0.45 + (this.my - 0.5) * 0.08),
      10,
      this.w * 0.5,
      this.h * 0.5,
      Math.max(this.w, this.h)
    );
    grd.addColorStop(0, 'rgba(0,74,173,0.20)');
    grd.addColorStop(0.35, 'rgba(15,72,102,0.10)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.globalCompositeOperation = 'lighter';

    // Reducir cálculos si FPS es bajo
    const qualityFactor = this.fps < 30 ? 0.5 : 1;

    for (const o of this.orbs) {
      // Drift optimizado
      o.x += o.vx * qualityFactor;
      o.y += o.vy * qualityFactor;

      // Mouse gravity menos intensa para mejorar rendimiento
      if (qualityFactor > 0.5) {
        const gx = (this.mx * this.w - o.x) * 0.00008;
        const gy = (this.my * this.h - o.y) * 0.00008;
        o.vx += gx;
        o.vy += gy;
      }

      // damping
      o.vx *= 0.995;
      o.vy *= 0.995;

      // wrap
      if (o.x < -o.r) o.x = this.w + o.r;
      if (o.x > this.w + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = this.h + o.r;
      if (o.y > this.h + o.r) o.y = -o.r;

      const pulse = 0.72 + Math.sin(this.t + o.x * 0.002) * 0.28;
      const rr = o.r * pulse;

      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, rr);
      g.addColorStop(0, `rgba(182,203,51,${o.a})`);
      g.addColorStop(0.4, `rgba(0,74,173,${o.a * 0.7})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x, o.y, rr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  };
}
