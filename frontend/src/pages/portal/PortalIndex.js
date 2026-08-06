import { useAuth } from '../../context/AuthContext';
import PoliceDashboard from './police/PoliceDashboard';
import OrganizationDashboard from './organization/OrganizationDashboard';

function PortalIndex() {
  const { auth } = useAuth();
  if (['police', 'STATE_ADMIN', 'DISTRICT_USER'].includes(auth?.role)) {
    return <PoliceDashboard />;
  }
  return <OrganizationDashboard />;
}

export default PortalIndex;
