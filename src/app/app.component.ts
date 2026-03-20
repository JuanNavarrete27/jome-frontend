import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, signal, ChangeDetectionStrategy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ensureGsap, gsap, prefersReducedMotion } from './core/utils/gsap';
import { isMobile, shouldReduceEffects, getMobileInfo } from './core/utils/mobile';
import { BackgroundFxComponent } from './core/fx/bg-fx.component';
import { MagneticDirective } from './core/directives/magnetic.directive';
import { ScrollService } from './core/services/scroll.service';

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

  constructor(private scrollService: ScrollService) {}

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

  // ✅ BULLETPROOF synchronous navigation - NO MORE ASYNC ISSUES
  scrollTo(id: string): void {
    // Immediate execution without async/await complications
    try {
      this.scrollService.scrollToSection(id);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  scrollToHome(): void {
    // Direct home scroll without async complications
    try {
      this.scrollService.scrollToSection('home');
    } catch (error) {
      console.error('Home navigation error:', error);
    }
  }

  // Centralized WhatsApp configuration
  private readonly WHATSAPP_NUMBER = '59892454958';
  private readonly WHATSAPP_MESSAGE = encodeURIComponent(
    '¡Hola! Estoy interesado en sus servicios de desarrollo web. Me gustaría obtener más información.'
  );

  openWhatsApp(): void {
    window.open(`https://wa.me/${this.WHATSAPP_NUMBER}?text=${this.WHATSAPP_MESSAGE}`, '_blank');
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

  // ✅ BULLETPROOF mobile navigation - NO MORE ASYNC ISSUES
  async navigateAndClose(sectionId: string): Promise<void> {
    // Close menu first, then navigate
    try {
      this.closeMenu();
      // Small delay to ensure menu close animation
      await new Promise(resolve => setTimeout(resolve, 150));
      this.scrollService.scrollToSection(sectionId);
    } catch (error) {
      console.error('Mobile navigation error:', error);
    }
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
