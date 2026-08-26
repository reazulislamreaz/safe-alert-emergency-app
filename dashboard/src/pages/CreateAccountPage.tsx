import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { api, RegisterPayload } from '../services/api';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { AuthErrorBanner, AuthSpinner } from '../components/auth/AuthFeedback';
import {
  authInputClass,
  authLabelClass,
  authPrimaryBtnClass,
} from '../components/auth/AuthShell';

const RACE_OPTIONS = [
  'Prefer not to say',
  'White',
  'Black or African American',
  'Asian',
  'Hispanic or Latino',
  'Native American',
  'Mixed',
  'Other',
];

interface CreateAccountPageProps {
  onClose: () => void;
  onRegistered: (session: { phone: string; token: string; otpCode?: string }) => void;
}

function parseEmergencyContact(value: string): { name: string; relation: string } {
  const [name, ...rest] = value.split(' - ');
  return {
    name: (name || value).trim(),
    relation: rest.join(' - ').trim() || 'Emergency Contact',
  };
}

export const CreateAccountPage: React.FC<CreateAccountPageProps> = ({ onClose, onRegistered }) => {
  const [photos, setPhotos] = useState<Array<string | null>>([null, null, null]);
  const [fullName, setFullName] = useState('');
  const [race, setRace] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileRefs = useRef<Array<HTMLInputElement | null>>([]);

  const photoCount = photos.filter(Boolean).length;

  const handlePhoto = async (index: number, file?: File) => {
    if (!file) return;
    setErrorMessage(null);
    try {
      const uploaded = await api.uploadImages([file]);
      const url = uploaded.files[0]?.url;
      if (!url) {
        throw new Error('Could not upload photo.');
      }
      const next = [...photos];
      next[index] = url;
      setPhotos(next);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not add photo.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (photoCount < 3) {
      setErrorMessage('Please add 3 profile photos.');
      return;
    }

    const contact = parseEmergencyContact(emergencyContact);
    if (!contact.name) {
      setErrorMessage('Emergency contact is required.');
      return;
    }

    const payload: RegisterPayload = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      dob: dob || undefined,
      race: race || undefined,
      location: location.trim() || undefined,
      emergencyContactName: contact.name,
      emergencyContactRelation: contact.relation,
      emergencyContactPhone: phone.trim(),
      profilePhotos: photos.filter((photo): photo is string => Boolean(photo)),
    };

    setIsLoading(true);
    try {
      const data = await api.register(payload);
      onRegistered({
        phone: phone.trim(),
        token: data.token,
        otpCode: data.otpCode,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileAuthLayout title="Create Account" onClose={onClose}>
      <AuthErrorBanner message={errorMessage} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-normal text-[#30302F]">
              Profile Photos <span className="text-[#DC2626]">*</span>
            </p>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                photoCount === 3
                  ? 'text-[#00AA1D] bg-[#E8F8EE]'
                  : 'text-[#FF7B6B] bg-[#FFDACD]'
              }`}
            >
              {photoCount}/3 required
            </span>
          </div>
          <div className="flex gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="flex-1 relative">
                <button
                  type="button"
                  onClick={() => fileRefs.current[index]?.click()}
                  className={`w-full h-[108px] rounded-xl border border-dashed overflow-hidden flex flex-col items-center justify-center gap-1 transition-all touch-manipulation ${
                    photo
                      ? 'border-[#3A67D5] bg-white shadow-sm'
                      : 'border-[#E1E1E1] bg-[#F5F5F5] hover:bg-gray-100'
                  }`}
                  aria-label={`Upload photo ${index + 1}`}
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-[#30302F]" />
                      <span className="text-xs text-[#30302F]">Photo {index + 1}</span>
                    </>
                  )}
                </button>
                {photo && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = [...photos];
                      next[index] = null;
                      setPhotos(next);
                    }}
                    className="absolute top-1 right-1 size-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-[10px] touch-manipulation"
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    ×
                  </button>
                )}
                <input
                  ref={(el) => {
                    fileRefs.current[index] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhoto(index, e.target.files?.[0])}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="reg-name" className={authLabelClass}>
              Full name
            </label>
            <input
              id="reg-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Miles"
              className={authInputClass}
            />
          </div>
          <div>
            <label htmlFor="reg-race" className={authLabelClass}>
              Race(Optional)
            </label>
            <select
              id="reg-race"
              value={race}
              onChange={(e) => setRace(e.target.value)}
              className={`${authInputClass} appearance-none`}
            >
              <option value="">White</option>
              {RACE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="reg-dob" className={authLabelClass}>
              Date of Birth
            </label>
            <input
              id="reg-dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className={authInputClass}
            />
          </div>
          <div>
            <label htmlFor="reg-email" className={authLabelClass}>
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@gmail.com"
              className={authInputClass}
            />
          </div>
          <div>
            <label htmlFor="reg-phone" className={authLabelClass}>
              Phone Number
            </label>
            <input
              id="reg-phone"
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2(555) 0000 - 0000"
              className={authInputClass}
            />
          </div>
          <div>
            <label htmlFor="reg-location" className={authLabelClass}>
              Location
            </label>
            <input
              id="reg-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="New York, NY"
              className={authInputClass}
            />
          </div>
          <div>
            <label htmlFor="reg-contact" className={authLabelClass}>
              Emergency Contact
            </label>
            <input
              id="reg-contact"
              required
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="James Johnson - Father"
              className={authInputClass}
            />
          </div>
        </div>

        <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
          {isLoading ? <AuthSpinner /> : 'Continue - Verify Phone'}
        </button>
      </form>
    </MobileAuthLayout>
  );
};
