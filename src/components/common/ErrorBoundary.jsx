import React from 'react';

class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('File manager render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-gray-50">
          <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Unable to display this folder</h2>
            <p className="mt-2 text-sm text-gray-600">
              The folder data contains an item the app cannot display yet.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="mt-5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
