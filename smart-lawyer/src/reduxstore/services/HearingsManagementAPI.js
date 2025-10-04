import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  isTokenExpiredOrExpiring,
  getTokenTimeRemaining,
} from "../../utils/tokenUtils";
import { logout } from "../features/authSlice";

// For Hearings Management Service
// Track user changes to clear caches
let lastUserId = null;

import { API_BASE } from "../../config/apiConfig";

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
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
    console.log("🔍 Hearings User Identification Debug:", {
      hasUser: !!currentUser,
      userObject: currentUser,
      extractedUserId: currentUserId,
      hasToken: !!token,
    });

    // Check if user has changed - if so, clear all caches immediately
    if (lastUserId && lastUserId !== currentUserId) {
      console.log("🚨 HEARINGS USER CHANGE DETECTED! Clearing all caches...");
      console.log(`📤 Previous user: ${lastUserId}`);
      console.log(`📥 New user: ${currentUserId}`);

      // Force clear all cached data to prevent showing wrong user's data
      if (api && api.dispatch) {
        api.dispatch(hearingsManagementAPI.util.resetApiState());
      }

      console.log("✅ All Hearings API caches cleared for user switch");
    }

    // Update last user tracking
    lastUserId = currentUserId;

    // Debug logging
    console.log("🔍 Hearings API Call Debug:", {
      endpoint: endpoint,
      hasToken: !!token,
      currentUser: currentUserId,
      tokenPrefix: token ? token.substring(0, 20) + "..." : "none",
    });

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    // Do not set Content-Type globally; let fetch infer for JSON and FormData
    return headers;
  },
});

// Create the API service
export const hearingsManagementAPI = createApi({
  reducerPath: "hearingsManagementAPI",
  baseQuery,
  tagTypes: ["Hearing", "HearingStatistics", "UpcomingHearings"],
  endpoints: (builder) => ({
    // ============= HEARING ENDPOINTS =============

    // Get hearings with filtering and pagination
    getHearings: builder.query({
      query: ({
        page = 1,
        page_size = 15,
        search = "",
        status = "",
        hearing_type = "",
        case_id = "",
        assigned_lawyer_id = "",
        hearing_date_from = "",
        hearing_date_to = "",
        court_name = "",
        judge_name = "",
        sort_by = "date_asc",
      } = {}) => {
        const params = new URLSearchParams();

        if (page) params.append("page", page.toString());
        if (page_size) params.append("page_size", page_size.toString());
        if (search) params.append("search", search);
        if (status) params.append("status", status);
        if (hearing_type) params.append("hearing_type", hearing_type);
        if (case_id) params.append("case_id", case_id.toString());
        if (assigned_lawyer_id)
          params.append("assigned_lawyer_id", assigned_lawyer_id.toString());
        if (hearing_date_from)
          params.append("hearing_date_from", hearing_date_from);
        if (hearing_date_to) params.append("hearing_date_to", hearing_date_to);
        if (court_name) params.append("court_name", court_name);
        if (judge_name) params.append("judge_name", judge_name);
        if (sort_by) params.append("sort_by", sort_by);

        return `hearings?${params.toString()}`;
      },
      providesTags: ["Hearing"],
    }),

    // Get a single hearing by ID
    getHearing: builder.query({
      query: (id) => `hearings/${id}`,
      providesTags: (result, error, id) => [{ type: "Hearing", id }],
    }),

    // Create a new hearing
    createHearing: builder.mutation({
      query: (newHearing) => ({
        url: "hearings",
        method: "POST",
        body: newHearing,
      }),
      invalidatesTags: ["Hearing", "HearingStatistics", "UpcomingHearings"],
    }),

    // Update a hearing
    updateHearing: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `hearings/${id}`,
        method: "PUT",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Hearing", id },
        "Hearing",
        "HearingStatistics",
        "UpcomingHearings",
      ],
    }),

    // Delete a hearing
    deleteHearing: builder.mutation({
      query: (id) => ({
        url: `hearings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Hearing", "HearingStatistics", "UpcomingHearings"],
    }),

    // Get hearings for a specific case
    getCaseHearings: builder.query({
      query: (caseId) => `hearings/case/${caseId}/hearings`,
      providesTags: (result, error, caseId) => [
        { type: "Hearing", id: `case-${caseId}` },
      ],
    }),

    // ============= STATISTICS ENDPOINTS =============

    // Get hearing statistics for dashboard
    getHearingStatistics: builder.query({
      query: () => "hearings/statistics",
      providesTags: ["HearingStatistics"],
    }),

    // ============= UPCOMING HEARINGS ENDPOINTS =============

    // Get upcoming hearings summary
    getUpcomingHearings: builder.query({
      query: (limit) => {
        const params = new URLSearchParams();
        if (limit) params.append("limit", limit.toString());
        return `hearings/upcoming?${params.toString()}`;
      },
      providesTags: ["UpcomingHearings"],
    }),

    // ============= CALENDAR ENDPOINTS =============

    // Get hearings for calendar view
    getCalendarHearings: builder.query({
      query: ({ year, month }) => `hearings/calendar/${year}/${month}`,
      providesTags: (result, error, { year, month }) => [
        { type: "Hearing", id: `calendar-${year}-${month}` },
      ],
    }),

    // ============= HEARING TYPES ENDPOINTS =============

    // Get available hearing types
    getHearingTypes: builder.query({
      query: () => "hearings/types/list",
      providesTags: ["Hearing"],
    }),

    // ============= ATTACHMENTS ENDPOINTS =============

    // List attachments for a hearing
    getHearingAttachments: builder.query({
      query: (hearingId) => `hearings/${hearingId}/attachments`,
      providesTags: (result, error, hearingId) => [
        { type: "Hearing", id: `attachments-${hearingId}` },
      ],
    }),

    // Count attachments for a hearing
    getHearingAttachmentCount: builder.query({
      query: (hearingId) => `hearings/${hearingId}/attachments/count`,
      providesTags: (result, error, hearingId) => [
        { type: "Hearing", id: `attachments-count-${hearingId}` },
      ],
    }),

    // Upload attachment
    uploadHearingAttachment: builder.mutation({
      query: ({ hearingId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `hearings/${hearingId}/attachments`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { hearingId }) => [
        { type: "Hearing", id: `attachments-${hearingId}` },
        { type: "Hearing", id: `attachments-count-${hearingId}` },
      ],
    }),

    // Delete attachment
    deleteHearingAttachment: builder.mutation({
      query: ({ hearingId, attachmentId }) => ({
        url: `hearings/${hearingId}/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { hearingId }) => [
        { type: "Hearing", id: `attachments-${hearingId}` },
        { type: "Hearing", id: `attachments-count-${hearingId}` },
      ],
    }),

    // Build download URL (no fetch)
    getHearingAttachmentDownloadUrl: builder.query({
      queryFn: ({ hearingId, attachmentId }) => ({
        data: `${baseQuery.arg.baseUrl}/hearings/${hearingId}/attachments/${attachmentId}/download`,
      }),
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  // Hearing CRUD
  useGetHearingsQuery,
  useGetHearingQuery,
  useCreateHearingMutation,
  useUpdateHearingMutation,
  useDeleteHearingMutation,
  useLazyGetHearingsQuery,

  // Case-specific hearings
  useGetCaseHearingsQuery,
  useLazyGetCaseHearingsQuery,

  // Statistics
  useGetHearingStatisticsQuery,

  // Upcoming hearings
  useGetUpcomingHearingsQuery,

  // Calendar
  useGetCalendarHearingsQuery,
  useLazyGetCalendarHearingsQuery,

  // Hearing types
  useGetHearingTypesQuery,

  // Attachments
  useGetHearingAttachmentsQuery,
  useGetHearingAttachmentCountQuery,
  useUploadHearingAttachmentMutation,
  useDeleteHearingAttachmentMutation,
  useLazyGetHearingAttachmentDownloadUrlQuery,
} = hearingsManagementAPI;

export default hearingsManagementAPI;
