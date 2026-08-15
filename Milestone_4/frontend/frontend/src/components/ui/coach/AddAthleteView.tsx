import React, { useState, useRef } from 'react';
import { BadgeCheck, Scale, Save, Check, Loader2, UploadCloud, Camera, X } from 'lucide-react';

interface AddAthleteViewProps {
  onAddAthlete: (payload: any) => Promise<any> | void;
  setActiveTab: (tab: string) => void;
  token?: string;
}

export const AddAthleteView: React.FC<AddAthleteViewProps> = ({
  onAddAthlete,
  setActiveTab,
  token
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState<number | ''>(24);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [heightCm, setHeightCm] = useState<number | ''>(185);
  const [weightKg, setWeightKg] = useState<number | ''>(82);
  const [sport, setSport] = useState<string>('Soccer');
  const [position, setPosition] = useState('Forward');

  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [trainingIntensity, setTrainingIntensity] = useState('Medium');
  const [weeklySessions, setWeeklySessions] = useState<number | ''>(4);
  const [hasPrevInjury, setHasPrevInjury] = useState('No');
  const [prevInjuryType, setPrevInjuryType] = useState('None');
  const [injuryRecency, setInjuryRecency] = useState('None');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setAvatarPreview(URL.createObjectURL(file));
    setIsUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/cloudinary/upload-image`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedUrl = data.secure_url || data.profile_picture_url;
        setAvatarUrl(uploadedUrl);
      } else {
        // Fallback: Use FileReader data URL if Cloudinary response fails
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) setAvatarUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Photo upload error", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      full_name: fullName,
      email: email.trim() || undefined,
      profile_picture_url: avatarUrl.trim() || undefined,
      age: typeof age === 'number' ? age : null,
      gender,
      height: typeof heightCm === 'number' ? heightCm : null,
      weight: typeof weightKg === 'number' ? weightKg : null,
      sport: sport || 'General',
      position: position || 'Athlete',
      training_intensity: trainingIntensity,
      weekly_training_sessions: typeof weeklySessions === 'number' ? weeklySessions : null,
      has_previous_injury: hasPrevInjury,
      previous_injury_type: prevInjuryType,
      injury_recency: injuryRecency
    };

    try {
      await onAddAthlete(payload);
      setSavedSuccess(true);
      setTimeout(() => {
        setActiveTab('athletes');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to create athlete profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1f]">
          New Athlete Profile
        </h2>
        <p className="text-sm md:text-base text-[#424656] mt-1">
          Register a new athlete to begin tracking biometric data and injury risk.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-[#c4f2c7] text-[#0f5132] rounded-xl text-sm font-semibold flex items-center gap-2 border border-[#11801c]/30 animate-fade-in">
          <Check className="w-5 h-5 text-[#11801c]" />
          Athlete profile successfully created! Redirecting to Athletes Roster...
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Info */}
        <section className="bg-white rounded-xl shadow-xs border border-[#c3c6d8] p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#c3c6d8]">
            <div className="w-8 h-8 rounded-full bg-[#f3f3ff] flex items-center justify-center text-[#004ccd]">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191c1f]">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-xs font-medium text-[#424656] mb-1">
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Marcus"
                className="w-full bg-white border border-[#c3c6d8] rounded-lg px-4 py-2.5 text-sm text-[#191c1f] focus:outline-none focus:ring-2 focus:ring-[#004ccd]/20 focus:border-[#004ccd]"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-xs font-medium text-[#424656] mb-1">
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Johnson"
                className="w-full bg-white border border-[#c3c6d8] rounded-lg px-4 py-2.5 text-sm text-[#191c1f] focus:outline-none focus:ring-2 focus:ring-[#004ccd]/20 focus:border-[#004ccd]"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#424656] mb-1">
                Email Address (Optional)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marcus.j@example.com"
                className="w-full bg-white border border-[#c3c6d8] rounded-lg px-4 py-2.5 text-sm text-[#191c1f] focus:outline-none focus:ring-2 focus:ring-[#004ccd]/20 focus:border-[#004ccd]"
              />
            </div>

            <div className="md:col-span-2 pt-2 border-t border-[#c3c6d8]/40">
              <label className="block text-xs font-medium text-[#424656] mb-2">
                Athlete Profile Photo (Cloudinary CDN Upload)
              </label>
              
              <div className="flex items-center gap-4 bg-[#f7f9fd] p-3.5 rounded-xl border border-[#c3c6d8]">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 bg-[#004ccd] text-white font-bold flex items-center justify-center relative">
                  {avatarPreview || avatarUrl ? (
                    <img 
                      src={avatarPreview || avatarUrl} 
                      alt="Athlete preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-6 h-6 text-white/80" />
                  )}

                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => photoInputRef.current?.click()}
                      className="px-4 py-2 bg-[#004ccd] hover:bg-[#003da9] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
                    >
                      <UploadCloud className="w-4 h-4" />
                      {isUploadingPhoto ? 'Uploading to Cloudinary...' : 'Upload Photo'}
                    </button>

                    {(avatarPreview || avatarUrl) && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarUrl('');
                          setAvatarPreview(null);
                        }}
                        className="px-3 py-2 text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#424656] mt-1.5">
                    {avatarUrl.includes('cloudinary.com') ? (
                      <span className="text-[#11801c] font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-[#11801c]" /> Uploaded to Cloudinary CDN
                      </span>
                    ) : (
                      'Supported formats: JPG, PNG, WEBP (Max 5MB).'
                    )}
                  </p>
                </div>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Biometrics & Demographics */}
        <section className="bg-white rounded-xl shadow-xs border border-[#c3c6d8] p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#c3c6d8]">
            <div className="w-8 h-8 rounded-full bg-[#f3f3ff] flex items-center justify-center text-[#004ccd]">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191c1f]">
              Biometrics & Demographics
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="age" className="block text-xs font-medium text-[#424656] mb-1">
                Age
              </label>
              <div className="relative">
                <input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="24"
                  className="w-full bg-white border border-[#c3c6d8] rounded-lg pl-4 pr-12 py-2.5 text-sm text-[#191c1f] focus:outline-none focus:ring-2 focus:ring-[#004ccd]/20 focus:border-[#004ccd]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#424656]">
                  yrs
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="gender" className="block text-xs font-medium text-[#424656] mb-1">
                Gender
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-white border border-[#c3c6d8] rounded-lg px-4 py-2.5 text-sm text-[#191c1f] focus:outline-none focus:ring-2 focus:ring-[#004ccd]/20 focus:border-[#004ccd]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="height" className="block text-xs font-medium text-[#424656] mb-1">
                Height
              </label>
              <div className="relative">
                <input
                  id="height"
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="185"
                  className="w-full bg-white border border-[#c3c6d8] rounded-lg pl-4 pr-12 py-2.5 text-sm text-[#191c1f] focus:outline-none focus:ring-2 focus:ring-[#004ccd]/20 focus:border-[#004ccd]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#424656]">
                  cm
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="weight" className="block text-xs font-medium text-[#424656] mb-1">
                Weight
              </label>
              <div className="relative">
                <input
                  id="weight"
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="82"
                  className="w-full bg-white border border-[#c3c6d8] rounded-lg pl-4 pr-12 py-2.5 text-sm text-[#191c1f] focus:outline-none focus:ring-2 focus:ring-[#004ccd]/20 focus:border-[#004ccd]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#424656]">
                  kg
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sport" className="block text-xs font-medium text-[#424656] mb-1">
                Primary Sport
              </label>
              <select
                id="sport"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full bg-white border border-[#c3c6d8] rounded-lg px-4 py-2.5 text-sm text-[#191c1f] focus:outline-none focus:ring-2 focus:ring-[#004ccd]/20 focus:border-[#004ccd]"
              >
                <option value="Soccer">Soccer</option>
                <option value="Basketball">Basketball</option>
                <option value="Track & Field">Track & Field</option>
                <option value="Gymnastics">Gymnastics</option>
                <option value="Football">Football</option>
                <option value="Tennis">Tennis</option>
                <option value="Swimming">Swimming</option>
                <option value="Baseball">Baseball</option>
              </select>
            </div>

            <div>
              <label htmlFor="position" className="block text-xs font-medium text-[#424656] mb-1">
                Position / Specialty
              </label>
              <input
                id="position"
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Forward / Guard / Sprinter"
                className="w-full bg-white border border-[#c3c6d8] rounded-lg px-4 py-2.5 text-sm text-[#191c1f] focus:outline-none focus:ring-2 focus:ring-[#004ccd]/20 focus:border-[#004ccd]"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Training and Injury History */}
        <section className="bg-white rounded-xl shadow-xs border border-[#c3c6d8] p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[#c3c6d8]">
            <div className="w-8 h-8 rounded-full bg-[#f3f3ff] flex items-center justify-center text-[#004ccd]">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191c1f]">
              Training &amp; Injury History
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="trainingIntensity" className="block text-xs font-medium text-[#424656] mb-1">
                Training Intensity
              </label>
              <select
                id="trainingIntensity"
                value={trainingIntensity}
                onChange={(e) => setTrainingIntensity(e.target.value)}
                className="w-full bg-white border border-[#c3c6d8] rounded-lg px-4 py-2.5 text-sm text-[#191c1f] focus:outline-none focus:ring-2 focus:ring-[#004ccd]/20 focus:border-[#004ccd]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="weeklySessions" className="block text-xs font-medium text-[#424656] mb-1">
                Weekly Training Sessions
              </label>
              <input
                id="weeklySessions"
                type="number"
                min={1}
                max={14}
                value={weeklySessions}
                onChange={(e) => setWeeklySessions(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="4"
                className="w-full bg-white border border-[#c3c6d8] rounded-lg px-4 py-2.5 text-sm text-[#191c1f] focus:outline-none focus:ring-2 focus:ring-[#004ccd]/20 focus:border-[#004ccd]"
              />
            </div>

            <div>
              <label htmlFor="hasPrevInjury" className="block text-xs font-medium text-[#424656] mb-1">
                Previous Injury Status
              </label>
              <select
                id="hasPrevInjury"
                value={hasPrevInjury}
                onChange={(e) => setHasPrevInjury(e.target.value)}
                className="w-full bg-white border border-[#c3c6d8] rounded-lg px-4 py-2.5 text-sm text-[#191c1f] focus:outline-none focus:ring-2 focus:ring-[#004ccd]/20 focus:border-[#004ccd]"
              >
                <option value="No">No Previous Injury</option>
                <option value="Yes">Has Previous Injury</option>
              </select>
            </div>

            {hasPrevInjury === 'Yes' && (
              <>
                <div>
                  <label htmlFor="prevInjuryType" className="block text-xs font-medium text-[#424656] mb-1">
                    Previous Injury Type
                  </label>
                  <select
                    id="prevInjuryType"
                    value={prevInjuryType}
                    onChange={(e) => setPrevInjuryType(e.target.value)}
                    className="w-full bg-white border border-[#c3c6d8] rounded-lg px-4 py-2.5 text-sm text-[#191c1f] focus:outline-none focus:ring-2 focus:ring-[#004ccd]/20 focus:border-[#004ccd]"
                  >
                    <option value="None">None</option>
                    <option value="ACL Tear">ACL Tear</option>
                    <option value="Hamstring Strain">Hamstring Strain</option>
                    <option value="Ankle Sprain">Ankle Sprain</option>
                    <option value="Knee Ligament">Knee Ligament</option>
                    <option value="Shoulder Dislocation">Shoulder Dislocation</option>
                    <option value="Groin Strain">Groin Strain</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="injuryRecency" className="block text-xs font-medium text-[#424656] mb-1">
                    Injury Recency
                  </label>
                  <select
                    id="injuryRecency"
                    value={injuryRecency}
                    onChange={(e) => setInjuryRecency(e.target.value)}
                    className="w-full bg-white border border-[#c3c6d8] rounded-lg px-4 py-2.5 text-sm text-[#191c1f] focus:outline-none focus:ring-2 focus:ring-[#004ccd]/20 focus:border-[#004ccd]"
                  >
                    <option value="None">None</option>
                    <option value="Within 3 Months">Within 3 Months</option>
                    <option value="Within 6 Months">Within 6 Months</option>
                    <option value="Within 1 Year">Within 1 Year</option>
                    <option value="Over 1 Year Ago">Over 1 Year Ago</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#c3c6d8]">
          <button
            type="button"
            onClick={() => setActiveTab('athletes')}
            className="px-6 py-2.5 rounded-lg text-xs font-bold text-[#424656] hover:bg-[#e0e2e6] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 rounded-lg text-xs font-bold bg-[#004ccd] text-white hover:bg-[#003da9] transition-colors shadow-sm flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Athlete
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
