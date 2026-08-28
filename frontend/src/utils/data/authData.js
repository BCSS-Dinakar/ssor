import { Building2, Shield } from 'lucide-react';

export const ROLES = [
  { id: 'organization', label: 'Organization', sub: 'Institutions & employers', Icon: Building2 },
  { id: 'police', label: 'Police Officer', sub: 'Departmental access', Icon: Shield },
];

export const ORG_TYPES = [
  'School / College',
  'Crèche / day-care',
  'Sports academy',
  'Transport operator',
  'Home / caregiver agency',
  'Other child-facing institution',
];

export const ORG_REG_STEPS = ['Organization', 'Address', 'Contact', 'Administrator', 'Documents', 'Review', 'Declaration'];

