'use client';

import React, { useState } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Log error to monitoring service
    this.logError(error, errorInfo);
  }

  logError = (error: Error, errorInfo: any) => {
    // Send error to monitoring service
    try {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(() => {
        // Silently fail if logging fails
      });
    } catch (e) {
      // Silently fail
    }
  };

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
      <p className="text-gray-300 mb-6">
        We encountered an unexpected error. Don't worry, your data is safe.
      </p>
      
      <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
        <h3 className="text-white font-semibold mb-2">Error Details:</h3>
        <p className="text-red-400 text-sm font-mono break-all">
          {error.message}
        </p>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={resetError}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
        >
          Try Again
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
        >
          Reload Page
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
);

export default ErrorBoundary;
