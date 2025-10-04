import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE } from "../../config/apiConfig";

const CLIENT_API_BASE_URL = API_BASE;

export const clientRegistrationAPI = createApi({
  reducerPath: "clientRegistrationAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: CLIENT_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.clientToken;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Client"],
  endpoints: (builder) => ({
    // Client Registration (Signin)
    clientSignup: builder.mutation({
      query: (clientData) => ({
        url: "/registration/client/signup",
        method: "POST",
        body: clientData,
      }),
      transformResponse: (response) => {
        console.log("Client signup response:", response);
        return response;
      },
      transformErrorResponse: (error) => {
        console.error("Client signup error:", error);

        // Handle field-specific errors similar to Signin.jsx
        if (error.data?.errors) {
          const fieldErrors = {};
          error.data.errors.forEach((err) => {
            if (err.field) {
              fieldErrors[err.field] = err.message;
            }
          });

          return {
            ...error.data,
            field_errors: fieldErrors,
          };
        }

        return error.data || error;
      },
    }),

    // Client Google Registration
    clientGoogleSignup: builder.mutation({
      query: (googleData) => ({
        url: "/registration/client/google-signup",
        method: "POST",
        body: googleData,
      }),
      transformResponse: (response) => {
        console.log("Client Google signup response:", response);
        return response;
      },
      transformErrorResponse: (error) => {
        console.error("Client Google signup error:", error);
        return error.data || error;
      },
    }),

    // Get client profile (for future use)
    getClientProfile: builder.query({
      query: (clientId) => `/client/profile/${clientId}`,
      providesTags: ["Client"],
    }),

    // Update client profile (for future use)
    updateClientProfile: builder.mutation({
      query: ({ clientId, ...profileData }) => ({
        url: `/client/profile/${clientId}`,
        method: "PUT",
        body: profileData,
      }),
      invalidatesTags: ["Client"],
    }),
  }),
});

export const {
  useClientSignupMutation,
  useClientGoogleSignupMutation,
  useGetClientProfileQuery,
  useUpdateClientProfileMutation,
} = clientRegistrationAPI;
