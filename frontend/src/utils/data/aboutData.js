import {
  Scale,
  Lock,
  Eye,
  Fingerprint,
  Activity,
  Database,
} from 'lucide-react';

export const principles = [
  {
    icon: Scale,
    title: 'Conviction-Based Only',
    description: 'Only convicted persons are held in the disclosable register — never the accused — protecting the presumption of innocence.',
    bgClass: 'bg-indigo-50',
    iconClass: 'text-indigo-600',
  },
  {
    icon: Lock,
    title: 'Privacy by Design',
    description: 'Consistent with the right to privacy (K.S. Puttaswamy, 2017) and the DPDP Act 2023, the register is never publicly searchable.',
    bgClass: 'bg-amber-50',
    iconClass: 'text-amber-600',
  },
  {
    icon: Eye,
    title: 'Controlled Disclosure',
    description: 'Information is released through controlled police channels — never thrown open to the public. Every disclosure is audited.',
    bgClass: 'bg-blue-50',
    iconClass: 'text-blue-600',
  },
  {
    icon: Fingerprint,
    title: 'Biometric Identification',
    description: 'Operational action rests on fingerprints and lawful biometrics — never on name or photograph alone.',
    bgClass: 'bg-emerald-50',
    iconClass: 'text-emerald-600',
  },
  {
    icon: Activity,
    title: '100% Audit Trail',
    description: 'Every access, search, modification and disclosure is written to an immutable audit log for accountability.',
    bgClass: 'bg-pink-50',
    iconClass: 'text-pink-600',
  },
  {
    icon: Database,
    title: 'Time-Bound Retention',
    description: 'Records carry a statutory review date and are deleted at the end of their retention period — 15 years to lifetime.',
    bgClass: 'bg-violet-50',
    iconClass: 'text-violet-600',
  },
];

export const legalFramework = [
  { name: 'BNS 2023', desc: 'Bharatiya Nyaya Sanhita — replaces the IPC. Sections 63–79 cover sexual offences.' },
  { name: 'POCSO 2012', desc: 'Protection of Children from Sexual Offences Act — criminalises all forms of sexual abuse of children.' },
  { name: 'IT Act 2000', desc: 'Information Technology Act — Sections 66E, 67, 67A, 67B address cyber sexual offences.' },
  { name: 'ITPA 1956', desc: 'Immoral Traffic (Prevention) Act — Sections 3–7 criminalise trafficking and exploitation.' },
  { name: 'JJ Act 2015', desc: 'Juvenile Justice Act — governs juvenile offenders; records are sealed.' },
  { name: 'DPDP Act 2023', desc: 'Digital Personal Data Protection Act — governs how personal data is processed and protected.' },
  { name: 'Puttaswamy 2017', desc: 'Supreme Court ruling establishing the fundamental right to privacy under Article 21.' },
];

export const timeline = [
  { year: 'Phase 1', title: 'Legal Framework', text: 'Mapping all applicable statutory provisions and drafting the operational protocol.' },
  { year: 'Phase 2', title: 'System Design', text: 'Colour-coded classification, biometric integration, and audit infrastructure design.' },
  { year: 'Phase 3', title: 'Pilot Deployment', text: 'Controlled pilot with select commissionerates and institutions for validation.' },
  { year: 'Phase 4', title: 'Statewide Rollout', text: 'Full deployment across all districts with NCRB/NDSO interoperability.' },
];
