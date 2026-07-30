import React from 'react';
import { Printer } from 'lucide-react';

function OrgUserGuide() {
  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Print-specific CSS overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide non-printable layout elements */
          aside, header, nav, footer, .print\\:hidden, button {
            display: none !important;
          }
          
          /* Reset outer body and html */
          body, html, #root {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Clear sidebar left padding offset */
          .min-h-dvh {
            padding-left: 0 !important;
          }

          /* Prevent page breaks inside sections and images */
          section {
            page-break-inside: avoid !important;
          }
          img {
            max-height: 3in !important;
            page-break-inside: avoid !important;
          }
        }
      `}} />

      {/* Custom Page Header to avoid duplicate titles and layout gaps */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider font-bold leading-none text-slate-400 flex items-center gap-1.5 mb-1.5">
            <span>Organization</span>
            <span className="text-slate-300">/</span>
            <span className="text-indigo-600">User Guide</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
            Operational processes, vetting requests, and compliance guides for registered institutions.
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <Printer className="h-4 w-4" /> Print Guide
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="p-6 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-2xl text-slate-800 space-y-10 print:p-0 print:border-none print:shadow-none print:bg-transparent">
        
        {/* Print-Only Document Title */}
        <div className="hidden print:block border-b border-slate-200 pb-4 mb-6">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest font-mono">
            Official Manual
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            SSOR Portal User Guide (Institution Console)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Operational processes, vetting requests, and compliance guides for registered institutions.
          </p>
        </div>

        {/* System Vetting Process Timeline */}
        <section className="space-y-6">
          <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-2">
            Verification Work Flow
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Below is the lifecycle of a candidate background check from submission to clearance download:
          </p>
          
          <div className="space-y-1 mt-4">
            {/* Step 1 */}
            <div className="flex gap-4 items-start">
              <div className="flex flex-col items-center shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-600 shadow-2xs">
                  1
                </div>
                <div className="w-0.5 h-10 bg-slate-200 mt-1"></div>
              </div>
              <div className="space-y-1 pb-4">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Onboarding & Approvals</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Register your institution with official details and upload your Government Registration Certificate and Authorization Letters.
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="flex gap-4 items-start">
              <div className="flex flex-col items-center shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 border border-red-200 text-xs font-bold text-red-600 shadow-2xs">
                  2
                </div>
                <div className="w-0.5 h-10 bg-slate-200 mt-1"></div>
              </div>
              <div className="space-y-1 pb-4">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Clearance Request Submission</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Input the candidate's profile details and upload the mandatory signed candidate consent form.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 items-start">
              <div className="flex flex-col items-center shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-600 shadow-2xs">
                  3
                </div>
                <div className="w-0.5 h-10 bg-slate-200 mt-1"></div>
              </div>
              <div className="space-y-1 pb-4">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Vetting & Review</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The request is sent to the police queue. Officers run automated database queries and complete verification checks.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 items-start">
              <div className="flex flex-col items-center shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-600 shadow-2xs">
                  4
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Certificate Download</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Access the outcome status on your dashboard. If cleared, download the secure, tamper-proof background check clearance certificate.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1 */}
        <section className="space-y-3 border-l-3 border-indigo-500 pl-4">
          <h2 className="text-base font-bold text-slate-900">
            1. Institutional Access & Credentials
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            To protect citizen privacy, only vetted organizations are allowed portal access.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-xs leading-relaxed">
            <li>
              <strong>Mandatory Documents:</strong> Upload your official Government Registration Certificate and Institutional Authorization Letters.
            </li>
            <li>
              <strong>Access Vetting:</strong> Police administrators check these documents to confirm the legitimacy of your institution before approving portal access.
            </li>
            <li>
              <strong>Permissions:</strong> Approved organizations gain the ability to submit background checks, track historical outcomes, and print signed clearance records.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 border-l-3 border-red-500 pl-4">
          <h2 className="text-base font-bold text-slate-900">
            2. Submitting Background Verification Checks
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            Registered organizations can run background clearance searches on prospective employees, such as school teachers, care home helpers, or transport staff.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-xs leading-relaxed">
            <li>
              <strong>Consent is Mandatory:</strong> Under privacy compliance rules, you MUST upload a signed physical consent form from the candidate. Background checks without consent will be blocked by police review.
            </li>
            <li>
              <strong>Required Fields:</strong> Candidate Full Name, Aadhaar/Government ID, Mobile Number, and Vetting Role/Designation.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 border-l-3 border-emerald-500 pl-4">
          <h2 className="text-base font-bold text-slate-900">
            3. Request Tracking & Vetting Statuses
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            You can monitor the vetting process in real-time under the "Clearance Requests" tab.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-xs leading-relaxed">
            <li>
              <strong>Pending:</strong> Request is successfully queued and waiting for police database checks.
            </li>
            <li>
              <strong>Under Review:</strong> Police are actively checking matching record indices or investigating potential database matches.
            </li>
            <li>
              <strong>Cleared:</strong> The candidate has no sexual offender records found. A printable clearance certificate has been issued.
            </li>
            <li>
              <strong>Denied:</strong> The candidate matched database offender records. Clearance is refused.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 border-l-3 border-amber-500 pl-4">
          <h2 className="text-base font-bold text-slate-900">
            4. Clearance Certificates & Public QR Verification
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            Cleared candidates receive an official background verification certificate.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-xs leading-relaxed">
            <li>
              <strong>Download PDF:</strong> Printable certificates are kept securely inside the "Cleared Personnel" section.
            </li>
            <li>
              <strong>Tamper-Proof Verification:</strong> Each certificate contains a unique QR code and signature token. Auditing authorities can verify its validity instantly by scanning the QR code, directing them to the public portal validation gateway.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 border-l-3 border-slate-500 pl-4">
          <h2 className="text-base font-bold text-slate-900">
            5. Safety Helpline & Police Desk Support
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            If you encounter vetting disputes or have compliance inquiries:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-xs leading-relaxed">
            <li>
              <strong>Support Tickets:</strong> Open a support ticket on the dashboard to chat directly with the registry administration desk.
            </li>
            <li>
              <strong>Emergency assistance:</strong> Access the emergency SHE Teams and women/child safety helplines listed in the dashboard support panel.
            </li>
          </ul>
        </section>

        {/* Footer reference note */}
        <div className="border-t border-slate-200 pt-6 mt-8 text-xs text-slate-500 leading-relaxed font-medium">
          <p>
            <strong>Reference Note:</strong> For advanced operational vetting instructions, refer to the full <em>SSOR Organization Console Usage Document</em> stored under the <code>doc/</code> directory in the registry repository.
          </p>
        </div>

      </div>
    </div>
  );
}

export default OrgUserGuide;
