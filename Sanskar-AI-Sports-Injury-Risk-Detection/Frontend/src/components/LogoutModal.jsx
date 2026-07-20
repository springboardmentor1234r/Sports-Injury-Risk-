import React, { useEffect, useRef } from 'react';

/**
 * LogoutModal
 * A confirmation dialog shown before signing the user out.
 *
 * Props:
 *  isOpen    – boolean  – whether the modal is visible
 *  onCancel  – fn       – called when the user dismisses without logging out
 *  onConfirm – fn       – called when the user confirms sign-out
 */
const LogoutModal = ({ isOpen, onCancel, onConfirm }) => {
  const cancelBtnRef = useRef(null);

  /* ── Keyboard: close on Escape ── */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  /* ── Focus the Cancel button when modal opens (a11y) ── */
  useEffect(() => {
    if (isOpen) {
      // Small delay so the element is rendered and transition has started
      const t = setTimeout(() => cancelBtnRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  /* ── Prevent body scroll while modal is open ── */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    /* Backdrop – always rendered so the CSS transition works */
    <div
      aria-hidden={!isOpen}
      onClick={onCancel}
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300 ${
        isOpen
          ? 'bg-black/60 backdrop-blur-sm pointer-events-auto opacity-100'
          : 'bg-black/0 backdrop-blur-none pointer-events-none opacity-0'
      }`}
    >
      {/* Modal card – stop propagation so clicking inside doesn't close */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        aria-describedby="logout-modal-desc"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 p-7 transition-all duration-300 ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="h-14 w-14 rounded-2xl bg-red-950/50 border border-red-900/40 flex items-center justify-center shadow-lg shadow-red-900/20">
            <svg
              className="w-7 h-7 text-red-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Logout arrow icon */}
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2
          id="logout-modal-title"
          className="text-xl font-bold text-white text-center tracking-tight"
        >
          Confirm Logout
        </h2>

        {/* Message */}
        <p
          id="logout-modal-desc"
          className="mt-2 text-sm text-slate-400 text-center leading-relaxed"
        >
          Are you sure you want to sign out? Your current session will end and
          you'll need to log in again to continue.
        </p>

        {/* Divider */}
        <div className="my-6 h-px bg-slate-800" />

        {/* Actions */}
        <div className="flex gap-3">
          {/* Cancel */}
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 text-sm font-semibold hover:bg-slate-800 hover:text-white active:scale-[0.97] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Cancel
          </button>

          {/* Confirm Sign Out */}
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white text-sm font-semibold shadow-md shadow-red-900/30 hover:shadow-red-900/50 active:scale-[0.97] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
