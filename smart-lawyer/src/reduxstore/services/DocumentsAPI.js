import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const DOCUMENTS_BASE_URL = "http://localhost:8004/api/v1";

const baseQuery = fetchBaseQuery({
  baseUrl: DOCUMENTS_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

export const documentsAPI = createApi({
  reducerPath: "documentsAPI",
  baseQuery,
  tagTypes: ["Document"],
  endpoints: (builder) => ({
    listDocuments: builder.query({
      query: ({
        page = 1,
        page_size = 50,
        search = "",
        status = "",
        doc_type = "",
      } = {}) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", String(page_size));
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        if (doc_type) params.set("doc_type", doc_type);
        return { url: `documents?${params.toString()}` };
      },
      providesTags: (result) =>
        result?.documents
          ? [
              ...result.documents.map((d) => ({ type: "Document", id: d.id })),
              { type: "Document", id: "LIST" },
            ]
          : [{ type: "Document", id: "LIST" }],
    }),
    createDocument: builder.mutation({
      query: ({
        title,
        description,
        doc_type,
        status,
        tags,
        case_id,
        case_number,
        case_title,
        client_id,
        client_name,
        assigned_lawyer_id,
        assigned_lawyer_name,
        file,
      }) => {
        const form = new FormData();
        form.append("title", title);
        if (description) form.append("description", description);
        if (doc_type) form.append("doc_type", doc_type);
        if (status) form.append("status", status);
        if (tags) form.append("tags", tags);
        if (case_id) form.append("case_id", String(case_id));
        if (case_number) form.append("case_number", case_number);
        if (case_title) form.append("case_title", case_title);
        if (client_id) form.append("client_id", String(client_id));
        if (client_name) form.append("client_name", client_name);
        if (assigned_lawyer_id)
          form.append("assigned_lawyer_id", String(assigned_lawyer_id));
        if (assigned_lawyer_name)
          form.append("assigned_lawyer_name", assigned_lawyer_name);
        if (file) form.append("file", file);
        return { url: "documents", method: "POST", body: form };
      },
      invalidatesTags: [{ type: "Document", id: "LIST" }],
    }),
    updateDocument: builder.mutation({
      query: ({ id, patch }) => ({
        url: `documents/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Document", id: arg.id },
        { type: "Document", id: "LIST" },
      ],
    }),
    deleteDocument: builder.mutation({
      query: (id) => ({ url: `documents/${id}`, method: "DELETE" }),
      invalidatesTags: (result, error, id) => [
        { type: "Document", id },
        { type: "Document", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useListDocumentsQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
} = documentsAPI;

export default documentsAPI;
