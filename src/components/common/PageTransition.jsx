import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

// Keying the outlet restarts the entrance animation without delaying navigation.
// This keeps every link and browser back/forward action reliable.
const PageTransition = () => {
  const location = useLocation();
  const routeKey = `${location.pathname}${location.search}`;

  return (
    <div key={routeKey} className="page-transition page-transition--enter">
      <Outlet />
    </div>
  );
};

export default PageTransition;
