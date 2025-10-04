// services/ClassificationAPI.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ClassificationAPI = createApi({
  reducerPath: "classificationApi",
  baseQuery: fetchBaseQuery({
    // Point to the new backend router prefix
    baseUrl: "http://localhost:8011/api/classification",
    prepareHeaders: (headers, { getState }) => {
      headers.set("Accept", "application/json");
      const token = getState()?.auth?.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    classifyPdf: builder.mutation({
      // Expect an object: { formData, firmId, lawyerId, firmName?, lawyerName? }
      query: ({ formData, firmId, lawyerId, firmName, lawyerName }) => {
        const params = new URLSearchParams();
        if (firmId == null || lawyerId == null) {
          throw new Error("firmId and lawyerId are required");
        }
        params.set("firm_id", String(firmId));
        params.set("assigned_lawyer_id", String(lawyerId));
        if (firmName) params.set("firm_name", String(firmName));
        if (lawyerName) params.set("assigned_lawyer_name", String(lawyerName));

        return {
          url: `/upload_pdf/?${params.toString()}`,
          method: "POST",
          body: formData,
        };
      },
      // Add response transformation
      transformResponse: (response) => {
        console.log("API Response:", response);
        return response;
      },
      // Add error handling
      transformErrorResponse: (response) => {
        console.error("API Error Response:", response);

        // Handle different types of errors
        if (response.status === "FETCH_ERROR") {
          return {
            status: response.status,
            error: "Network error - please check if the server is running",
          };
        }

        if (response.status === "TIMEOUT_ERROR") {
          return {
            status: response.status,
            error: "Request timeout - please try again",
          };
        }

        return response;
      },
    }),
    getPredictions: builder.query({
      // Optional scoping: { firmId, lawyerId, page, pageSize, skip, limit }
      query: ({ firmId, lawyerId, page, pageSize, skip, limit } = {}) => {
        const params = new URLSearchParams();
        if (firmId != null) params.set("firm_id", String(firmId));
        if (lawyerId != null)
          params.set("assigned_lawyer_id", String(lawyerId));
        if (page != null) params.set("page", String(page));
        if (pageSize != null) params.set("page_size", String(pageSize));
        if (skip != null) params.set("skip", String(skip));
        if (limit != null) params.set("limit", String(limit));
        const qs = params.toString();
        const suffix = qs ? `?${qs}` : "";
        return { url: `/predictions/${suffix}` };
      },
    }),
  }),
});

export const { useClassifyPdfMutation, useGetPredictionsQuery } =
  ClassificationAPI;
