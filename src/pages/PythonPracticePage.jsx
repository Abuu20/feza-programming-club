import React from 'react';
import EnhancedPythonEditor from '../components/python/EnhancedPythonEditor';
import SEO from '../components/common/SEO';

const PythonPracticePage = () => {
  return (
    <>
      <SEO
        title="Code Lab"
        description="Practice Python right in your browser with the Feza Programming Club Code Lab — no installation needed."
        path="/python-practice"
      />
      <EnhancedPythonEditor />
    </>
  );
};

export default PythonPracticePage;
