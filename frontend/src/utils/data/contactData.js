import { Phone, Mail, MapPin } from 'lucide-react';

export const contactChannels = [
  {
    icon: Phone,
    title: 'Emergency Helplines',
    items: [
      { label: 'Police Emergency', value: '100 / 112' },
      { label: 'Childline', value: '1098' },
      { label: 'Cyber Crime', value: '1930' },
      { label: 'Women Helpline', value: '181' },
    ],
    accent: 'from-red-500 to-orange-400',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  {
    icon: Mail,
    title: 'Email Support',
    items: [
      { label: 'General Enquiries', value: 'support@ssor.telangana.gov.in' },
      { label: 'Organization Registration', value: 'organizations@ssor.telangana.gov.in' },
      { label: 'Technical Support', value: 'tech@ssor.telangana.gov.in' },
    ],
    accent: 'from-secondary to-blue-400',
    iconBg: 'bg-blue-50',
    iconColor: 'text-secondary',
  },
  {
    icon: MapPin,
    title: 'Office Address',
    items: [
      { label: 'Headquarters', value: 'State Police Headquarters' },
      { label: 'Location', value: 'Lakdikapul, Hyderabad' },
      { label: 'State', value: 'Telangana - 500004' },
      { label: 'Office Hours', value: 'Mon–Sat, 10:00 AM – 5:00 PM' },
    ],
    accent: 'from-emerald-500 to-teal-400',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
];
