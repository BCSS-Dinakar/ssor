import { Building2, Shield } from 'lucide-react';

export const ROLES = [
  { id: 'organization', label: 'Organization', sub: 'Institutions & employers', Icon: Building2 },
  { id: 'police', label: 'Police Officer', sub: 'Departmental access', Icon: Shield },
];

export const ORG_TYPES = [
  'School',
  'Crèche / day-care',
  'Sports academy',
  'Transport operator',
  'Home / caregiver agency',
  'Other child-facing institution',
];

export const SIGNATORY_ID_TYPES = ['Aadhaar', 'PAN', 'Driving licence'];

export const SECURITY_QUESTIONS = [
  'Your first school',
  'City of birth',
  'Driving licence number',
  'PAN',
  "Mother's maiden name",
  'Your first vehicle',
  'Your last college',
];

export const ORG_REG_STEPS = ['Organization', 'Address', 'Contact', 'Administrator', 'Documents', 'Review', 'Declaration'];

