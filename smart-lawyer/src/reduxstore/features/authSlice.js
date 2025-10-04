import { createSlice } from "@reduxjs/toolkit";

// Redux Auth Slice - REQUIRED for token management
const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: localStorage.getItem("admin_token") || null,
    user: (() => {
      // Try to load user from localStorage on initialization
      try {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
      } catch {
        return null;
      }
    })(),
    isAuthenticated: !!localStorage.getItem("admin_token"),
  },
  reducers: {
    setCredentials: (state, action) => {
      const { token, user } = action.payload;

      // IMPORTANT: Clear old data first to prevent token mixing
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("admin_token");

      // Then set new data
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;

      // Store in localStorage
      localStorage.setItem("admin_token", token);
      console.log(
        "✅ Token stored in Redux and localStorage:",
        token?.substring(0, 20) + "..."
      );
      console.log("🔄 User switched, old token cleared, new token set");
      console.log("👤 New user:", user?.email || user?.username || "unknown");
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;

      // Clear ALL possible token keys from localStorage
      localStorage.removeItem("admin_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");

      // Also clear user-related metadata to avoid stale UI
      localStorage.removeItem("user_name");
      localStorage.removeItem("userRole");
      localStorage.removeItem("user");
      localStorage.removeItem("rememberMe");
      // Client-specific keys (for completeness if used elsewhere)
      localStorage.removeItem("clientToken");
      localStorage.removeItem("client_name");
      localStorage.removeItem("client");

      console.log(
        "🚪 User logged out, all tokens cleared from Redux and localStorage"
      );
    },
    // New action to force clear user data and caches
    clearUserData: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("admin_token");
      console.log("🧹 User data forcefully cleared");
    },
  },
});

export const { setCredentials, logout, clearUserData } = authSlice.actions;
export default authSlice.reducer;
