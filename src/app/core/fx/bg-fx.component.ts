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
    this.targetFps = (this.isCoarsePointer || saveData || mobileInfo.shouldReduceEffects) ? 20 : 30;

    // ✅ Permitir canvas en móvil siempre (no bloquear completamente)
    // Solo bloquear si es saveData + efectos reducidos extremos
    if (saveData && mobileInfo.shouldReduceEffects && this.isCoarsePointer) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

    this.resize();
    this.seed();
    this.running = true;
    
    // ✅ START IMMEDIATELY - No delay
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
    // en móvil o efectos reducidos no seguimos mouse
    if (this.isCoarsePointer || shouldReduceEffects()) return;
    this.mx = ev.clientX 
  }

  private seed(): void {
    // Ultra high density for dramatic effect
    const baseCount = Math.floor(this.w / 60); 
    const shouldReduce = shouldReduceEffects();
    const count = this.isCoarsePointer 
      ? Math.min(20, Math.max(12, baseCount)) 
      : shouldReduce
        ? Math.min(24, Math.max(16, baseCount)) 
        : Math.min(32, Math.max(20, baseCount)); 

    this.orbs = Array.from({ length: count }).map(() => {
      const baseRadius = this.isCoarsePointer ? 80 : 100;
      const radiusVariation = this.isCoarsePointer ? 150 : 200;
      const r = baseRadius + Math.random() * radiusVariation;
      
      return {
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r,
        vx: (-0.6 + Math.random() * 1.2) * 0.6, 
        vy: (-0.6 + Math.random() * 1.2) * 0.6,
        a: (this.isCoarsePointer ? 0.12 : 0.18) + Math.random() * (this.isCoarsePointer ? 0.15 : 0.25) 
      };
    });
  }

  private tick = (now: number) => {
    if (!this.running) return;

    this.rafId = requestAnimationFrame(this.tick);

    if (!this.ctx) return;

    // cap FPS REAL (no “return early” sin pintar)
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

    // PREMIUM MONOCHROME vignette with rich colors
    const grd = ctx.createRadialGradient(
      this.w * (0.25 + (this.mx - 0.5) * 0.15),
      this.h * (0.3 + (this.my - 0.5) * 0.12),
      25,
      this.w * 0.5,
      this.h * 0.5,
      Math.max(this.w, this.h)
    );
    grd.addColorStop(0, 'rgba(255, 255, 255, 0.45)'); 
    grd.addColorStop(0.2, 'rgba(248, 250, 252, 0.35)'); 
    grd.addColorStop(0.4, 'rgba(226, 232, 240, 0.28)'); 
    grd.addColorStop(0.6, 'rgba(156, 163, 175, 0.22)'); 
    grd.addColorStop(1, 'rgba(55, 65, 81, 0.1)'); 
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.globalCompositeOperation = 'lighter';

    // en móvil o efectos reducidos: menos "mouse gravity", menos cálculos
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

      // PREMIUM MONOCHROME gradients with 6 colors
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, rr);
      if (this.isCoarsePointer || shouldReduceEffects()) {
        // Móvil: 4 stops, ultra visibles
        g.addColorStop(0, `rgba(255, 255, 255, ${o.a * 0.9})`); 
        g.addColorStop(0.4, `rgba(248, 250, 252, ${o.a * 0.7})`); 
        g.addColorStop(0.6, `rgba(226, 232, 240, ${o.a * 0.4})`); 
        g.addColorStop(0.8, `rgba(156, 163, 175, ${o.a * 0.2})`); 
        g.addColorStop(1, `rgba(107, 114, 128, ${o.a * 0.08})`); 
      } else {
        // Desktop: 6 stops, ultra premium gradients
        g.addColorStop(0, `rgba(255, 255, 255, ${o.a * 0.06})`); 
        g.addColorStop(0.5, `rgba(248, 250, 252, ${o.a * 0.28})`); 
        g.addColorStop(0.6, `rgba(226, 232, 240, ${o.a * 0.28})`); 
        g.addColorStop(0.8, `rgba(156, 163, 175, ${o.a * 0.22})`); 
        g.addColorStop(1, `rgba(55, 65, 81, ${o.a * 0.1})`); 
      }

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x, o.y, rr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  };
}
