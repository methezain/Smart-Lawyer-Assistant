import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE } from "../../config/apiConfig";

const authHeader = () => {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const AdminAuthAPI = createApi({
  reducerPath: "AdminAuthAPI",
  baseQuery: fetchBaseQuery({
  baseUrl: API_BASE + "/", // Unified Auth service (ensure trailing slash for existing paths)
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("admin_token");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Admin", "Firm"],
  endpoints: (builder) => ({
    listFirms: builder.query({
      query: () => ({ url: "auth/firms/" }),
      transformResponse: (resp) => resp?.data?.firms || [],
      providesTags: [{ type: "Firm", id: "LIST" }],
    }),
    // Admin login endpoint using unified authentication
    adminLogin: builder.mutation({
      query: ({ username, password }) => ({
        url: "auth/login/",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username,
          password,
          user_type: "admin", // Add user_type parameter for unified auth
        }).toString(),
      }),
    }),

    // Staff login via unified authentication (delegates to staff service)
    staffLogin: builder.mutation({
      query: ({ username, password, firm_id }) => ({
        url: "auth/login/",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username,
          password,
          user_type: "staff",
          firm_id: String(firm_id),
        }).toString(),
      }),
    }),

    // Login activity
    getLoginActivity: builder.query({
      query: (id) => `/auth/login-activity/${id}`,
      transformResponse: (response) => {
        // Normalize potential shapes
        if (Array.isArray(response)) return response;
        if (response && Array.isArray(response.items)) return response.items;
        if (response && Array.isArray(response.data)) return response.data;
        return [];
      },
      providesTags: (result, error, id) => [
        { type: "Staff", id: `login-${id}` },
      ],
    }),
    startLoginSession: builder.mutation({
      query: ({ id, body }) => ({
        url: `/auth/login-activity/${id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (res, err, { id }) => [
        { type: "Staff", id: `login-${id}` },
      ],
    }),
    endLoginSession: builder.mutation({
      query: ({ id, body }) => ({
        url: `/auth/login-activity/${id}/logout`,
        method: "POST",
        body,
      }),
      invalidatesTags: (res, err, { id }) => [
        { type: "Staff", id: `login-${id}` },
      ],
    }),

    // Admin forgot password using unified authentication
    adminForgotPassword: builder.mutation({
      query: ({ email }) => ({
        url: "auth/forgot-password/",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          contact: email,
          user_type: "admin",
        }).toString(),
      }),
    }),

    // Admin verify reset OTP using unified authentication
    adminVerifyResetOTP: builder.mutation({
      query: ({ reset_token, otp_code }) => ({
        url: "auth/verify-reset-otp/",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          reset_token,
          otp_code,
          user_type: "admin",
        }).toString(),
      }),
    }),

    // Admin reset password using unified authentication
    adminResetPassword: builder.mutation({
      query: ({ reset_token, new_password, confirm_password }) => ({
        url: "auth/reset-password/",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          reset_token,
          new_password,
          confirm_password,
          user_type: "admin",
        }).toString(),
      }),
    }),

    // Admin change password using unified authentication
    adminChangePassword: builder.mutation({
      query: ({ username, currentPassword, newPassword, confirmPassword }) => ({
        url: "auth/change-password/",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username,
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
          user_type: "admin",
        }).toString(),
      }),
    }),

    // Logout admin (if needed)
    adminLogout: builder.mutation({
      query: () => ({
        url: "auth/logout/",
        method: "POST",
        headers: authHeader(),
      }),
    }),
  }),
});

export const {
  useListFirmsQuery,
  useAdminLoginMutation,
  useAdminChangePasswordMutation,
  useAdminForgotPasswordMutation,
  useAdminVerifyResetOTPMutation,
  useAdminResetPasswordMutation,
  useStaffLoginMutation,
  useGetLoginActivityQuery,
  useStartLoginSessionMutation,
  useEndLoginSessionMutation,
} = AdminAuthAPI;
