import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:8003/api/v1",
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

export const judgmentsAPI = createApi({
  reducerPath: "judgmentsAPI",
  baseQuery,
  tagTypes: ["Judgment"],
  endpoints: (builder) => ({
    processJudgmentPdf: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: "judgments/ocr", method: "POST", body: formData };
      },
    }),
    listJudgments: builder.query({
      query: ({ page = 1, size = 10, search } = {}) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("size", String(size));
        if (search) params.set("search", search);
        return { url: `judgments?${params.toString()}` };
      },
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map((j) => ({ type: "Judgment", id: j.id })),
              { type: "Judgment", id: "LIST" },
            ]
          : [{ type: "Judgment", id: "LIST" }],
    }),
    createJudgment: builder.mutation({
      query: ({ data, file }) => {
        const form = new FormData();
        form.append("data", JSON.stringify(data));
        if (file) form.append("file", file);
        return { url: "judgments", method: "POST", body: form };
      },
      invalidatesTags: [{ type: "Judgment", id: "LIST" }],
    }),
    updateJudgment: builder.mutation({
      query: ({ id, data, file }) => {
        const form = new FormData();
        if (data) form.append("data", JSON.stringify(data));
        if (file) form.append("file", file);
        return { url: `judgments/${id}`, method: "PATCH", body: form };
      },
      invalidatesTags: (result, error, arg) => [
        { type: "Judgment", id: arg.id },
        { type: "Judgment", id: "LIST" },
      ],
    }),
    deleteJudgment: builder.mutation({
      query: (id) => ({ url: `judgments/${id}`, method: "DELETE" }),
      invalidatesTags: (result, error, id) => [
        { type: "Judgment", id },
        { type: "Judgment", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useProcessJudgmentPdfMutation,
  useListJudgmentsQuery,
  useCreateJudgmentMutation,
  useUpdateJudgmentMutation,
  useDeleteJudgmentMutation,
} = judgmentsAPI;
export default judgmentsAPI;
