import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MarketingLayout from './layout/MarketingLayout';
import PortalLayout from './layout/PortalLayout';
import LandingPage from './pages/LandingPage';
import OrganizationServicesPage from './pages/OrganizationServicesPage';
import LoginPage from './pages/LoginPage';

import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

import PortalIndex from './pages/portal/PortalIndex';
import Profile from './pages/portal/Profile';

import RegistryDatabase from './pages/portal/police/RegistryDatabase';
import RiskTierGuide from './pages/portal/RiskTierGuide';
import PendingVerifications from './pages/portal/police/PendingVerifications';
import VerificationHistory from './pages/portal/police/VerificationHistory';
import OrganizationApprovals from './pages/portal/police/OrganizationApprovals';
import OrganizationApprovalDetails from './pages/portal/police/OrganizationApprovalDetails';
import OffenderDetail from './pages/portal/police/OffenderDetail';
import VerificationVetting from './pages/portal/police/VerificationVetting';
import SupportTickets from './pages/portal/police/SupportTickets';

import SystemAuditLog from './pages/portal/police/SystemAuditLog';

import SubmitVerification from './pages/portal/organization/SubmitVerification';
import VerificationRequests from './pages/portal/organization/VerificationRequests';
import VerifiedPersonnel from './pages/portal/organization/VerifiedPersonnel';
import PersonnelDetails from './pages/portal/organization/PersonnelDetails';
import VerificationDetails from './pages/portal/organization/VerificationDetails';
import LegalResources from './pages/portal/organization/LegalResources';
import ComplianceAndSupport from './pages/portal/organization/ComplianceAndSupport';
import RoleProtectedRoute from './components/RoleProtectedRoute';


function App() {
  return (
    <Router>
      <Routes>
        {/* Marketing site */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/services" element={<OrganizationServicesPage />} />

          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />

        {/* Protected role-based portal */}
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<PortalIndex />} />
          {/* Shared */}
          <Route path="profile" element={<Profile />} />
          <Route path="tiers" element={<RiskTierGuide />} />
          
          {/* Police Only Routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['police']} />}>
            <Route path="register" element={<RegistryDatabase />} />
            <Route path="register/:id" element={<OffenderDetail />} />
            <Route path="clearances" element={<PendingVerifications />} />
            <Route path="clearances/:id" element={<VerificationVetting />} />
            <Route path="clearance-history" element={<VerificationHistory />} />
            <Route path="clearance-history/:id" element={<VerificationVetting />} />
            <Route path="org-verify" element={<OrganizationApprovals />} />
            <Route path="org-verify/:id" element={<OrganizationApprovalDetails />} />
            <Route path="tickets" element={<SupportTickets />} />
            <Route path="audit" element={<SystemAuditLog />} />
          </Route>

          {/* Organization Only Routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['organization']} />}>
            <Route path="apply" element={<SubmitVerification />} />
            <Route path="requests" element={<VerificationRequests />} />
            <Route path="candidates" element={<VerifiedPersonnel />} />
            <Route path="candidates/:id" element={<PersonnelDetails />} />
            <Route path="track/:id" element={<VerificationDetails />} />
            <Route path="resources" element={<LegalResources />} />
            <Route path="compliance" element={<ComplianceAndSupport />} />
          </Route>

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
