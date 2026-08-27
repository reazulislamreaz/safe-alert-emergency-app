import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

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
    console.error('Safety Circle UI Caught Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-lg mx-auto my-12 bg-white border border-red-200 rounded-2xl shadow-xl text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            Display Error Recovered
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {this.state.error?.message || 'An error occurred while rendering this view.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reload View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
