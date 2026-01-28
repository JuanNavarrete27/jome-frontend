import { Directive, ElementRef, HostListener, OnDestroy, Input } from '@angular/core';
import { prefersReducedMotion } from '../utils/gsap';
import { isMobile } from '../utils/mobile';

@Directive({ selector: '[magnetic]', standalone: true })
export class MagneticDirective implements OnDestroy {
  @Input() magneticStrength = 0.3;
  @Input() magneticRadius = 80;

  private rect?: DOMRect;
  private rafId?: number;
  private lastX = 0;
  private lastY = 0;
  private disabled = false;

  constructor(private el: ElementRef<HTMLElement>) {
    // ✅ Permitir magnetic ligero en móvil (no deshabilitar completamente)
    this.disabled = false;
  }

  ngAfterViewInit(): void {
    if (prefersReducedMotion() || this.disabled) return;
    this.rect = this.el.nativeElement.getBoundingClientRect();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.rect = this.el.nativeElement.getBoundingClientRect();
  }

  @HostListener('mousemove', ['$event'])
  onMove(ev: MouseEvent): void {
    if (prefersReducedMotion()) return;
    if (this.rafId) return;

    const isMobileDevice = isMobile();
    
    // ✅ Permitir magnetic en móvil pero con fuerza reducida
    if (isMobileDevice) {
      this.magneticStrength = 0.1; // Muy ligero en móvil
      this.magneticRadius = 40;   // Radio más pequeño
    }

    this.rafId = requestAnimationFrame(() => {
      const el = this.el.nativeElement;
      if (!this.rect) this.rect = el.getBoundingClientRect();

      const x = ev.clientX - this.rect.left;
      const y = ev.clientY - this.rect.top;

      const dx = x - this.rect.width / 2;
      const dy = y - this.rect.height / 2;

      const targetX = dx * this.magneticStrength;
      const targetY = dy * this.magneticStrength;

      if (Math.abs(targetX - this.lastX) > 0.1 || Math.abs(targetY - this.lastY) > 0.1) {
        gsap.to(el, {
          x: targetX,
          y: targetY,
          duration: isMobileDevice ? 0.15 : 0.25, // Más rápido en móvil
          ease: 'power3.out'
        });
        this.lastX = targetX;
        this.lastY = targetY;
      }

      this.rafId = undefined;
    });
  }

  @HostListener('mouseleave')
  onLeave(): void {
    const isMobileDevice = isMobile();
    gsap.to(this.el.nativeElement, { 
      x: 0, 
      y: 0, 
      duration: isMobileDevice ? 0.2 : 0.35, // Más rápido en móvil
      ease: 'power2.out' // Menos costoso que elastic
    });
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    gsap.set(this.el.nativeElement, { x: 0, y: 0 });
  }
}
