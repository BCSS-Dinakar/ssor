import React from 'react';
import { useAuth } from '../../context/AuthContext';
import UserGuide from './police/UserGuide';
import OrgUserGuide from './organization/OrgUserGuide';

function UserGuideDispatcher() {
  const { auth } = useAuth();

  if (auth?.role === 'police') {
    return <UserGuide />;
  }
  
  return <OrgUserGuide />;
}

export default UserGuideDispatcher;
