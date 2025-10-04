import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-gray-100 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Something went wrong.
          </h2>
          <p className="mb-4">
            We've encountered an error while loading this component.
          </p>
          <details className="bg-gray-200 p-4 rounded mb-4">
            <summary className="cursor-pointer font-semibold">
              Error details
            </summary>
            <p className="mt-2 text-red-700 whitespace-pre-wrap">
              {this.state.error && this.state.error.toString()}
            </p>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap overflow-auto max-h-[300px]">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </p>
          </details>
          <button
            className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
