/**
 * Mobile Detection Utility
 * Detección confiable de móvil/touch con múltiples estrategias
 */

export interface MobileInfo {
  isMobile: boolean;
  isTouch: boolean;
  isCoarsePointer: boolean;
  isSmallScreen: boolean;
  shouldReduceEffects: boolean;
}

let mobileCache: MobileInfo | null = null;

export function getMobileInfo(): MobileInfo {
  if (mobileCache) return mobileCache;

  const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const isSmallScreen = window.innerWidth <= 768;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Consideramos móvil si tiene pointer coarse O pantalla pequeña O touch
  const isMobile = isCoarsePointer || isSmallScreen || isTouch;
  
  // Reducir efectos en móvil o con Save-Data
  const saveData = (navigator as any)?.connection?.saveData === true;
  const shouldReduceEffects = isMobile || saveData;

  mobileCache = {
    isMobile,
    isTouch,
    isCoarsePointer,
    isSmallScreen,
    shouldReduceEffects
  };

  return mobileCache;
}

export function isMobile(): boolean {
  return getMobileInfo().isMobile;
}

export function shouldReduceEffects(): boolean {
  return getMobileInfo().shouldReduceEffects;
}

export function isCoarsePointer(): boolean {
  return getMobileInfo().isCoarsePointer;
}

// Listener para cambios (ej: rotación, resize)
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    mobileCache = null; // Invalidar cache
  });
  
  // Escuchar cambios en media queries
  if (window.matchMedia) {
    const mq = window.matchMedia('(pointer: coarse)');
    mq.addEventListener?.('change', () => {
      mobileCache = null;
    });
  }
}
