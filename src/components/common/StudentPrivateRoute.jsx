import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from './Loader';

const StudentPrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  // Check if user is logged in
  return user ? <Outlet /> : <Navigate to="/student/login" />;
};

export default StudentPrivateRoute;
