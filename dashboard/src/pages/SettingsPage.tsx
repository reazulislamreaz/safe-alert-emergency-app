import React, { useState } from 'react';
import { User, FileText, Info, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'about' | 'terms' | 'privacy'>('profile');

  // Form States
  const [profileName, setProfileName] = useState('Admin User');
  const [profilePhone, setProfilePhone] = useState('+1 (555) 000-0001');
  const [profileRole, setProfileRole] = useState('Super Admin');
  const [profileEmail, setProfileEmail] = useState('admin@safealert.app');

  const [termsText, setTermsText] = useState(
    `1. Acceptance of Terms\nBy accessing and using the SafeAlert Emergency Operations Platform, you accept and agree to be bound by the terms and provisions of this agreement.\n\n2. Emergency Dispatch and Telemetry Usage\nAll telemetry, GPS broadcasts, and emergency dispatch communications transmitted via this system are strictly for crisis de-escalation, rapid responder coordination, and community safety protection.`
  );

  const [aboutText, setAboutText] = useState(
    `SafeAlert is a next-generation emergency alert and responder coordination system designed to protect individuals, families, and organizations in mission-critical crisis situations through high-precision telemetry, multi-party live dispatch bridges, and rapid response networks.`
  );

  const [privacyText, setPrivacyText] = useState(
    `SafeAlert collects live telemetry, location coordinates, and audio/chat transmissions exclusively during active SOS broadcast cycles. Encrypted transmission channels and strict access controls ensure all citizen data remains confidential and audit-compliant.`
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none -mx-1 px-1">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'about', label: 'About Us', icon: Info },
          { id: 'terms', label: 'Terms & Conditions', icon: FileText },
          { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 touch-manipulation ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          Settings updated successfully!
        </div>
      )}

      {/* Sub Tab: Profile */}
      {activeSubTab === 'profile' && (
        <div className="figma-card p-4 sm:p-6 max-w-2xl">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Profile</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Role
              </label>
              <input
                type="text"
                value={profileRole}
                onChange={(e) => setProfileRole(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub Tab: About Us */}
      {activeSubTab === 'about' && (
        <div className="figma-card p-4 sm:p-6 max-w-3xl">
          <h3 className="text-sm font-bold text-gray-900 mb-4">About Us</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <textarea
              rows={8}
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-800 leading-relaxed focus:outline-none focus:border-blue-500 shadow-sm"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                Save About Us
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub Tab: Terms & Conditions */}
      {activeSubTab === 'terms' && (
        <div className="figma-card p-4 sm:p-6 max-w-3xl">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Terms & Conditions</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <textarea
              rows={8}
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-800 leading-relaxed focus:outline-none focus:border-blue-500 shadow-sm"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                Save Terms & Conditions
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub Tab: Privacy Policy */}
      {activeSubTab === 'privacy' && (
        <div className="figma-card p-4 sm:p-6 max-w-3xl">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Privacy Policy</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <textarea
              rows={8}
              value={privacyText}
              onChange={(e) => setPrivacyText(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-800 leading-relaxed focus:outline-none focus:border-blue-500 shadow-sm"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                Save Privacy Policy
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
