import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '520px',
            background: '#1e293b',
            padding: '2rem',
            borderRadius: '1rem',
            border: '1px solid #334155',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.75rem' }}>
              Beklenmeyen Bir Hata Oluştu
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Uygulama çalışırken bir hata meydana geldi. Sayfayı yenileyerek işlemi tekrarlayabilirsiniz.
            </p>
            {this.state.error?.message && (
              <pre style={{
                background: '#090d16',
                color: '#f87171',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '1.5rem',
                maxHeight: '150px'
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#f59e0b',
                color: '#0f172a',
                border: 'none',
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
