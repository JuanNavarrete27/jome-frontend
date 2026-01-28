import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { prefersReducedMotion } from '../utils/gsap';
import { isMobile } from '../utils/mobile';

@Directive({ selector: '[tilt]', standalone: true })
export class TiltDirective {
  @Input() tiltMax = 9;
  @Input() tiltPerspective = 900;

  private disabled = false;

  constructor(private el: ElementRef<HTMLElement>) {
    // ✅ Permitir tilt ligero en móvil (no deshabilitar completamente)
    this.disabled = false;
  }

  @HostListener('mousemove', ['$event'])
  onMove(ev: MouseEvent): void {
    if (this.disabled) return;
    if (prefersReducedMotion()) return;

    const target = this.el.nativeElement;
    const rect = target.getBoundingClientRect();
    const isMobileDevice = isMobile();

    const px = (ev.clientX - rect.left) / rect.width;
    const py = (ev.clientY - rect.top) / rect.height;

    // ✅ Reducir intensidad en móvil pero permitir movimiento
    const mobileMultiplier = isMobileDevice ? 0.3 : 1;
    const adjustedMax = this.tiltMax * mobileMultiplier;
    
    const rx = (py - 0.5) * -adjustedMax;
    const ry = (px - 0.5) * adjustedMax;

    target.style.transform = `perspective(${this.tiltPerspective}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }

  @HostListener('mouseleave')
  onLeave(): void {
    this.el.nativeElement.style.transform = `perspective(${this.tiltPerspective}px) rotateX(0deg) rotateY(0deg)`;
  }
}
