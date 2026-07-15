import {
  LayoutDashboard,
  FileCheck,
  ClipboardList,
  Database,
  ShieldCheck,
  MessageSquare,
  Users,
  UserCircle,
  BookOpen,
  Award,
} from 'lucide-react';

// Risk tiers (from the concept note + prototype)
export const TIERS = {
  red: { name: 'Red', color: 'bg-red-600', text: 'text-red-600', category: 'Dangerous / gang', sections: ['BNS 63–66', 'BNS 70', 'POCSO 5–6'], retention: 'Lifetime' },
  orange: { name: 'Orange', color: 'bg-orange-500', text: 'text-orange-500', category: 'Repeat offender', sections: ['BNS 71', '+ base section'], retention: '25 years' },
  blue: { name: 'Blue', color: 'bg-sky-600', text: 'text-sky-600', category: 'Cyber sexual', sections: ['IT Act 67A/67B', 'BNS 77', 'BNS 78', 'POCSO 11–14'], retention: '25 years' },
  black: { name: 'Black', color: 'bg-neutral-800', text: 'text-neutral-800', category: 'Trafficking', sections: ['BNS 143–144', 'BNS 111', 'ITPA 3–7'], retention: 'Lifetime' },
  silver: { name: 'Silver', color: 'bg-slate-400', text: 'text-slate-400', category: 'Juvenile (internal)', sections: ['JJ Act 2015'], retention: 'Sealed' },
  pink: { name: 'Pink', color: 'bg-pink-500', text: 'text-pink-500', category: 'Harassment', sections: ['BNS 74', 'BNS 75', 'BNS 78', 'BNS 79'], retention: '15 years' },
  green: { name: 'Green', color: 'bg-green-600', text: 'text-green-600', category: 'Isolated / low', sections: ['BNS 74', 'BNS 75'], retention: '15 years' },
};

/**
 * Clearance-centric glossary (locked):
 * - Clearance request: org submission for a candidate
 * - Pending clearances: police queue
 * - Issue / Deny clearance: police decision
 * Route paths remain unchanged for API compatibility.
 */
export const NAV = {
  organization: [
    { id: 'overview', label: 'Dashboard', desc: 'Clearance outcomes and status', icon: LayoutDashboard, path: '/portal' },
    { section: 'Services' },
    { id: 'apply', label: 'Submit Clearance Request', desc: 'Submit staff for background check', icon: FileCheck, path: '/portal/apply' },
    { section: 'Records' },
    { id: 'requests', label: 'Clearance Requests', desc: 'Track submitted clearance requests', icon: ClipboardList, path: '/portal/requests' },
    { id: 'candidates', label: 'Cleared Personnel', desc: 'View staff with issued clearances', icon: Users, path: '/portal/candidates' },
    { id: 'compliance', label: 'Compliance & Support', desc: 'Police desk chat and compliance', icon: Award, path: '/portal/compliance' },
    { section: 'Help' },
    { id: 'tiers', label: 'Risk Tier Guide', desc: 'Offender classification reference', icon: BookOpen, path: '/portal/tiers' },
    { id: 'resources', label: 'Legal Resources', desc: 'Safe hiring manuals and POCSO laws', icon: BookOpen, path: '/portal/resources' },
    { id: 'profile', label: 'Organization Profile', desc: 'Registered organization details', icon: UserCircle, path: '/portal/profile' },
  ],
  police: [
    { id: 'overview', label: 'Dashboard', desc: 'Register metrics and queues', icon: LayoutDashboard, path: '/portal' },
    { section: 'Register' },
    { id: 'register', label: 'Registry Database', desc: 'Search disclosable offender records', icon: Database, path: '/portal/register' },
    { id: 'tiers', label: 'Risk Tier Guide', desc: 'Offender classification reference', icon: BookOpen, path: '/portal/tiers' },
    { section: 'Clearances' },
    { id: 'clearances', label: 'Pending Clearances', desc: 'Process candidate clearance requests', icon: FileCheck, path: '/portal/clearances', badge: 'clearPending' },
    { id: 'clearance-history', label: 'Clearance History', desc: 'Completed clearance decisions', icon: ClipboardList, path: '/portal/clearance-history' },
    { id: 'org-verify', label: 'Organization Approvals', desc: 'Approve portal access for organizations', icon: ClipboardList, path: '/portal/org-verify' },
    { id: 'tickets', label: 'Support Tickets', desc: 'Organization inquiries and support', icon: MessageSquare, path: '/portal/tickets' },
    { section: 'Oversight' },
    { id: 'audit', label: 'System Audit Log', desc: 'Immutable record of system access', icon: ShieldCheck, path: '/portal/audit' },
    { section: 'Account' },
    { id: 'profile', label: 'Officer Profile', desc: 'Your officer credentials', icon: UserCircle, path: '/portal/profile' },
  ],
};

export const ROLE_META = {
  organization: { kicker: 'Organization Portal', title: 'Institution Console' },
  police: { kicker: 'Police Administration', title: 'Register Console' },
};

export const HELPLINES = [
  { label: 'Police emergency', value: '100 / 112' },
  { label: 'Women safety (SHE Teams)', value: '100' },
  { label: 'Childline', value: '1098' },
  { label: 'Cyber crime', value: '1930' },
];

export const STATUS_PILL = {
  active: 'bg-emerald-100 text-emerald-700',
  cleared: 'bg-emerald-100 text-emerald-700',
  approved: 'bg-emerald-100 text-emerald-700',
  review: 'bg-amber-100 text-amber-700',
  pending: 'bg-blue-100 text-blue-700',
  verifying: 'bg-amber-100 text-amber-700',
  new: 'bg-blue-100 text-blue-700',
  declined: 'bg-slate-200 text-slate-600',
  rejected: 'bg-red-100 text-red-700',
  closed: 'bg-slate-200 text-slate-600',
};
