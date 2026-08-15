import React from 'react';
import { User, Users } from 'lucide-react';

export const BuiltForSection: React.FC = () => {
  return (
    <section id="built-for" className="bg-white py-20 lg:py-32 border-t border-[#c5c6cd]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#c5c6cd]">
          {/* Athletes */}
          <div className="py-12 md:py-0 md:pr-12 text-center md:text-left">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f8f9ff] rounded-2xl border border-[#c5c6cd] mb-6 shadow-sm">
              <User className="text-[#101c2e] w-8 h-8" />
            </div>
            <h3 className="font-serif text-3xl font-bold text-[#0b1c30] mb-3">
              ATHLETES
            </h3>
            <p className="text-lg text-[#45474c] italic mb-8 font-serif">
              &ldquo;Your personal injury intelligence&rdquo;
            </p>
            <ul className="space-y-4 text-base text-[#45474c]">
              <li className="flex items-center justify-center md:justify-start gap-3">
                <span className="w-2 h-2 bg-[#1d4ed8] rounded-full shrink-0"></span>
                <span>Self-scan in any training environment</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3">
                <span className="w-2 h-2 bg-[#1d4ed8] rounded-full shrink-0"></span>
                <span>Track mobility progress over time</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3">
                <span className="w-2 h-2 bg-[#1d4ed8] rounded-full shrink-0"></span>
                <span>Receive custom corrective routines</span>
              </li>
            </ul>
          </div>

          {/* Coaches */}
          <div className="py-12 md:py-0 md:pl-12 text-center md:text-left">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f8f9ff] rounded-2xl border border-[#c5c6cd] mb-6 shadow-sm">
              <Users className="text-[#101c2e] w-8 h-8" />
            </div>
            <h3 className="font-serif text-3xl font-bold text-[#0b1c30] mb-3">
              COACHES
            </h3>
            <p className="text-lg text-[#45474c] italic mb-8 font-serif">
              &ldquo;Your whole team, one dashboard&rdquo;
            </p>
            <ul className="space-y-4 text-base text-[#45474c]">
              <li className="flex items-center justify-center md:justify-start gap-3">
                <span className="w-2 h-2 bg-[#1d4ed8] rounded-full shrink-0"></span>
                <span>Screen full rosters in under an hour</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3">
                <span className="w-2 h-2 bg-[#1d4ed8] rounded-full shrink-0"></span>
                <span>Compare team data across seasons</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3">
                <span className="w-2 h-2 bg-[#1d4ed8] rounded-full shrink-0"></span>
                <span>Integrate findings into load management</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
