import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, HostListener, OnDestroy, OnInit, signal, ChangeDetectionStrategy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ensureGsap, gsap, prefersReducedMotion } from '../../core/utils/gsap';
import { RevealOnScrollDirective } from '../../core/directives/reveal-on-scroll.directive';
import { MagneticDirective } from '../../core/directives/magnetic.directive';
import { TiltDirective } from '../../core/directives/tilt.directive';

type Service = {
  icon: string;
  title: string;
  desc: string;
  bullets: string[];
};

type Work = {
  tag: string;
  title: string;
  desc: string;
  metric: string;
  domain?: string;
  previewType: 'iframe' | 'video';
  videoUrl?: string;
};

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RevealOnScrollDirective, MagneticDirective, TiltDirective],
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {
  showreelOpen = signal(false);
  previewProject = signal<Work | null>(null);
  iframeError = signal(false);
  cursorX = signal(0.5);
  cursorY = signal(0.5);
  safeUrl = signal<SafeResourceUrl | null>(null);
  mixedContentError = signal(false);

  @ViewChild('modalPanel', { static: false }) modalPanel?: ElementRef<HTMLDivElement>;

  services: Service[] = [
    {
      icon: 'WEB',
      title: 'Web estática',
      desc: 'Páginas web profesionales con diseño personalizado y efectos visuales impactantes.',
      bullets: ['Diseño personalizado', 'Efectos y animaciones', 'Formulario de contacto', 'Botones a redes sociales', 'Precio: 300-500 USD', 'Plazo: 24-48 horas hábiles']
    },
    {
      icon: 'CODE',
      title: 'Web completa',
      desc: 'Soluciones web completas con frontend SPA, backend y base de datos para automatización.',
      bullets: ['Diseño exclusivo', 'Animaciones pro', 'Frontend SPA', 'Backend con servidor', 'Base de datos', 'Precio: 600-900 USD', 'Plazo: 7-10 días hábiles']
    },
    {
      icon: 'SYSTEM',
      title: 'Sistemas de gestión',
      desc: 'Desarrollo de sistemas SPA con enfoque clínico/profesional para gestión integral.',
      bullets: ['Tipo SPA', 'Enfoque clínico/profesional', 'Automatización de procesos', 'Plazo: 7-14 días hábiles']
    }
  ];

  works: Work[] = [
    { 
      tag: 'WEB COMPLETA', 
      title: 'donfrancisco.uy', 
      desc: 'Sitio web completo con frontend SPA, backend y base de datos para gestión integral.', 
      metric: 'Web completa',
      domain: 'https://donfrancisco.uy',
      previewType: 'iframe'
    },
    { 
      tag: 'WEB COMPLETA', 
      title: 'bentasca.com', 
      desc: 'Plataforma web profesional con animaciones avanzadas y sistema de gestión.', 
      metric: 'Web completa',
      domain: 'https://bentasca.com',
      previewType: 'iframe'
    },
    { 
      tag: 'WEB ESTÁTICA', 
      title: 'karenbentancor.com', 
      desc: 'Página web estática con diseño personalizado y efectos visuales impactantes.', 
      metric: 'Web estática',
      domain: 'https://karenbentancor.com',
      previewType: 'iframe'
    },
    { 
      tag: 'SISTEMA SPA', 
      title: 'servimel', 
      desc: 'Sistema de gestión clínico profesional tipo SPA con automatización de procesos.', 
      metric: 'Sistema de gestión',
      previewType: 'video',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Video demo placeholder
    }
  ];

  clients = [
    { name: 'Don Francisco', logo: 'assets/donfrancisco.svg' },
    { name: 'Bentasca', logo: 'assets/bentasca.svg' },
    { name: 'Karen Bentancor', logo: 'assets/karenbentancor.svg' },
    { name: 'Servimel', logo: 'assets/servimel.svg' }
  ];

  testimonials = [
    {
      name: 'Don Francisco',
      role: 'donfrancisco.uy',
      quote:
        'Excelente desarrollo web. Tienen nuestro sistema funcionando perfectamente con frontend SPA y backend robusto.'
    },
    {
      name: 'Bentasca',
      role: 'bentasca.com',
      quote: 'Nuestra plataforma web quedó profesional y funcional. Animaciones increíbles y sistema de gestión integral.'
    },
    {
      name: 'Karen Bentancor',
      role: 'karenbentancor.com',
      quote: 'Página web estática con diseño impactante. Rápida, moderna y exactamente lo que necesitábamos.'
    }
  ];

  contactForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    service: ['Web estática'],
    message: ['', [Validators.required, Validators.minLength(8)]]
  });

  sending = signal(false);
  sentOk = signal(false);
  mouseMoveThrottled = false;

  private heroTl?: gsap.core.Timeline;
  private previewTimeoutId: any = null;

  constructor(private fb: FormBuilder, private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef) {}

  // TrackBy functions for optimized *ngFor
  trackByService(index: number, service: Service): string {
    return service.title;
  }

  trackByWork(index: number, work: Work): string {
    return work.title;
  }

  trackByClient(index: number, client: { name: string; logo: string }): string {
    return client.name;
  }

  trackByBullet(index: number, bullet: string): string {
    return bullet;
  }

  trackByTestimonial(index: number, testimonial: { name: string }): string {
    return testimonial.name;
  }

  ngOnInit(): void {
    ensureGsap();
  }

  ngAfterViewInit(): void {
    if (prefersReducedMotion()) return;

    // HERO: optimized entrance animations
    this.heroTl = gsap
      .timeline({ defaults: { ease: 'power2.out' } })
      .fromTo(
        '.hero__kicker',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }
      )
      .fromTo(
        '.hero__title',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        '-=0.4'
      )
      .fromTo(
        '.hero__subtitle',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        '-=0.5'
      )
      .fromTo(
        '.hero__actions .btn',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.05 },
        '-=0.4'
      )
      .fromTo(
        '.hero__stats .stat',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.04 },
        '-=0.3'
      );

    // Simplified ambient effects
    gsap.to('.hero__glow', {
      opacity: 0.7,
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    // Reduced floating animations
    gsap.to('.shape--a', { y: -12, duration: 2.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.shape--b', { y: 16, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }

  ngOnDestroy(): void {
    this.heroTl?.kill();
    if (this.previewTimeoutId) clearTimeout(this.previewTimeoutId);
  }

  @HostListener('window:mousemove', ['$event'])
  onMouse(ev: MouseEvent): void {
    // Throttled mouse move for better performance
    if (!this.mouseMoveThrottled) {
      this.mouseMoveThrottled = true;
      this.cursorX.set(ev.clientX / Math.max(1, window.innerWidth));
      this.cursorY.set(ev.clientY / Math.max(1, window.innerHeight));
      
      setTimeout(() => {
        this.mouseMoveThrottled = false;
      }, 16); // ~60fps
    }
  }

  private animateModalIn(): void {
    // Forzar detección de cambios para asegurar que el modal esté en el DOM
    this.cdr.detectChanges();

    // Ejecutar GSAP después de que Angular renderice el modal
    queueMicrotask(() => {
      if (!prefersReducedMotion() && this.modalPanel?.nativeElement) {
        gsap.fromTo(
          this.modalPanel.nativeElement,
          { y: 22, opacity: 0, filter: 'blur(10px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.65, ease: 'power3.out' }
        );
      }
    });
  }

  openShowreel(): void {
    this.previewProject.set(null);
    this.iframeError.set(false);
    this.mixedContentError.set(false);
    this.safeUrl.set(null);
    this.showreelOpen.set(true);
    document.body.style.overflow = 'hidden';

    this.animateModalIn();
  }

  openPreview(project: Work): void {
    console.log('openPreview called with:', project);
    
    // Resetear estados
    this.previewProject.set(project);
    this.iframeError.set(false);
    this.mixedContentError.set(false);
    this.safeUrl.set(null);

    if (this.previewTimeoutId) clearTimeout(this.previewTimeoutId);
    
    // Manejar mixed content para HTTP
    if (project.domain?.startsWith('http://') && window.location.protocol === 'https:') {
      this.mixedContentError.set(true);
      this.iframeError.set(true);
    } else if (project.domain) {
      // Sanitizar la URL del iframe (NG0904 FIX)
      const sanitized = this.sanitizer.bypassSecurityTrustResourceUrl(project.domain);
      this.safeUrl.set(sanitized);
    }
    
    // Abrir modal
    this.showreelOpen.set(true);
    document.body.style.overflow = 'hidden';
    
    this.animateModalIn();
    
    // Timeout para detectar si el iframe no carga (solo para iframes)
    if (project.previewType === 'iframe' && !this.mixedContentError()) {
      this.previewTimeoutId = setTimeout(() => {
        if (this.previewProject()?.title === project.title) {
          this.iframeError.set(true);
        }
      }, 12000);
    }
  }

  closeShowreel(): void {
    this.previewProject.set(null);
    this.iframeError.set(false);
    this.mixedContentError.set(false);
    this.safeUrl.set(null);
    this.showreelOpen.set(false);
    document.body.style.overflow = '';

    if (this.previewTimeoutId) clearTimeout(this.previewTimeoutId);
  }

  onIframeLoad(): void {
    // El iframe se cargó correctamente
    this.iframeError.set(false);
    if (this.previewTimeoutId) clearTimeout(this.previewTimeoutId);
  }

  onIframeError(): void {
    this.iframeError.set(true);
    if (this.previewTimeoutId) clearTimeout(this.previewTimeoutId);
  }

  openInNewTab(url: string): void {
    window.open(url, '_blank');
  }

  getClientUrl(clientName: string): string {
    const urls: { [key: string]: string } = {
      'Don Francisco': 'https://donfrancisco.uy',
      'Bentasca': 'https://bentasca.com',
      'Karen Bentancor': 'https://karenbentancor.com',
      'Servimel': 'http://76.13.166.48/'
    };
    return urls[clientName] || '#';
  }

  highlightClient(clientName: string): void {
    // Resaltar todos los nombres del cliente en el marquee
    const elements = document.querySelectorAll(`[data-client="${clientName}"]`);
    elements.forEach(el => {
      (el as HTMLElement).style.textShadow = '0 0 20px rgba(30, 91, 255, 0.8), 0 0 40px rgba(30, 91, 255, 0.4)';
      (el as HTMLElement).style.color = '#1E5BFF';
    });
  }

  unhighlightClient(clientName: string): void {
    // Quitar resaltado de todos los nombres del cliente
    const elements = document.querySelectorAll(`[data-client="${clientName}"]`);
    elements.forEach(el => {
      (el as HTMLElement).style.textShadow = '';
      (el as HTMLElement).style.color = '';
    });
  }

  scrollToContact(): void {
    this.closeShowreel();
    setTimeout(() => {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async submit(): Promise<void> {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    this.sentOk.set(false);

    // TODO: conectar con backend real (mailer / CRM)
    await new Promise((r) => setTimeout(r, 950));

    this.sending.set(false);
    this.sentOk.set(true);
    this.contactForm.reset({ service: 'Web estática' });

    if (!prefersReducedMotion()) {
      gsap.fromTo(
        '.contact__success',
        { y: 10, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.75 }
      );
    }
  }
}
