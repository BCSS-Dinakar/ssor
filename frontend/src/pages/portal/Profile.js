import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/portal/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Building, MapPin, Mail, UserCheck, FileCode, Award, Eye, X, Download, FileText } from 'lucide-react';
import { authApi } from '../../api/auth.api';

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
    let activeUrl = null;
    if (previewDoc) {
      setDocBlobUrl(null);
      setIsDocLoading(true);
      authApi.getDocument(previewDoc.name)
        .then(res => {
          activeUrl = URL.createObjectURL(res.data);
          setDocBlobUrl(activeUrl);
        })
        .catch(err => console.error("Failed to fetch doc blob", err))
        .finally(() => setIsDocLoading(false));
    } else {
      setDocBlobUrl(null);
    }

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [previewDoc]);

  const downloadDoc = async (filename) => {
    try {
      const res = await authApi.getDocument(filename);
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
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <PageHeader
          crumb={isOrg ? "Administration / Profile" : "Officer / Credentials"}
          title={isOrg ? "Organization Profile" : "Officer Profile"}
          subtitle="View verified registration details and authorization parameters."
        />
        <div className="flex flex-col items-end shrink-0">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            {isOrg ? 'Registry App ID' : 'Officer Badge ID'}
          </span>
          <div className="text-sm font-mono font-bold text-secondary mt-0.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            {isOrg ? mockOrgProfile.appId : mockPoliceProfile.badgeId}
          </div>
        </div>
      </div>

      {isOrg ? (
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Column 1 (Left 1/3) */}
          <div className="space-y-6 lg:col-span-1">
            {/* Clearance Badge */}
            <div className="card p-5 bg-white border border-emerald-200 shadow-sm rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 font-heading uppercase tracking-wider">Access License</h4>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 mt-0.5">
                    Active & Approved
                  </span>
                </div>
              </div>
            </div>

            {/* Document locker */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileCode className="h-4.5 w-4.5 text-secondary" />
                <h4 className="text-sm font-bold text-primary font-heading uppercase tracking-wider">Verification Docs</h4>
              </div>
              <div className="space-y-3">
                {mockOrgProfile.docs.map((doc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-100 transition-colors gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-slate-800 font-extrabold truncate">{doc.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{doc.size}</div>
                    </div>
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-secondary bg-white border border-slate-200 hover:border-secondary hover:text-secondary px-2.5 py-1.5 rounded-lg shrink-0 transition-colors shadow-sm"
                    >
                      <Eye className="h-3 w-3" /> View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2 (Right 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building className="h-5 w-5 text-secondary" />
                <h4 className="text-base font-extrabold text-slate-800 font-heading">Institution Details</h4>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Organization Name</label>
                  <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockOrgProfile.orgName}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Organization Type</label>
                  <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockOrgProfile.orgType}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Parent Organization</label>
                  <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockOrgProfile.parentOrg}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Department Unit</label>
                  <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockOrgProfile.department}</div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Jurisdiction</label>
                  <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockOrgProfile.jurisdiction}</div>
                </div>
              </div>
            </div>

            <div className="card p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="h-5 w-5 text-secondary" />
                <h4 className="text-base font-extrabold text-slate-800 font-heading">Registered Address</h4>
              </div>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Physical Address</label>
                  <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockOrgProfile.address}</div>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">City</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockOrgProfile.city}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">District</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockOrgProfile.district}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">State</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockOrgProfile.state}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Country</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockOrgProfile.country}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">PIN</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm font-mono">{mockOrgProfile.pinCode}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Mail className="h-5 w-5 text-secondary" />
                  <h4 className="text-base font-extrabold text-slate-800 font-heading">Communication Details</h4>
                </div>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Official Email</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm font-mono truncate">{mockOrgProfile.officialEmail}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Official Phone</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm font-mono">{mockOrgProfile.officialPhone}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Alternate Phone</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm font-mono">{mockOrgProfile.altPhone}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Website</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm truncate">{mockOrgProfile.website}</div>
                  </div>
                </div>
              </div>

              <div className="card p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <UserCheck className="h-5 w-5 text-secondary" />
                  <h4 className="text-base font-extrabold text-slate-800 font-heading">Administrator</h4>
                </div>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockOrgProfile.adminName}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Designation</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockOrgProfile.designation}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Emp ID</label>
                      <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm font-mono">{mockOrgProfile.empId}</div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Mobile</label>
                      <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm font-mono">{mockOrgProfile.mobile}</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Personal Email</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm font-mono truncate">{o.adminEmail || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Police Column 1 */}
          <div className="space-y-6 lg:col-span-1">
            <div className="card p-5 bg-white border border-blue-200 shadow-sm rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 font-heading uppercase tracking-wider">Access Status</h4>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 mt-0.5">
                    Verified Officer
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileCode className="h-4.5 w-4.5 text-secondary" />
                <h4 className="text-sm font-bold text-primary font-heading uppercase tracking-wider">Officer Documents</h4>
              </div>
              <div className="space-y-3">
                {mockPoliceProfile.docs.map((doc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-100 transition-colors gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-slate-800 font-extrabold truncate">{doc.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{doc.size}</div>
                    </div>
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-secondary bg-white border border-slate-200 hover:border-secondary hover:text-secondary px-2.5 py-1.5 rounded-lg shrink-0 transition-colors shadow-sm"
                    >
                      <Eye className="h-3 w-3" /> View
                    </button>
                  </div>
                ))}
                {mockPoliceProfile.docs.length === 0 && (
                  <div className="text-center py-6 text-slate-400 font-bold text-sm">No documents uploaded.</div>
                )}
              </div>
            </div>
          </div>

          {/* Police Column 2 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <UserCheck className="h-5 w-5 text-secondary" />
                <h4 className="text-base font-extrabold text-slate-800 font-heading">Officer Specifications</h4>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockPoliceProfile.name}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Rank / Role</label>
                  <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockPoliceProfile.rank}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Employee ID</label>
                  <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm font-mono">{mockPoliceProfile.empId}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Department</label>
                  <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockPoliceProfile.department}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Assigned Wing</label>
                  <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockPoliceProfile.wing}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Jurisdiction</label>
                  <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockPoliceProfile.jurisdiction}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Deputation Date</label>
                  <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockPoliceProfile.joiningDate}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Clearance Level</label>
                  <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockPoliceProfile.clearanceLevel}</div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="card p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <MapPin className="h-5 w-5 text-secondary" />
                  <h4 className="text-base font-extrabold text-slate-800 font-heading">Station Posting</h4>
                </div>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Primary Station</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockPoliceProfile.station}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Police District</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockPoliceProfile.district}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">State</label>
                      <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockPoliceProfile.state}</div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Country</label>
                      <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">{mockPoliceProfile.country}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Mail className="h-5 w-5 text-secondary" />
                  <h4 className="text-base font-extrabold text-slate-800 font-heading">Contact Details</h4>
                </div>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Official Email</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm font-mono truncate">{mockPoliceProfile.email}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm font-mono">{mockPoliceProfile.mobile}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Alternate Phone</label>
                    <div className="text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm font-mono">{mockPoliceProfile.altPhone}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lock policy notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 flex items-start gap-3 mt-4">
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
                <span className="text-sm font-bold font-heading">{previewDoc.name}</span>
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
                    <p className="text-base font-bold text-slate-500 mt-4">Loading document...</p>
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
                    <p className="text-base font-bold">Document preview unavailable</p>
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
                className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-none transition-all"
              >
                <Download className="h-3.5 w-3.5" /> Download PDF
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                className="btn-secondary py-1.5 px-4 rounded-none text-sm text-slate-700 hover:text-white border-slate-300 font-bold"
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
