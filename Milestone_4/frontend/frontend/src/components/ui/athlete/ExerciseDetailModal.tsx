import React from 'react';

interface PrescribedExercise {
  id: number;
  name: string;
  reps: string;
  targetJoint: string;
  description: string;
}

interface ExerciseDetailModalProps {
  exercise: PrescribedExercise | null;
  onClose: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  onClose,
}) => {
  if (!exercise) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#c3c6d7] max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-left text-[#191c1f]">
        {/* Header */}
        <div className="bg-[#00379b] text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">
              fitness_center
            </span>
            <h3 className="text-[20px] font-bold">{exercise.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Video / Animated Motion Demo Graphic */}
        <div className="bg-[#191b23] h-52 relative flex items-center justify-center overflow-hidden">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFD88zbHA1QjccitwrppBbm6gRAC_DA8gWGX7tfdIRa-hjhRM7cf-56Yn8BDYwZHeLX-3xMzrNWlTpESwFrugJA3gymKUNy1gWC3twHjxnWA20wX5vToTBvSkcTx4B6A4dvlDyEnCJ3fCfjKIF0uWQKSX1xupmKNZAasSaR39lF0oOv1gN1bgl18CN-toskgCZaWEWyV8Pok3dG07czzb5ysy0v0QVagpN5TKe9M6aSEsyPT1a8g-c5mEl2OtdRdZdTQetmrVpLIcj"
            alt={exercise.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute flex flex-col items-center text-white text-center p-4">
            <div className="w-12 h-12 rounded-full bg-[#00379b] flex items-center justify-center shadow-lg mb-2 cursor-pointer hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[28px]">
                play_arrow
              </span>
            </div>
            <span className="text-[12px] font-semibold tracking-wider uppercase">
              3D Form Vector Guide
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-[#f3f3fe] rounded-lg border border-[#c3c6d7]">
            <div>
              <span className="text-[11px] font-semibold text-[#434654] uppercase block">
                Dosage &amp; Volume
              </span>
              <span className="text-[16px] font-bold text-[#00379b]">
                {exercise.reps}
              </span>
            </div>
            {exercise.targetJoint && (
              <div className="text-right">
                <span className="text-[11px] font-semibold text-[#434654] uppercase block">
                  Target Complex
                </span>
                <span className="text-[14px] font-bold text-[#191b23]">
                  {exercise.targetJoint}
                </span>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-[14px] font-bold text-[#191b23] uppercase tracking-wide mb-1">
              Biomechanical Execution Cues
            </h4>
            <p className="text-[14px] text-[#434654] leading-relaxed">
              {exercise.description ||
                'Perform movement in front of mirror or video feedback camera. Ensure knee does not cave inward during descent.'}
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="bg-[#00379b] text-white px-6 py-2.5 rounded-lg text-[13px] font-semibold uppercase tracking-wider hover:bg-[#004ccd] transition-colors"
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
