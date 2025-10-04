import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE } from "../../config/apiConfig";

export const StaffAPI = createApi({
  reducerPath: "StaffAPI",
  baseQuery: fetchBaseQuery({
  baseUrl: API_BASE,
    prepareHeaders: (headers, { getState }) => {
      // Try Redux state first
      const token = getState()?.auth?.token;

      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Staff"],
  endpoints: (builder) => ({
    listStaff: builder.query({
      query: () => "/staff/",
      // Normalize different backend shapes into a flat array
      transformResponse: (response) => {
        let list = [];
        if (Array.isArray(response)) {
          list = response;
        } else if (response && Array.isArray(response.results)) {
          list = response.results;
        } else if (response && Array.isArray(response.items)) {
          list = response.items;
        } else if (response && Array.isArray(response.data)) {
          list = response.data;
        }
        return list;
      },
      providesTags: (result) => {
        const items = Array.isArray(result) ? result : [];
        return [
          ...items.map(({ id }) => ({ type: "Staff", id })),
          { type: "Staff", id: "LIST" },
        ];
      },
    }),
    getStaff: builder.query({
      query: (id) => `/staff/${id}`,
      providesTags: (result, error, id) => [{ type: "Staff", id }],
    }),
    revealStaffPassword: builder.mutation({
      query: (id) => ({ url: `/staff/${id}/reveal-password`, method: "POST" }),
    }),

    createStaff: builder.mutation({
      query: (payload) => ({
        url: "/staff/",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [{ type: "Staff", id: "LIST" }],
    }),
    updateStaff: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/staff/${id}`,
        method: "PUT",
        body: patch,
      }),
      invalidatesTags: (res, err, { id }) => [
        { type: "Staff", id },
        { type: "Staff", id: "LIST" },
      ],
    }),
    deleteStaff: builder.mutation({
      query: (id) => ({ url: `/staff/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Staff", id: "LIST" }],
    }),
  }),
});

export const {
  useListStaffQuery,
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useRevealStaffPasswordMutation,
} = StaffAPI;
