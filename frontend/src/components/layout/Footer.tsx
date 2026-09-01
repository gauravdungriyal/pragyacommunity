import React from 'react';
import { Link } from 'react-router-dom';

/**
 * A single-row footer. It stays out of the way of the app content and
 * collapses to two short lines on small screens.
 */
export const Footer: React.FC = () => (
  <footer className="mt-auto border-t border-sand-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
      <p className="text-neutral-500 dark:text-neutral-400 text-center sm:text-left">
        © {new Date().getFullYear()} Pragya Connect
      </p>

      <nav className="flex items-center gap-4">
        <Link to="/help" className="text-neutral-500 dark:text-neutral-400 hover:text-forest-700 dark:hover:text-gold-400 transition-colors">
          Help
        </Link>
        <Link to="/legal" className="text-neutral-500 dark:text-neutral-400 hover:text-forest-700 dark:hover:text-gold-400 transition-colors">
          Privacy & Terms
        </Link>
        <a
          href="mailto:support@pragya-yog.com"
          className="text-neutral-500 dark:text-neutral-400 hover:text-forest-700 dark:hover:text-gold-400 transition-colors"
        >
          Contact
        </a>
      </nav>
    </div>
  </footer>
);
