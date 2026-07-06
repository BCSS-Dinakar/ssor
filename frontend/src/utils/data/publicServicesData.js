import {
  Building2,
  FileCheck,
  ClipboardList,
  UserCheck,
  Fingerprint,
  BadgeCheck,
  Search,
} from 'lucide-react';

export const services = [
  {
    icon: FileCheck,
    title: 'Employment Clearance Certificate',
    description:
      'Schools, crèches, sports academies and caregiver agencies can request a verified clear / refer decision before employing any person in a child-facing role.',
    audience: 'Institutions',
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
  },
  {
    icon: Search,
    title: 'Limited Disclosure Request',
    description:
      'Where a registered offender presents an identified risk to a specific child, a parent or guardian may request limited disclosure under a written protocol.',
    audience: 'Parents & Guardians',
    audienceColor: 'bg-emerald-100 text-emerald-700',
    accent: 'from-emerald-500 to-teal-400',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    points: [
      'Request must relate to a specific, identified risk',
      'Reviewed by an officer of DSP rank or above',
      'Confidential — no general public lookup',
      'Disclosure is protocol-bound and auditable',
    ],
  },
  {
    icon: Building2,
    title: 'Institution Registration',
    description:
      'Register your institution to access safe-recruitment verification services. All institution accounts are licence-linked and verified by the police.',
    audience: 'New Institutions',
    audienceColor: 'bg-amber-100 text-amber-700',
    accent: 'from-accent to-yellow-300',
    iconBg: 'bg-amber-50',
    iconColor: 'text-accent',
    points: [
      'Submit institutional licence & registration details',
      'Police verification of institution credentials',
      'Receive approved institution portal access',
      'Manage multiple clearance requests from one dashboard',
    ],
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
    text: 'A digitally signed clearance certificate is issued, linked to your institution licence and verifiable online.',
  },
];

export const faqs = [
  {
    q: 'Who can apply for a clearance certificate?',
    a: 'Any registered institution (school, crèche, sports academy, transport operator, caregiver agency) with a valid licence can apply for employment clearance checks.',
  },
  {
    q: 'How long does verification take?',
    a: 'Standard clearance checks are processed within 7 working days. Urgent requests (for child-facing roles) may be expedited to 3 working days.',
  },
  {
    q: 'Can a parent request information about a specific person?',
    a: 'Yes — but only under the limited disclosure protocol. The request must relate to a specific, identified risk to a child and is reviewed by an officer of DSP rank.',
  },
  {
    q: 'Is the register publicly searchable?',
    a: 'No. The register is never publicly searchable. All information flows through controlled police channels, consistent with the right to privacy.',
  },
  {
    q: 'What documents do I need?',
    a: 'For institution registration: licence/registration certificate, authorised signatory ID, institution address proof. For clearance: candidate details and consent form.',
  },
];
