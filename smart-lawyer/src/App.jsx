import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  // Navigate,
} from "react-router-dom";

import ProtectedRoute from "./components/authentication/ProtectedRoute";

// Landing Section
import Hero from "./components/landing/Hero";

// Registration
import Welcome from "./components/registration/admin/components/Welcome";
import RegisterFirm from "./components/registration/admin/RegisterFirm";

// // Super Admin
import SuperAdminDashboard from "./components/superadmin/Dashboard";

// // Services
import Services from "./components/Services";

import Login from "./components/authentication/Login";
import ClientSignin from "./components/authentication/ClientSignin";
import ClientDashboard from "./components/client/Dashboard";
import RoleSelection from "./components/authentication/RoleSelection";
import ForgotPassword from "./components/authentication/ForgotPassword";
import VerifyResetOTP from "./components/authentication/VerifyResetOTP";
import ResetPassword from "./components/authentication/ResetPassword";
import ChangePassword from "./components/authentication/ChangePassword";

import AdminProfile from "./components/admin/index-management/Dashboard";
// Staff components
import StaffDashboard from "./components/staff/index-component/DashboardStaff";

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Routes */}
        <Route
          path="/"
          element={
            // <ErrorBoundary>
            <Hero />
            // </ErrorBoundary>
          }
        />
        {/* Register Routes */}
        <Route
          path="/welcome"
          element={
            // <ErrorBoundary>
            <Welcome />
            // </ErrorBoundary>
          }
        />
        <Route
          path="/register-your-firm-as-an-admin"
          element={
            // <ErrorBoundary>
            <RegisterFirm />
            // </ErrorBoundary>
          }
        />
        {/* Super Admin Routes */}
        <Route
          path="/owner/dashboard"
          element={
            // <ErrorBoundary>
            <SuperAdminDashboard />
            // </ErrorBoundary>
          }
        />
        {/* Services Routes */}
        <Route
          path="/services/specialty/:specialtyName"
          element={
            // <ErrorBoundary>
            <Services />
            // </ErrorBoundary>
          }
        />
        <Route
          path="/services/:serviceSlug"
          element={
            // <ErrorBoundary>
            <Services />
            // </ErrorBoundary>
          }
        />

        <Route path="/auth" element={<RoleSelection />} />
        <Route path="/auth/client" element={<Login />} />
        <Route path="/auth/staff" element={<Login />} />
        <Route path="/auth/admin" element={<Login />} />

        {/* Client Registration Route */}
        <Route
          path="/register-yourself-as-a-client"
          element={<ClientSignin />}
        />

        {/* Unified Password Reset Routes - Works for both Admin and Client */}
        <Route
          path="/auth/admin/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/auth/admin/verify-reset-otp"
          element={<VerifyResetOTP />}
        />
        <Route path="/auth/admin/reset-password" element={<ResetPassword />} />

        {/* Client Password Reset Routes - Uses same unified components */}
        <Route
          path="/auth/client/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/auth/client/verify-reset-otp"
          element={<VerifyResetOTP />}
        />
        <Route path="/auth/client/reset-password" element={<ResetPassword />} />

        {/* Unified Change Password Route - Works for both Admin and Client */}
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Username-based Admin routes */}
        <Route
          path="/admin/:username"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/home"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/profile"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/cases"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/hearings"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/documents"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/judgments"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/clients"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/staff-directory"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/add-staff"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/messages"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/notifications"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/contracts"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/add-agreement"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/edit-agreement"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/view-agreement"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/billing"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/billing/add"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/billing/edit/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/billing/view/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/settings"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:username/cases/:caseNumber"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }
        />

        {/* Staff Routes with username prefix - single dashboard mirrors AdminProfile */}
        <Route
          path="/staff/:username"
          element={
            <ProtectedRoute requiredRole="staff">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/:username/home"
          element={
            <ProtectedRoute requiredRole="staff">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/:username/profile"
          element={
            <ProtectedRoute requiredRole="staff">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/:username/cases"
          element={
            <ProtectedRoute requiredRole="staff">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/:username/documents"
          element={
            <ProtectedRoute requiredRole="staff">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/:username/calendar"
          element={
            <ProtectedRoute requiredRole="staff">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        {/* Staff AI Tools - simplified tool route */}
        <Route
          path="/staff/:username/:toolId"
          element={
            <ProtectedRoute requiredRole="staff">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Client routes with username prefix */}
        <Route
          path="/client/:username"
          element={
            <ProtectedRoute requiredRole="client">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
