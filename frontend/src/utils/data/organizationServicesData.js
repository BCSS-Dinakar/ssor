import {
  Building2,
  FileCheck,
  ClipboardList,
  UserCheck,
  Fingerprint,
  BadgeCheck,
} from 'lucide-react';

export const services = [
  {
    icon: FileCheck,
    title: 'Employment Clearance Certificate',
    description:
      'Schools, crèches, sports academies and caregiver agencies can request a verified clear / refer decision before employing any person in a child-facing role.',
    audience: 'Organizations',
    audienceColor: 'bg-blue-100 text-secondary',
    accent: 'from-secondary to-blue-400',
    iconBg: 'bg-blue-50',
    iconColor: 'text-secondary',
    points: [
      'Submit candidate details securely',
      'Police cross-check under controlled access',
      'Receive clear / refer result within 7 working days',
      'Licence-linked digital certificate issued',
    ],
    cta: { label: 'Login as Organization', to: '/login?role=organization' },
  },
  
  {
    icon: Building2,
    title: 'Organization Registration',
    description:
      'Register your organization to access safe-recruitment verification services. All organization accounts are licence-linked and verified by the police.',
    audience: 'New Organizations',
    audienceColor: 'bg-amber-100 text-amber-700',
    accent: 'from-accent to-yellow-300',
    iconBg: 'bg-amber-50',
    iconColor: 'text-accent',
    points: [
      'Submit licence & registration details',
      'Police verification of organization credentials',
      'Receive approved organization portal access',
      'Manage multiple clearance requests from one portal',
    ],
    cta: { label: 'Register Organization', to: '/login?role=organization&mode=register' },
  },
];

export const steps = [
  {
    icon: ClipboardList,
    title: 'Apply Online',
    text: 'Submit your clearance or disclosure request through the secure portal with all required documentation.',
  },
  {
    icon: Fingerprint,
    title: 'Police Verification',
    text: 'Your request is cross-checked against the register under strict controlled access by authorised officers.',
  },
  {
    icon: UserCheck,
    title: 'Review & Decision',
    text: 'A senior officer reviews the result and issues a clear / refer decision with full audit logging.',
  },
  {
    icon: BadgeCheck,
    title: 'Certificate Issued',
    text: 'A digitally signed clearance certificate is issued, linked to your organization licence and verifiable online.',
  },
];

export const faqs = [
  {
    q: 'Who can apply for a clearance certificate?',
    a: 'Any registered organization (school, crèche, sports academy, transport operator, caregiver agency) with a valid licence can apply for employment clearance checks.',
  },
  {
    q: 'How long does verification take?',
    a: 'Standard clearance checks are processed within 7 working days. Urgent requests (for child-facing roles) may be expedited to 3 working days.',
  },
  
  {
    q: 'Is the register publicly searchable?',
    a: 'No. The register is never publicly searchable. All information flows through controlled police channels, consistent with the right to privacy.',
  },
  {
    q: 'What documents do I need?',
    a: 'For organization registration: licence/registration certificate, authorised signatory ID, and organization address proof. For clearance: candidate details and consent form.',
  },
];
