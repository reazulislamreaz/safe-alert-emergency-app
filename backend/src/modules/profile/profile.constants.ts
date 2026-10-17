export const PROFILE_PHOTO_LIMIT = 3;

export const PROFILE_COPY = {
  editCta: "Edit",
  updateCta: "Update Profile",
  logoutCta: "Log out",
  deleteAccountCta: "Delete Account",
  logoutPrompt: {
    title: "Ready to log out?",
    cancel: "Cancel",
    confirm: "Log out",
  },
  deletePrompt: {
    title: "Input your Pin",
    confirm: "Delete",
  },
} as const;

export const PROFILE_MENU = [
  { key: "subscription", label: "My Subscriptions" },
  { key: "about", label: "About Us", slug: "about" },
  { key: "privacy", label: "Privacy Policy", slug: "privacy" },
  { key: "terms", label: "Terms & Conditions", slug: "terms" },
] as const;

export type PlanFeatureRow = {
  label: string;
  included: boolean;
  comingSoon?: boolean;
};

export const PLAN_CATALOG = {
  FREE: {
    id: "plan-free",
    tier: "FREE" as const,
    name: "Free",
    price: 0,
    priceLabel: "$0",
    pricePeriod: "forever",
    features: [
      { label: "2 emergency groups", included: true },
      { label: "Up to 5 contacts per group", included: true },
      { label: "SOS alerts", included: true },
      { label: "Video calls", included: false },
      { label: "Unlimited contacts", included: false },
      { label: "Incident journal", included: false },
    ] satisfies PlanFeatureRow[],
  },
  PREMIUM: {
    id: "plan-pro",
    tier: "PREMIUM" as const,
    name: "Premium",
    price: 5,
    priceLabel: "$5.00",
    pricePeriod: "/month",
    features: [
      { label: "Unlimited groups", included: true },
      { label: "Unlimited Contacts per groups", included: true },
      { label: "SOS alerts", included: true },
      { label: "Group video calls", included: true },
      { label: "Incident journal", included: true },
      { label: "Wearable integration (coming soon)", included: true, comingSoon: true },
    ] satisfies PlanFeatureRow[],
  },
} as const;

export const SUBSCRIPTION_COPY = {
  currentPlan: "Current Plan",
  switchPlan: "Switch Plan",
  choosePlan: "Choose Plan",
  cancelCta: "Cancel Subscription",
  cancelledBadge: "Cancelled",
  trialNote: "Cancel anytime. 7-day free trial for Pro.",
  cancelTitle: "Any Comments or Suggestions?",
  cancelSubtitle: "This will immediately move you to the Free plan.",
  cancelPlaceholder: "Describe the incident or update…",
} as const;

export const LEGAL_PAGES = [
  {
    slug: "about",
    title: "About Us",
    body: [
      "Safety Circle is an emergency response platform built to help you reach trusted people in seconds.",
      "When something goes wrong, Safety Circle sends live location, SOS alerts, and optional live audio or video to the groups you choose — so family, friends, and responders can act immediately.",
      "Our mission is to make personal safety simple, private, and always within reach. We connect citizens, emergency contacts, and operations teams through one secure app.",
    ].join("\n\n"),
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    body: [
      "SAFETY CIRCLE PRIVACY POLICY\nEffective Date: October 17, 2026\nVersion: 2.5 (Production)\nApplies to: Safety Circle Mobile Application, Citizen Web Client, and Admin Command Center (safety-circle-app.com)",
      "1. INTRODUCTION\nWelcome to Safety Circle (operated under safety-circle-app.com, referred to as \"Safety Circle\", \"we\", \"us\", or \"our\"). Safety Circle is an emergency communication and safety coordination platform designed to connect citizens with their trusted emergency contacts, family circles, and designated emergency responders during urgent situations. This Privacy Policy details what information we collect, how we use and protect it, your privacy rights, and how you can manage or permanently delete your data. By registering an account or using Safety Circle, you agree to this policy.",
      "2. INFORMATION WE COLLECT\n• Account & Profile Information: Full name, verified email address (for 6-digit OTP verification and administrative notifications), mobile phone number (for contact matching), location label (city/state), optional date of birth, optional race classification (from catalog to assist visual identification in emergency response), and profile photos (up to 3).\n• Authentication Credentials: 4-digit security PIN (stored strictly as salted bcrypt cryptographic hashes) and biometric public credential identifiers (faceIdCredentialId). Raw biometric data (Face ID / fingerprints) is processed exclusively on your device's local Secure Enclave and is never transmitted to or stored on our servers.\n• Emergency Contacts & Circles: Contact names, phone numbers, relationship designations (parent, spouse, friend), custom circle colors, and invitation tokens.\n• Real-Time Geolocation Telemetry: When an emergency alert is active, we collect precise GPS coordinates (latitude, longitude), geocoded street address, accuracy radius (meters), movement speed (m/s), compass heading (degrees), device battery level, and millisecond timestamps.\n• Incident Media & Communications: Live incident chat messages, uploaded photo evidence, temporary WebRTC call tokens (via ZegoCloud), and incident resolution notes.\n• Device & Technical Diagnostics: Device operating platform (iOS/Android/Web), IP address, and push notification tokens (FCM/APNs).",
      "3. HOW WE USE YOUR INFORMATION\nWe process your information strictly for safety-focused purposes:\n• Delivering immediate SOS broadcasts and high-priority audible alarms to your designated emergency circle.\n• Streaming live telemetry points, movement paths, and battery status on interactive maps (Google Maps / OpenStreetMap Leaflet) during active emergencies.\n• Authenticating accounts via 6-digit email OTPs and secure JWT tokens with strict audience segregation.\n• Facilitating live incident chat, photo sharing, and group audio/video conference calls.\n• Managing subscription tiers (Free vs. Premium), group limits, and partner promotional vouchers.\n• Archiving incident duration, notes, and close-time media snapshots in your private Incident Journal upon alert resolution.\n• Monitoring platform uptime and investigating abusive or fraudulent alerts.",
      "4. LOCATION INFORMATION AND DEVICE PERMISSIONS\n• Precise Location: Accessed ONLY when you trigger an emergency SOS, during an active broadcast (foreground and background), upon safety countdown expiration, or during an explicit test drill. Safety Circle DOES NOT run persistent background location tracking outside active emergency sessions.\n• Device Permissions: Location (precise/background during active SOS), Camera (profile & evidence photos), Microphone (group audio/video calls), Notifications (emergency chimes and updates), and Biometrics (local rapid unlock). Permissions can be modified or revoked at any time in device system settings.",
      "5. EMERGENCY ALERTS AND SOS FUNCTIONALITY\n• Alert Modes: Standard Emergency (audible alarm, push broadcast, live telemetry), Silent Emergency (discreet alert suppressing loud sounds on the user's phone while alerting contacts), and Test Drill Mode.\n• Resolution: Resolving or cancelling an alert halts telemetry streaming immediately, dispatches cancellation notices to all recipients, and commits the summary to your journal.\n• Emergency Disclaimer: Safety Circle is a peer safety tool and NOT a direct replacement for 911 or local emergency authorities. Always dial official emergency services first in life-threatening situations.",
      "6. EMERGENCY CONTACTS AND SHARING\n• Circle Sharing: Designated emergency contacts receive your live coordinates, battery level, name, and live chat access during active incidents.\n• Security Operators: Designated Super Admins monitor active alerts via the command dashboard.\n• No Sale of Data: Safety Circle DOES NOT sell, rent, license, or monetize your personal information or location history to data brokers or advertising aggregators.",
      "7. THIRD-PARTY SERVICES\n• Amazon Web Services (AWS S3): Encrypted cloud object storage for profile photos and incident media attachments.\n• ZegoCloud: WebRTC video and audio engine for incident calls.\n• Google Maps & Leaflet: Geographic mapping, route visualization, and address geocoding.\n• Nodemailer / SMTP: Transactional email delivery and 6-digit verification OTPs.\n• Firebase Cloud Messaging (FCM): Push notification delivery.",
      "8. DATA SECURITY\nAll data in transit is protected by TLS/HTTPS and secure WebSockets (WSS). PINs and passwords are protected by salted bcrypt hashing. Sessions use signed JWTs with distinct audience scopes (aud: 'app' vs aud: 'dashboard'). Active tokens for logged-out or deleted accounts are immediately invalidated via our server-side token revocation database (RevokedToken).",
      "9. YOUR RIGHTS AND PRIVACY CHOICES\nYou have the right to access, inspect, correct, and erase your personal data, manage device permissions, and request data portability under applicable laws (including GDPR and CCPA/CPRA).",
      "10. DATA RETENTION\nActive account records are kept while your account is open. Incident journals are retained in your private history. Verification OTPs expire within 10 minutes. Revoked tokens are kept only until original token expiration.",
      "11. ACCOUNT DELETION\nYou can permanently delete your account directly in the app under Profile > Delete Account by entering your 4-digit PIN. Deletion immediately triggers a database cascade (onDelete: Cascade) that permanently erases your profile, contacts, groups, alerts, telemetry points, live messages, journals, and notifications, and revokes your active token.",
      "12. CHILDREN'S PRIVACY\nSafety Circle is not directed to children under 13 (or under 16 in the EEA/UK). We do not knowingly collect personal data directly from unsupervised minors without verifiable guardian consent.",
      "13. INTERNATIONAL TRANSFERS\nData is stored on cloud servers located primarily in the United States under standard international contractual safeguards.",
      "14. CHANGES TO THIS POLICY\nWe may update this policy periodically. Material changes will be communicated via in-app notification, email alert, or dashboard notice.",
      "15. CONTACT US\nFor questions, privacy requests, or assistance, contact: support@safety-circle-app.com or visit https://safety-circle-app.com.",
    ].join("\n\n"),
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    body: [
      "Safety Circle is a safety communication tool. It is not a replacement for calling local emergency services (such as 911) when you are in immediate danger.",
      "You are responsible for keeping your PIN private, maintaining accurate emergency contacts, and using the app lawfully. False or abusive alerts may result in account suspension.",
      "The Free plan includes limited groups and contacts. Premium adds unlimited groups and contacts, group video calls, and incident journal access, billed at $5.00 per month after a 7-day trial. You may cancel at any time; access then returns to the Free plan.",
      "We may update these terms to reflect product or legal changes. Continued use of Safety Circle after an update means you accept the revised terms.",
    ].join("\n\n"),
  },
] as const;
