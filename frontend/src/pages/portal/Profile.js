import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/portal/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Building, MapPin, Mail, UserCheck, FileCode, Award, Eye, X, Download, FileText } from 'lucide-react';

function Profile() {
  const { auth } = useAuth();
  const isOrg = auth?.role === 'organization';

  const [previewDoc, setPreviewDoc] = useState(null);

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

  // Registration data mock template
  const mockOrgProfile = {
    appId: 'REG-2026-88341',
    orgName: auth?.name || 'Little Scholars School',
    orgType: 'School',
    parentOrg: 'Little Scholars Educational Trust',
    department: 'Primary & Secondary Sections',
    jurisdiction: 'Cyberabad Commissionerate (West Zone)',
    
    country: 'India',
    state: 'Telangana',
    district: 'Ranga Reddy',
    city: 'Kondapur, Serilingampally',
    address: 'Plot 45, Survey 12, Kondapur Main Road',
    pinCode: '500084',
    
    officialEmail: 'admin@littlescholars.edu.in',
    officialPhone: '040-23456780',
    altPhone: '98480-22338',
    website: 'https://www.littlescholars.edu.in',
    
    adminName: 'Dr. K. Madhav Rao',
    designation: 'Principal & Head of Institution',
    empId: 'LSS-PR-002',
    mobile: '98765-43210',
    
    docs: [
      { 
        id: 'doc-auth',
        name: 'Authorization_Letter_LSS.pdf', 
        size: '1.2 MB',
        title: 'Institution Authorization Letter',
        issuedBy: 'Little Scholars Educational Trust Board',
        date: '12-05-2026',
        text: 'This letter formally authorizes Dr. K. Madhav Rao (Principal) to act as the primary licensee administrator for the State Sexual Offender Register (SSOR) portal verification cell on behalf of the trust.'
      },
      { 
        id: 'doc-reg',
        name: 'Govt_School_Registration_TS.pdf', 
        size: '2.4 MB',
        title: 'Telangana State School Registration Cert',
        issuedBy: 'Department of School Education, Govt of TS',
        date: '04-03-2018',
        text: 'School Registration Reference: SERI-RR-2018-8420. This certificate verifies that Little Scholars School is registered under the Telangana Education Act, and is fully recognized as an active co-educational primary and secondary school.'
      },
      { 
        id: 'doc-noc',
        name: 'NOC_Fire_Safety_2025.pdf', 
        size: '1.8 MB',
        title: 'NOC / Fire Safety Compliance Certificate',
        issuedBy: 'Telangana State Disaster Response & Fire Services',
        date: '10-09-2025',
        text: 'Reference ID: NOC/FS/2025/1104. This certifies that the school building premises at Plot 45, Kondapur, has undergone testing and complies with all state safety specifications and disaster response directives.'
      }
    ]
  };

  const mockPoliceProfile = {
    badgeId: auth?.loginId || 'ISP-8842',
    name: auth?.name || 'Insp. G. Madhusudhan Rao',
    rank: 'Inspector of Police',
    empId: 'TS-POL-41922',
    department: 'Crime Investigation Department (CID)',
    wing: 'Anti-Human Trafficking & Child Vetting Cell',
    jurisdiction: auth?.clearance || 'Cyberabad Commissionerate (West Zone)',
    joiningDate: '12-08-2018',
    email: 'g.m.rao@tspolice.gov.in',
    mobile: '94906-17204',
    altPhone: '040-23004122',
    station: 'Miyapur Police Station',
    district: 'Cyberabad Commissionerate',
    state: 'Telangana',
    country: 'India',
    clearanceLevel: 'Level 3 Registry Administrator (Full Access)',
    docs: [
      {
        id: 'doc-badge',
        name: 'Inspector_Badge_Vetted.pdf',
        size: '1.4 MB',
        title: 'Official Officer Identity Badge Vetting',
        issuedBy: 'Director General of Police, Telangana State',
        date: '15-08-2022',
        text: 'This verifies that Inspector G. Madhusudhan Rao (Badge ID: ISP-8842) is a sworn officer of the Telangana State Police Force, currently assigned to the State Sexual Offender Register Oversight Cell.'
      },
      {
        id: 'doc-deputation',
        name: 'SSOR_Deputation_Order_2024.pdf',
        size: '1.9 MB',
        title: 'SSOR Cell Deputation Order',
        issuedBy: 'Home Department, Govt of Telangana State',
        date: '10-01-2024',
        text: 'Deputation Order Ref: HD/TS/SSOR/2024/90. Inspector G. Madhusudhan Rao is officially deputed to head the security and validation desks of the Cyberabad division of the SSOR disclosable register portal.'
      }
    ]
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
                {/* Official seal mock */}
                <div className="absolute right-6 top-6 opacity-10 pointer-events-none select-none">
                  <Award className="w-24 h-24 text-primary" />
                </div>

                <div className="border-b border-slate-100 pb-3 text-center">
                  <h4 className="text-xs font-black text-slate-800 uppercase font-heading tracking-wider">{previewDoc.title}</h4>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">TS Government Registry Portal Vetted Document</span>
                </div>

                <div className="space-y-3 text-xs text-slate-650 leading-relaxed font-medium">
                  <p>{previewDoc.text}</p>
                  
                  <p>This credential remains active and linked to account ID <strong>{mockOrgProfile.appId}</strong>. Verified in active SSOR repository checks.</p>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between text-[8px] font-mono text-slate-400 font-bold">
                  <div>ISSUED BY: {previewDoc.issuedBy}</div>
                  <div>DATE: {previewDoc.date}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-100/50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => alert(`Downloading official PDF copy of ${previewDoc.name}`)}
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
