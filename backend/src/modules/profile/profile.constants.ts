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
      "Safety Circle collects the information needed to protect you in an emergency: your profile, emergency contacts, device location during an alert, and optional incident recordings.",
      "We do not sell your personal data. Location and media captured during an SOS are shared only with the groups and operators you authorize for that incident.",
      "You can update or delete your account from Profile. Deleting your account removes your profile, contacts, and stored incident history from our systems, except where we must retain records for legal or safety obligations.",
      "By using Safety Circle you agree to this policy. Contact support@safealert.app with privacy questions.",
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
