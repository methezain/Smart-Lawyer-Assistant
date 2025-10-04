import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();

  // Check authentication for both admin and client
  const token = localStorage.getItem("access_token");
  const adminToken = localStorage.getItem("admin_token");
  const clientToken = localStorage.getItem("clientToken");
  const userRole = localStorage.getItem("userRole");
  const userName = localStorage.getItem("user_name");
  const clientName = localStorage.getItem("client_name");

  // Check if user has valid authentication
  const isAuthenticated =
    !!(token || adminToken || clientToken) &&
    !!userRole &&
    !!(userName || clientName);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If a specific role is required, check if user has that role
  if (requiredRole && userRole !== requiredRole) {
    // Redirect based on user's actual role
    if (userRole === "admin") {
      return <Navigate to={`/admin/${userName}`} replace />;
    } else if (userRole === "staff") {
      return <Navigate to={`/staff/${userName}`} replace />;
    } else if (userRole === "client") {
      return <Navigate to={`/client/${clientName}`} replace />;
    } else {
      return <Navigate to="/auth" replace />;
    }
  }

  // For admin routes, verify the username in URL matches logged-in user
  if (userRole === "admin" && location.pathname.startsWith("/admin/")) {
    const urlUsername = location.pathname.split("/")[2];
    if (urlUsername && urlUsername !== userName) {
      // Redirect to correct admin username
      const newPath = location.pathname.replace(
        `/admin/${urlUsername}`,
        `/admin/${userName}`
      );
      return <Navigate to={newPath} replace />;
    }
  }

  // For staff routes, if using username-prefixed path, ensure it matches
  if (userRole === "staff" && location.pathname.startsWith("/staff/")) {
    const parts = location.pathname.split("/").filter(Boolean);
    // parts: ["staff", maybeUsername, ...]
    if (parts.length >= 2 && parts[1] !== userName) {
      // Redirect to the same path but with correct username
      const rest = parts.slice(2).join("/");
      const newPath = rest
        ? `/staff/${userName}/${rest}`
        : `/staff/${userName}`;
      return <Navigate to={newPath} replace />;
    }
  }

  // For client routes, enforce username in URL matches logged-in client
  if (userRole === "client" && location.pathname.startsWith("/client/")) {
    const urlUsername = location.pathname.split("/")[2];
    if (urlUsername && urlUsername !== clientName) {
      const newPath = location.pathname.replace(
        `/client/${urlUsername}`,
        `/client/${clientName}`
      );
      return <Navigate to={newPath} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
