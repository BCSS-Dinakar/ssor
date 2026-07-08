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

export const DEMO_OTP = '123456';

export const ORG_REG_STEPS = ['Organization', 'Address', 'Contact', 'Administrator', 'Documents', 'Review', 'Declaration'];


export function emptyOrgReg() {
  return {
    orgName: 'Little Scholars Academy',
    orgType: 'School',
    parentOrg: 'LSA Educational Trust',
    department: 'Primary Section',
    jurisdiction: 'Banjara Hills PS',
    country: 'India',
    state: 'Telangana',
    district: 'Hyderabad',
    city: 'Hyderabad',
    address: 'Road No 12, Banjara Hills',
    pinCode: '500034',
    officialEmail: 'info@littlescholars.edu.in',
    officialPhone: '040-23344556',
    altPhone: '040-23344557',
    website: 'https://littlescholars.edu.in',
    adminName: 'Ravi Kumar',
    designation: 'Principal',
    empId: 'LSA-001',
    adminEmail: 'principal@littlescholars.edu.in',
    mobile: '9876543210',
    loginId: 'lsa_admin',
    password: 'password123',
    confirm: 'password123',
    authLetter: null,
    govCert: null,
    supportingDocs: null,
    acceptTerms: false,
    acceptPrivacy: false,
    confirmInfo: false,
    otp: '',
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
  return 'Signed in (demo). The Organization Services portal would open here.';
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
