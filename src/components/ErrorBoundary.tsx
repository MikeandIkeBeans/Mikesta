import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by Mikesta ErrorBoundary:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleReset = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            minHeight: '100vh',
            padding: 24,
            background: 'var(--paper, #f7f8f5)',
            color: 'var(--ink, #182523)',
            fontFamily: "'Manrope', sans-serif",
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              background: '#fff',
              padding: '36px 30px',
              borderRadius: 18,
              border: '1px solid var(--line, #e2e7e1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: '#fbeae8',
                color: '#ad4938',
                display: 'grid',
                placeItems: 'center',
                fontSize: 22,
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" />
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: 20, letterSpacing: '-0.04em' }}>
              Something interrupted this moment
            </h2>

            <p style={{ color: 'var(--muted, #73807b)', fontSize: 13, margin: '0 0 20px' }}>
              Mikesta encountered an unexpected issue. Don't worry, your local moments are preserved.
            </p>

            {this.state.error?.message && (
              <pre
                style={{
                  background: '#f4f6f2',
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 11,
                  textAlign: 'left',
                  overflowX: 'auto',
                  margin: '0 0 20px',
                  fontFamily: 'monospace',
                }}
              >
                {this.state.error.message}
              </pre>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  background: 'var(--accent, #e76f51)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 12,
                  border: 0,
                  cursor: 'pointer',
                }}
              >
                Reload application
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: '1px solid var(--line, #e2e7e1)',
                  background: 'transparent',
                  color: 'var(--ink, #182523)',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Reset cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
