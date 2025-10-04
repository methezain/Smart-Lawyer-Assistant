import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  isTokenExpiredOrExpiring,
  getTokenTimeRemaining,
} from "../../utils/tokenUtils";
import { logout } from "../features/authSlice";

// For Case Management Service (Cases, Dashboard, etc.)
// Track user changes to clear caches
let lastUserId = null;

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:8001/api/v1",
  prepareHeaders: (headers, { getState, endpoint, api }) => {
    // Try Redux store first
    const state = getState();
    let token = state?.auth?.token;

    // Check if token is expired or expiring soon
    if (token && isTokenExpiredOrExpiring(token, 2)) {
      // Check 2 minutes before expiry
      const timeRemaining = getTokenTimeRemaining(token);
      console.log(
        `⚠️ Token expiring soon or expired! Time remaining: ${timeRemaining} minutes`
      );

      if (timeRemaining <= 0) {
        console.log("🚨 Token has expired, logging out user...");
        // Token has expired, log out the user
        if (api && api.dispatch) {
          api.dispatch(logout());
        }
        token = null;
      } else {
        console.log(
          `⏰ Token expires in ${timeRemaining} minutes - consider refreshing`
        );
      }
    }

    // Get current user info for tracking user changes
    const currentUser = state?.auth?.user;

    // Try multiple ways to identify the user
    let currentUserId = "unknown";
    if (currentUser) {
      currentUserId =
        currentUser.id ||
        currentUser.email ||
        currentUser.username ||
        currentUser.user_id;
    }

    // If we still don't have user ID but have token, try to extract from token payload
    if (currentUserId === "unknown" && token) {
      try {
        // Decode JWT token to get user info (just for identification, not validation)
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          currentUserId =
            payload.sub ||
            payload.username ||
            payload.email ||
            payload.user_id ||
            "from-token";
        }
      } catch {
        console.log("Could not decode token for user identification");
      }
    }

    // Enhanced debug logging
    console.log("🔍 User Identification Debug:", {
      hasUser: !!currentUser,
      userObject: currentUser,
      extractedUserId: currentUserId,
      hasToken: !!token,
    });

    // Check if user has changed - if so, clear all caches immediately
    if (lastUserId && lastUserId !== currentUserId) {
      console.log("🚨 USER CHANGE DETECTED! Clearing all caches...");
      console.log(`📤 Previous user: ${lastUserId}`);
      console.log(`📥 New user: ${currentUserId}`);

      // Force clear all cached data to prevent showing wrong user's data
      if (api && api.dispatch) {
        api.dispatch(caseManagementAPI.util.resetApiState());
      }

      console.log("✅ All API caches cleared for user switch");
    }

    // Update last user tracking
    lastUserId = currentUserId;

    // Debug logging
    console.log("🔍 API Call Debug:", {
      endpoint: endpoint,
      hasToken: !!token,
      currentUser: currentUserId,
      tokenPrefix: token ? token.substring(0, 20) + "..." : "none",
    });

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

// Create the API service
export const caseManagementAPI = createApi({
  reducerPath: "caseManagementAPI",
  baseQuery,
  tagTypes: ["Case", "Client", "Staff"],
  endpoints: (builder) => ({
    // ============= CASE ENDPOINTS =============

    // Get cases with filtering and pagination
    getCases: builder.query({
      query: ({
        page = 1,
        page_size = 15,
        search = "",
        status = "",
        type = "",
        assigned_lawyer_id = "",
        staff_id = "",
        client_id = "",
        filing_date_from = "",
        filing_date_to = "",
        next_hearing_from = "",
        next_hearing_to = "",
        sort_by = "latest",
      } = {}) => {
        const params = new URLSearchParams();

        // Backend guard: clamp page_size to 100 to avoid 422 errors
        const pageSizeNum = Number(page_size);
        const safePageSize = Number.isFinite(pageSizeNum)
          ? Math.min(Math.max(pageSizeNum, 1), 100)
          : 15;

        if (page) params.append("page", page.toString());
        if (safePageSize) params.append("page_size", safePageSize.toString());
        if (search) params.append("search", search);
        if (status) params.append("status", status);
        if (type) params.append("type", type);
        if (assigned_lawyer_id)
          params.append("assigned_lawyer_id", assigned_lawyer_id.toString());
        if (staff_id) params.append("staff_id", staff_id.toString());
        if (client_id) params.append("client_id", client_id.toString());
        if (filing_date_from)
          params.append("filing_date_from", filing_date_from);
        if (filing_date_to) params.append("filing_date_to", filing_date_to);
        if (next_hearing_from)
          params.append("next_hearing_from", next_hearing_from);
        if (next_hearing_to) params.append("next_hearing_to", next_hearing_to);
        if (sort_by) params.append("sort_by", sort_by);

        return `/cases/?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.cases.map(({ id }) => ({ type: "Case", id })),
              { type: "Case", id: "LIST" },
            ]
          : [{ type: "Case", id: "LIST" }],
    }),

    // Get single case by ID
    getCase: builder.query({
      query: (id) => `/cases/${id}`,
      providesTags: (result, error, id) => [{ type: "Case", id }],
    }),

    // Get case by case number
    getCaseByNumber: builder.query({
      query: (caseNumber) => `/cases/number/${caseNumber}`,
      providesTags: (result, error, caseNumber) => [
        { type: "Case", id: caseNumber },
      ],
    }),

    // Create new case
    createCase: builder.mutation({
      query: (caseData) => ({
        url: "/cases/",
        method: "POST",
        body: caseData,
      }),
      invalidatesTags: [{ type: "Case", id: "LIST" }],
    }),

    // Update case
    updateCase: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/cases/${id}`,
        method: "PUT",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Case", id },
        { type: "Case", id: "LIST" },
      ],
    }),

    // Delete case
    deleteCase: builder.mutation({
      query: (id) => ({
        url: `/cases/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Case", id: "LIST" }],
    }),

    // Get case types
    getCaseTypes: builder.query({
      query: () => "/cases/types/",
      providesTags: [{ type: "Case", id: "TYPES" }],
    }),

    // Get case statistics
    getCaseStatistics: builder.query({
      query: () => "/cases/statistics/",
      providesTags: [{ type: "Case", id: "STATISTICS" }],
    }),

    // ============= CLIENT ENDPOINTS =============

    // Get clients
    getClients: builder.query({
      query: ({
        skip = 0,
        limit = 100,
        search = "",
        is_active = null,
      } = {}) => {
        const params = new URLSearchParams();

        if (skip) params.append("skip", skip.toString());
        if (limit) params.append("limit", limit.toString());
        if (search) params.append("search", search);
        if (is_active !== null)
          params.append("is_active", is_active.toString());

        return `/clients/?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Client", id })),
              { type: "Client", id: "LIST" },
            ]
          : [{ type: "Client", id: "LIST" }],
    }),

    // Get single client
    getClient: builder.query({
      query: (id) => `/clients/${id}`,
      providesTags: (result, error, id) => [{ type: "Client", id }],
    }),

    // Create new client
    createClient: builder.mutation({
      query: (clientData) => ({
        url: "/clients/",
        method: "POST",
        body: clientData,
      }),
      invalidatesTags: [{ type: "Client", id: "LIST" }],
    }),

    // Update client
    updateClient: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/clients/${id}`,
        method: "PUT",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Client", id },
        { type: "Client", id: "LIST" },
      ],
    }),

    // Delete client
    deleteClient: builder.mutation({
      query: (id) => ({
        url: `/clients/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Client", id: "LIST" }],
    }),

    // ============= STAFF ENDPOINTS =============

    // Get staff
    getStaff: builder.query({
      query: ({
        skip = 0,
        limit = 100,
        search = "",
        is_active = null,
        specialization = "",
      } = {}) => {
        const params = new URLSearchParams();

        if (skip) params.append("skip", skip.toString());
        if (limit) params.append("limit", limit.toString());
        if (search) params.append("search", search);
        if (is_active !== null)
          params.append("is_active", is_active.toString());
        if (specialization) params.append("specialization", specialization);

        return `/staff/?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Staff", id })),
              { type: "Staff", id: "LIST" },
            ]
          : [{ type: "Staff", id: "LIST" }],
    }),

    // Get single staff member
    getStaffMember: builder.query({
      query: (id) => `/staff/${id}`,
      providesTags: (result, error, id) => [{ type: "Staff", id }],
    }),

    // Create new staff member
    createStaff: builder.mutation({
      query: (staffData) => ({
        url: "/staff/",
        method: "POST",
        body: staffData,
      }),
      invalidatesTags: [{ type: "Staff", id: "LIST" }],
    }),

    // Update staff member
    updateStaff: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/staff/${id}`,
        method: "PUT",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Staff", id },
        { type: "Staff", id: "LIST" },
      ],
    }),

    // Delete staff member
    deleteStaff: builder.mutation({
      query: (id) => ({
        url: `/staff/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Staff", id: "LIST" }],
    }),

    // Get specializations
    getSpecializations: builder.query({
      query: () => "/staff/specializations/",
      providesTags: [{ type: "Staff", id: "SPECIALIZATIONS" }],
    }),
  }),
});

// Export hooks for components
export const {
  // Case hooks
  useGetCasesQuery,
  useGetCaseQuery,
  useGetCaseByNumberQuery,
  useLazyGetCaseQuery,
  useLazyGetCaseByNumberQuery,
  useCreateCaseMutation,
  useUpdateCaseMutation,
  useDeleteCaseMutation,
  useGetCaseTypesQuery,
  useGetCaseStatisticsQuery,

  // Client hooks
  useGetClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,

  // Staff hooks
  useGetStaffQuery,
  useGetStaffMemberQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useGetSpecializationsQuery,
} = caseManagementAPI;

// Export the API reducer
export default caseManagementAPI.reducer;
