import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { LEASE_AGREEMENTS_BASE } from "../../config/apiConfig";

export const RENTAL_AGREEMENT_BASE_URL = LEASE_AGREEMENTS_BASE; // gateway-relative

const baseQuery = fetchBaseQuery({
  baseUrl: RENTAL_AGREEMENT_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // If auth token needed later, uncomment below
    const token = getState()?.auth?.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const RentalAgreementAPI = createApi({
  reducerPath: "RentalAgreementAPI",
  baseQuery,
  tagTypes: ["RentalAgreement"],
  endpoints: (builder) => ({
    generateLease: builder.mutation({
      // Backend route: POST /api/v1/lease_agreements/generate
      query: (payload) => ({
        url: `/generate`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response) => ({
        id: response.id,
        agreement_text: response.agreement_text,
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "RentalAgreement", id: result.id || "LATEST" }] : [],
    }),
    getLeaseByProperty: builder.query({
      // Backend route: GET /api/v1/lease_agreements/{property_address}
      query: (property_address) => ({
        url: `/${encodeURIComponent(property_address)}`,
      }),
      providesTags: (result, error, arg) => [
        { type: "RentalAgreement", id: result?.id || arg || "LATEST" },
      ],
    }),
    deleteLease: builder.mutation({
      // Backend route: DELETE /api/v1/lease_agreements/{property_address}
      query: (property_address) => ({
        url: `/${encodeURIComponent(property_address)}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "RentalAgreement", id: arg || "LATEST" },
      ],
    }),
  }),
});

export const {
  useGenerateLeaseMutation,
  useGetLeaseByPropertyQuery,
  useLazyGetLeaseByPropertyQuery,
  useDeleteLeaseMutation,
} = RentalAgreementAPI;

export default RentalAgreementAPI;
