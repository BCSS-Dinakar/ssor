import { Shield, Building2, Users, Database, Scale, Fingerprint, Lock } from 'lucide-react';

export const legalFramework = [
  'BNS 2023',
  'POCSO 2012',
  'IT Act 2000',
  'ITPA 1956',
  'JJ Act 2015',
  'DPDP Act 2023',
  'Puttaswamy 2017',
];

export const accessLevels = [
  {
    icon: Shield,
    title: 'Police & Administration',
    tag: 'Full Access',
    tagClass: 'bg-accent text-primary',
    accent: 'from-accent to-yellow-300',
    iconBg: 'bg-amber-50',
    iconColor: 'text-accent',
    description:
      'Authorised officers with recorded clearance manage the register, run searches and process requests. Every action is written to an immutable audit log.',
    points: ['Register dashboard & risk-tier analytics', 'Search, manage & review records', 'Access audit & retention control'],
    cta: { label: 'Login', to: '/login' },
    ctaClass: 'btn-primary',
  },
  {
    icon: Building2,
    title: 'Organizations',
    tag: 'Clearance Check',
    tagClass: 'bg-blue-100 text-secondary',
    accent: 'from-secondary to-blue-400',
    iconBg: 'bg-blue-50',
    iconColor: 'text-secondary',
    description:
      'Schools, creches, sports academies, transport operators and caregiver agencies obtain a verified clear / refer decision through the police — never a list of names.',
    points: ['Employment clearance certificates', 'Safe-recruitment verification', 'Licence-linked organization accounts'],
    cta: { label: 'Login', to: '/login?role=organization' },
    ctaClass: 'btn-secondary',
  },
  {
    icon: Users,
    title: 'Parents & Guardians',
    tag: 'Limited Disclosure',
    tagClass: 'bg-emerald-100 text-emerald-700',
    accent: 'from-emerald-500 to-teal-400',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    description:
      'Where a registered offender presents an identified risk to a specific child, a parent or guardian may request limited disclosure under a written protocol, reviewed case by case.',
    points: ['Request for a specific, identified risk', 'Reviewed by an officer of DSP rank', 'Confidential — no public lookup'],
    cta: { label: 'Login', to: '/login?role=public' },
    ctaClass: 'btn-secondary',
  },
];

export const tiers = [
  { name: 'Red', color: 'bg-red-600', category: 'Dangerous predator / gang', law: 'BNS 63–66, 70 · POCSO 5–6', retention: 'Lifetime' },
  { name: 'Orange', color: 'bg-orange-500', category: 'Repeat / habitual offender', law: 'BNS 71 + base section', retention: '25 years' },
  { name: 'Blue', color: 'bg-sky-600', category: 'Cyber sexual offender', law: 'IT Act 66E/67/67A/67B · BNS 77–78', retention: '25 years' },
  { name: 'Black', color: 'bg-neutral-800', category: 'Organised crime / trafficking', law: 'BNS 143–144, 111 · ITPA 3–7', retention: 'Lifetime' },
  { name: 'Silver', color: 'bg-slate-400', category: 'Juvenile (internal only)', law: 'JJ Act 2015', retention: 'Sealed' },
  { name: 'Pink', color: 'bg-pink-500', category: 'Non-contact / harassment', law: 'BNS 74–76, 78–79', retention: '15 years' },
  { name: 'Green', color: 'bg-green-600', category: 'Isolated, low-severity', law: 'BNS 74 / 75', retention: '15 years' },
];

export const capabilities = [
  {
    icon: Database,
    title: 'Conviction-Based Register',
    description: 'Only convicted persons are held in the disclosable register — never the accused — protecting the presumption of innocence.',
    bgClass: 'bg-blue-50',
    iconClass: 'text-blue-600',
  },
  {
    icon: Scale,
    title: 'Legal-Mapped Tiers',
    description: 'Each colour tier maps to precise statutory provisions under the BNS 2023 and allied special legislation.',
    bgClass: 'bg-indigo-50',
    iconClass: 'text-indigo-600',
  },
  {
    icon: Fingerprint,
    title: 'Biometric Identification',
    description: 'Operational action rests on fingerprints and lawful biometrics — never on name or photograph alone.',
    bgClass: 'bg-emerald-50',
    iconClass: 'text-emerald-600',
  },
  {
    icon: Lock,
    title: 'Audited, Time-Bound Data',
    description: 'Every access is logged, every record carries a review date, and records are deleted at the end of their retention period.',
    bgClass: 'bg-amber-50',
    iconClass: 'text-amber-600',
  },
];
