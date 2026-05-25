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
        <div className="estado-central card">
          <h2>Algo deu errado</h2>
          <p>Tente recarregar a página.</p>
          <button type="button" className="btn" onClick={() => window.location.reload()}>
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
