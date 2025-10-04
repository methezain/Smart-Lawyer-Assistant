import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE } from "../../config/apiConfig";

const baseQuery = fetchBaseQuery({
  baseUrl:
    import.meta.env.VITE_CLIENTS_API_URL || API_BASE,
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

export const ClientsAPI = createApi({
  reducerPath: "ClientsAPI",
  baseQuery,
  tagTypes: ["Clients"],
  endpoints: (builder) => ({
    getClients: builder.query({
      query: ({
        page = 1,
        page_size = 15,
        search = "",
        type,
        marital_status,
        gender,
        join_date_from,
        join_date_to,
      } = {}) => {
        // Clamp to API constraints: page >= 1, 1 <= page_size <= 100
        const safePage = Math.max(1, Number(page) || 1);
        const sizeNum = Number(page_size);
        const safePageSize = Math.max(
          1,
          Math.min(100, Number.isFinite(sizeNum) ? sizeNum : 15)
        );

        const params = {
          page: safePage,
          page_size: safePageSize,
        };
        if (search) params.search = search;
        if (type) params.type = type;
        if (marital_status) params.marital_status = marital_status;
        if (gender) params.gender = gender;
        if (join_date_from) params.join_date_from = join_date_from;
        if (join_date_to) params.join_date_to = join_date_to;
        return { url: "clients", params };
      },
      providesTags: () => [{ type: "Clients", id: "LIST" }],
    }),
    getClient: builder.query({
      query: (id) => `clients/${id}`,
      providesTags: (res, err, id) => [{ type: "Clients", id }],
    }),
    createClient: builder.mutation({
      query: (body) => ({ url: "clients/", method: "POST", body }),
      invalidatesTags: [{ type: "Clients", id: "LIST" }],
    }),
    updateClient: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `clients/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (res, err, { id }) => [
        { type: "Clients", id },
        { type: "Clients", id: "LIST" },
      ],
    }),
    linkCase: builder.mutation({
      query: ({
        client_id,
        case_id,
        status,
        staff_id,
        staff_name,
        assigned_lawyer_id,
        assigned_lawyer_name,
      }) => {
        const params = {};
        if (case_id != null) params.case_id = case_id;
        if (status) params.status = status;
        // Prefer new fields, fallback to legacy param names for back-compat
        if (assigned_lawyer_id != null)
          params.assigned_lawyer_id = assigned_lawyer_id;
        else if (staff_id != null) params.staff_id = staff_id;
        if (assigned_lawyer_name)
          params.assigned_lawyer_name = assigned_lawyer_name;
        else if (staff_name) params.staff_name = staff_name;
        return {
          url: `clients/${client_id}/link_case`,
          method: "POST",
          params,
        };
      },
      invalidatesTags: (res, err, { client_id }) => [
        { type: "Clients", id: client_id },
        { type: "Clients", id: "LIST" },
      ],
    }),
    deleteClient: builder.mutation({
      query: (id) => ({ url: `clients/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Clients", id: "LIST" }],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useLazyGetClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useLinkCaseMutation,
  useDeleteClientMutation,
} = ClientsAPI;
