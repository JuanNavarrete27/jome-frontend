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
    const isMobile = window.matchMedia?.('(pointer: coarse)').matches ?? (window.innerWidth <= 768);

    const isHeroContent = !!target.closest('.hero__copy, .hero__actions, .hero__stats');

    // ✅ Progressive enhancement:
    // - En mobile: NUNCA blur (caro y si falla trigger queda feo)
    // - Hero: casi sin ocultar
    if (isHeroContent) {
      if (!isMobile) {
        gsap.set(target, { opacity: 0.96, y: 8 });
      } else {
        gsap.set(target, { opacity: 1, y: 0 });
      }
    } else {
      if (!isMobile) {
        gsap.set(target, {
          opacity: 0.85,
          [this.revealFrom]: this.revealAmount * 0.6,
          filter: 'blur(3px)'
        } as any);
      } else {
        gsap.set(target, {
          opacity: 0.96,
          [this.revealFrom]: this.revealAmount * 0.2
          // ✅ sin blur
        } as any);
      }
    }

    // ✅ Si ScrollTrigger falla por cualquier motivo -> no dejes nada “a medio estado”
    try {
      this.trigger = ScrollTrigger.create({
        trigger: target,
        start: isHeroContent ? 'top 100%' : 'top 86%',
        onEnter: () => {
          if (isHeroContent) {
            gsap.to(target, {
              opacity: 1,
              y: 0,
              duration: isMobile ? 0.18 : 0.28,
              ease: 'power1.out'
            });
          } else {
            gsap.to(target, {
              opacity: 1,
              [this.revealFrom]: 0,
              filter: isMobile ? 'none' : 'blur(0px)',
              delay: this.revealDelay,
              duration: isMobile ? 0.28 : 0.65,
              ease: 'power2.out'
            } as any);
          }
        },
        once: this.revealOnce
      });
    } catch {
      // fallback: visible y listo
      gsap.set(target, { opacity: 1, x: 0, y: 0, filter: 'none' } as any);
    }
  }

  ngOnDestroy(): void {
    this.trigger?.kill();
  }
}
