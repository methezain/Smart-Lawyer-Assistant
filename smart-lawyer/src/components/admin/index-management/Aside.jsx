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
          <li>
            <button
              onClick={() => onNavigate("notifications")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "notifications"
                  ? "bg-gray-100 text-emerald-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-notification-2-line text-2xl"></i>
              <span>Notifications</span>
              <span className="ml-auto bg-red-500 text-white text-xs w-4 h-4 flex justify-center items-center flex-shrink-0 rounded-full ">
                0
              </span>
            </button>
          </li>
        </ul>

        <p className="text-[10px] font-medium text-gray-500 mb-3 px-3">
          CASE MANAGEMENT
        </p>
        <ul className="space-y-1.5 mb-3">
          <li>
            <button
              onClick={() => onNavigate("cases")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "cases"
                  ? "bg-gray-100 text-emerald-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-file-list-3-line text-2xl"></i>
              <span>All Cases</span>
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
              <span>Court Hearings</span>
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
              <i className="ri-file-paper-2-line text-2xl"></i>
              <span>Legal Documents</span>
            </button>
          </li>
        </ul>

        <p className="text-[10px] font-medium text-gray-500 mb-3 px-3">
          PEOPLE
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
              <i className="ri-contacts-book-line text-2xl"></i>
              <span>Clients</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("addStaff")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "addStaff"
                  ? "bg-gray-100 text-emerald-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-user-add-line text-2xl"></i>
              <span>Add Staff</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("staff")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "staff"
                  ? "bg-gray-100 text-emerald-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-team-line text-2xl"></i>
              <span>Staff Directory</span>
            </button>
          </li>
        </ul>

        <p className="text-[10px] font-medium text-gray-500 mb-3 px-3">
          BOOKKEEPING
        </p>
        <ul className="space-y-1.5 mb-3">
          <li>
            <button
              onClick={() => onNavigate("contracts")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "contracts"
                  ? "bg-gray-100 text-emerald-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-shake-hands-line text-2xl"></i>
              <span>Agreements</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("billing")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "billing"
                  ? "bg-gray-100 text-emerald-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-money-dollar-circle-line text-2xl"></i>
              <span>Invoices</span>
            </button>
          </li>
        </ul>
        <p className="text-[10px] font-medium text-gray-500 mb-3 px-3">
          SETTINGS
        </p>
        <ul className="space-y-1.5 mb-3">
          <li>
            <button
              onClick={() => onNavigate("settings")}
              className={`flex items-center gap-4 px-2 py-1.5 cursor-pointer w-full text-left rounded-xl ${
                activeComponent === "settings"
                  ? "bg-gray-100 text-emerald-600"
                  : "hover:bg-gray-100 text-gray-800"
              } font-medium`}
            >
              <i className="ri-settings-4-line text-2xl"></i>
              <span>Settings</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
