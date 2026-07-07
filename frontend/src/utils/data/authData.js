import { Users, Building2, Shield } from 'lucide-react';

export const ROLES = [
  { id: 'public', label: 'Public', sub: 'Parents & guardians', Icon: Users },
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

export const DEMO_OTP = '123456';

export const PUBLIC_REG_STEPS = ['Personal', 'Account', 'Security'];
export const ORG_REG_STEPS = ['Organization', 'Signatory', 'Account', 'Security'];

export function emptyPublicReg() {
  return {
    name: '',
    mobile: '',
    email: '',
    gender: '',
    dob: '',
    address: '',
    loginId: '',
    password: '',
    confirm: '',
    q1: '',
    a1: '',
    q2: '',
    a2: '',
    captcha: '',
    otp: '',
  };
}

export function emptyOrgReg() {
  return {
    orgName: '',
    orgType: '',
    licenceNo: '',
    address: '',
    city: '',
    pinCode: '',
    policeStation: '',
    signatoryName: '',
    designation: '',
    idType: '',
    idNumber: '',
    mobile: '',
    email: '',
    otp: '',
    loginId: '',
    password: '',
    confirm: '',
    q1: '',
    a1: '',
    q2: '',
    a2: '',
    captcha: '',
  };
}

export function getLoginSuccessMessage(role) {
  if (role === 'police') {
    return 'Officer credentials accepted (demo). The Register Console would open here.';
  }
  if (role === 'organization') {
    return 'Signed in (demo). The Organization portal would open here — manage clearance requests and track verifications.';
  }
  return 'Signed in (demo). The Public Services portal would open here.';
}

export function getLoginDescription(role) {
  if (role === 'police') {
    return 'Restricted to authorised officers with recorded clearance. Every action is audited.';
  }
  if (role === 'organization') {
    return 'Sign in to submit clearance requests, track verifications, and manage your institution account.';
  }
  return 'Sign in to track applications and request limited disclosure as a parent or guardian.';
}
