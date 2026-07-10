/**
 * Opens a print window with a beautifully styled Police Clearance Certificate.
 * Allows the user to print or save it as a PDF directly.
 */
export const downloadClearanceCertificate = (record) => {
  const referenceId = record.id;
  const candidateName = record.candidate || record.candidateName;
  const dob = record.dob;
  const role = record.role;
  const org = record.org || record.orgName || 'Registered Institution';
  const issueDate = record.decisionDate || record.submitted || new Date().toLocaleDateString('en-GB');

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Police Clearance Certificate - ${candidateName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            padding: 40px;
            background: #ffffff;
            display: flex;
            justify-content: center;
          }
          .certificate {
            border: 10px double #cbd5e1;
            padding: 50px;
            width: 700px;
            background: #faf8f5;
            position: relative;
            box-sizing: border-box;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 26px;
            font-weight: 800;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .subtitle {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #64748b;
            margin-top: 5px;
          }
          .title {
            font-size: 20px;
            font-weight: 800;
            text-align: center;
            color: #0f172a;
            margin-bottom: 30px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .details {
            margin-bottom: 40px;
            line-height: 1.8;
          }
          .details p {
            margin: 10px 0;
            font-size: 14px;
          }
          .details strong {
            color: #0f172a;
          }
          .footer {
            margin-top: 50px;
            border-top: 2px dashed #cbd5e1;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #64748b;
          }
          .signature {
            text-align: right;
          }
          .stamp {
            border: 3px solid #10b981;
            color: #10b981;
            padding: 8px 15px;
            font-weight: 800;
            text-transform: uppercase;
            transform: rotate(-10deg);
            display: inline-block;
            margin-top: 15px;
            border-radius: 4px;
            font-size: 14px;
          }
          @media print {
            body { padding: 0; }
            .certificate { border: 10px double #000000; background: #ffffff; }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <div class="logo">Telangana State Police</div>
            <div class="subtitle">Official Vetting Clearance Register</div>
          </div>
          
          <div class="title">Police Clearance Certificate</div>
          
          <div class="details">
            <p>Reference Token: <strong>${referenceId}</strong></p>
            <p>Issue Date: <strong>${issueDate}</strong></p>
            <p>Candidate Name: <strong>${candidateName}</strong></p>
            <p>Date of Birth: <strong>${dob || '—'}</strong></p>
            <p>Requesting Authority: <strong>${org}</strong></p>
            <p>Designated Target Seat: <strong>${role || 'Staff'}</strong></p>
            <p style="margin-top: 20px; font-size: 13px; color: #475569;">
              This certifies that candidate <strong>${candidateName}</strong> has been cross-checked against the Central Conviction Registry and the state crime registers. No disclosable criminal record was identified. The vetting clearance certificate is officially issued and valid for 365 days.
            </p>
          </div>
          
          <div class="stamp">Approved Clearance</div>
          
          <div class="footer">
            <div>
              <span>SECURED DIGITAL ID: SHA-256 REGISTERED</span><br/>
              <span style="font-family: monospace; font-size: 9px;">${referenceId.split('-')[0].toUpperCase()} - SECURITY VERIFIED</span>
            </div>
            <div class="signature">
              <strong>Controller of Registries</strong><br/>
              <span>SSOR Vetting Authority</span>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
