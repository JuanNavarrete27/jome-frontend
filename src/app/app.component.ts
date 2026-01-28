import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, signal, ChangeDetectionStrategy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ensureGsap, gsap, prefersReducedMotion } from './core/utils/gsap';
import { isMobile, shouldReduceEffects, getMobileInfo } from './core/utils/mobile';
import { BackgroundFxComponent } from './core/fx/bg-fx.component';
import { MagneticDirective } from './core/directives/magnetic.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BackgroundFxComponent, MagneticDirective, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'jome';
  year = new Date().getFullYear();
  progress = signal(0);
  scrolled = signal(false);

  // Hamburger menu state
  menuOpen = signal(false);
  private menuRafId?: number;

  private rafId?: number;
  private progressRafPending = false;

  // Mobile detection cache
  private mobileInfo = getMobileInfo();

  ngOnInit(): void {
    ensureGsap();

    if (!prefersReducedMotion()) {
      gsap.fromTo(
        '.app-header',
        { y: -18, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.05, ease: 'power3.out', delay: 0.15 }
      );
    }

    // ✅ calcular una vez al inicio (sin loop infinito)
    this.updateProgressOnce();
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.menuRafId) cancelAnimationFrame(this.menuRafId);
    // Restaurar scroll por si quedó bloqueado
    document.body.style.overflow = '';
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 12);
    this.scheduleProgressUpdate();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.scheduleProgressUpdate();
  }

  @HostListener('window:orientationchange')
  onOrientationChange(): void {
    this.scheduleProgressUpdate();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Cerrar menú con Escape
    if (event.key === 'Escape' && this.menuOpen()) {
      this.closeMenu();
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouse(ev: MouseEvent): void {
    const mx = (ev.clientX / Math.max(1, window.innerWidth)) * 100;
    const my = (ev.clientY / Math.max(1, window.innerHeight)) * 100;
    document.documentElement.style.setProperty('--mx', mx + '%');
    document.documentElement.style.setProperty('--my', my + '%');
  }

  scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;

    if (!window.gsap) {
      window.scrollTo({ top: el.offsetTop - 86, behavior: 'smooth' });
      return;
    }

    if (prefersReducedMotion()) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    gsap.to(window, {
      duration: 1.05,
      scrollTo: { y: el, offsetY: 86 },
      ease: 'power3.out'
    });
  }

  openWhatsApp(): void {
    const message = encodeURIComponent(
      '¡Hola! Estoy interesado en sus servicios de desarrollo web. Me gustaría obtener más información.'
    );
    const phoneNumber = '5491123456789'; // Reemplazar con número real
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  }

  // =========================
  // ✅ Hamburger Menu Logic
  // =========================
  toggleMenu(): void {
    if (this.menuOpen()) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu(): void {
    this.menuOpen.set(true);
    
    // Bloquear scroll del body en móvil
    if (this.mobileInfo.isMobile) {
      document.body.style.overflow = 'hidden';
    }
    
    // Focus al primer link para accesibilidad
    this.menuRafId = requestAnimationFrame(() => {
      const firstLink = document.querySelector('.mobile-nav__link') as HTMLElement;
      firstLink?.focus();
    });
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    
    // Restaurar scroll
    document.body.style.overflow = '';
    
    if (this.menuRafId) {
      cancelAnimationFrame(this.menuRafId);
      this.menuRafId = undefined;
    }
  }

  navigateAndClose(sectionId: string): void {
    this.scrollTo(sectionId);
    this.closeMenu();
  }

  // Getters para template
  get isMobileDevice(): boolean {
    return this.mobileInfo.isMobile;
  }

  get showHamburger(): boolean {
    return this.mobileInfo.isSmallScreen; // ≤768px
  }

  // =========================
  // ✅ Progress bar sin loop infinito
  // =========================
  private scheduleProgressUpdate(): void {
    if (this.progressRafPending) return;
    this.progressRafPending = true;

    this.rafId = requestAnimationFrame(() => {
      this.progressRafPending = false;
      this.updateProgressOnce();
    });
  }

  private updateProgressOnce(): void {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const p = scrollHeight > 0 ? Math.min(1, Math.max(0, scrollTop / scrollHeight)) : 0;
    this.progress.set(p);
  }
}
