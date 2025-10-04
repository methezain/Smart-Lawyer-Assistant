import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE } from "../../config/apiConfig";

// Permissions Service -> FastAPI at http://localhost:8010/api/v1
export const PermissionsAPI = createApi({
  reducerPath: "PermissionsAPI",
  baseQuery: fetchBaseQuery({
  baseUrl: API_BASE,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Permission"],
  endpoints: (builder) => ({
    // GET /permissions?admin_id=&assigned_lawyer_id=&module=
    listPermissions: builder.query({
      query: ({ admin_id, assigned_lawyer_id, module } = {}) => {
        const params = new URLSearchParams();
        if (admin_id != null && admin_id !== "")
          params.append("admin_id", String(admin_id));
        if (assigned_lawyer_id != null && assigned_lawyer_id !== "")
          params.append("assigned_lawyer_id", String(assigned_lawyer_id));
        if (module) params.append("module", module);
        const qs = params.toString();
        return `/permissions/${qs ? `?${qs}` : ""}`;
      },
      providesTags: () => [{ type: "Permission", id: "LIST" }],
      transformResponse: (resp) => resp?.data || { items: [] },
    }),

    // POST /permissions/bulk-apply
    bulkApplyPermissions: builder.mutation({
      query: (body) => ({
        url: "/permissions/bulk-apply",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Permission", id: "LIST" }],
    }),
  }),
});

export const {
  useListPermissionsQuery,
  useLazyListPermissionsQuery,
  useBulkApplyPermissionsMutation,
} = PermissionsAPI;

export default PermissionsAPI.reducer;
