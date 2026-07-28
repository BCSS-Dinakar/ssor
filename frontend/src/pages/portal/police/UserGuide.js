import React from 'react';
import { Printer } from 'lucide-react';

function UserGuide() {
  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Print-specific CSS overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide non-printable layout elements */
          aside, header, nav, footer, .print\\:hidden, button {
            display: none !important;
          }
          
          /* Remove layout container offsets and spacing */
          body, html, #root, .min-h-dvh, .flex, main, .portal-content {
            padding: 0 !important;
            margin: 0 !important;
            left: 0 !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            transform: none !important;
            background: white !important;
            color: black !important;
          }
          
          .lg\\:pl-64, .2xl\\:pl-80 {
            padding-left: 0 !important;
          }

          /* Clear borders and shadows for print paper */
          .bg-white, .p-6, .sm\\:p-8 {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          
          /* Page break behaviors */
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
            <span>Police</span>
            <span className="text-slate-300">/</span>
            <span className="text-indigo-600">User Guide</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
            Operational processes and workflows for Telangana Police Officials.
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
            SSOR Application Process & Flow Guide (Police Console)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Operational processes and workflows for Telangana Police Officials.
          </p>
        </div>
        
        {/* System Vetting Process Timeline */}
        <section className="space-y-6">
          <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-2">
            System Vetting Process Flow
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Below is the operational sequence for processing institutional requests and database vetting:
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
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Request Submission</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Approved organizations submit candidate details (Aadhaar, Name, Mobile) for background checks.
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
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Database Matching</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The SSOR engine automatically runs background queries across CCTNS, ePetty Cases, and the ePrisons release gateway.
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
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Police Vetting Review</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Police administrators log in, open the pending request, and inspect details of any matched record across database tabs.
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
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Decision & Dispatch</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The officer clicks either "Issue Clearance" or "Deny Clearance". The system issues a signed clearance certificate to the organization.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1 */}
        <section className="space-y-3 border-l-3 border-indigo-500 pl-4">
          <h2 className="text-base font-bold text-slate-900">
            1. Registry Database & Risk Classification
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            The State Sexual Offender Registry (SSOR) is a secure, conviction-based repository of sexual offenders across all 33 districts of Telangana. Access is strictly controlled under a closed-loop vetting model.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-xs leading-relaxed">
            <li>
              <strong>Search Parameters:</strong> Search the database by Name, Aadhaar ID, or specific Criminal Case Numbers.
            </li>
            <li>
              <strong>Threat Tiering:</strong> Offenders are classified into Red (High Risk, POCSO/Gang Rape), Orange (Repeat Offender), or Green (Isolated/Low Risk) with strict retention rules for each.
            </li>
            <li>
              <strong>GIS Console:</strong> The main dashboard uses a map colored by risk tier to identify hotspots and active density counts.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 border-l-3 border-red-500 pl-4">
          <h2 className="text-base font-bold text-slate-900">
            2. ePrisons Real-Time Release Monitoring
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            A direct API gateway connects the portal with the NIC ePrisons database, facilitating the real-time tracking of active and upcoming prisoner releases.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-xs leading-relaxed">
            <li>
              <strong>Release Alerts:</strong> Blinking markers on the map highlight districts with recent release entries.
            </li>
            <li>
              <strong>Detailed Surveillance:</strong> Hovering or clicking on districts displays the released prisoner's name, parentage, release date, sections of law, and the assigned tracking task force.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 border-l-3 border-emerald-500 pl-4">
          <h2 className="text-base font-bold text-slate-900">
            3. Organization Vetting & Onboarding
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            Police officials must manage access requests from vetting institutions (schools, creches, care homes, and transport operators) before they can submit background checks.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-xs leading-relaxed">
            <li>
              <strong>Verification:</strong> Review uploaded Government Registration Certificates and Institutional Authorization Letters.
            </li>
            <li>
              <strong>Actions:</strong> Approve or decline institutional access requests within the 'Organization Approvals' panel to grant or restrict their dashboard console.
            </li>
          </ul>
          
          {/* Visual Illustration */}
          <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex flex-col items-center max-w-sm mt-3">
            <img 
              src="/images/institution-verify.png" 
              alt="Organization Vetting Dashboard" 
              className="max-h-36 rounded shadow-2xs border border-slate-200/60 object-contain"
            />
            <span className="text-[10px] text-slate-400 font-semibold mt-2">
              Verification panel for checking uploaded certificates
            </span>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 border-l-3 border-amber-500 pl-4">
          <h2 className="text-base font-bold text-slate-900">
            4. Candidate Verification Flow (Vetting Process)
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            When an approved organization requests a background check for a candidate, police officials run the verification flow.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-xs leading-relaxed">
            <li>
              <strong>Triple DB Matching:</strong> The engine queries CCTNS, ePetty Cases, and ePrisons databases.
            </li>
            <li>
              <strong>Review & Decision:</strong> Compare candidate details against matching records across database tabs. Make a vetting decision by selecting 'Issue Clearance' or 'Deny Clearance'.
            </li>
            <li>
              <strong>Deliverable:</strong> Once confirmed, the system signs a verification certificate and sends a secure outcome status directly to the requesting organization.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 border-l-3 border-slate-500 pl-4">
          <h2 className="text-base font-bold text-slate-900">
            5. Audit & Compliance Protocols
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            In compliance with the Puttaswamy Judgement, access to the registry is strictly audited.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-xs leading-relaxed">
            <li>
              <strong>Immutable Logs:</strong> Every search query, profile check, or clearance decision is recorded permanently in the System Audit Log, including officer ID, timestamp, and IP address.
            </li>
            <li>
              <strong>Privacy Assurance:</strong> The database does not publish open public lists, preventing vigilantism and protecting legal rehabilitation guidelines.
            </li>
          </ul>

          {/* Visual Illustration */}
          <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex flex-col items-center max-w-sm mt-3">
            <img 
              src="/images/controlled-access.png" 
              alt="System Audit Logs and Controlled Access" 
              className="max-h-36 rounded shadow-2xs border border-slate-200/60 object-contain"
            />
            <span className="text-[10px] text-slate-400 font-semibold mt-2">
              Controlled and fully audited institutional access flow
            </span>
          </div>
        </section>

        {/* Footer reference note */}
        <div className="border-t border-slate-200 pt-6 mt-8 text-xs text-slate-500 leading-relaxed font-medium">
          <p>
            <strong>Reference Note:</strong> For advanced operational vetting instructions, refer to the full <em>SSOR Police Officials Usage Document</em> stored under the <code>doc/</code> directory in the registry repository.
          </p>
        </div>

      </div>
    </div>
  );
}

export default UserGuide;
