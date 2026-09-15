import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { api, RegisterPayload } from '../services/api';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { FourDigitPinInput } from '../components/auth/FourDigitPinInput';
import { AuthErrorBanner, AuthSpinner } from '../components/auth/AuthFeedback';
import {
  authInputClass,
  authLabelClass,
  authPrimaryBtnClass,
} from '../components/auth/AuthShell';

type RaceOption = { key: string; label: string };

interface CreateAccountPageProps {
  onClose: () => void;
  onRegistered: (session: { email: string; token: string; otpCode?: string }) => void;
}

function toDobIso(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  return parsed.toISOString();
}

export const CreateAccountPage: React.FC<CreateAccountPageProps> = ({ onClose, onRegistered }) => {
  const [photos, setPhotos] = useState<Array<string | null>>([null, null, null]);
  const [fullName, setFullName] = useState('');
  const [raceKey, setRaceKey] = useState('');
  const [raceOptions, setRaceOptions] = useState<RaceOption[]>([]);
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [selectedPin, setSelectedPin] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileRefs = useRef<Array<HTMLInputElement | null>>([]);

  const photoCount = photos.filter(Boolean).length;
  const uploadedUrls = photos.filter((photo): photo is string => Boolean(photo));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getRaces();
        if (cancelled) return;
        const options = Array.isArray(data?.options) ? (data.options as RaceOption[]) : [];
        setRaceOptions(options);
        setRaceKey((current) => current || options[0]?.key || '');
      } catch {
        if (!cancelled) {
          setRaceOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmergency = emergencyContactPhone.trim();
    const trimmedLocation = location.trim();
    const dobIso = toDobIso(dob);
    const password = selectedPin.join();

    if (uploadedUrls.length < 3) {
      setErrorMessage('Please add 3 profile photos.');
      return;
    }

    if (trimmedFullName.length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('Email address is required.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.replace(/\D/g, '').length < 7) {
      setErrorMessage('Please enter a valid mobile number.');
      return;
    }

    if (!/^\d{4}$/.test(password)) {
      setErrorMessage('Please enter an exactly 4-digit PIN.');
      return;
    }

    if (!raceKey) {
      setErrorMessage('Please select a race option.');
      return;
    }

    if (!trimmedEmergency || trimmedEmergency.replace(/\D/g, '').length < 7) {
      setErrorMessage('Please enter a valid emergency contact phone number.');
      return;
    }

    if (!dobIso) {
      setErrorMessage('Date of birth is required.');
      return;
    }

    if (!trimmedLocation) {
      setErrorMessage('Location is required.');
      return;
    }

    const finalPayload: RegisterPayload = {
      fullName: trimmedFullName,
      email: trimmedEmail,
      phone: trimmedPhone,
      password,
      race: raceKey,
      emergencyContactPhone: trimmedEmergency,
      dob: dobIso,
      location: trimmedLocation,
      profilePhotos: uploadedUrls,
    };

    setIsLoading(true);
    try {
      const data = await api.register(finalPayload);
      onRegistered({
        email: trimmedEmail.toLowerCase(),
        token: data.token,
        otpCode: data.otpCode,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      if (/already exists/i.test(message)) {
        setErrorMessage(`${message} Try logging in, or use a different email.`);
      } else {
        setErrorMessage(message);
      }
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
              Full name <span className="text-[#DC2626]">*</span>
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
              Race
            </label>
            <select
              id="reg-race"
              value={raceKey}
              onChange={(e) => setRaceKey(e.target.value)}
              className={`${authInputClass} appearance-none`}
              required
            >
              {raceOptions.length === 0 && <option value="">Loading…</option>}
              {raceOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="reg-dob" className={authLabelClass}>
              Date of Birth <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="reg-dob"
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className={authInputClass}
            />
          </div>
          <div>
            <label htmlFor="reg-email" className={authLabelClass}>
              Email Address <span className="text-[#DC2626]">*</span>
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
              Mobile Number <span className="text-[#DC2626]">*</span>
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
              Location <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="reg-location"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="New York, NY"
              className={authInputClass}
            />
          </div>
          <div>
            <label htmlFor="reg-emergency-phone" className={authLabelClass}>
              Emergency Contact Phone <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="reg-emergency-phone"
              type="tel"
              required
              autoComplete="tel"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              placeholder="+1 (555) 987-6543"
              className={authInputClass}
            />
          </div>
          <div>
            <FourDigitPinInput
              value={selectedPin.join('')}
              onChange={(pin) => {
                setSelectedPin(pin.split(''));
                setErrorMessage(null);
              }}
              label="Create 4-digit PIN *"
            />
          </div>
        </div>

        <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
          {isLoading ? <AuthSpinner /> : 'Continue - Verify Email'}
        </button>
      </form>
    </MobileAuthLayout>
  );
};
