/**
 * Token utility functions for handling JWT tokens
 * Includes expiration checking and automatic refresh
 */

/**
 * Decode JWT token payload (client-side decoding for expiration check only)
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Check if token is expired or will expire soon
 * @param {string} token - JWT token
 * @param {number} bufferMinutes - Minutes before expiry to consider as "soon to expire"
 * @returns {boolean} - True if expired or expiring soon
 */
export const isTokenExpiredOrExpiring = (token, bufferMinutes = 5) => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;

  const expiryTime = payload.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = bufferMinutes * 60 * 1000; // Convert minutes to milliseconds

  return currentTime >= expiryTime - bufferTime;
};

/**
 * Get token expiry time
 * @param {string} token - JWT token
 * @returns {Date|null} - Expiry date or null
 */
export const getTokenExpiryTime = (token) => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;

  return new Date(payload.exp * 1000);
};

/**
 * Get time remaining until token expires
 * @param {string} token - JWT token
 * @returns {number} - Minutes until expiry, or 0 if expired
 */
export const getTokenTimeRemaining = (token) => {
  const expiryTime = getTokenExpiryTime(token);
  if (!expiryTime) return 0;

  const currentTime = new Date();
  const timeDiff = expiryTime.getTime() - currentTime.getTime();

  return Math.max(0, Math.floor(timeDiff / (1000 * 60))); // Convert to minutes
};

/**
 * Extract user information from token
 * @param {string} token - JWT token
 * @returns {object|null} - User info or null
 */
export const getUserFromToken = (token) => {
  const payload = decodeToken(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    username: payload.username,
    firmId: payload.firm_id,
    userType: payload.user_type,
    exp: payload.exp,
  };
};

export default {
  decodeToken,
  isTokenExpiredOrExpiring,
  getTokenExpiryTime,
  getTokenTimeRemaining,
  getUserFromToken,
};
