import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Ligeirinho Hub]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="estado-central">
          <div className="card" style={{ maxWidth: 400 }}>
            <h2 style={{ margin: '0 0 0.5rem' }}>Algo deu errado</h2>
            <p style={{ color: 'var(--hub-muted)', margin: '0 0 1rem' }}>
              Tente recarregar a página.
            </p>
            <button
              type="button"
              className="btn"
              onClick={() => window.location.reload()}
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
