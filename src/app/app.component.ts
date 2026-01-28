import { Component, HostListener, OnDestroy, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ensureGsap, gsap, prefersReducedMotion } from './core/utils/gsap';
import { BackgroundFxComponent } from './core/fx/bg-fx.component';
import { MagneticDirective } from './core/directives/magnetic.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BackgroundFxComponent, MagneticDirective],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  year = new Date().getFullYear();
  progress = signal(0);
  scrolled = signal(false);

  private rafId?: number;
  private progressRafPending = false;

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
