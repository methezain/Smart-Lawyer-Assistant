import React from "react";
import PropTypes from "prop-types";
import Messages from "./Messages";
import ChatInput from "./ChatInput";

// Presentational Chatbot: expects injected state/actions/refs from parent (Dashboard)
const Chatbot = ({
  currentChat,
  inputMessage,
  isLoading,
  fileInputRef,
  messagesEndRef,
  setInputMessage,
  handleSendMessage,
  handleKeyDown,
  handleFileUpload,
  formatTimestamp,
}) => {
  const hasMessages = currentChat.messages.length > 0;

  // Initial state: center the input; After first message: typical chat layout with messages area + bottom input
  if (!hasMessages) {
    return (
      <div className="h-[calc(100dvh-90px)] flex items-center justify-center px-4">
        <div className="w-full max-w-3xl">
          <ChatInput
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            isLoading={isLoading}
            onSubmit={handleSendMessage}
            onKeyDown={handleKeyDown}
            fileInputRef={fileInputRef}
            onFileUpload={handleFileUpload}
            mode="initial"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-90px)] flex flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-3xl mx-auto">
          <Messages
            messages={currentChat.messages}
            isLoading={isLoading}
            endRef={messagesEndRef}
            formatTimestamp={formatTimestamp}
          />
        </div>
      </div>
      <div>
        <div className="max-w-3xl mx-auto ">
          <ChatInput
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            isLoading={isLoading}
            onSubmit={handleSendMessage}
            onKeyDown={handleKeyDown}
            fileInputRef={fileInputRef}
            onFileUpload={handleFileUpload}
          />
        </div>
      </div>
    </div>
  );
};

Chatbot.propTypes = {
  currentChat: PropTypes.shape({
    id: PropTypes.string,
    messages: PropTypes.array.isRequired,
  }).isRequired,
  inputMessage: PropTypes.string.isRequired,
  isLoading: PropTypes.bool.isRequired,
  fileInputRef: PropTypes.object.isRequired,
  messagesEndRef: PropTypes.object.isRequired,
  setInputMessage: PropTypes.func.isRequired,
  handleSendMessage: PropTypes.func.isRequired,
  handleKeyDown: PropTypes.func.isRequired,
  handleFileUpload: PropTypes.func.isRequired,
  formatTimestamp: PropTypes.func.isRequired,
};

export default Chatbot;
