import React from 'react';
import { Shield, FileText } from 'lucide-react';

export const Legal: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-forest-600 via-forest-700 to-forest-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
            <Shield className="w-3.5 h-3.5" />
            Legal & Compliance
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">
            Privacy Policy & Terms of Service
          </h1>
          <p className="text-forest-100/80 text-xs sm:text-sm">
            Pragya Connect is committed to safeguarding community data and respectful spiritual learning.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-6 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-forest-600 dark:text-gold-400" />
            1. Terms of Service
          </h2>
          <p>
            By accessing Pragya Connect, you agree to abide by our code of mutual respect, mindful interaction, and intellectual honesty. Community members and mentors are expected to uphold ethical learning standards.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-forest-600 dark:text-gold-400" />
            2. Privacy & Data Protection
          </h2>
          <p>
            We collect only necessary information required to maintain your learning profile and connect you with mentors. We do not sell your personal data to third parties. All password credentials are cryptographically encrypted using industry-standard salted hashes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-forest-600 dark:text-gold-400" />
            3. Mentorship & Health Guidance Disclaimer
          </h2>
          <p>
            Insights shared by mentors and community members in Ayurveda, nutrition, and yoga are for educational purposes and personal well-being. They do not substitute professional medical diagnosis or clinical treatment.
          </p>
        </section>
      </div>
    </div>
  );
};
