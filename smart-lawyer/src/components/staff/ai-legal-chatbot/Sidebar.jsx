import React, { useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

const Sidebar = ({
  isOpen,
  chats,
  currentChatId,
  onSelectChat,
  onDeleteChat,
  onCreateChat,
  showDocuments,
  toggleDocuments,
  uploadedDocuments,
  onDeleteDocument,
  onClearAllChats,
  onToggleSidebar,
  overlayMode = false,
}) => {
  const [confirmingChatId, setConfirmingChatId] = useState(null);

  // Layout + animation container classes
  const containerClasses = overlayMode
    ? `fixed z-40 top-14 left-0 h-[calc(100dvh-56px)] w-[288px] flex flex-col bg-[#f7fafd] shadow-md border-r border-gray-100 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-72"
      }`
    : `relative ${
        isOpen ? "w-[275px]" : "w-0"
      } bg-[#f7fafd] border-r border-gray-100 transition-all duration-300 flex flex-col`;

  // Helper: derive display title similar to Gemini chat list (first prompt fallback)
  const getDisplayTitle = (chat) => {
    const placeholderTitles = ["New Chat", "Chat", "Untitled", ""].map((t) =>
      t.toLowerCase()
    );
    const baseTitle = (chat.title || "").trim();
    const firstUserMsg = chat.messages?.find((m) => m.role === "user");
    if (!baseTitle || placeholderTitles.includes(baseTitle.toLowerCase())) {
      if (firstUserMsg?.content) {
        const text = firstUserMsg.content.replace(/\s+/g, " ").trim();
        return text.length > 40 ? text.slice(0, 37) + "..." : text || "(draft)";
      }
      return "New chat"; // UI default
    }
    return baseTitle.length > 40 ? baseTitle.slice(0, 37) + "..." : baseTitle;
  };
  return (
    <div
      className={containerClasses}
      aria-hidden={!isOpen && !overlayMode ? true : undefined}
    >
      {/* Edge Toggle Handle */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        className={`group absolute top-1/2 right-0 translate-x-full cursor-pointer -translate-y-1/2 z-50 h-full w-2 flex items-center justify-center bg-sky-100 transition ${
          !isOpen ? "pointer-events-auto" : ""
        }`}
      >
        <i
          className={`text-sky-600 group-hover:text-sky-600 text-sm ${
            isOpen ? "ri-arrow-left-s-line" : "ri-arrow-right-s-line"
          }`}
        />
      </button>
      <div
        className={`px-3 pt-4 pb-2 border-b border-gray-100 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={onCreateChat}
          className="w-full group flex items-center gap-2 rounded-xl bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 px-3 py-2 text-sm font-medium shadow-sm transition-colors"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500 text-white text-base group-hover:bg-emerald-600 transition">
            <i className="ri-add-line" />
          </span>
          <span>New chat</span>
        </button>
      </div>
      {/* Gems (static placeholders for now) */}
      <div
        className={`px-4 py-3 border-b border-gray-100 space-y-2 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <h3 className="px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Gems
        </h3>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-600 hover:bg-white hover:shadow-sm transition"
            onClick={toggleDocuments}
            title="Manage Documents"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-sky-100 text-sky-500">
              <i className="ri-file-list-line text-base" />
            </span>
            <span className="flex-1 text-left">Documents</span>
            <i className="ri-pushpin-line text-[13px] text-gray-400" />
          </button>
          {/* Placeholder gem
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-600 hover:bg-white hover:shadow-sm transition"
            disabled
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-indigo-100 text-indigo-500">
              <i className="ri-book-open-line text-base" />
            </span>
            <span className="flex-1 text-left">Knowledge Base</span>
            <i className="ri-pushpin-line text-[13px] text-gray-300" />
          </button> */}
        </div>
      </div>
      {showDocuments && (
        <div className="border-b border-gray-200 p-4 max-h-48 overflow-y-auto">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Uploaded Documents
          </h3>
          {uploadedDocuments.length === 0 ? (
            <p className="text-xs text-gray-500">No documents uploaded</p>
          ) : (
            <div className="space-y-2">
              {uploadedDocuments.map((doc) => (
                <div
                  key={doc.file_id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate text-gray-700">{doc.filename}</span>
                  <button
                    onClick={() => onDeleteDocument(doc.file_id, doc.filename)}
                    className="text-red-500 hover:text-red-700 ml-2"
                    title="Delete document"
                  >
                    <i className="ri-delete-bin-line" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div
        className={`overflow-y-auto flex-1 transition-opacity duration-200 custom-scroll ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-4 py-3">
          <h3 className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Recent
          </h3>
          <div className="space-y-1.5">
            {chats.map((chat) => {
              const display = getDisplayTitle(chat);
              const active = currentChatId === chat.id;
              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => onSelectChat(chat)}
                  className={`group relative w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-emerald-400/40 transition ${
                    active
                      ? "bg-emerald-100/70 text-emerald-700"
                      : "hover:bg-white hover:shadow-sm text-gray-700"
                  }`}
                  aria-current={active ? "true" : undefined}
                >
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium shadow-sm ${
                      active
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 text-gray-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors"
                    }`}
                  >
                    <i className="ri-chat-3-line text-base" />
                  </span>
                  <span className="flex-1 min-w-0 text-xs font-semibold truncate">
                    {display}
                  </span>
                  <span className="text-xs font-semibold text-gray-400 group-hover:hidden">
                    {chat.messages.length}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmingChatId(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-white bg-emerald-500 hover:text-red-500 py-1 px-2 rounded-md hover:bg-red-100 transition"
                    title="Delete chat"
                  >
                    <i className="ri-close-line" />
                  </button>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div
        className={`px-4 py-3 border-t border-gray-100 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex gap-2">
          <button
            onClick={onClearAllChats}
            className="flex-1 bg-red-500/90 hover:bg-red-600 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={toggleDocuments}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 transition"
            title="Documents"
          >
            <i className="ri-folder-2-line" />
          </button>
        </div>
      </div>
      {confirmingChatId &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setConfirmingChatId(null)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-chat-title"
              className="relative z-10 w-full max-w-md mx-4 rounded-3xl bg-[#f7f9fc] shadow-2xl border border-gray-200 p-4 animate-fade-in"
            >
              <h2
                id="delete-chat-title"
                className="font-semibold text-gray-800 mb-2"
              >
                Delete chat?
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                This will permanently remove all prompts and responses in this
                conversation. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 text-sm">
                <button
                  onClick={() => setConfirmingChatId(null)}
                  className="px-4 py-2 rounded-xl font-medium text-xs text-gray-600 hover:bg-white/80 border border-transparent hover:border-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const id = confirmingChatId;
                    setConfirmingChatId(null);
                    onDeleteChat(id);
                  }}
                  className="px-4 py-2 rounded-xl font-semibold text-xs bg-red-600 text-white hover:bg-red-700 shadow-sm transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  chats: PropTypes.array.isRequired,
  currentChatId: PropTypes.string,
  onSelectChat: PropTypes.func.isRequired,
  onDeleteChat: PropTypes.func.isRequired,
  onCreateChat: PropTypes.func.isRequired,
  showDocuments: PropTypes.bool.isRequired,
  toggleDocuments: PropTypes.func.isRequired,
  uploadedDocuments: PropTypes.array.isRequired,
  onDeleteDocument: PropTypes.func.isRequired,
  onClearAllChats: PropTypes.func.isRequired,
  onToggleSidebar: PropTypes.func.isRequired,
  overlayMode: PropTypes.bool,
};

export default Sidebar;
