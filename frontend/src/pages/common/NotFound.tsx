import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-sand-50 dark:bg-neutral-950 flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center mb-2">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 flex items-center justify-center p-2 shadow-sm">
            <img src={logoImg} alt="Pragya Connect" className="w-full h-full object-contain" />
          </div>
        </div>
        <div className="w-16 h-16 rounded-3xl bg-forest-600 dark:bg-gold-500 text-white dark:text-forest-900 font-extrabold text-2xl flex items-center justify-center mx-auto shadow-xl">
          404
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-extrabold text-3xl text-neutral-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            The page you are looking for has moved or does not exist in the Pragya knowledge realm.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-forest-600 hover:bg-forest-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-forest-900 transition-all flex items-center gap-2 shadow-md"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
