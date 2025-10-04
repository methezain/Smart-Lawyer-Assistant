import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Header from "../../landing/Header";
import Aside from "./AsideStaff";
import Main from "./MainStaff";
import Sidebar from "../ai-legal-chatbot/Sidebar";
import useChatbot from "../ai-legal-chatbot/useChatbot";
import { useTokenMonitor } from "../../../hooks/useTokenMonitor";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useParams();

  const [activeComponent, setActiveComponent] = useState("home");
  // Chatbot state (only initialized here so Sidebar can overlay Aside)
  const {
    state: chatbotState,
    actions: chatbotActions,
    refs: chatbotRefs,
  } = useChatbot();
  const {
    chats,
    currentChat,
    isSidebarOpen,
    uploadedDocuments,
    showDocuments,
  } = chatbotState;
  const {
    setIsSidebarOpen,
    setShowDocuments,
    createNewChat,
    selectChat,
    deleteChat,
    handleDeleteDocument,
    handleClearAllChats,
  } = chatbotActions;

  // Add token monitoring (same as Admin Dashboard)
  const tokenStatus = useTokenMonitor(true);

  // Optional: log token status for debugging
  useEffect(() => {
    if (tokenStatus.timeRemaining > 0) {
      console.log(
        `🕐 [Staff] Token status - Time remaining: ${tokenStatus.timeRemaining} minutes, Expiring: ${tokenStatus.isExpiring}`
      );
    }
  }, [tokenStatus]);

  // Determine base route for staff
  const baseRoute = `/staff/${username}`;

  // Set active component based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/home") || path === baseRoute) {
      setActiveComponent("home");
    } else if (path.includes("/profile")) {
      setActiveComponent("profile");
    } else if (path.includes("/cases")) {
      setActiveComponent("cases");
    } else if (path.includes("/clients")) {
      setActiveComponent("clients");
    } else if (path.includes("/documents")) {
      setActiveComponent("documents");
    } else if (path.includes("/calendar")) {
      setActiveComponent("calendar");
    } else if (path.includes(`/chatbot`)) {
      setActiveComponent("chatbot");
    } else if (path.includes(`/summarization`)) {
      setActiveComponent("summarization");
    } else if (path.includes(`/template`)) {
      setActiveComponent("template");
    } else if (path.includes(`/examination`)) {
      setActiveComponent("examination");
    } else if (path.includes(`/prediction`)) {
      setActiveComponent("prediction");
    } else if (path.includes(`/classification`)) {
      setActiveComponent("classification");
    }
  }, [location, baseRoute]);

  // Navigate via sidebar
  const navigateToComponent = (component) => {
    setActiveComponent(component);
    if (component === "home") {
      navigate(baseRoute + "/home");
    } else if (
      [
        "chatbot",
        "summarization",
        "template",
        "examination",
        "prediction",
        "classification",
      ].includes(component)
    ) {
      navigate(`${baseRoute}/${component}`);
    } else {
      navigate(`${baseRoute}/${component}`);
    }
  };

  return (
    <>
      <Header />
      <div className="bg-gray-50 h-[calc(100vh-56px)] mt-14 w-full flex relative">
        <Aside
          activeComponent={activeComponent}
          onNavigate={navigateToComponent}
        />
        {/* Overlay Sidebar only when chatbot active */}
        {activeComponent === "chatbot" && (
          <Sidebar
            isOpen={isSidebarOpen}
            chats={chats}
            currentChatId={currentChat.id}
            onSelectChat={selectChat}
            onDeleteChat={deleteChat}
            onCreateChat={createNewChat}
            showDocuments={showDocuments}
            toggleDocuments={() => setShowDocuments(!showDocuments)}
            uploadedDocuments={uploadedDocuments}
            onDeleteDocument={handleDeleteDocument}
            onClearAllChats={handleClearAllChats}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            overlayMode
          />
        )}
        <Main
          activeComponent={activeComponent}
          chatbotState={chatbotState}
          chatbotActions={chatbotActions}
          chatbotRefs={chatbotRefs}
        />
      </div>
    </>
  );
}
