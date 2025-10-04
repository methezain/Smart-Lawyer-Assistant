import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE } from "../../config/apiConfig";

const CLIENT_API_BASE_URL = API_BASE;

export const clientAuthAPI = createApi({
  reducerPath: "clientAuthAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: CLIENT_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token =
        getState().auth?.clientToken || localStorage.getItem("clientToken");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["ClientAuth"],
  endpoints: (builder) => ({
    // Client Login using unified authentication
    clientLogin: builder.mutation({
      query: ({ username, password }) => ({
        url: "/auth/login/",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username,
          password,
          user_type: "client", // Add user_type parameter for unified auth
        }).toString(),
      }),
      transformResponse: (response) => {
        console.log("Client login response:", response);
        return response;
      },
      transformErrorResponse: (error) => {
        console.error("Client login error:", error);
        return error.data || error;
      },
    }),

    // Client Google Login (still separate as it has different logic)
    clientGoogleLogin: builder.mutation({
      query: ({ google_id, email }) => ({
        url: "/auth/client/google-login/",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          google_id,
          email,
        }).toString(),
      }),
    }),

    // Client Forgot Password using unified authentication
    clientForgotPassword: builder.mutation({
      query: ({ contact }) => ({
        url: "/auth/forgot-password/",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          contact,
          user_type: "client",
        }).toString(),
      }),
    }),

    // Client Verify Reset OTP using unified authentication
    clientVerifyResetOTP: builder.mutation({
      query: ({ reset_token, otp_code }) => ({
        url: "/auth/verify-reset-otp/",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          reset_token,
          otp_code,
          user_type: "client",
        }).toString(),
      }),
    }),

    // Client Reset Password using unified authentication
    clientResetPassword: builder.mutation({
      query: ({ reset_token, new_password, confirm_password }) => ({
        url: "/auth/reset-password/",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          reset_token,
          new_password,
          confirm_password,
          user_type: "client",
        }).toString(),
      }),
    }),

    // Client Change Password using unified authentication
    clientChangePassword: builder.mutation({
      query: ({
        username,
        current_password,
        new_password,
        confirm_password,
      }) => ({
        url: "/auth/change-password/",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username,
          current_password,
          new_password,
          confirm_password,
          user_type: "client",
        }).toString(),
      }),
    }),
  }),
});

export const {
  useClientLoginMutation,
  useClientGoogleLoginMutation,
  useClientForgotPasswordMutation,
  useClientVerifyResetOTPMutation,
  useClientResetPasswordMutation,
  useClientChangePasswordMutation,
} = clientAuthAPI;
