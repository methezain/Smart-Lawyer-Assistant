import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

const Notifications = ({ notifications, setNotifications }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get unread notification count
  const unreadCount = notifications.filter((note) => !note.read).length;

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "case":
        return "ri-folder-open-line";
      case "document":
        return "ri-file-text-line";
      case "meeting":
        return "ri-calendar-check-line";
      default:
        return "ri-notification-3-line";
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((note) => ({ ...note, read: true })));
  };

  const handleNotificationClick = (notification) => {
    setNotifications((prev) =>
      prev.map((note) =>
        note.id === notification.id ? { ...note, read: true } : note
      )
    );
    setNotificationsOpen(false);
  };

  return (
    <div className="relative ml-3" ref={notificationsRef}>
      <button
        onClick={() => setNotificationsOpen(!notificationsOpen)}
        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full relative"
      >
        <i className="ri-notification-3-line text-xl"></i>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {notificationsOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-emerald-600 hover:text-emerald-800"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500">
                  <i className="ri-notification-off-line text-2xl mb-2"></i>
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? "bg-emerald-50" : ""
                    }`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          !notification.read
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <i
                          className={getNotificationIcon(notification.type)}
                        ></i>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 text-center">
              <Link
                to="/staff/notifications"
                className="text-xs text-emerald-600 hover:text-emerald-800"
                onClick={() => setNotificationsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
