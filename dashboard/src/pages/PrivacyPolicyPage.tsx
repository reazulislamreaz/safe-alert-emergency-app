import React, { useEffect, useState } from 'react';
import { ArrowLeft, Shield, Clock } from 'lucide-react';
import { api } from '../services/api';
import { User, isDashboardAdmin, AuthAudience } from '../types';

interface PrivacyPolicyPageProps {
  currentUser?: User | null;
  sessionAudience?: AuthAudience;
  onBack?: () => void;
}

const DEFAULT_PRIVACY_BODY = `1. INTRODUCTION
Welcome to Safe Alert (operated in conjunction with the Safety Circle emergency response platform, referred to as "Safe Alert", "we", "us", or "our"). Safe Alert is an emergency communication and safety coordination application designed to connect citizens with their trusted emergency contacts, family, and designated responders during urgent situations. This Privacy Policy details what information we collect, how we use and protect it, your privacy rights, and how you can permanently delete your data.

2. INFORMATION WE COLLECT
• Account & Profile: Full name, verified email address (for 6-digit OTP verification and account administration), mobile phone number (for contact matching), location label (city/state), optional date of birth, optional race classification (from catalog to assist visual identification in emergencies), and up to 3 profile photos.
• Authentication Credentials: 4-digit security PIN (stored strictly as salted bcrypt cryptographic hashes) and biometric public credential identifiers (faceIdCredentialId). Raw biometric data (Face ID / fingerprints) is processed exclusively on your device's local Secure Enclave and is never transmitted to or stored on our servers.
• Emergency Contacts & Circles: Contact names, phone numbers, relationship designations (parent, spouse, friend), custom circle colors, and invitation tokens.
• Real-Time Geolocation Telemetry: When an emergency alert is active, we collect precise GPS coordinates (latitude, longitude), geocoded street address, accuracy radius (meters), movement speed (m/s), compass heading (degrees), device battery level, and millisecond timestamps.
• Incident Media & Communications: Live incident chat messages, uploaded photo evidence, temporary WebRTC call tokens (via ZegoCloud), and incident resolution notes.
• Device & Technical Diagnostics: Device operating platform (iOS/Android/Web), IP address, and push notification tokens (FCM/APNs).

3. HOW WE USE YOUR INFORMATION
We process your information strictly for safety-focused purposes:
• Delivering immediate SOS broadcasts and high-priority audible alarms to your designated emergency circle.
• Streaming live telemetry points, movement paths, and battery status on interactive maps (Google Maps / OpenStreetMap Leaflet) during active emergencies.
• Authenticating accounts via 6-digit email OTPs and secure JWT tokens with audience segregation.
• Facilitating live incident chat, photo sharing, and group audio/video conference calls.
• Managing subscription tiers (Free vs. Premium), group limits, and partner promotional vouchers.
• Archiving incident duration, notes, and close-time media snapshots in your private Incident Journal upon alert resolution.
• Monitoring platform uptime and investigating abusive or fraudulent alerts.

4. LOCATION INFORMATION AND DEVICE PERMISSIONS
• Precise Location: Accessed ONLY when you trigger an emergency SOS, during an active broadcast (foreground and background), upon safety countdown expiration, or during an explicit test drill. Safe Alert DOES NOT run persistent background location tracking outside active emergency sessions.
• Device Permissions: Location (precise/background during active SOS), Camera (profile & evidence photos), Microphone (group audio/video calls), Notifications (emergency chimes and updates), and Biometrics (local rapid unlock). Permissions can be modified or revoked at any time in device system settings.

5. EMERGENCY ALERTS AND SOS FUNCTIONALITY
• Alert Modes: Standard Emergency (audible alarm, push broadcast, live telemetry), Silent Emergency (discreet alert suppressing loud sounds on the user's phone while alerting contacts), and Test Drill Mode.
• Resolution: Resolving or cancelling an alert halts telemetry streaming immediately, dispatches cancellation notices to all recipients, and commits the summary to your journal.
• Emergency Disclaimer: Safe Alert is a peer safety tool and NOT a direct replacement for 911 or local emergency authorities. Always dial official emergency services first in life-threatening situations.

6. EMERGENCY CONTACTS AND SHARING
• Circle Sharing: Designated emergency contacts receive your live coordinates, battery level, name, and live chat access during active incidents.
• Security Operators: Designated Super Admins monitor active alerts via the command dashboard.
• No Sale of Data: Safe Alert DOES NOT sell, rent, license, or monetize your personal information or location history to data brokers or advertising aggregators.

7. THIRD-PARTY SERVICES
• Amazon Web Services (AWS S3): Encrypted cloud object storage for profile photos and incident media attachments.
• ZegoCloud: WebRTC video and audio engine for incident calls.
• Google Maps & Leaflet: Geographic mapping, route visualization, and address geocoding.
• Nodemailer / SMTP: Transactional email delivery and 6-digit verification OTPs.
• Firebase Cloud Messaging (FCM): Push notification delivery.

8. DATA SECURITY
All data in transit is protected by TLS/HTTPS and secure WebSockets (WSS). PINs and passwords are protected by salted bcrypt hashing. Sessions use signed JWTs with distinct audience scopes (aud: 'app' vs aud: 'dashboard'). Active tokens for logged-out or deleted accounts are immediately invalidated via our server-side token revocation database (RevokedToken).

9. YOUR RIGHTS AND PRIVACY CHOICES
You have the right to access, inspect, correct, and erase your personal data, manage device permissions, and request data portability under applicable laws (including GDPR and CCPA/CPRA).

10. DATA RETENTION
Active account records are kept while your account is open. Incident journals are retained in your private history. Verification OTPs expire within 10 minutes. Revoked tokens are kept only until original token expiration.

11. ACCOUNT DELETION
You can permanently delete your account directly in the app under Profile > Delete Account by entering your 4-digit PIN. Deletion immediately triggers a database cascade (onDelete: Cascade) that permanently erases your profile, contacts, groups, alerts, telemetry points, live messages, journals, and notifications, and revokes your active token.

12. CHILDREN'S PRIVACY
Safe Alert is not directed to children under 13 (or under 16 in the EEA/UK). We do not knowingly collect personal data directly from unsupervised minors without verifiable guardian consent.

13. INTERNATIONAL TRANSFERS
Data is stored on cloud servers located primarily in the United States under standard international contractual safeguards.

14. CHANGES TO THIS POLICY
We may update this policy periodically. Material changes will be communicated via in-app notification, email alert, or dashboard notice.

15. CONTACT US
For questions, privacy requests, or assistance, contact: support@safealert.app or visit https://safealert.app.`;

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  currentUser,
  sessionAudience = 'app',
  onBack,
}) => {
  const [policyTitle, setPolicyTitle] = useState<string>('Privacy Policy');
  const [policyBody, setPolicyBody] = useState<string>(DEFAULT_PRIVACY_BODY);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getPublicLegalPage('privacy')
      .then((data) => {
        if (!cancelled && data) {
          if (data.title) setPolicyTitle(data.title);
          if (data.body) setPolicyBody(data.body);
          if (data.updatedAt) setUpdatedAt(data.updatedAt);
        }
      })
      .catch(() => {
        // Fall back cleanly to bundled default text
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  const isAdmin = currentUser && isDashboardAdmin(currentUser, sessionAudience);

  // Parse paragraphs and bullet sections cleanly
  const paragraphs = policyBody
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-800 font-sans antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation"
              aria-label="Return to previous screen"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>
                {isAdmin
                  ? 'Back to Dashboard'
                  : currentUser
                  ? 'Back to App'
                  : 'Back'}
              </span>
            </button>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#3A67D5] flex items-center justify-center text-white text-[11px] font-black tracking-tight shrink-0 shadow-xs">
                SC
              </div>
              <span className="font-bold text-gray-900 text-sm tracking-tight">
                Safe Alert
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Official
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 shadow-xs space-y-6">
          {/* Header */}
          <div className="border-b border-gray-100 pb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#09003B] tracking-tight">
              {policyTitle}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {updatedAt
                  ? `Last updated: ${new Date(updatedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}`
                  : 'Effective: October 2026'}
              </span>
              <span>•</span>
              <span>Safe Alert &amp; Safety Circle</span>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <div className="w-6 h-6 border-2 border-[#3A67D5] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading latest policy...</p>
            </div>
          ) : (
            <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
              {paragraphs.map((block, idx) => {
                // Check if this block looks like a numbered heading or title
                const isHeading =
                  /^\d+\.\s+[A-Z\s&,–—/-]+$/.test(block.split('\n')[0].trim()) ||
                  /^[A-Z\s]{4,}$/.test(block.split('\n')[0].trim());

                if (isHeading) {
                  const lines = block.split('\n');
                  const heading = lines[0];
                  const bodyLines = lines.slice(1).join('\n');
                  return (
                    <section key={idx} className="space-y-2 pt-2">
                      <h2 className="text-base font-bold text-[#09003B] border-b border-gray-100 pb-1.5">
                        {heading}
                      </h2>
                      {bodyLines && (
                        <div className="whitespace-pre-line text-gray-600 text-xs sm:text-sm pl-0.5">
                          {bodyLines}
                        </div>
                      )}
                    </section>
                  );
                }

                return (
                  <p key={idx} className="whitespace-pre-line text-gray-600">
                    {block}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 px-4 text-center text-xs text-gray-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Safe Alert. All rights reserved.</p>
          <a
            href="mailto:support@safealert.app"
            className="text-[#3A67D5] hover:underline font-medium"
          >
            support@safealert.app
          </a>
        </div>
      </footer>
    </div>
  );
};
