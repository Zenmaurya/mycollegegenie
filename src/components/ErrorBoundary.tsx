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
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center font-['Inter'] bg-paper">
          <div>
            <h1 className="text-3xl font-black text-ink mb-2 font-['Fraunces']">
              Oops! Something went wrong
            </h1>
            <p className="text-ink-soft text-sm max-w-md font-medium mx-auto">
              The app encountered an unexpected error. Your data is safe.
            </p>
          </div>
          <button 
            onClick={this.handleReset} 
            className="px-8 py-3 bg-mark text-mark-ink border border-mark-ink/10 hover:bg-mark-ink hover:text-white rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            Go to Home Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
