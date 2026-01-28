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
    // Deshabilitar en móvil/touch desde el inicio
    this.disabled = isMobile();
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
    if (this.disabled || prefersReducedMotion()) return;
    if (this.rafId) return;

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
          duration: 0.25,
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
    if (this.disabled) return;
    gsap.to(this.el.nativeElement, { x: 0, y: 0, duration: 0.35, ease: 'elastic.out(1, 0.35)' });
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    gsap.set(this.el.nativeElement, { x: 0, y: 0 });
  }
}
