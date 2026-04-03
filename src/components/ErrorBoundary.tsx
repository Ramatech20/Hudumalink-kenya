import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Firestore ${parsed.operationType} error: ${parsed.error}`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center p-4 transition-colors">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 dark:border-neutral-800 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Something went wrong</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              {isFirestoreError ? "Our database encountered an issue. This might be due to permissions or a temporary connection problem." : "We've encountered an unexpected error. Our team has been notified."}
            </p>
            
            <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl mb-8 text-left overflow-hidden">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Error Details</p>
              <p className="text-xs font-mono text-red-600 dark:text-red-400 break-words">
                {errorMessage}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              <a
                href="/"
                className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all"
              >
                <Home className="w-5 h-5" />
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
