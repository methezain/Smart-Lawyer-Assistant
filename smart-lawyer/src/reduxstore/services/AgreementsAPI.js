import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const AGREEMENTS_BASE_URL = "http://localhost:8007/api/v1";

const baseQuery = fetchBaseQuery({
  baseUrl: AGREEMENTS_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const AgreementsAPI = createApi({
  reducerPath: "AgreementsAPI",
  baseQuery,
  tagTypes: ["Agreement"],
  endpoints: (builder) => ({
    listAgreements: builder.query({
      query: ({
        page = 1,
        page_size = 20,
        search = "",
        status = "",
        case_type = "",
      } = {}) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", String(page_size));
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        if (case_type) params.set("case_type", case_type);
        return { url: `agreements?${params.toString()}` };
      },
      providesTags: (result) =>
        result?.agreements
          ? [
              ...result.agreements.map((a) => ({
                type: "Agreement",
                id: a.id,
              })),
              { type: "Agreement", id: "LIST" },
            ]
          : [{ type: "Agreement", id: "LIST" }],
    }),
    getAgreement: builder.query({
      query: (id) => ({ url: `agreements/${id}` }),
      providesTags: (result, error, id) => [{ type: "Agreement", id }],
    }),
    createAgreement: builder.mutation({
      query: (data) => ({ url: "agreements", method: "POST", body: data }),
      invalidatesTags: [{ type: "Agreement", id: "LIST" }],
    }),
    updateAgreement: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `agreements/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Agreement", id },
        { type: "Agreement", id: "LIST" },
      ],
    }),
    deleteAgreement: builder.mutation({
      query: (id) => ({ url: `agreements/${id}`, method: "DELETE" }),
      invalidatesTags: (result, error, id) => [
        { type: "Agreement", id },
        { type: "Agreement", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useListAgreementsQuery,
  useGetAgreementQuery,
  useCreateAgreementMutation,
  useUpdateAgreementMutation,
  useDeleteAgreementMutation,
} = AgreementsAPI;

export default AgreementsAPI;
