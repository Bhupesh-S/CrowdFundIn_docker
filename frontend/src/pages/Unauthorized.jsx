import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="container text-center py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="error-page">
            <h1 className="display-1 text-danger">403</h1>
            <h2 className="mb-4">Access Denied</h2>
            <p className="lead mb-4">
              Sorry, you don't have permission to access this page.
            </p>
            
            {user && (
              <div className="alert alert-info mb-4">
                <strong>Current Role:</strong> {user.role || 'No role assigned'}
                <br />
                <small className="text-muted">
                  This page requires different permissions than your current role.
                </small>
              </div>
            )}

            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button 
                className="btn btn-secondary" 
                onClick={handleGoBack}
              >
                Go Back
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleGoHome}
              >
                Go Home
              </button>
              {user?.role !== 'admin' && (
                <Link to="/profile" className="btn btn-outline-primary">
                  View Profile
                </Link>
              )}
            </div>

            <div className="mt-4">
              <small className="text-muted">
                Need different permissions? Contact an administrator or{' '}
                <Link to="/contact" className="text-decoration-none">
                  contact support
                </Link>.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;