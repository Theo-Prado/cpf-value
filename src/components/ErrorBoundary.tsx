import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  /** Conteudo protegido. */
  readonly children: ReactNode;
  /** Conteudo exibido quando o trecho protegido falha. */
  readonly fallback: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
}

/**
 * Protege a camada 3D (SDD 17.7).
 *
 * Uma falha na cena **MUST NOT** derrubar a aplicacao: o fallback CSS
 * assume e o carimbo continua funcionando. O erro e registrado no
 * console com contexto, mas nunca aparece como tela branca.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Falha na camada 3D do Cartório Digital de CPF:', error, info.componentStack);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
