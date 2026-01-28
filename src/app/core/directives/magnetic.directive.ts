import { AfterViewInit, Directive, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';
import { ensureGsap, prefersReducedMotion, gsap } from '../utils/gsap';

@Directive({ selector: '[magnetic]', standalone: true })
export class MagneticDirective implements AfterViewInit, OnDestroy {
  @Input() magneticStrength = 0.22;
  private rect?: DOMRect;
  private rafId?: number;
  private lastX = 0;
  private lastY = 0;

  private disabled = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    ensureGsap();
    // ✅ en touch/coarse pointer no aplicamos magnetic
    this.disabled = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    this.rect = this.el.nativeElement.getBoundingClientRect();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.rect = this.el.nativeElement.getBoundingClientRect();
  }

  @HostListener('mousemove', ['$event'])
  onMove(ev: MouseEvent): void {
    if (this.disabled) return;
    if (prefersReducedMotion()) return;
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
