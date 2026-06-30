import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: 'var(--text-bright)', marginBottom: 8 }}>Something went wrong on this page</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 420, marginBottom: 8, fontSize: '0.875rem' }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={this.handleReset}>Try Again</button>
            <button className="btn btn-primary" onClick={() => window.location.href = '/'}>Go to Dashboard</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}