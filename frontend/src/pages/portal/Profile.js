import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/portal/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Building, MapPin, Mail, UserCheck, FileCode, Award, Eye, X, Download, FileText } from 'lucide-react';
import api from '../../api/api';

function Profile() {
  const { auth } = useAuth();
  const isOrg = auth?.role === 'organization';

  const [previewDoc, setPreviewDoc] = useState(null);
  const [docBlobUrl, setDocBlobUrl] = useState(null);
  const [isDocLoading, setIsDocLoading] = useState(false);

  useEffect(() => {
    if (previewDoc) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [previewDoc]);

  useEffect(() => {
    if (previewDoc) {
      setDocBlobUrl(null);
      setIsDocLoading(true);
      // We use the new generic auth route for fetching docs
      api.get(`/auth/documents/${previewDoc.name}`, { responseType: 'blob' })
        .then(res => {
          const url = URL.createObjectURL(res.data);
          setDocBlobUrl(url);
        })
        .catch(err => console.error("Failed to fetch doc blob", err))
        .finally(() => setIsDocLoading(false));
    } else {
      if (docBlobUrl) {
        URL.revokeObjectURL(docBlobUrl);
        setDocBlobUrl(null);
      }
    }
  }, [previewDoc]);

  const downloadDoc = async (filename) => {
    try {
      const res = await api.get(`/auth/documents/${filename}`, { responseType: 'blob' });
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

  const o = auth?.organizationProfile || {};
  const meta = auth?.documentMetadata || {};

  const getDocMeta = (filename, defaultTitle, defaultText) => {
    const m = meta[filename] || {};
    return {
      id: `doc-${filename}`,
      name: filename,
      size: m.size ? `${m.type} • ${m.size}` : 'Unknown Size',
      title: defaultTitle,
      issuedBy: 'Uploaded via Registration',
      date: m.date || 'N/A',
      text: defaultText
    };
  };

  const mockOrgProfile = {
    appId: o.id || 'REG-PENDING',
    orgName: o.orgName || auth?.name || 'N/A',
    orgType: o.orgType || 'N/A',
    parentOrg: o.parentOrg || 'N/A',
    department: o.department || 'N/A',
    jurisdiction: o.jurisdiction || 'N/A',

    country: o.country || 'N/A',
    state: o.state || 'N/A',
    district: o.district || 'N/A',
    city: o.city || 'N/A',
    address: o.address || 'N/A',
    pinCode: o.pinCode || 'N/A',

    officialEmail: o.officialEmail || 'N/A',
    officialPhone: o.officialPhone || 'N/A',
    altPhone: o.altPhone || 'N/A',
    website: o.website || 'N/A',

    adminName: o.adminName || 'N/A',
    designation: o.designation || 'N/A',
    empId: o.empId || 'N/A',
    mobile: o.mobile || 'N/A',

    docs: [
      o.authLetterPath && getDocMeta(
        o.authLetterPath, 
        'Institution Authorization Letter', 
        'This letter formally authorizes the administrator to act as the primary licensee for the SSOR portal.'
      ),
      o.govCertPath && getDocMeta(
        o.govCertPath, 
        'Government Registration Certificate', 
        'This certificate verifies the organization is registered and recognized.'
      ),
      o.supportingDocsPaths && o.supportingDocsPaths.length > 0 && getDocMeta(
        o.supportingDocsPaths[0], 
        'Supporting Document', 
        'Additional supporting compliance document.'
      )
    ].filter(Boolean)
  };

  const p = auth?.policeProfile || {};
  const mockPoliceProfile = {
    badgeId: p.badgeId || auth?.loginId || 'N/A',
    name: p.name || auth?.name || 'N/A',
    rank: p.rank || 'N/A',
    empId: p.empId || 'N/A',
    department: p.department || 'N/A',
    wing: p.wing || 'N/A',
    jurisdiction: p.jurisdiction || 'N/A',
    joiningDate: p.joiningDate || 'N/A',
    email: p.email || 'N/A',
    mobile: p.mobile || 'N/A',
    altPhone: p.altPhone || 'N/A',
    station: p.station || 'N/A',
    district: p.district || 'N/A',
    state: p.state || 'N/A',
    country: p.country || 'N/A',
    clearanceLevel: p.clearanceLevel || 'N/A',
    docs: (p.docsPaths || []).map((path) => getDocMeta(
      path,
      'Uploaded Document',
      'This is an uploaded supporting document.'
    ))
  };

  return (
    <div className="space-y-6 w-full font-body relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <PageHeader
          crumb="Licence Credentials"
          title={isOrg ? "Licence Credentials" : "Officer Credentials"}
          subtitle="View verified institutional registration profiles and authorization parameters."
        />
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isOrg ? 'Registry App ID' : 'Officer Badge ID'}</span>
          <div className="text-xs font-mono font-bold text-secondary mt-0.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            {isOrg ? mockOrgProfile.appId : mockPoliceProfile.badgeId}
          </div>
        </div>
      </div>

      {isOrg ? (
        /* Double Column Split Layout to occupy the Full Space */
        <div className="grid lg:grid-cols-3 gap-6 w-full items-start">

          {/* Column 1 (Left 1/3): Summary & Documents Locker */}
          <div className="space-y-6 lg:col-span-1">
            {/* Simple Core Badge */}
            <div className="card p-5 bg-gradient-to-br from-primary to-[#0f2a4a] text-white border-0 shadow-md rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full filter blur-xl"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="h-5.5 w-5.5 text-accent" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white font-heading uppercase tracking-wider">Clearance License</h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-0.5">
                    Active & Approved
                  </span>
                </div>
              </div>
              <div className="border-t border-white/10 mt-4 pt-3 text-[10px] font-mono space-y-1.5 text-blue-100">
                <div className="flex justify-between">
                  <span>Authorized role:</span>
                  <span className="text-white font-bold">Level 2 (Child-Facing)</span>
                </div>
                <div className="flex justify-between">
                  <span>Quota usage:</span>
                  <span className="text-white font-bold">12 / 50 Checks YTD</span>
                </div>
              </div>
            </div>

            {/* Document locker */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileCode className="h-4.5 w-4.5 text-secondary" />
                <h4 className="text-xs font-bold text-primary font-heading uppercase tracking-wider">Registration Uploads</h4>
              </div>
              <div className="space-y-2.5">
                {mockOrgProfile.docs.map((doc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-100/50 transition-colors gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-800 font-extrabold truncate">{doc.name}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{doc.size}</div>
                    </div>
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1 text-[9px] font-bold text-secondary bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg shrink-0 transition-colors"
                    >
                      <Eye className="h-3 w-3" /> View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2 (Right 2/3): Full Specifications Grid */}
          <div className="lg:col-span-2 space-y-6">

            {/* Institution Specs */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building className="h-4.5 w-4.5 text-secondary" />
                <h4 className="text-xs font-bold text-primary font-heading uppercase tracking-wider">1. Institution Specifications</h4>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Organization Name</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockOrgProfile.orgName}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Organization Type</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockOrgProfile.orgType}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Parent Organization</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockOrgProfile.parentOrg}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Department Unit</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockOrgProfile.department}</div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Police Jurisdiction</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockOrgProfile.jurisdiction}</div>
                </div>
              </div>
            </div>

            {/* Registered Address */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <MapPin className="h-4.5 w-4.5 text-secondary" />
                <h4 className="text-xs font-bold text-primary font-heading uppercase tracking-wider">2. Registered Address</h4>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Physical Address</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockOrgProfile.address}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">City / Town</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockOrgProfile.city}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">District</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockOrgProfile.district}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">State / Country</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockOrgProfile.state}, {mockOrgProfile.country}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">PIN Code</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono">{mockOrgProfile.pinCode}</div>
                </div>
              </div>
            </div>

            {/* Contacts & Admin split */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Contacts */}
              <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Mail className="h-4.5 w-4.5 text-secondary" />
                  <h4 className="text-xs font-bold text-primary font-heading uppercase tracking-wider">3. Contacts</h4>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Email Address</span>
                    <div className="font-semibold text-slate-750 font-mono truncate">{mockOrgProfile.officialEmail}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Phone</span>
                    <div className="font-semibold text-slate-750 font-mono">{mockOrgProfile.officialPhone}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Website</span>
                    <div className="font-semibold text-slate-750 font-mono truncate">{mockOrgProfile.website}</div>
                  </div>
                </div>
              </div>

              {/* Admin */}
              <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <UserCheck className="h-4.5 w-4.5 text-secondary" />
                  <h4 className="text-xs font-bold text-primary font-heading uppercase tracking-wider">4. Administrator</h4>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Full Name</span>
                    <div className="font-semibold text-slate-750 truncate">{mockOrgProfile.adminName}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Designation</span>
                    <div className="font-semibold text-slate-750 truncate">{mockOrgProfile.designation}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Employee ID</span>
                    <div className="font-semibold text-slate-750 font-mono">{mockOrgProfile.empId}</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Double Column Split Layout for Police Profile */
        <div className="grid lg:grid-cols-3 gap-6 w-full items-start">

          {/* Column 1 (Left 1/3): Summary & Documents Locker */}
          <div className="space-y-6 lg:col-span-1">
            {/* Simple Core Badge */}
            <div className="card p-5 bg-gradient-to-br from-primary to-[#0f2a4a] text-white border-0 shadow-md rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full filter blur-xl"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="h-5.5 w-5.5 text-accent" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white font-heading uppercase tracking-wider">Access Clearance</h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-0.5">
                    Authorized Administrator
                  </span>
                </div>
              </div>
              <div className="border-t border-white/10 mt-4 pt-3 text-[10px] font-mono space-y-1.5 text-blue-100">
                <div className="flex justify-between">
                  <span>Duty Clearance:</span>
                  <span className="text-white font-bold">{mockPoliceProfile.clearanceLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Registry Role:</span>
                  <span className="text-white font-bold">{mockPoliceProfile.rank}</span>
                </div>
              </div>
            </div>

            {/* Document locker */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileCode className="h-4.5 w-4.5 text-secondary" />
                <h4 className="text-xs font-bold text-primary font-heading uppercase tracking-wider">Verification Uploads</h4>
              </div>
              <div className="space-y-2.5">
                {mockPoliceProfile.docs.map((doc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-100/50 transition-colors gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-800 font-extrabold truncate">{doc.name}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{doc.size}</div>
                    </div>
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1 text-[9px] font-bold text-secondary bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg shrink-0 transition-colors"
                    >
                      <Eye className="h-3 w-3" /> View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2 (Right 2/3): Full Specifications Grid */}
          <div className="lg:col-span-2 space-y-6">

            {/* Officer Specifications */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building className="h-4.5 w-4.5 text-secondary" />
                <h4 className="text-xs font-bold text-primary font-heading uppercase tracking-wider">1. Officer Specifications</h4>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Full Name</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockPoliceProfile.name}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Officer Rank / Role</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockPoliceProfile.rank}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Employee ID</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono">{mockPoliceProfile.empId}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Assigned Wing</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockPoliceProfile.wing}</div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Command Jurisdiction</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockPoliceProfile.jurisdiction}</div>
                </div>
              </div>
            </div>

            {/* Posting & Station details */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <MapPin className="h-4.5 w-4.5 text-secondary" />
                <h4 className="text-xs font-bold text-primary font-heading uppercase tracking-wider">2. Station Information</h4>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Primary Station</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockPoliceProfile.station}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Police District</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockPoliceProfile.district}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">State / Country</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5">{mockPoliceProfile.state}, {mockPoliceProfile.country}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Wing Deputation Date</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono">{mockPoliceProfile.joiningDate}</div>
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Mail className="h-4.5 w-4.5 text-secondary" />
                <h4 className="text-xs font-bold text-primary font-heading uppercase tracking-wider">3. Communication Contacts</h4>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Official Email</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono">{mockPoliceProfile.email}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Mobile Number</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono">{mockPoliceProfile.mobile}</div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Alternate Contact Helpline</span>
                  <div className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono">{mockPoliceProfile.altPhone}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Lock policy notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-start gap-3 mt-4">
        <Lock className="h-4.5 w-4.5 text-secondary shrink-0 mt-0.5" />
        <div>
          <strong>Immutable Security Policy:</strong> Personal details, licenses, and verified documents are strictly audit-locked and cannot be edited. If you need to make changes, please contact the Police Cell Help Desk.
        </div>
      </div>

      {/* 3. Document Viewer Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-[100] bg-slate-350/15 flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-none max-w-2xl w-[70vw] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary to-[#0f2a4a] text-white border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-accent" />
                <span className="text-xs font-bold font-heading">{previewDoc.name}</span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-350 hover:text-white transition-colors"
                aria-label="Close document viewer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>            {/* Document sheet */}
            <div className="p-6 bg-slate-50 flex-grow overflow-y-auto">
              <div className="bg-white border border-slate-200/80 rounded-none p-6 shadow-inner space-y-5 relative min-h-[300px]">
                {isDocLoading ? (
                  <div className="flex flex-col items-center justify-center h-[50vh]">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-slate-500 mt-4">Loading document...</p>
                  </div>
                ) : docBlobUrl ? (
                  previewDoc.name.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={docBlobUrl} className="w-full h-[60vh] border-0 rounded" title="Document Viewer" />
                  ) : (
                    <div className="flex justify-center bg-slate-100 rounded p-4 h-[60vh]">
                      <img src={docBlobUrl} alt="Document" className="max-w-full max-h-full object-contain shadow-sm" />
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
                    <Award className="w-16 h-16 mb-2 opacity-50" />
                    <p className="text-sm font-bold">Document preview unavailable</p>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-4 flex justify-between text-[8px] font-mono text-slate-400 font-bold">
                  <div>ISSUED BY: {previewDoc.issuedBy}</div>
                  <div>DATE: {previewDoc.date}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-100/50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => downloadDoc(previewDoc.name)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-none transition-all"
              >
                <Download className="h-3.5 w-3.5" /> Download PDF
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                className="btn-secondary py-1.5 px-4 rounded-none text-xs text-slate-700 hover:text-white border-slate-300 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
