import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center glass-panel p-8 rounded-2xl max-w-sm">
        <Compass className="w-16 h-16 text-sky-400 mx-auto mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-sm text-slate-400 mb-6 font-sans">
          The requested page does not exist or has been moved.
        </p>
        <Link
          to="/login"
          className="inline-block py-2 px-6 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-all duration-150"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
