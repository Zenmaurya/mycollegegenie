// @ts-nocheck
/* eslint-disable */
/**
 * Global Error Boundary — catches all React component errors and shows a friendly fallback.
 * Must be a class component — getDerivedStateFromError requires it.
 * @ts-nocheck used because TypeScript strict mode has issues with class field inference
 * in this project's tsconfig, but the runtime behavior is correct.
 */
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '24px',
          padding: '24px', textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
        }}>
          <div style={{ fontSize: '72px' }}>😵</div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1f2937', marginBottom: '8px' }}>
              Oops! Something went wrong
            </h1>
            <p style={{ color: '#6b7280', fontSize: '15px', maxWidth: '400px', fontWeight: 500 }}>
              The app encountered an unexpected error. Your data is safe.
            </p>
            {isDev && this.state.error && (
              <pre style={{
                marginTop: '16px', padding: '12px', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: '8px', fontSize: '11px',
                color: '#991b1b', textAlign: 'left', maxWidth: '600px', overflowX: 'auto',
              }}>
                {String(this.state.error)}
              </pre>
            )}
          </div>
          <button onClick={this.handleReset} style={{
            padding: '12px 32px', background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
            color: 'white', border: 'none', borderRadius: '16px', fontSize: '15px',
            fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
          }}>
            Go to Home Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
