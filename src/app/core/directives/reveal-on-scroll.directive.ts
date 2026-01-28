import { AfterViewInit, Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { ensureGsap, prefersReducedMotion, ScrollTrigger, gsap } from '../utils/gsap';

@Directive({ selector: '[revealOnScroll]', standalone: true })
export class RevealOnScrollDirective implements AfterViewInit, OnDestroy {
  @Input() revealFrom: 'y' | 'x' = 'y';
  @Input() revealAmount = 28;
  @Input() revealDelay = 0;
  @Input() revealOnce = true;

  private trigger?: ScrollTrigger;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    ensureGsap();
    if (prefersReducedMotion()) return;

    const target = this.el.nativeElement;
    
    // Optimización mobile-first: no ocultar contenido inicialmente en móvil
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      gsap.set(target, { opacity: 0, [this.revealFrom]: this.revealAmount, filter: 'blur(6px)' } as any);
    } else {
      // En móvil: contenido visible por defecto, animación más sutil
      gsap.set(target, { opacity: 0.85, [this.revealFrom]: this.revealAmount * 0.3, filter: 'blur(2px)' } as any);
    }

    this.trigger = ScrollTrigger.create({
      trigger: target,
      start: 'top 86%',
      onEnter: () => {
        const duration = isMobile ? 0.6 : 0.95; // Más rápido en móvil
        const finalOpacity = isMobile ? 1 : 1;
        const finalFilter = isMobile ? 'blur(0px)' : 'blur(0px)';
        
        gsap.to(target, {
          opacity: finalOpacity,
          [this.revealFrom]: 0,
          filter: finalFilter,
          delay: this.revealDelay,
          duration: duration,
          ease: 'power3.out'
        } as any);
      },
      once: this.revealOnce
    });
  }

  ngOnDestroy(): void {
    this.trigger?.kill();
  }
}
