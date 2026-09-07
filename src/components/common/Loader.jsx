import React from 'react';
import { ClipLoader } from 'react-spinners';

const Loader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <ClipLoader color="#3B82F6" size={50} />
    </div>
  );
};

export default Loader;
