import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log error for debugging
    console.error('Error caught by boundary:', error, errorInfo);

    // Log to monitoring service if needed (e.g., Sentry)
    if (process.env.REACT_APP_SENTRY_DSN) {
      // Could integrate Sentry here
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p className="error-message">
              We're sorry for the inconvenience. The application encountered an error.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre>
                  <code>
                    {this.state.error && this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </code>
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button 
                onClick={this.handleReset}
                className="btn-primary"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="btn-secondary"
              >
                Go to Dashboard
              </button>
            </div>

            {this.state.errorCount > 3 && (
              <p className="error-warning">
                Multiple errors detected. Please refresh the page.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
