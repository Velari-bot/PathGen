'use client';

import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  networkLatency?: number;
}

interface PerformanceMonitorProps {
  componentName: string;
  children: React.ReactNode;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  componentName, 
  children 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    
    // Monitor component render time
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes(componentName)) {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration,
            loadTime: performance.now() - startTime
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['measure', 'navigation'] });

    // Monitor memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
      }));
    }

    // Log performance metrics
    const logMetrics = () => {
      if (metrics) {
        fetch('/api/log-performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            componentName,
            metrics,
            timestamp: new Date().toISOString(),
            url: window.location.href
          })
        }).catch(() => {
          // Silently fail if logging fails
        });
      }
    };

    const timeoutId = setTimeout(logMetrics, 1000);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [componentName, metrics]);

  return <>{children}</>;
};

// Hook for monitoring API call performance
export const useAPIPerformance = () => {
  const [metrics, setMetrics] = useState<Record<string, number>>({});

  const measureAPICall = async <T>(
    apiCall: () => Promise<T>,
    callName: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setMetrics(prev => ({ ...prev, [callName]: duration }));
      
      // Log slow API calls
      if (duration > 2000) { // 2 seconds
        fetch('/api/log-performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            componentName: 'API_CALL',
            metrics: { [callName]: duration },
            timestamp: new Date().toISOString(),
            url: window.location.href,
            slowCall: true
          })
        }).catch(() => {});
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log failed API calls
      fetch('/api/log-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentName: 'API_CALL_FAILED',
          metrics: { [callName]: duration },
          timestamp: new Date().toISOString(),
          url: window.location.href,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }).catch(() => {});
      
      throw error;
    }
  };

  return { metrics, measureAPICall };
};

export default PerformanceMonitor;
