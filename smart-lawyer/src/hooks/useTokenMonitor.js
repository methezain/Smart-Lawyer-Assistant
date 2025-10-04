import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../reduxstore/features/authSlice";
import {
  isTokenExpiredOrExpiring,
  getTokenTimeRemaining,
} from "../utils/tokenUtils";

/**
 * Hook to monitor token expiration and handle automatic logout
 * @param {boolean} enabled - Whether to enable token monitoring
 * @returns {object} - Token status information
 */
export const useTokenMonitor = (enabled = true) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);

  const warningShownRef = useRef(false);
  const checkIntervalRef = useRef(null);

  useEffect(() => {
    if (!enabled || !token || !isAuthenticated) {
      // Clear any existing interval
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    const checkTokenExpiration = () => {
      if (!token) return;

      const timeRemaining = getTokenTimeRemaining(token);
      const isExpiring = isTokenExpiredOrExpiring(token, 5); // 5 minutes warning

      console.log(
        `🕐 Token check - Time remaining: ${timeRemaining} minutes, Expiring: ${isExpiring}`
      );

      if (timeRemaining <= 0) {
        console.log("🚨 Token expired, logging out...");
        // Token has expired
        dispatch(logout());
        navigate("/auth", { replace: true });
        return;
      }

      if (isExpiring && timeRemaining <= 5 && !warningShownRef.current) {
        console.log(`⚠️ Token expiring in ${timeRemaining} minutes`);
        // Show warning (you can replace this with a toast notification)
        if (
          window.confirm(
            `Your session will expire in ${timeRemaining} minutes. Would you like to refresh the page to extend your session?`
          )
        ) {
          window.location.reload();
        }
        warningShownRef.current = true;
      }

      // Reset warning flag if we have more than 10 minutes left
      if (timeRemaining > 10) {
        warningShownRef.current = false;
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Set up interval to check every minute
    checkIntervalRef.current = setInterval(checkTokenExpiration, 60000); // 1 minute

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [token, isAuthenticated, enabled, dispatch, navigate]);

  // Return token status info
  return {
    timeRemaining: token ? getTokenTimeRemaining(token) : 0,
    isExpiring: token ? isTokenExpiredOrExpiring(token, 5) : false,
    isExpired: token ? getTokenTimeRemaining(token) <= 0 : true,
  };
};

export default useTokenMonitor;
