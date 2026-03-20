import { Injectable } from '@angular/core';
import { ensureGsap, gsap, prefersReducedMotion } from '../utils/gsap';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {
  private headerOffset = 86;
  private isInitialized = false;
  private sectionRegistry = new Set<string>();
  private retryAttempts = new Map<string, number>();

  constructor() {
    this.init();
  }

  private init(): void {
    // Ensure GSAP is loaded
    ensureGsap();
    
    // Immediate initialization
    this.isInitialized = true;
    
    // Register sections immediately
    this.registerExistingSections();
  }

  registerExistingSections(): void {
    // Register all sections that exist right now
    const sectionIds = ['home', 'services', 'work', 'clients', 'process', 'contact'];
    sectionIds.forEach(id => {
      if (document.getElementById(id)) {
        this.sectionRegistry.add(id);
      }
    });
  }

  // BULLETPROOF: Immediate scroll without waiting
  scrollToSection(sectionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Immediate scroll attempt
        this.performScroll(sectionId);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private performScroll(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (!element) {
      console.warn(`Section with ID "${sectionId}" not found`);
      return;
    }

    // Close mobile menu if open
    const mobileNav = document.querySelector('.mobile-nav--open');
    if (mobileNav) {
      const closeBtn = document.querySelector('.mobile-nav__close') as HTMLElement;
      closeBtn?.click();
    }

    // Smooth scroll with proper offset
    if (!window.gsap) {
      window.scrollTo({ top: element.offsetTop - this.headerOffset, behavior: 'smooth' });
      return;
    }

    if (prefersReducedMotion()) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      return;
    }

    // GSAP premium smooth scroll
    gsap.to(window, {
      duration: 1.2,
      scrollTo: {
        y: element,
        offsetY: this.headerOffset,
        autoKill: false
      },
      ease: 'power3.inOut'
    });
  }

  scrollToTop(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.performScrollTop();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private performScrollTop(): void {
    // Close mobile menu if open
    const mobileNav = document.querySelector('.mobile-nav--open');
    if (mobileNav) {
      const closeBtn = document.querySelector('.mobile-nav__close') as HTMLElement;
      closeBtn?.click();
    }

    if (!window.gsap) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (prefersReducedMotion()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // GSAP premium smooth scroll
    gsap.to(window, {
      duration: 1.2,
      scrollTo: { y: 0, autoKill: false },
      ease: 'power3.inOut'
    });
  }

  // Update header offset for responsive
  updateHeaderOffset(offset: number): void {
    this.headerOffset = offset;
  }
}
