import { Injectable, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type Project = {
  tag: string;
  title: string;
  desc: string;
  metric: string;
  domain?: string;
  previewType: 'iframe' | 'video';
  videoUrl?: string;
};

@Injectable({
  providedIn: 'root'
})
export class PreviewModalService {
  isOpen = signal(false);
  project = signal<Project | null>(null);
  iframeError = signal(false);
  previewLoading = signal(false);
  mixedContentError = signal(false);
  safeUrl = signal<SafeResourceUrl | null>(null);
  safeVideoUrl = signal<SafeResourceUrl | null>(null);
  
  private previewTimeoutId: any = null;

  constructor(private sanitizer: DomSanitizer) {}

  open(project: Project): void {
    // Resetear estados
    this.project.set(project);
    this.iframeError.set(false);
    this.mixedContentError.set(false);
    this.safeUrl.set(null);
    this.safeVideoUrl.set(null);
    this.previewLoading.set(project.previewType === 'iframe');

    if (this.previewTimeoutId) clearTimeout(this.previewTimeoutId);
    
    // Manejar mixed content para HTTP
    if (project.domain?.startsWith('http://') && window.location.protocol === 'https:') {
      this.mixedContentError.set(true);
      this.previewLoading.set(false);
      this.iframeError.set(true);
    } else if (project.domain) {
      // Sanitizar la URL del iframe
      const sanitized = this.sanitizer.bypassSecurityTrustResourceUrl(project.domain);
      this.safeUrl.set(sanitized);
    } else if (project.videoUrl) {
      // Sanitizar la URL del video
      const sanitizedVideo = this.sanitizer.bypassSecurityTrustResourceUrl(project.videoUrl);
      this.safeVideoUrl.set(sanitizedVideo);
    }
    
    // Abrir modal y bloquear scroll
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';
    
    // Timeout para detectar si el iframe no carga
    if (project.previewType === 'iframe' && !this.mixedContentError()) {
      this.previewTimeoutId = setTimeout(() => {
        if (this.project()?.title === project.title) {
          this.previewLoading.set(false);
          this.iframeError.set(true);
        }
      }, 12000);
    }
  }

  openPortfolio(): void {
    this.project.set(null);
    this.iframeError.set(false);
    this.previewLoading.set(false);
    this.mixedContentError.set(false);
    this.safeUrl.set(null);
    this.safeVideoUrl.set(null);
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.project.set(null);
    this.iframeError.set(false);
    this.previewLoading.set(false);
    this.mixedContentError.set(false);
    this.safeUrl.set(null);
    this.safeVideoUrl.set(null);
    this.isOpen.set(false);
    document.body.style.overflow = '';

    if (this.previewTimeoutId) clearTimeout(this.previewTimeoutId);
  }

  onIframeLoad(): void {
    this.previewLoading.set(false);
    this.iframeError.set(false);
    if (this.previewTimeoutId) clearTimeout(this.previewTimeoutId);
  }

  openInNewTab(): void {
    const domain = this.project()?.domain;
    if (domain) {
      window.open(domain, '_blank');
    }
  }
}
