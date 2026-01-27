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
    gsap.set(target, { opacity: 0, [this.revealFrom]: this.revealAmount, filter: 'blur(6px)' } as any);

    this.trigger = ScrollTrigger.create({
      trigger: target,
      start: 'top 86%',
      onEnter: () => {
        gsap.to(target, {
          opacity: 1,
          [this.revealFrom]: 0,
          filter: 'blur(0px)',
          delay: this.revealDelay,
          duration: 0.95,
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
