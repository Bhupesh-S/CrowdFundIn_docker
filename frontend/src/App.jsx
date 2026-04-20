import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Components
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import CampaignList from './pages/CampaignList.jsx';
import CampaignDetail from './pages/CampaignDetail.jsx';
import CreateCampaign from './pages/CreateCampaign.jsx';
import Profile from './pages/Profile.jsx';
import Dashboard from './pages/Dashboard.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import MyDonations from './pages/MyDonations.jsx';
import AdminDashboard from './pages/AdminDashboardProfessional.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminSignup from './pages/AdminSignup.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminCampaigns from './pages/AdminCampaigns.jsx';
import AdminReports from './pages/AdminReports.jsx';
import AdminVerifyDonors from './pages/AdminVerifyDonors.jsx';
import AdminVerifyCampaigns from './pages/AdminVerifyCampaigns.jsx';
import AdminComplaints from './pages/AdminComplaints.jsx';
import AdminDonorHistory from './pages/AdminDonorHistory.jsx';
import Unauthorized from './pages/Unauthorized.jsx';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="App">
      {!isAdminRoute && <Navbar />}
      <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Register />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/signup" element={<AdminSignup />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/campaigns" element={<CampaignList />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/campaigns/:id/edit" element={<ProtectedRoute requiredRole="campaign_owner"><CreateCampaign /></ProtectedRoute>} />
            <Route path="/create-campaign" element={<ProtectedRoute requiredRole="campaign_owner"><CreateCampaign /></ProtectedRoute>} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-donations" 
              element={
                <ProtectedRoute>
                  <MyDonations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/verify-donors" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminVerifyDonors />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/verify-campaigns" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminVerifyCampaigns />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/complaints" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminComplaints />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/campaigns" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCampaigns />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reports" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/donor-history" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDonorHistory />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        {!isAdminRoute && <Footer />}
      </div>
  );
}

export default App;
