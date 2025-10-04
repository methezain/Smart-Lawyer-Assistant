import React from "react";
import { useLocation, useParams } from "react-router-dom";

export default function ClientDashboard() {
  const { username } = useParams();
  const location = useLocation();
  const client = JSON.parse(localStorage.getItem("client") || "null");

  const displayName = client?.full_name || client?.username || username;

  return (
    <div className="min-h-screen bg-[#f6f6f6] text-[#0c0c0c] p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold">Welcome, {displayName}</h1>
        <p className="text-sm text-gray-600 mt-1">Client Dashboard</p>

        {location.state?.openChat && location.state?.firmData ? (
          <div className="mt-6 p-4 rounded-lg border border-dashed border-[#0c0c0c]/20 bg-white">
            <p className="text-sm">
              Opening chat with firm:{" "}
              <b>{location.state.firmData?.firm_name || "Unknown Firm"}</b>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              This is a placeholder. Hook this to your chat module.
            </p>
          </div>
        ) : null}

        <div className="mt-8 text-sm text-gray-700">
          <p>
            Build out client pages under /client/:username/… as needed (profile,
            messages, cases, etc.).
          </p>
        </div>
      </div>
    </div>
  );
}
