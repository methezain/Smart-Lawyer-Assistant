import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const INVOICES_BASE_URL = "http://localhost:8008/api/v1";

const baseQuery = fetchBaseQuery({
  baseUrl: INVOICES_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const InvoicesAPI = createApi({
  reducerPath: "InvoicesAPI",
  baseQuery,
  tagTypes: ["Invoice"],
  endpoints: (builder) => ({
    listInvoices: builder.query({
      query: ({ page = 1, page_size = 20, search = "", status = "" } = {}) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", String(page_size));
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        return { url: `invoices?${params.toString()}` };
      },
      providesTags: (result) =>
        result?.invoices
          ? [
              ...result.invoices.map((i) => ({ type: "Invoice", id: i.id })),
              { type: "Invoice", id: "LIST" },
            ]
          : [{ type: "Invoice", id: "LIST" }],
    }),
    getInvoice: builder.query({
      query: (id) => ({ url: `invoices/${id}` }),
      providesTags: (r, e, id) => [{ type: "Invoice", id }],
    }),
    getAgreementLedger: builder.query({
      query: (agreementId) => ({
        url: `invoices/ledger/by-agreement/${agreementId}`,
      }),
    }),
    createInvoice: builder.mutation({
      query: (data) => ({ url: "invoices", method: "POST", body: data }),
      invalidatesTags: [{ type: "Invoice", id: "LIST" }],
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `invoices/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "LIST" },
      ],
    }),
    deleteInvoice: builder.mutation({
      query: (id) => ({ url: `invoices/${id}`, method: "DELETE" }),
      invalidatesTags: (r, e, id) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "LIST" },
      ],
    }),
    addPayment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `invoices/${id}/payments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "LIST" },
      ],
    }),
    removePayment: builder.mutation({
      query: ({ id, paymentId }) => ({
        url: `invoices/${id}/payments/${paymentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useListInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useAddPaymentMutation,
  useRemovePaymentMutation,
  useGetAgreementLedgerQuery,
} = InvoicesAPI;

export default InvoicesAPI;
