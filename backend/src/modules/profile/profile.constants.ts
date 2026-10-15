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
      "SAFE ALERT PRIVACY POLICY\nEffective Date: October 15, 2026\nVersion: 2.4 (Production)\nApplies to: Safe Alert Mobile Application, Citizen Web Client, and Super Admin Command Center",
      "1. INTRODUCTION\nSafe Alert (operated in conjunction with Safety Circle) connects citizens with trusted emergency contacts and designated responders in safety-critical situations. This Privacy Policy details our practices regarding information collection, real-time telemetry processing, emergency sharing, and account data deletion. By registering an account or using Safe Alert, you agree to this policy.",
      "2. INFORMATION WE COLLECT\n• Account & Profile: Full name, verified email address, phone number, location city/address, date of birth, demographic race classification (optional, to assist in visual emergency identification), and profile photos (up to 3).\n• Authentication Credentials: 4-digit security PIN (stored strictly as salted bcrypt hashes) and biometric public credential identifiers (faceIdCredentialId). Raw biometric scans (Face ID / fingerprints) remain isolated in your device hardware and are never transmitted to or stored on our servers.\n• Emergency Circles & Contacts: Contact names, phone numbers, relationship designations (parent, spouse, friend), custom circle colors, and invitation tokens.\n• Real-Time Telemetry: When an alert is active, we collect precise GPS coordinates (latitude, longitude), geocoded street address, accuracy radius (meters), movement speed (m/s), heading (degrees), device battery level, and timestamps.\n• Incident Media & Communications: Live incident chat messages, uploaded photo evidence, temporary WebRTC call tokens (via ZegoCloud), and incident resolution logs.\n• Device Information: Device platform, IP address, and push notification tokens (FCM/APNs).",
      "3. HOW WE USE YOUR INFORMATION\nWe use your data strictly to:\n• Dispatch high-priority emergency broadcasts and audible alerts to your designated emergency circle.\n• Stream real-time breadcrumb telemetry, GPS coordinates, and battery level on interactive maps during active emergencies.\n• Authenticate accounts via 6-digit email OTPs and secure JWT tokens with strict audience segregation.\n• Coordinate live incident chat, media sharing, and group audio/video conference rooms.\n• Manage Free and Premium subscription tiers, promotional partner vouchers, and circle size limits.\n• Archive incident logs into your private Incident Journal upon alert resolution.\n• Monitor system availability and investigate abusive or fraudulent false alerts.",
      "4. LOCATION INFORMATION AND DEVICE PERMISSIONS\n• Precise Location: Collected ONLY when you trigger an emergency SOS, during an active broadcast (foreground and background), upon safety countdown expiration, or during an explicit test drill. Safe Alert DOES NOT perform continuous background location tracking outside active emergency sessions.\n• Permissions: Location (precise), Camera (profile & evidence photos), Microphone (group audio/video calls), Notifications (emergency chimes and updates), and Biometrics (local rapid unlock). Permissions can be adjusted at any time in device system settings.",
      "5. EMERGENCY ALERTS AND SOS FUNCTIONALITY\n• Alert Modes: Standard Emergency (audible alarm, push broadcast, live telemetry), Silent Emergency (discreet alert suppressing loud sounds on your device while alerting contacts), and Test Drill Mode.\n• Resolution: Halts telemetry streaming immediately and notifies all recipients.\n• Official 911 Disclaimer: Safe Alert is a peer safety tool and NOT a direct replacement for 911 or local emergency services. Always dial official emergency services first in life-threatening situations.",
      "6. EMERGENCY CONTACTS AND SHARING\n• Circle Sharing: Designated emergency contacts receive your live coordinates, battery level, name, and live chat access during active incidents.\n• Security Operators: Designated Super Admins monitor active alerts via the command dashboard.\n• No Sale of Data: Safe Alert DOES NOT sell, rent, license, or monetize your personal information or location history to data brokers or advertisers.",
      "7. THIRD-PARTY SERVICES\n• AWS S3: Encrypted cloud object storage for profile and incident media.\n• ZegoCloud: WebRTC video and audio engine for incident calls.\n• Google Maps & Leaflet: Geographic mapping and address geocoding.\n• Nodemailer / SMTP: Transactional email delivery and 6-digit verification OTPs.\n• Firebase Cloud Messaging (FCM): Push notification delivery.",
      "8. DATA SECURITY\nAll data in transit is protected by TLS/HTTPS and secure WebSockets (WSS). PINs and passwords are protected by salted bcrypt hashing. Sessions use signed JWTs with distinct audience scopes (aud: 'app' vs aud: 'dashboard'). Active tokens for logged-out or deleted accounts are immediately invalidated via our server-side token revocation database (RevokedToken).",
      "9. YOUR RIGHTS AND PRIVACY CHOICES\nYou have the right to access, inspect, correct, and erase your personal data, manage device permissions, and request data portability under applicable laws (including GDPR and CCPA/CPRA).",
      "10. DATA RETENTION\nActive account records are kept while your account is open. Incident journals are retained in your private history. Verification OTPs expire within 10 minutes. Revoked tokens are kept only until original token expiration.",
      "11. ACCOUNT DELETION\nYou can permanently delete your account directly in the app under Profile > Delete Account by entering your 4-digit PIN. Deletion immediately triggers a database cascade (onDelete: Cascade) that permanently erases your profile, contacts, groups, alerts, telemetry points, live messages, journals, and notifications, and revokes your active token.",
      "12. CHILDREN'S PRIVACY\nSafe Alert is not directed to children under 13 (or under 16 in the EEA/UK). We do not knowingly collect personal data directly from unsupervised minors.",
      "13. INTERNATIONAL TRANSFERS\nData is stored on cloud servers located primarily in the United States under standard international contractual safeguards.",
      "14. CHANGES TO THIS POLICY\nWe may update this policy periodically. Material changes will be communicated via in-app notification, email alert, or dashboard notice.",
      "15. CONTACT US\nFor questions, privacy requests, or assistance, contact: support@safealert.app or visit https://safealert.app.",
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
