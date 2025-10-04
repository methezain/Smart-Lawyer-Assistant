import { useState, useEffect, useRef, useCallback } from "react";
import {
  useSendMessageMutation,
  useSendGeneralMessageMutation,
  useUploadDocumentMutation,
  useGetDocumentsQuery,
  useDeleteDocumentMutation,
  useDeleteChatSessionMutation,
  useClearAllSessionsMutation,
} from "../../../reduxstore/services/ChatbotAPI";

/**
 * useChatbot - encapsulates all state & side-effects for the Legal AI Chatbot.
 */
export function useChatbot() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState({ id: null, messages: [] });
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [showDocuments, setShowDocuments] = useState(false);
  const [useDocumentContext, setUseDocumentContext] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // RTK Query hooks
  const [sendMessage] = useSendMessageMutation();
  const [sendGeneralMessage] = useSendGeneralMessageMutation();
  const [uploadDocument] = useUploadDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();
  const [deleteChatSession] = useDeleteChatSessionMutation();
  const [clearAllSessions] = useClearAllSessionsMutation();
  const { data: documents, refetch: refetchDocuments } = useGetDocumentsQuery();

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem("ragChats");
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setChats(parsed);
        if (parsed.length > 0) {
          setCurrentChat(parsed[0]);
        } else {
          createNewChat();
        }
      } catch (err) {
        console.error("Error parsing saved chats:", err);
        createNewChat();
      }
    } else {
      createNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist chats
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("ragChats", JSON.stringify(chats));
    }
  }, [chats]);

  // Scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages]);

  // Sync documents list
  useEffect(() => {
    if (documents?.documents) setUploadedDocuments(documents.documents);
  }, [documents]);

  const stripHtmlTags = useCallback((html) => {
    if (!html) return "";
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  }, []);

  const createNewChat = useCallback(() => {
    const newChat = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      sessionId: `session_${Date.now()}`,
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChat(newChat);
    setInputMessage("");
  }, []);

  const selectChat = useCallback((chat) => {
    setCurrentChat(chat);
    setInputMessage("");
  }, []);

  const updateChatTitle = useCallback((chatId, message) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              title: message.slice(0, 30) + (message.length > 30 ? "..." : ""),
            }
          : c
      )
    );
  }, []);

  const handleSendMessage = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!inputMessage.trim() || isLoading) return;

      const userMessage = {
        id: Date.now(),
        content: inputMessage,
        sender: "user",
        timestamp: new Date().toISOString(),
      };
      const updatedChat = {
        ...currentChat,
        messages: [...currentChat.messages, userMessage],
      };
      if (currentChat.messages.length === 0)
        updateChatTitle(currentChat.id, inputMessage);
      setCurrentChat(updatedChat);
      setChats((prev) =>
        prev.map((c) => (c.id === currentChat.id ? updatedChat : c))
      );
      const messageToSend = inputMessage;
      setInputMessage("");
      setIsLoading(true);
      try {
        const response = useDocumentContext
          ? await sendMessage({
              message: messageToSend,
              session_id: currentChat.sessionId,
            }).unwrap()
          : await sendGeneralMessage({
              message: messageToSend,
              session_id: currentChat.sessionId,
            }).unwrap();
        const aiResponse = {
          id: Date.now(),
          content: stripHtmlTags(response.response),
          sender: "assistant",
          timestamp: new Date().toISOString(),
          sources: response.sources || [],
          context_used: response.context_used,
          response_type: response.response_type,
        };
        const chatWithResponse = {
          ...updatedChat,
          messages: [...updatedChat.messages, aiResponse],
        };
        setCurrentChat(chatWithResponse);
        setChats((prev) =>
          prev.map((c) => (c.id === currentChat.id ? chatWithResponse : c))
        );
      } catch (error) {
        console.error("Error sending message:", error);
        const errorResponse = {
          id: Date.now(),
          content:
            "Sorry, I encountered an error processing your message. Please try again.",
          sender: "assistant",
          timestamp: new Date().toISOString(),
          isError: true,
        };
        const chatWithError = {
          ...updatedChat,
          messages: [...updatedChat.messages, errorResponse],
        };
        setCurrentChat(chatWithError);
        setChats((prev) =>
          prev.map((c) => (c.id === currentChat.id ? chatWithError : c))
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      inputMessage,
      isLoading,
      currentChat,
      useDocumentContext,
      sendMessage,
      sendGeneralMessage,
      stripHtmlTags,
      updateChatTitle,
    ]
  );

  const deleteChat = useCallback(
    async (chatId) => {
      const chatToDelete = chats.find((c) => c.id === chatId);
      if (chatToDelete?.sessionId) {
        try {
          await deleteChatSession(chatToDelete.sessionId);
        } catch (err) {
          console.error("Error deleting chat session:", err);
        }
      }
      const updated = chats.filter((c) => c.id !== chatId);
      setChats(updated);
      if (currentChat.id === chatId) {
        if (updated.length > 0) setCurrentChat(updated[0]);
        else createNewChat();
      }
    },
    [chats, currentChat, deleteChatSession, createNewChat]
  );

  const handleFileUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      e.target.value = "";
      const allowed = [
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowed.includes(file.type)) {
        alert("Please upload a PDF, TXT, DOC, or DOCX file.");
        return;
      }
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        alert("File size must be less than 100MB.");
        return;
      }
      try {
        setIsLoading(true);
        const result = await uploadDocument(file).unwrap();
        refetchDocuments();
        const uploadMessage = {
          id: Date.now(),
          content: `Document "${result.filename}" uploaded successfully! ${result.chunks_created} text chunks created.`,
          sender: "system",
          timestamp: new Date().toISOString(),
          isSuccess: true,
        };
        const updatedChat = {
          ...currentChat,
          messages: [...currentChat.messages, uploadMessage],
        };
        setCurrentChat(updatedChat);
        setChats((prev) =>
          prev.map((c) => (c.id === currentChat.id ? updatedChat : c))
        );
      } catch (error) {
        console.error("Error uploading document:", error);
        let errorMessage = "Failed to upload document. ";
        if (error.status === 422)
          errorMessage +=
            "Invalid file format or corrupted file. Please try a different file.";
        else if (error.status === 413)
          errorMessage += "File is too large. Please upload a smaller file.";
        else if (error.data?.detail) errorMessage += error.data.detail;
        else errorMessage += "Please check your connection and try again.";
        const errorChatMessage = {
          id: Date.now(),
          content: errorMessage,
          sender: "system",
          timestamp: new Date().toISOString(),
          isError: true,
        };
        const updatedChat = {
          ...currentChat,
          messages: [...currentChat.messages, errorChatMessage],
        };
        setCurrentChat(updatedChat);
        setChats((prev) =>
          prev.map((c) => (c.id === currentChat.id ? updatedChat : c))
        );
      } finally {
        setIsLoading(false);
      }
    },
    [uploadDocument, refetchDocuments, currentChat, setChats]
  );

  const handleDeleteDocument = useCallback(
    async (fileId, filename) => {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${filename}"?`
      );
      if (!confirmDelete) return;
      try {
        await deleteDocument(fileId).unwrap();
        refetchDocuments();
      } catch (error) {
        console.error("Error deleting document:", error);
        alert("Failed to delete document. Please try again.");
      }
    },
    [deleteDocument, refetchDocuments]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const formatTimestamp = useCallback(
    (timestamp) =>
      new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  const handleClearAllChats = useCallback(async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear all conversations?"
    );
    if (!confirmClear) return;
    try {
      await clearAllSessions();
      setChats([]);
      createNewChat();
      localStorage.removeItem("ragChats");
    } catch (error) {
      console.error("Error clearing all chats:", error);
    }
  }, [clearAllSessions, createNewChat]);

  return {
    state: {
      chats,
      currentChat,
      inputMessage,
      isLoading,
      isSidebarOpen,
      uploadedDocuments,
      showDocuments,
      useDocumentContext,
    },
    refs: { messagesEndRef, fileInputRef },
    actions: {
      setInputMessage,
      setIsSidebarOpen,
      setShowDocuments,
      setUseDocumentContext,
      handleSendMessage,
      handleKeyDown,
      createNewChat,
      selectChat,
      deleteChat,
      handleFileUpload,
      handleDeleteDocument,
      handleClearAllChats,
      formatTimestamp,
    },
  };
}

export default useChatbot;
