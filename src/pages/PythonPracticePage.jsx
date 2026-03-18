import React from 'react';

// Use lazy loading to avoid initialization issues
const EnhancedPythonEditor = React.lazy(() => import('../components/python/EnhancedPythonEditor'));

const PythonPracticePage = () => {
  return (
    <React.Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white">Loading Python Editor...</p>
        </div>
      </div>
    }>
      <EnhancedPythonEditor />
    </React.Suspense>
  );
};

export default PythonPracticePage;
