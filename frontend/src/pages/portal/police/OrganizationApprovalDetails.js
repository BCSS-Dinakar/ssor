import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Eye,
  Download,
  X,
} from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';

// Mock data store — in production this would come from an API
const MOCK_ORGS = {
  'ORG-8392': {
    id: 'ORG-8392',
    name: 'Little Scholars Academy',
    type: 'School',
    parentOrg: 'Scholars Education Trust',
    department: 'Primary Section',
    jurisdiction: 'South Zone',
    country: 'India',
    state: 'Telangana',
    district: 'Hyderabad',
    city: 'Hyderabad',
    address: '12-2-845, Mehdipatnam, Near Pillar No. 140',
    pin: '500028',
    officialEmail: 'office@littlescholars.edu',
    officialPhone: '040-23456789',
    altPhone: '040-23456790',
    website: 'https://www.littlescholars.edu',
    adminName: 'Dr. Lakshmi Devi',
    designation: 'Principal',
    empId: 'LS-ADMIN-001',
    adminEmail: 'admin@littlescholars.edu',
    mobile: '9876543210',
    loginId: 'littlescholars_admin',
    appliedOn: '2026-07-07',
    status: 'pending',
    documents: [
      { name: 'Authorization Letter.pdf', size: '1.2 MB' },
      { name: 'School Registration Certificate.pdf', size: '850 KB' },
      { name: 'CBSE Affiliation Certificate.pdf', size: '620 KB' },
    ],
  },
  'ORG-8381': {
    id: 'ORG-8381',
    name: 'Sunshine Pre-school',
    type: 'Pre-school',
    parentOrg: 'Sunshine Foundation',
    department: 'Early Childhood',
    jurisdiction: 'East Zone',
    country: 'India',
    state: 'Telangana',
    district: 'Cyberabad',
    city: 'Gachibowli',
    address: 'Plot 45, Gachibowli Main Road',
    pin: '500032',
    officialEmail: 'info@sunshine.edu',
    officialPhone: '040-29876543',
    altPhone: '',
    website: 'https://www.sunshine.edu',
    adminName: 'Mrs. Priya Sharma',
    designation: 'Director',
    empId: 'SS-DIR-001',
    adminEmail: 'priya@sunshine.edu',
    mobile: '9988776655',
    loginId: 'sunshine_admin',
    appliedOn: '2026-07-06',
    status: 'pending',
    documents: [
      { name: 'Authorization Letter.pdf', size: '980 KB' },
      { name: 'Pre-school Licence.pdf', size: '1.1 MB' },
    ],
  },
  'ORG-8370': {
    id: 'ORG-8370',
    name: 'Global Tech Institute',
    type: 'College',
    parentOrg: 'Global Education Group',
    department: 'Engineering',
    jurisdiction: 'West Zone',
    country: 'India',
    state: 'Telangana',
    district: 'Rangareddy',
    city: 'Shamshabad',
    address: 'Survey No 123, Near Airport',
    pin: '501218',
    officialEmail: 'hr@globaltech.edu',
    officialPhone: '040-30001234',
    altPhone: '040-30001235',
    website: 'https://www.globaltech.edu',
    adminName: 'Prof. Ravi Kumar',
    designation: 'Registrar',
    empId: 'GT-REG-001',
    adminEmail: 'ravi@globaltech.edu',
    mobile: '9123456789',
    loginId: 'globaltech_admin',
    appliedOn: '2026-07-05',
    status: 'approved',
    documents: [
      { name: 'Authorization Letter.pdf', size: '1.5 MB' },
      { name: 'AICTE Approval.pdf', size: '2.1 MB' },
      { name: 'University Affiliation.pdf', size: '1.8 MB' },
    ],
  },
};

// Fallback for IDs not in the mock store
function getOrg(id) {
  return MOCK_ORGS[id] || {
    id,
    name: 'Unknown Organization',
    type: '-',
    parentOrg: '-',
    department: '-',
    jurisdiction: '-',
    country: 'India',
    state: '-',
    district: '-',
    city: '-',
    address: '-',
    pin: '-',
    officialEmail: '-',
    officialPhone: '-',
    altPhone: '-',
    website: '-',
    adminName: '-',
    designation: '-',
    empId: '-',
    adminEmail: '-',
    mobile: '-',
    loginId: '-',
    appliedOn: '-',
    status: 'pending',
    documents: [],
  };
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</div>
        <div className="text-sm text-slate-800 font-semibold break-words mt-0.5">{value || '—'}</div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card p-6 bg-white border border-slate-200/80 shadow-md">
      <h3 className="text-xs font-black text-primary font-heading mb-4 pb-3 border-b border-slate-100 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function OrganizationApprovalDetails() {
  const { id } = useParams();
  const org = getOrg(id);
  const [status, setStatus] = useState(org.status);
  const [viewingDoc, setViewingDoc] = useState(null);

  const statusBadge = {
    pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock, text: 'Pending Review' },
    approved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-250', Icon: CheckCircle2, text: 'Approved Registration' },
    rejected: { cls: 'bg-red-50 text-red-700 border-red-250', Icon: XCircle, text: 'Registration Rejected' },
  }[status];

  const handleApprove = () => {
    setStatus('approved');
    alert(`Organization ${org.id} has been approved.`);
  };

  const handleReject = () => {
    setStatus('rejected');
    alert(`Organization ${org.id} has been rejected.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <PageHeader
        crumb={`Administration / Requests / Organization Verifications / ${org.id}`}
        title={org.name}
        subtitle={`Application ID: ${org.id} · Applied on ${org.appliedOn}`}
        actions={
          <Link
            to="/portal/org-verify"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-primary transition-all bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Link>
        }
      />

      {/* Status Banner */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm ${statusBadge.cls}`}>
        <div className="flex items-center gap-3">
          <statusBadge.Icon className="h-5 w-5 shrink-0" />
          <div>
            <div className="font-extrabold text-sm uppercase tracking-wide">{statusBadge.text}</div>
            <div className="text-[11px] opacity-90 font-medium mt-0.5">
              {status === 'pending' && 'This application is awaiting your review and credential validation.'}
              {status === 'approved' && 'This organization has been verified and granted portal access.'}
              {status === 'rejected' && 'This application has been rejected and credentials suspended.'}
            </div>
          </div>
        </div>
        {status === 'pending' && (
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
            <button onClick={handleApprove} className="w-full sm:w-auto inline-flex justify-center items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-100">
              <CheckCircle2 className="h-4 w-4" /> Approve License
            </button>
            <button onClick={handleReject} className="w-full sm:w-auto inline-flex justify-center items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-md shadow-red-100">
              <XCircle className="h-4 w-4" /> Reject Case
            </button>
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Organization Details">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
            <Building2 className="hidden" />
            <InfoRow icon={Building2} label="Organization Name" value={org.name} />
            <InfoRow icon={Building2} label="Type" value={org.type} />
            <InfoRow icon={Building2} label="Parent Organization" value={org.parentOrg} />
            <InfoRow icon={Building2} label="Department / Unit" value={org.department} />
            <InfoRow icon={Shield} label="Jurisdiction" value={org.jurisdiction} />
          </div>
        </Section>

        <Section title="Address Details">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
            <InfoRow icon={MapPin} label="Country" value={org.country} />
            <InfoRow icon={MapPin} label="State" value={org.state} />
            <InfoRow icon={MapPin} label="District" value={org.district} />
            <InfoRow icon={MapPin} label="City" value={org.city} />
            <InfoRow icon={MapPin} label="Full Address" value={org.address} />
            <InfoRow icon={MapPin} label="PIN Code" value={org.pin} />
          </div>
        </Section>

        <Section title="Contact Details">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
            <InfoRow icon={Mail} label="Official Email" value={org.officialEmail} />
            <InfoRow icon={Phone} label="Official Phone" value={org.officialPhone} />
            <InfoRow icon={Phone} label="Alternate Phone" value={org.altPhone} />
            <InfoRow icon={Globe} label="Website" value={org.website} />
          </div>
        </Section>

        <Section title="Administrator Details">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
            <InfoRow icon={User} label="Full Name" value={org.adminName} />
            <InfoRow icon={User} label="Designation" value={org.designation} />
            <InfoRow icon={User} label="Employee ID" value={org.empId} />
            <InfoRow icon={Mail} label="Official Email" value={org.adminEmail} />
            <InfoRow icon={Phone} label="Mobile Number" value={org.mobile} />
            <InfoRow icon={User} label="Username" value={org.loginId} />
          </div>
        </Section>
      </div>

      {/* Documents */}
      <Section title="Uploaded Credentials">
        {org.documents.length === 0 ? (
          <p className="text-xs text-slate-455 font-semibold">No credentials or certificates uploaded.</p>
        ) : (
          <div className="space-y-3">
            {org.documents.map((doc, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-150 rounded-2xl gap-3 hover:bg-slate-100/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 leading-none">{doc.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold mt-1.5">{doc.size}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl border border-blue-200 transition-colors text-[9px] font-black text-secondary uppercase tracking-widest"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  <button
                    onClick={() => alert(`Downloading ${doc.name}... (simulated)`)}
                    className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-250 transition-colors text-[9px] font-black text-emerald-700 uppercase tracking-widest"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Document Preview Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingDoc(null)}>
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scaleUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-800 text-xs leading-none">{viewingDoc.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold mt-1.5">{viewingDoc.size}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Downloading ${viewingDoc.name}... (simulated)`)}
                  className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-250 transition-colors text-[9px] font-black text-emerald-700 uppercase tracking-widest"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-50/50 flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="h-24 w-24 bg-white rounded-2xl flex items-center justify-center mx-auto border border-slate-200 shadow-inner">
                  <FileText className="h-12 w-12 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-700 uppercase tracking-wider">Document Preview Console</p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">{viewingDoc.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-3 bg-white px-4 py-1.5 rounded-full border border-slate-100 inline-block">PDF Renderer Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizationApprovalDetails;
