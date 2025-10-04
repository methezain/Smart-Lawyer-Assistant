import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { caseManagementAPI } from "../reduxstore/services/CaseManagementAPI";

/**
 * Hook to handle user switching and cache invalidation
 * This ensures that when users switch, all cached data is cleared
 * to prevent showing data from the previous user
 */
export const useUserSwitchHandler = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.user);
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);

  // Keep track of the previous user
  const previousUserRef = useRef(null);

  useEffect(() => {
    const currentUserId = currentUser?.id || currentUser?.email;
    const previousUserId = previousUserRef.current;

    // If user has changed (and we had a previous user), clear all caches
    if (previousUserId && currentUserId && previousUserId !== currentUserId) {
      console.log("🔄 User switch detected in hook, clearing all caches...");
      console.log(`Previous: ${previousUserId}, Current: ${currentUserId}`);

      // Clear all RTK Query caches
      dispatch(caseManagementAPI.util.resetApiState());

      // Also clear any browser cache that might be interfering
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            if (name.includes("api") || name.includes("case")) {
              caches.delete(name);
            }
          });
        });
      }

      console.log("✅ All caches cleared for user switch");
    }

    // Update the previous user reference
    previousUserRef.current = currentUserId;
  }, [currentUser, isAuthenticated, dispatch]);

  // Return current user info for debugging
  return {
    currentUserId: currentUser?.id || currentUser?.email,
    isAuthenticated,
  };
};

export default useUserSwitchHandler;
