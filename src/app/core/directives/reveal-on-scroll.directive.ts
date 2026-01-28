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
    
    // PROGRESSIVE ENHANCEMENT: contenido visible por defecto
    // Solo ocultar elementos decorativos, nunca contenido crítico
    const isHeroContent = target.closest('.hero__copy, .hero__actions, .hero__stats');
    const isMobile = window.innerWidth <= 768;
    
    if (isHeroContent) {
      // Contenido del hero: siempre visible, animación sutil solo en desktop
      if (!isMobile) {
        gsap.set(target, { opacity: 0.95, y: 8 }); // Movimiento mínimo, casi visible
      }
    } else {
      // Elementos decorativos: animación normal pero menos agresiva
      if (!isMobile) {
        gsap.set(target, { opacity: 0.8, [this.revealFrom]: this.revealAmount * 0.6, filter: 'blur(3px)' } as any);
      } else {
        gsap.set(target, { opacity: 0.9, [this.revealFrom]: this.revealAmount * 0.2, filter: 'blur(1px)' } as any);
      }
    }

    this.trigger = ScrollTrigger.create({
      trigger: target,
      start: isHeroContent ? 'top 100%' : 'top 86%', // Hero anima inmediatamente
      onEnter: () => {
        if (isHeroContent) {
          // Hero: animación ultra rápida y sutil
          gsap.to(target, {
            opacity: 1,
            y: 0,
            duration: isMobile ? 0.2 : 0.3,
            ease: 'power1.out'
          });
        } else {
          // Decorativos: animación normal
          const duration = isMobile ? 0.4 : 0.7;
          gsap.to(target, {
            opacity: 1,
            [this.revealFrom]: 0,
            filter: 'blur(0px)',
            delay: this.revealDelay,
            duration: duration,
            ease: 'power2.out'
          } as any);
        }
      },
      once: this.revealOnce
    });
  }

  ngOnDestroy(): void {
    this.trigger?.kill();
  }
}
