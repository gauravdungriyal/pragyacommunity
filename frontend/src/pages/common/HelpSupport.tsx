import React, { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  CheckCircle
} from 'lucide-react';

export const HelpSupport: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketSent, setTicketSent] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const faqs = [
    {
      q: 'How do I book a 1-on-1 session with a Mentor or Guru?',
      a: 'Navigate to the "Mentors & Gurus" page from the sidebar. You can filter by domain (e.g., Yoga, Ayurveda, Meditation) and click "Book Slot" to choose your preferred date, time, and session format.',
    },
    {
      q: 'Are the live workshops and webinars free to attend?',
      a: 'Yes, all Pragya Connect community workshops and webinars are complimentary for registered community members. Simply click "Register Now" on any event card.',
    },
    {
      q: 'How can I apply to become a certified Mentor on Pragya Connect?',
      a: 'During registration, choose the "Mentor / Guru" role. Our editorial team will review your qualifications and enable your mentor profile on the public directory.',
    },
    {
      q: 'How do I download reference guides from the Digital Library?',
      a: 'Open the "Knowledge Hub" tab, filter by your topic of interest, and click "Access Resource" to view or download high-resolution PDFs and study materials.',
    },
  ];

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    setTicketSent(true);
    setSubject('');
    setMessage('');
    setTimeout(() => setTicketSent(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-forest-600 via-forest-700 to-forest-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
            <HelpCircle className="w-3.5 h-3.5" />
            Support & Guidance
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">
            Help Center & FAQ
          </h1>
          <p className="text-forest-100/80 text-xs sm:text-sm">
            Find answers to common questions or reach out directly to the Pragya support team.
          </p>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-4">
        <h2 className="font-display font-bold text-lg text-neutral-900 dark:text-white">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3 pt-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-sand-200 dark:border-neutral-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center justify-between gap-4 hover:bg-sand-50 dark:hover:bg-neutral-800/60 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gold-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-sand-100 dark:border-neutral-800/60 bg-sand-50/40 dark:bg-neutral-800/20">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Help Ticket */}
      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-4">
        <h2 className="font-display font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-forest-600 dark:text-forest-400" />
          Submit a Support Inquiry
        </h2>

        {ticketSent && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Your ticket has been received. Our team will contact you within 24 hours.
          </div>
        )}

        <form onSubmit={handleTicketSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="E.g., Assistance with Mentor session scheduling"
              className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Message Details
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your question or issue in detail..."
              className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 font-medium resize-none"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl font-bold text-xs bg-forest-600 hover:bg-forest-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-forest-900 shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Send Support Message
          </button>
        </form>
      </div>
    </div>
  );
};
