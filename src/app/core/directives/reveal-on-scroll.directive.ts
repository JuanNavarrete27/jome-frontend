import { AfterViewInit, Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { ensureGsap, prefersReducedMotion, ScrollTrigger, gsap } from '../utils/gsap';
import { shouldReduceEffects, isMobile } from '../utils/mobile';

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
    const isMobileDevice = isMobile();
    const reduceEffects = shouldReduceEffects();
    
    // PROGRESSIVE ENHANCEMENT: contenido visible por defecto
    // Solo ocultar elementos decorativos, nunca contenido crítico
    const isHeroContent = !!target.closest('.hero__copy, .hero__actions, .hero__stats');
    
    if (isHeroContent) {
      // Contenido del hero: siempre visible, animación sutil solo en desktop
      if (!isMobileDevice) {
        gsap.set(target, { opacity: 0.96, y: 8 });
      } else {
        gsap.set(target, { opacity: 1, y: 0 });
      }
    } else {
      // Elementos decorativos: animación ultra-lite en móvil
      if (!isMobileDevice) {
        gsap.set(target, {
          opacity: 0.85,
          [this.revealFrom]: this.revealAmount * 0.6,
          filter: 'blur(3px)'
        } as any);
      } else {
        // ✅ Mobile: sin blur, opacity casi visible, movimiento mínimo
        gsap.set(target, {
          opacity: 0.96,
          [this.revealFrom]: this.revealAmount * 0.2
          // Sin filter: blur() en móvil
        } as any);
      }
    }

    // Si ScrollTrigger falla -> fallback visible
    try {
      this.trigger = ScrollTrigger.create({
        trigger: target,
        start: isHeroContent ? 'top 100%' : 'top 86%',
        onEnter: () => {
          if (isHeroContent) {
            // Hero: animación ultra rápida
            gsap.to(target, {
              opacity: 1,
              y: 0,
              duration: isMobileDevice ? 0.18 : 0.28,
              ease: 'power1.out'
            });
          } else {
            // Decorativos: animación adaptada
            gsap.to(target, {
              opacity: 1,
              [this.revealFrom]: 0,
              filter: isMobileDevice ? 'none' : 'blur(0px)',
              delay: this.revealDelay,
              duration: isMobileDevice ? 0.28 : 0.65,
              ease: 'power2.out'
            } as any);
          }
        },
        once: this.revealOnce
      });
    } catch {
      // Fallback: visible y listo
      gsap.set(target, { opacity: 1, x: 0, y: 0, filter: 'none' } as any);
    }
  }

  ngOnDestroy(): void {
    this.trigger?.kill();
  }
}
