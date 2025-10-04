import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { PREDICTION_BASE } from "../../config/apiConfig";

export const VerdictPredictionAPI = createApi({
  reducerPath: "verdictPredictionAPI",
  baseQuery: fetchBaseQuery({
  baseUrl: PREDICTION_BASE, // Gateway-relative prediction service
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
