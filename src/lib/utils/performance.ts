import type { Metric } from 'web-vitals';
import { logDebug } from './logger';

type WebVitalsModule = typeof import('web-vitals') & {
  onFID?: (onReport: (metric: Metric) => void) => void;
};

export interface PerformanceMetrics {
  CLS?: number;
  FID?: number;
  FCP?: number;
  LCP?: number;
  TTFB?: number;
  INP?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private reportCallback?: (metrics: PerformanceMetrics) => void;

  constructor() {
    if (typeof window === 'undefined') return;
    this.initializeMonitoring();
  }

  private async initializeMonitoring() {
    try {
      const webVitals = (await import('web-vitals')) as WebVitalsModule;

      // Only call functions that exist
      if (webVitals.onCLS) webVitals.onCLS(this.handleMetric.bind(this));
      if (webVitals.onFID) webVitals.onFID(this.handleMetric.bind(this));
      if (webVitals.onFCP) webVitals.onFCP(this.handleMetric.bind(this));
      if (webVitals.onLCP) webVitals.onLCP(this.handleMetric.bind(this));
      if (webVitals.onTTFB) webVitals.onTTFB(this.handleMetric.bind(this));
      if (webVitals.onINP) webVitals.onINP(this.handleMetric.bind(this));
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }

  private handleMetric(metric: Metric) {
    this.metrics[metric.name] = metric.value;

    // Log to console in development
    if (import.meta.env.DEV) {
      logDebug(`${metric.name}: ${metric.value.toFixed(2)}`);
    }

    // Report if callback is set
    if (this.reportCallback) {
      this.reportCallback(this.metrics);
    }
  }

  public setReportCallback(callback: (metrics: PerformanceMetrics) => void) {
    this.reportCallback = callback;
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public async reportToAnalytics() {
    const metrics = this.getMetrics();

    // Send to your analytics endpoint
    if (import.meta.env.PROD && Object.keys(metrics).length > 0) {
      try {
        await fetch('/api/analytics/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metrics,
            url: window.location.href,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
          }),
        });
      } catch (error) {
        console.error('Failed to report metrics:', error);
      }
    }
  }
}

// Singleton instance
let monitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitor) {
    monitor = new PerformanceMonitor();
  }
  return monitor;
}

// Resource loading optimization
export function preloadResource(href: string, as: 'script' | 'style' | 'font' | 'image') {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;

  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

export function prefetchResource(href: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

export function preconnectOrigin(origin: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// Bundle size analysis helper
export function measureBundleImpact(
  chunkName: string
): { sizeKB: number; loadTime: number } | undefined {
  if (typeof window === 'undefined' || !performance.getEntriesByType) return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const chunk = resources.find((r) => r.name.includes(chunkName));

  if (chunk) {
    const sizeKB = chunk.transferSize / 1024;
    const loadTime = chunk.responseEnd - chunk.startTime;

    logDebug('Bundle metrics', {
      chunk: chunkName,
      sizeKB: Number(sizeKB.toFixed(2)),
      loadTime: Number(loadTime.toFixed(2)),
    });

    return { sizeKB, loadTime };
  }

  return undefined;
}
