import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { prefersReducedMotion } from '../utils/gsap';
import { shouldReduceEffects, isMobile } from '../utils/mobile';

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
  private lastDraw = 0;

  private mx = 0.5;
  private my = 0.5;

  // ✅ perf modes - usando detección centralizada
  private isCoarsePointer = false;
  private targetFps = 30;
  private running = false;

  ngAfterViewInit(): void {
    if (prefersReducedMotion()) return;

    // Usar detección centralizada de móvil
    const mobileInfo = { isMobile: isMobile(), shouldReduceEffects: shouldReduceEffects() };
    this.isCoarsePointer = mobileInfo.isMobile;

    // Save-Data (cuando existe) => bajar calidad fuerte
    const saveData = (navigator as any)?.connection?.saveData === true;

    // Cap FPS por device y efectos reducidos
    this.targetFps = (this.isCoarsePointer || saveData || mobileInfo.shouldReduceEffects) ? 20 : 30; // ✅ Subir FPS en móvil

    // ✅ Permitir canvas en móvil siempre (no bloquear completamente)
    // Solo bloquear si es saveData + efectos reducidos extremos
    if (saveData && mobileInfo.shouldReduceEffects && this.isCoarsePointer) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

    this.resize();
    this.seed();
    this.running = true;
    this.tick(performance.now());
  }

  ngOnDestroy(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  @HostListener('document:visibilitychange')
  onVis(): void {
    if (!this.running) return;

    // ✅ Pausar si la pestaña no está visible
    if (document.hidden) {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
      return;
    }

    // Reanudar
    if (!this.rafId) {
      this.lastDraw = 0;
      this.tick(performance.now());
    }
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

    // re-seed si cambia tamaño fuerte
    if (this.running) this.seed();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouse(ev: MouseEvent): void {
    // ✅ en móvil o efectos reducidos no seguimos mouse
    if (this.isCoarsePointer || shouldReduceEffects()) return;
    this.mx = ev.clientX / Math.max(1, this.w);
    this.my = ev.clientY / Math.max(1, this.h);
  }

  private seed(): void {
    // ✅ Ajustar orbs para móvil - más que antes pero aún optimizado
    const baseCount = Math.floor(this.w / 160); // Un poco más de densidad
    const shouldReduce = shouldReduceEffects();
    const count = this.isCoarsePointer 
      ? Math.min(8, Math.max(4, baseCount)) // ✅ Más orbs en móvil (4-8)
      : shouldReduce
        ? Math.min(10, Math.max(5, baseCount)) // Pocos en efectos reducidos
        : Math.min(12, Math.max(6, baseCount)); // Normal en desktop

    this.orbs = Array.from({ length: count }).map(() => {
      const baseRadius = this.isCoarsePointer ? 60 : 70; // ✅ Radio un poco más grande en móvil
      const radiusVariation = this.isCoarsePointer ? 120 : 150;
      const r = baseRadius + Math.random() * radiusVariation;
      
      return {
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r,
        vx: (-0.35 + Math.random() * 0.7) * 0.3, // Más lento
        vy: (-0.35 + Math.random() * 0.7) * 0.3,
        a: (this.isCoarsePointer ? 0.04 : 0.08) + Math.random() * (this.isCoarsePointer ? 0.06 : 0.12)
      };
    });
  }

  private tick = (now: number) => {
    if (!this.running) return;

    this.rafId = requestAnimationFrame(this.tick);

    if (!this.ctx) return;

    // ✅ cap FPS REAL (no “return early” sin pintar)
    const minFrameMs = 1000 / this.targetFps;
    if (this.lastDraw && now - this.lastDraw < minFrameMs) return;
    const delta = this.lastDraw ? (now - this.lastDraw) : minFrameMs;
    this.lastDraw = now;

    // movimiento estable independiente del FPS
    const dt = Math.min(40, delta) / 16.67;

    this.t += 0.007 * dt;

    const ctx = this.ctx;

    // clear
    ctx.clearRect(0, 0, this.w, this.h);

    // ✅ base vignette: mantener 1 gradiente (ok)
    const grd = ctx.createRadialGradient(
      this.w * (0.4 + (this.mx - 0.5) * 0.06),
      this.h * (0.45 + (this.my - 0.5) * 0.06),
      10,
      this.w * 0.5,
      this.h * 0.5,
      Math.max(this.w, this.h)
    );
    grd.addColorStop(0, 'rgba(0,74,173,0.18)');
    grd.addColorStop(0.35, 'rgba(15,72,102,0.08)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.globalCompositeOperation = 'lighter';

    // ✅ en móvil o efectos reducidos: menos "mouse gravity", menos cálculos
    const gravityOn = !this.isCoarsePointer && !shouldReduceEffects();

    for (const o of this.orbs) {
      o.x += o.vx * dt;
      o.y += o.vy * dt;

      if (gravityOn) {
        const gx = (this.mx * this.w - o.x) * 0.00007;
        const gy = (this.my * this.h - o.y) * 0.00007;
        o.vx += gx * dt;
        o.vy += gy * dt;
      }

      o.vx *= 0.995;
      o.vy *= 0.995;

      if (o.x < -o.r) o.x = this.w + o.r;
      if (o.x > this.w + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = this.h + o.r;
      if (o.y > this.h + o.r) o.y = -o.r;

      const pulse = 0.76 + Math.sin(this.t + o.x * 0.002) * 0.24;
      const rr = o.r * pulse;

      // ✅ optimización extrema: en móvil y efectos reducidos, gradiente ultra simple
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, rr);
      if (this.isCoarsePointer || shouldReduceEffects()) {
        // Móvil: solo 2 stops, opacidad mínima
        g.addColorStop(0, `rgba(182,203,51,${o.a * 0.5})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
      } else {
        // Desktop: gradiente completo
        g.addColorStop(0, `rgba(182,203,51,${o.a})`);
        g.addColorStop(0.55, `rgba(0,74,173,${o.a * 0.55})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
      }

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x, o.y, rr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  };
}
