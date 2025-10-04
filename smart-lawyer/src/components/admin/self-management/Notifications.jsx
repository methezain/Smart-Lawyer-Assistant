import React, { useState, useEffect } from "react";

const Notifications = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationsData, setNotificationsData] = useState([]);

  // Load notifications from localStorage on component mount
  useEffect(() => {
    const loadNotifications = () => {
      const storedNotifications = JSON.parse(
        localStorage.getItem("notifications") || "[]"
      );
      setNotificationsData(storedNotifications);
    };

    loadNotifications();
    // Set up an interval to check for new notifications
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter notifications based on active tab and search term
  const filteredNotifications = notificationsData
    .filter((notification) => {
      // Filter by tab
      if (activeTab !== "all" && activeTab !== notification.type) {
        return false;
      }

      // Filter by search term
      if (
        searchTerm &&
        !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first

  // Get counts for each type
  const counts = {
    all: notificationsData.length,
    case: notificationsData.filter((n) => n.type === "case").length,
    message: notificationsData.filter((n) => n.type === "message").length,
    document: notificationsData.filter((n) => n.type === "document").length,
    system: notificationsData.filter((n) => n.type === "system").length,
    client: notificationsData.filter((n) => n.type === "client").length,
    contract: notificationsData.filter((n) => n.type === "contract").length,
    unread: notificationsData.filter((n) => !n.isRead).length,
  };

  // Mark a notification as read
  const markAsRead = (id) => {
    const updatedNotifications = notificationsData.map((notification) =>
      notification.id === id ? { ...notification, isRead: true } : notification
    );
    setNotificationsData(updatedNotifications);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const updatedNotifications = notificationsData.map((notification) => ({
      ...notification,
      isRead: true,
    }));
    setNotificationsData(updatedNotifications);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
  };

  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>

        <button
          onClick={markAllAsRead}
          className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center"
          disabled={counts.unread === 0}
        >
          <i className="ri-check-double-line mr-1"></i>
          Mark all as read
        </button>
      </div>

      {/* Search and Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <i className="ri-search-line text-gray-400"></i>
            </span>
            <input
              type="text"
              placeholder="Search notifications..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex border-b border-gray-200 px-4">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === "all"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("case")}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === "case"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Case Updates
              <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                {counts.case}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("message")}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === "message"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Messages
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                {counts.message}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("document")}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === "document"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Documents
              <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                {counts.document}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("system")}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === "system"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              System
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                {counts.system}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("client")}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === "client"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Clients
              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                {counts.client}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("contract")}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === "contract"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Contracts
              <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full">
                {counts.contract}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="ri-notification-off-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              No notifications found
            </h3>
            <p className="text-gray-500">
              {activeTab === "all" && searchTerm
                ? `No notifications matching "${searchTerm}"`
                : `No ${
                    activeTab === "all" ? "" : activeTab
                  } notifications available`}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <li
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  notification.isRead ? "" : "bg-blue-50"
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon based on notification type */}
                  <div
                    className={`mt-1 p-2 rounded-full ${
                      notification.type === "case"
                        ? "bg-green-100 text-green-600"
                        : notification.type === "message"
                        ? "bg-blue-100 text-blue-600"
                        : notification.type === "document"
                        ? "bg-purple-100 text-purple-600"
                        : notification.type === "client"
                        ? "bg-yellow-100 text-yellow-600"
                        : notification.type === "contract"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <i
                      className={`text-lg ${
                        notification.type === "case"
                          ? "ri-file-list-3-line"
                          : notification.type === "message"
                          ? "ri-message-2-line"
                          : notification.type === "document"
                          ? "ri-file-paper-2-line"
                          : notification.type === "client"
                          ? "ri-user-add-line"
                          : notification.type === "contract"
                          ? "ri-file-contract-line"
                          : "ri-information-line"
                      }`}
                    ></i>
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3
                        className={`font-medium ${
                          notification.isRead
                            ? "text-gray-700"
                            : "text-gray-900"
                        }`}
                      >
                        {notification.title}
                        {!notification.isRead && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                            New
                          </span>
                        )}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(notification.timestamp)}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mt-1">
                      {notification.message}
                    </p>

                    {/* Additional metadata based on notification type */}
                    {notification.type === "case" && (
                      <div className="mt-1.5 text-xs text-blue-600">
                        Case: {notification.caseId} - {notification.caseTitle}
                      </div>
                    )}

                    {notification.type === "message" && (
                      <div className="mt-1.5 text-xs text-gray-500">
                        From: {notification.sender}
                      </div>
                    )}

                    {/* Additional metadata for contract notifications */}
                    {notification.type === "contract" && (
                      <div className="mt-1.5 text-xs text-orange-600">
                        Contract ID: {notification.contractId}
                        <br />
                        Firm: {notification.firmName}
                        <br />
                        Client: {notification.clientName}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-3 flex items-center space-x-3">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-gray-600 hover:text-emerald-600 flex items-center"
                        >
                          <i className="ri-check-line mr-1"></i>
                          Mark as read
                        </button>
                      )}

                      {notification.actionRequired && (
                        <button
                          className={`text-xs px-3 py-1 rounded-full flex items-center ${
                            notification.actionType === "review"
                              ? "bg-blue-100 text-blue-800"
                              : notification.actionType === "assign"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          <i
                            className={`mr-1 ${
                              notification.actionType === "review"
                                ? "ri-eye-line"
                                : notification.actionType === "assign"
                                ? "ri-user-add-line"
                                : "ri-alert-line"
                            }`}
                          ></i>
                          {notification.actionType === "review"
                            ? "Review"
                            : notification.actionType === "assign"
                            ? "Assign"
                            : "Action Required"}
                        </button>
                      )}

                      {/* Action links based on notification type */}
                      {notification.type === "case" && (
                        <a
                          href="#"
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          View Case
                        </a>
                      )}

                      {notification.type === "message" && (
                        <a
                          href="#"
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          Reply
                        </a>
                      )}

                      {notification.type === "document" && (
                        <a
                          href="#"
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          View Documents
                        </a>
                      )}

                      {notification.type === "client" && (
                        <a
                          href="#"
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          View Client
                        </a>
                      )}

                      {notification.type === "contract" && (
                        <a
                          href="#"
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          Review Contract
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
