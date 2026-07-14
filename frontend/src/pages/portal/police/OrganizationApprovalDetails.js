import React, { useState, useEffect } from 'react';
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
import { policeApi } from '../../../api/police.api';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-sm text-slate-400 font-bold uppercase tracking-wider">{label}</div>
        <div className="text-base text-slate-800 font-semibold break-words mt-0.5">{value || '—'}</div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card p-6 bg-white border border-slate-200/80 shadow-md">
      <h3 className="text-sm font-black text-primary font-heading mb-4 pb-3 border-b border-slate-100 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function OrganizationApprovalDetails() {
  const { id } = useParams();
  const [org, setOrg] = useState(null);
  const [status, setStatus] = useState('pending');
  const [viewingDoc, setViewingDoc] = useState(null);
  const [docBlobUrl, setDocBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activeUrl = null;
    if (viewingDoc && typeof viewingDoc.name === 'string' && viewingDoc.name.match(/\.(jpg|jpeg|png)$/i)) {
      setDocBlobUrl(null);
      policeApi.getDocument(viewingDoc.name)
        .then(res => {
          activeUrl = URL.createObjectURL(res.data);
          setDocBlobUrl(activeUrl);
        })
        .catch(err => {
          console.error("Failed to fetch doc blob", err);
        });
    } else {
      setDocBlobUrl(null);
    }

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [viewingDoc]);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await policeApi.getOrganizationById(id);
        if (res.success) {
          const user = res.data;
          const p = user.organizationProfile || {};
          
          let docs = [];
          if (p.authLetterPath) docs.push({ name: p.authLetterPath, type: 'Authorization Letter' });
          if (p.govCertPath) docs.push({ name: p.govCertPath, type: 'Gov Certificate' });
          if (p.supportingDocsPaths) {
            p.supportingDocsPaths.forEach(doc => docs.push({ name: doc, type: 'Supporting Document' }));
          }

          setOrg({
            id: user.id,
            loginId: user.loginId,
            appliedOn: new Date(user.createdAt).toISOString().split('T')[0],
            status: user.status,
            ...p,
            documents: docs
          });
          setStatus(user.status);
        }
      } catch (err) {
        console.error('Failed to fetch org details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading organization details...</div>;
  }

  if (!org) {
    return <div className="p-8 text-center text-red-500 font-medium">Organization not found.</div>;
  }

  const statusBadge = {
    pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock, text: 'Pending Review' },
    approved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-250', Icon: CheckCircle2, text: 'Approved Registration' },
    rejected: { cls: 'bg-red-50 text-red-700 border-red-250', Icon: XCircle, text: 'Registration Rejected' },
  }[status];

  const handleApprove = async () => {
    try {
      const res = await policeApi.updateOrganizationStatus(id, 'approved');
      if (res.success) {
        setStatus('approved');
        alert(`Organization ${org.id} has been approved.`);
      }
    } catch (err) {
      alert('Failed to approve organization.');
    }
  };

  const handleReject = async () => {
    try {
      const res = await policeApi.updateOrganizationStatus(id, 'rejected');
      if (res.success) {
        setStatus('rejected');
        alert(`Organization ${org.id} has been rejected.`);
      }
    } catch (err) {
      alert('Failed to reject organization.');
    }
  };

  const downloadDoc = async (filename) => {
    try {
      const res = await policeApi.getDocument(filename);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download document:', err);
      alert('Failed to download document.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <PageHeader
        crumb={`Administration / Requests / Organization Verifications / ${org.id}`}
        title={org.orgName}
        subtitle={`Application ID: ${org.id} · Applied on ${org.appliedOn}`}
        actions={
          <Link
            to="/portal/org-verify"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-primary transition-all bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm"
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
            <div className="font-extrabold text-base uppercase tracking-wide">{statusBadge.text}</div>
            <div className="text-sm opacity-90 font-medium mt-0.5">
              {status === 'pending' && 'This application is awaiting your review and credential validation.'}
              {status === 'approved' && 'This organization has been verified and granted portal access.'}
              {status === 'rejected' && 'This application has been rejected and credentials suspended.'}
            </div>
          </div>
        </div>
        {status === 'pending' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleReject}
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 font-extrabold text-sm uppercase tracking-wider rounded-xl border border-red-200 transition-colors shadow-sm"
            >
              <XCircle className="h-4 w-4" /> Reject
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-extrabold text-sm uppercase tracking-wider rounded-xl border border-emerald-600 transition-colors shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" /> Approve
            </button>
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Section title="Institution Details">
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoRow icon={Building2} label="Organization Name" value={org.orgName} />
              <InfoRow icon={Building2} label="Type of Institution" value={org.orgType} />
              <InfoRow icon={Building2} label="Parent Organization" value={org.parentOrg} />
              <InfoRow icon={Building2} label="Department / Wing" value={org.department} />
            </div>
          </Section>

          <Section title="Location & Contact">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <InfoRow icon={MapPin} label="Registered Address" value={`${org.address}, ${org.city}, ${org.district}, ${org.state} - ${org.pinCode}`} />
              </div>
              <InfoRow icon={Globe} label="Jurisdiction Zone" value={org.jurisdiction} />
              <InfoRow icon={Globe} label="Website" value={org.website} />
              <InfoRow icon={Mail} label="Official Email" value={org.officialEmail} />
              <InfoRow icon={Phone} label="Office Phone" value={org.officialPhone} />
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Administrator Credentials">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 border-b border-slate-100 pb-4 mb-2">
                <InfoRow icon={Shield} label="Requested Login ID" value={org.loginId} />
              </div>
              <InfoRow icon={User} label="Admin Name" value={org.adminName} />
              <InfoRow icon={User} label="Designation" value={org.designation} />
              <InfoRow icon={FileText} label="Employee ID" value={org.empId} />
              <InfoRow icon={Phone} label="Mobile Number" value={org.mobile} />
              <div className="sm:col-span-2">
                <InfoRow icon={Mail} label="Admin Direct Email" value={org.adminEmail} />
              </div>
            </div>
          </Section>

          <Section title="Verification Documents">
            {org.documents.length === 0 ? (
              <p className="text-sm text-slate-500 font-medium">No documents uploaded.</p>
            ) : (
              <div className="space-y-3">
                {org.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/50 transition-colors gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-black text-slate-800 truncate">{doc.name}</div>
                      <div className="text-sm font-bold text-slate-400 mt-0.5">{doc.type}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setViewingDoc(doc)}
                        className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl border border-blue-200 transition-colors text-xs font-black text-secondary uppercase tracking-widest"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      <button
                        onClick={() => downloadDoc(doc.name)}
                        className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-250 transition-colors text-xs font-black text-emerald-700 uppercase tracking-widest"
                      >
                        <Download className="h-3.5 w-3.5" /> DL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

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
                  <div className="font-extrabold text-slate-800 text-sm leading-none">{viewingDoc.name}</div>
                  <div className="text-sm text-slate-400 font-bold mt-1.5">{viewingDoc.type}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadDoc(viewingDoc.name)}
                  className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-250 transition-colors text-xs font-black text-emerald-700 uppercase tracking-widest"
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
              {docBlobUrl ? (
                viewingDoc.name.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={docBlobUrl} className="w-full h-[60vh] border-0 rounded" title="Document Viewer" />
                ) : (
                  <img src={docBlobUrl} alt="Document" className="max-w-full max-h-[60vh] object-contain rounded shadow" />
                )
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-base font-black text-slate-700 uppercase tracking-wider">Loading Document...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizationApprovalDetails;
