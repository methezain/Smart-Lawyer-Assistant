import PropTypes from "prop-types";

// Staff feature components
import Calendar from "../scheduling-component/Calendar";
import Profile from "../self-component/Profile";

// Case Management (staff-scoped)
import StaffIndexCase from "../case-management/StaffIndexCase";
import StaffIndexHearings from "../case-management/StaffIndexHearings";
import StaffIndexJudgment from "../case-management/StaffIndexJudgment";
import StaffIndexDocuments from "../case-management/StaffIndexDocuments";
import StaffIndexClient from "../case-management/StaffIndexClient";

// AI Legal Tools
import Chatbot from "../ai-legal-chatbot/Chatbot";
import Classification from "../ai-case-classification/Classification";
import Summarization from "../ai-case-summarization/Summarization";
import Prediction from "../ai-case-prediction/Prediction";
import Examination from "../ai-cross-examination/Examination";
import Template from "../ai-docs-drafting/Template";

export default function MainStaff({
  activeComponent,
  chatbotState,
  chatbotActions,
  chatbotRefs,
}) {
  const renderComponent = () => {
    switch (activeComponent) {
      case "home":
        return <Calendar />;
      case "profile":
        return <Profile />;
      case "cases":
        return <StaffIndexCase />;
      case "clients":
        return <StaffIndexClient />;
      case "hearings":
        return <StaffIndexHearings />;
      case "judgments":
        return <StaffIndexJudgment />;
      case "documents":
        return <StaffIndexDocuments />;
      // AI tools
      case "chatbot":
        if (!chatbotState) return null;
        const { currentChat, inputMessage, isLoading } = chatbotState;
        const {
          setInputMessage,
          handleSendMessage,
          handleKeyDown,
          handleFileUpload,
          formatTimestamp,
        } = chatbotActions;
        const { fileInputRef, messagesEndRef } = chatbotRefs;
        return (
          <Chatbot
            currentChat={currentChat}
            inputMessage={inputMessage}
            isLoading={isLoading}
            fileInputRef={fileInputRef}
            messagesEndRef={messagesEndRef}
            setInputMessage={setInputMessage}
            handleSendMessage={handleSendMessage}
            handleKeyDown={handleKeyDown}
            handleFileUpload={handleFileUpload}
            formatTimestamp={formatTimestamp}
          />
        );
      case "summarization":
        return <Summarization />;
      case "template":
        return <Template />;
      case "examination":
        return <Examination />;
      case "prediction":
        return <Prediction />;
      case "classification":
        return <Classification />;
      default:
        return <Calendar />;
    }
  };

  return (
    <div className="flex-1 p-4 overflow-auto">
      <div className="max-w-7xl mx-auto">{renderComponent()}</div>
    </div>
  );
}

MainStaff.propTypes = {
  activeComponent: PropTypes.string.isRequired,
  chatbotState: PropTypes.object,
  chatbotActions: PropTypes.object,
  chatbotRefs: PropTypes.object,
};
