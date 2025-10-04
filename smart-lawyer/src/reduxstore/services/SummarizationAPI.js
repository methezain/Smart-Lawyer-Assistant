// services/SummarizationAPI.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const SummarizationAPI = createApi({
  reducerPath: "summarizationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8012",
    prepareHeaders: (headers) => {
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Summary"],
  endpoints: (builder) => ({
    uploadAndSummarizePdf: builder.mutation({
      query: (formData) => {
        console.log("Sending PDF for summarization:", formData);
        return {
          url: "/upload_pdf/",
          method: "POST",
          body: formData,
          // Don't set Content-Type header, let the browser set it with the boundary
        };
      },
      // Add response transformation
      transformResponse: (response) => {
        console.log("Summarization API Response:", response);
        return response;
      },
      // Add error handling
      transformErrorResponse: (response) => {
        console.error("Summarization API Error Response:", response);

        // Handle different types of errors
        if (response.status === "FETCH_ERROR") {
          return {
            status: response.status,
            error:
              "Network error - please check if the summarization server is running on port 8012",
          };
        }

        if (response.status === "TIMEOUT_ERROR") {
          return {
            status: response.status,
            error:
              "Request timeout - PDF processing took too long, please try again",
          };
        }

        if (response.status === 400) {
          return {
            status: response.status,
            error:
              response.data?.message ||
              "Invalid file format - only PDF files are allowed",
          };
        }

        if (response.status === 500) {
          return {
            status: response.status,
            error:
              response.data?.message || "Server error during PDF processing",
          };
        }

        return response;
      },
      // Removed invalidatesTags to prevent automatic page reload after summary generation
    }),
    summarizeText: builder.mutation({
      query: (text) => ({
        url: "/summarize_text/",
        method: "POST",
        body: { text },
      }),
      transformResponse: (response) => response,
      transformErrorResponse: (response) => response,
    }),
    getSummaries: builder.query({
      query: () => "/summarize/",
      transformResponse: (response) => {
        console.log("Get Summaries Response:", response);
        return response;
      },
      transformErrorResponse: (response) => {
        console.error("Get Summaries Error:", response);
        return response;
      },
      providesTags: ["Summary"],
    }),
  }),
});

export const {
  useUploadAndSummarizePdfMutation,
  useSummarizeTextMutation,
  useGetSummariesQuery,
} = SummarizationAPI;
