import React from 'react';

/**
 * Shown while a lazily-loaded page chunk is downloading.
 */
export const PageLoader: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="min-h-[60vh] flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="w-9 h-9 border-4 border-forest-600 border-t-gold-500 rounded-full animate-spin" />
      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{label}</p>
    </div>
  </div>
);

/**
 * Neutral placeholder block used while a dashboard panel's data is in flight.
 */
export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = 'h-24' }) => (
  <div
    className={`animate-pulse rounded-2xl bg-sand-100 dark:bg-neutral-800/60 ${className}`}
    aria-hidden="true"
  />
);
