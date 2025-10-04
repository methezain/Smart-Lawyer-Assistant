import React, { useState, useEffect, useRef } from "react";
import Notifications from "../staff/self-component/Notifications";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useEndLoginSessionMutation } from "../../reduxstore/services/AdminAuthAPI";
import { logout } from "../../reduxstore/features/authSlice";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [endLoginSession] = useEndLoginSessionMutation();
  const userMenuRef = useRef(null);
  // Load mock notifications (for staff only)
  useEffect(() => {
    if (userRole === "staff") {
      setTimeout(() => {
        setNotifications([
          {
            id: 1,
            title: "New case assigned",
            message: "You've been assigned to Case #12345 - Smith vs. Jones",
            time: "2 hours ago",
            read: false,
            type: "case",
          },
          {
            id: 2,
            title: "Document ready for review",
            message: "The contract for Client XYZ needs your review",
            time: "1 day ago",
            read: true,
            type: "document",
          },
          {
            id: 3,
            title: "Meeting reminder",
            message: "Team meeting tomorrow at 10:00 AM",
            time: "2 days ago",
            read: true,
            type: "meeting",
          },
        ]);
      }, 1000);
    }
  }, [userRole]);
  // Close dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = () => {
      const token =
        localStorage.getItem("admin_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("clientToken");
      const storedUserName = localStorage.getItem("user_name") || "";
      const storedUserRole = localStorage.getItem("userRole") || "";
      const storedUser = localStorage.getItem("user");
      const storedClient = localStorage.getItem("client");

      setIsAuthenticated(!!token && !!storedUserRole);
      // Prefer client name when role is client
      if (storedUserRole === "client" && storedClient) {
        try {
          const parsedClient = JSON.parse(storedClient);
          setUserName(
            parsedClient.full_name || parsedClient.username || "User"
          );
        } catch {
          setUserName(storedUserName || "User");
        }
      } else {
        setUserName(storedUserName || "User");
      }
      setUserRole(storedUserRole);

      if (storedUser) {
        try {
          setUserDetails(JSON.parse(storedUser));
        } catch {
          setUserDetails(null);
        }
      } else {
        setUserDetails(null);
      }

      if (storedClient) {
        try {
          setClientDetails(JSON.parse(storedClient));
        } catch {
          setClientDetails(null);
        }
      } else {
        setClientDetails(null);
      }
    };

    // Initial check
    checkAuthStatus();

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [location]); // Re-run when location changes

  // Profile navigation available via role headers if needed; not used here
  const handleLogout = async () => {
    // If staff, best-effort close the latest open session
    try {
      const storedUser = localStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      if (userRole === "staff" && parsedUser?.id) {
        await endLoginSession({ id: parsedUser.id, body: {} }).unwrap();
      }
    } catch (e) {
      // Non-blocking
      console.warn("endLoginSession failed", e);
    }
    dispatch(logout());
    setIsAuthenticated(false);
    setUserName("");
    setUserRole("");
    setUserDetails(null);
    navigate("/");
  };

  // Helpers for avatar and display name
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    const first = parts[0][0] || "";
    const last = parts[parts.length - 1][0] || "";
    return (first + last).toUpperCase();
  };

  const getAvatarData = () => {
    if (userRole === "admin") {
      const name = userDetails?.userDetails
        ? `${userDetails.userDetails.first_name || ""} ${
            userDetails.userDetails.last_name || ""
          }`.trim()
        : userName;
      const image =
        userDetails?.userDetails?.profile_image_path ||
        userDetails?.profile_image_path ||
        null;
      return {
        displayName: name || userName || "User",
        avatarUrl: image,
        initials: getInitials(name || userName),
        subLabel: userDetails?.firmName || "admin",
      };
    }
    if (userRole === "staff") {
      const name = userDetails?.userDetails?.name || userName;
      const image =
        userDetails?.userDetails?.profile_image_path ||
        userDetails?.profile_image_path ||
        null;
      return {
        displayName: name || userName || "User",
        avatarUrl: image,
        initials: getInitials(name || userName),
        subLabel: "staff",
      };
    }
    if (userRole === "client") {
      const name =
        clientDetails?.full_name || clientDetails?.username || userName;
      const image = clientDetails?.profile_image_path || null;
      return {
        displayName: name || userName || "User",
        avatarUrl: image,
        initials: getInitials(name || userName),
        subLabel: "client",
      };
    }
    return {
      displayName: userName || "User",
      avatarUrl: null,
      initials: getInitials(userName),
      subLabel: "user",
    };
  };

  const { displayName, avatarUrl, initials, subLabel } = getAvatarData();
  const firmName = userDetails?.firmName;

  // Profile dropdown header for all roles
  const UserHeader = ({
    displayName,
    avatarUrl,
    initials,
    subLabel,
    onLogout,
  }) => {
    // You can add more user info here if available
    const userEmail =
      userDetails?.userDetails?.email || clientDetails?.email || "";
    return (
      <div className="relative ml-3" ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen((open) => !open)}
          className="flex items-center text-sm rounded-full cursor-pointer hover:outline-none hover:ring-2 hover:ring-offset-2 hover:ring-emerald-500"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-sm font-medium">{initials}</span>
            )}
          </div>
          <div className="ml-2 text-left">
            <span className="text-gray-700 hidden md:block">{displayName}</span>
            <p className="text-xs text-gray-400 leading-3">
              {subLabel === "admin" && firmName ? firmName : subLabel}
            </p>
          </div>
          <i
            className={`ri-arrow-down-s-line ml-2 text-gray-400 transition-transform duration-200 ${
              userMenuOpen ? "rotate-180" : "rotate-0"
            }`}
            style={{ willChange: "transform" }}
          ></i>
        </button>

        {userMenuOpen && (
          <div className="absolute -right-2 mt-3 w-40 rounded-xl shadow-xl z-20 animate-fadeIn">
            {/* Arrow */}
            <div
              className="flex justify-end"
              style={{
                position: "absolute",
                top: "-10px",
                left: 0,
                width: "100%",
                pointerEvents: "none",
              }}
            >
              <div className="w-3 h-3 bg-emerald-500 rotate-45 shadow-md mr-2 mt-2"></div>
            </div>
            <div className="rounded-xl bg-emerald-500 text-white shadow-xl p-2 relative space-y-1">
              <div className="flex flex-col gap-0.5 border-b border-emerald-100 pb-2">
                <div className="text-xs font-semibold truncate flex items-center gap-1">
                  {displayName}
                  <span className="w-[3px] h-[3px] bg-gray-100 rounded mt-0.5"></span>
                  <p className="text-xs">
                    {subLabel === "admin" && firmName ? firmName : subLabel}
                  </p>
                </div>
                {userEmail && (
                  <p className="text-[10px] text-emerald-100 truncate">
                    {userEmail}
                  </p>
                )}
              </div>
              <Link
                to={
                  userRole === "staff"
                    ? `/staff/${userName}/profile`
                    : userRole === "admin"
                    ? `/admin/${userName}/profile`
                    : userRole === "client"
                    ? `/client/${userName}/profile`
                    : "/"
                }
                className="flex items-center gap-2 py-1 text-xs rounded-lg text-white "
                onClick={() => setUserMenuOpen(false)}
              >
                <i className="ri-user-settings-line"></i>
                Your Profile
              </Link>
              <div className="border-t border-emerald-100 w-full">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-2 pt-2 pb-1 cursor-pointer text-xs rounded-lg text-white "
                >
                  <i className="ri-logout-box-line"></i>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-14 w-full bg-white px-10 flex justify-between items-center fixed top-0 z-50 border-b border-gray-200">
      <h1 className="p-3 text-2xl font-bold cursor-pointer text-[#226447]">
        LOGO
      </h1>
      <nav className="flex justify-end items-center text-[13px] gap-2 ">
        {isAuthenticated ? (
          <>
            <UserHeader
              displayName={displayName}
              avatarUrl={avatarUrl}
              initials={initials}
              subLabel={subLabel}
              onLogout={handleLogout}
            />
            {userRole === "staff" && (
              <Notifications
                notifications={notifications}
                setNotifications={setNotifications}
              />
            )}
          </>
        ) : (
          <>
            <Link
              to="/auth"
              className="bg-emerald-500 text-xs text-white px-4 py-2 font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/welcome"
              className="bg-[#dededa] text-xs text-[#0c0c0c] px-4 py-2 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Register your Firm
              <i className="ri-arrow-right-up-line size-10 ml-1.5"></i>
            </Link>

            <Link
              to="/register-yourself-as-a-client"
              className="bg-[#dededa] text-xs text-[#0c0c0c] px-4 py-2 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Sign Up
              <i className="ri-arrow-right-up-line size-10"></i>
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}
