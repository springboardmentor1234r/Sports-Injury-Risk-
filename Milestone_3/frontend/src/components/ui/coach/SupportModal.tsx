import React from 'react';
import { X, HelpCircle, BookOpen, ShieldCheck, Mail } from 'lucide-react';

interface SupportModalProps {
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#c3c6d8] overflow-hidden space-y-6">
        <div className="p-6 border-b border-[#c3c6d8] flex justify-between items-center bg-[#f7f9fd]">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-[#004ccd]" />
            <h3 className="text-lg font-bold text-[#191c1f]">MoveIQ Support & Guidance</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#424656] hover:bg-[#e0e2e6]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-[#f2f4f8] rounded-xl border border-[#c3c6d8] flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-[#004ccd] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[#191c1f]">Biomechanics Calibration Guide</h4>
              <p className="text-[11px] text-[#424656] mt-1">
                Learn how to position smartphones or high-speed camera rigs for optimal 60fps joint tracking.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#f2f4f8] rounded-xl border border-[#c3c6d8] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#004ccd] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[#191c1f]">Strain Algorithm Methodology</h4>
              <p className="text-[11px] text-[#424656] mt-1">
                MoveIQ computes ground reaction peak forces, knee valgus collapse angles, and rotational shear.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#f2f4f8] rounded-xl border border-[#c3c6d8] flex items-start gap-3">
            <Mail className="w-5 h-5 text-[#004ccd] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[#191c1f]">Contact Clinical Support</h4>
              <p className="text-[11px] text-[#424656] mt-1">
                Have questions about a specific athlete&apos;s risk profile? Email <span className="text-[#004ccd] font-semibold">support@moveiq.com</span>
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#c3c6d8] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold bg-[#004ccd] text-white hover:bg-[#003da9] rounded-lg shadow-xs"
            >
              Close Help Center
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
