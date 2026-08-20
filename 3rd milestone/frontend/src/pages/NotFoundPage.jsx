import React from 'react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">404</h1>
      <h2 className="text-2xl font-bold text-white mt-4">Page Not Found</h2>
      <p className="text-gray-400 mt-2 mb-8 text-center max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <a href="/" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium">
        Go Back Home
      </a>
    </div>
  );
};

export default NotFoundPage;
