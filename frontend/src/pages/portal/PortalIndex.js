import { useAuth } from '../../context/AuthContext';
import PoliceDashboard from './police/PoliceDashboard';
import OrganizationDashboard from './organization/OrganizationDashboard';

function PortalIndex() {
  const { auth } = useAuth();
  if (auth?.role === 'police') return <PoliceDashboard />;
  return <OrganizationDashboard />;
}

export default PortalIndex;
