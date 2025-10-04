import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const VerdictPredictionAPI = createApi({
  reducerPath: "verdictPredictionAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8013", // Backend URL for verdict prediction service
  }),
  tagTypes: ["VerdictPrediction"],
  endpoints: (builder) => ({
    uploadPdfForVerdict: builder.mutation({
      query: (files) => {
        const formData = new FormData();

        // Add multiple files to FormData
        files.forEach((file) => {
          formData.append("files", file);
        });

        return {
          url: "/upload_pdf/",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["VerdictPrediction"],
    }),
    getAllPredictions: builder.query({
      query: () => "/verdict_prediction/",
      providesTags: ["VerdictPrediction"],
    }),
  }),
});

export const { useUploadPdfForVerdictMutation, useGetAllPredictionsQuery } =
  VerdictPredictionAPI;
