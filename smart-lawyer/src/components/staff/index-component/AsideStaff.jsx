import PropTypes from "prop-types";

export default function Aside({ activeComponent, onNavigate }) {
  return (
    <div className="w-[275px] bg-white border-r border-gray-200 flex flex-col ">
      <nav className="flex-1 p-3 overflow-y-auto text-sm">
        <p className="text-[10px] font-medium text-gray-500 mb-3 px-3">MAIN</p>
        <ul className="space-y-1.5 mb-3">
          <li>
            <button
              onClick={() => onNavigate("home")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "home"
                  ? "bg-gray-100 text-emerald-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-dashboard-line text-2xl"></i>
              <span>Home</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("profile")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "profile"
                  ? "bg-gray-100 text-emerald-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-user-line text-2xl"></i>
              <span>Profile</span>
            </button>
          </li>
        </ul>

        <p className="text-[10px] font-medium text-gray-500 mb-3 px-3">
          CASE MANAGEMENT
        </p>
        <ul className="space-y-1.5 mb-3">
          <li>
            <button
              onClick={() => onNavigate("clients")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "clients"
                  ? "bg-gray-100 text-emerald-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-team-line text-2xl"></i>
              <span>Clients</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("cases")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "cases"
                  ? "bg-gray-100 text-emerald-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-folder-open-line text-2xl"></i>
              <span>Cases</span>
            </button>
          </li>

          <li>
            <button
              onClick={() => onNavigate("hearings")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "hearings"
                  ? "bg-gray-100 text-emerald-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-calendar-event-line text-2xl"></i>
              <span>Hearings</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("judgments")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "judgments"
                  ? "bg-gray-100 text-emerald-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-scales-line text-2xl"></i>
              <span>Judgments</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("documents")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "documents"
                  ? "bg-gray-100 text-emerald-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-file-list-3-line text-2xl"></i>
              <span>Documents</span>
            </button>
          </li>
        </ul>

        <p className="text-[10px] font-medium text-gray-500 mb-3 px-3">
          AI LEGAL TOOLS
        </p>
        <ul className="space-y-1.5 mb-3">
          <li>
            <button
              onClick={() => onNavigate("chatbot")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "chatbot"
                  ? "bg-gray-100 text-blue-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-chat-3-line text-2xl"></i>
              <span>AI Legal Assistant</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("classification")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "classification"
                  ? "bg-gray-100 text-blue-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-file-list-3-line text-2xl"></i>
              <span>Document Classification</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("summarization")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "summarization"
                  ? "bg-gray-100 text-blue-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-file-text-line text-2xl"></i>
              <span>Document Summarization</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("template")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "template"
                  ? "bg-gray-100 text-blue-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-draft-line text-2xl"></i>
              <span>Document Drafting</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("examination")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "examination"
                  ? "bg-gray-100 text-blue-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-scales-line text-2xl"></i>
              <span>Cross Examination</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("prediction")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "prediction"
                  ? "bg-gray-100 text-blue-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-bubble-chart-line text-2xl"></i>
              <span>Verdict Prediction</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

Aside.propTypes = {
  activeComponent: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
};
