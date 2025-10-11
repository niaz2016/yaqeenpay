import React from 'react';

interface ErrorBoundaryState { hasError: boolean; error?: any; }

/**
 * Generic React error boundary to prevent full blank screen when a child throws.
 * Shows a simple fallback with option to reload.
 */
export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // Log once globally for diagnostics
    console.error('[ErrorBoundary] Caught error:', error, info);
    if (typeof window !== 'undefined') {
      (window as any).__lastRenderError = { error, info, at: new Date().toISOString() };
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p style={{ color: '#666' }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button onClick={this.handleReload} style={{ marginTop: '1rem', padding: '0.6rem 1.2rem', cursor: 'pointer' }}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}
