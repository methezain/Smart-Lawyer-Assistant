import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ChatbotAPI = createApi({
  reducerPath: "chatbotAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8014/",

    prepareHeaders: (headers, { endpoint }) => {
      // Don't set Content-Type for file uploads - let browser handle it
      if (endpoint !== "uploadDocument") {
        headers.set("Content-Type", "application/json");
      }
      return headers;
    },
  }),
  tagTypes: ["Chat", "Document", "Session"],
  endpoints: (builder) => ({
    // Send message to chatbot
    sendMessage: builder.mutation({
      query: ({ message, session_id }) => ({
        url: "/chat/message",
        method: "POST",
        body: { message, session_id },
      }),
      invalidatesTags: ["Chat"],
    }),

    // Send general message (without document context)
    sendGeneralMessage: builder.mutation({
      query: ({ message, session_id }) => ({
        url: "/chat/general",
        method: "POST",
        body: { message, session_id },
      }),
      invalidatesTags: ["Chat"],
    }),

    // Get chat sessions
    getChatSessions: builder.query({
      query: () => "/chat/sessions",
      providesTags: ["Session"],
    }),

    // Get specific chat session
    getChatSession: builder.query({
      query: (session_id) => `/chat/sessions/${session_id}`,
      providesTags: (result, error, session_id) => [
        { type: "Session", id: session_id },
      ],
    }),

    // Delete chat session
    deleteChatSession: builder.mutation({
      query: (session_id) => ({
        url: `/chat/sessions/${session_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Session"],
    }),

    // Clear all chat sessions
    clearAllSessions: builder.mutation({
      query: () => ({
        url: "/chat/sessions",
        method: "DELETE",
      }),
      invalidatesTags: ["Session"],
    }),

    // Get suggested questions
    getSuggestedQuestions: builder.query({
      query: (context) => ({
        url: "/chat/suggestions",
        params: context ? { context } : {},
      }),
    }),

    // Upload document
    uploadDocument: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: "/documents/upload",
          method: "POST",
          body: formData,
          // Remove Content-Type header to let browser set it automatically
        };
      },
      invalidatesTags: ["Document"],
    }),

    // Get documents list
    getDocuments: builder.query({
      query: () => "/documents/list",
      providesTags: ["Document"],
    }),

    // Get specific document
    getDocument: builder.query({
      query: (file_id) => `/documents/${file_id}`,
      providesTags: (result, error, file_id) => [
        { type: "Document", id: file_id },
      ],
    }),

    // Delete document
    deleteDocument: builder.mutation({
      query: (file_id) => ({
        url: `/documents/${file_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Document"],
    }),

    // Search documents
    searchDocuments: builder.mutation({
      query: ({ query, n_results = 5, filter_by_file }) => ({
        url: "/documents/search",
        method: "POST",
        body: { query, n_results, filter_by_file },
      }),
    }),

    // Clear all documents
    clearAllDocuments: builder.mutation({
      query: () => ({
        url: "/documents/clear-all",
        method: "DELETE",
      }),
      invalidatesTags: ["Document"],
    }),

    // Get chat statistics
    getChatStatistics: builder.query({
      query: () => "/chat/statistics/overview",
    }),

    // Get document statistics
    getDocumentStatistics: builder.query({
      query: () => "/documents/statistics/overview",
    }),

    // Health check
    healthCheck: builder.query({
      query: () => "/health",
    }),

    // Get API info
    getApiInfo: builder.query({
      query: () => "/info",
    }),

    // Clear document cache
    clearDocumentCache: builder.mutation({
      query: () => ({
        url: "/chat/clear-cache",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useSendMessageMutation,
  useSendGeneralMessageMutation,
  useGetChatSessionsQuery,
  useGetChatSessionQuery,
  useDeleteChatSessionMutation,
  useClearAllSessionsMutation,
  useGetSuggestedQuestionsQuery,
  useUploadDocumentMutation,
  useGetDocumentsQuery,
  useGetDocumentQuery,
  useDeleteDocumentMutation,
  useSearchDocumentsMutation,
  useClearAllDocumentsMutation,
  useGetChatStatisticsQuery,
  useGetDocumentStatisticsQuery,
  useHealthCheckQuery,
  useGetApiInfoQuery,
  useClearDocumentCacheMutation,
} = ChatbotAPI;
