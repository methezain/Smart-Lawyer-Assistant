// Centralized API endpoint configuration
// All frontend code should import from here instead of hardcoding localhost ports.
// These default to gateway-relative paths so the app works behind the Nginx proxy.

export const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';
export const CLASSIFICATION_BASE = import.meta.env.VITE_CLASSIFICATION_BASE || '/api/v1/classification';
export const PREDICTION_BASE = import.meta.env.VITE_PREDICTION_BASE || '/api/v1/prediction';
export const SUMMARIZATION_BASE = import.meta.env.VITE_SUMMARIZATION_BASE || '/api/v1/summarization';
export const CHAT_BASE = import.meta.env.VITE_CHAT_BASE || '/api/v1/chat';
export const DRAFTING_BASE = import.meta.env.VITE_DRAFTING_BASE || '/api/v1/drafting';
export const LEASE_AGREEMENTS_BASE = import.meta.env.VITE_LEASE_AGREEMENTS_BASE || '/api/v1/lease_agreements';

// Helper to safely join base + path without duplicating slashes
export function joinEndpoint(base, path) {
  if (!path) return base;
  if (path.startsWith('/')) path = path.slice(1);
  return `${base.replace(/\/$/, '')}/${path}`;
}
