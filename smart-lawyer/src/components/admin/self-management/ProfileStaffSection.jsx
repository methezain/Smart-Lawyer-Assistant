import React from "react";
import { useSelector } from "react-redux";
import { useListStaffQuery } from "../../../reduxstore/services/StaffAPI";
import { useNavigate } from "react-router-dom";

export default function ProfileStaffSection({ onCountChange }) {
  const token = useSelector((s) => s.auth?.token);
  const { data } = useListStaffQuery(undefined, { skip: !token });
  // Normalize data as in IndexStaff.jsx
  const staffList = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.data)
    ? data.data
    : [];
  // Map to expected fields
  const uiStaffList = staffList.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    specialization: s.specialization ?? "",
    avatar: s.avatar_url || s.avatar || "",
  }));
  // Optionally notify parent of count
  React.useEffect(() => {
    if (typeof onCountChange === "function") onCountChange(uiStaffList.length);
  }, [uiStaffList.length, onCountChange]);
  return <StaffProfileGrid staffList={uiStaffList} />;
}

function StaffProfileGrid({ staffList }) {
  const navigate = useNavigate();
  const username = useSelector((s) => s.auth?.user?.username || "");
  const maxCards = 6;
  const cards = [
    ...staffList,
    ...(staffList.length < maxCards ? [null] : []),
  ].slice(0, maxCards);
  const handleViewProfile = (staff) => {
    // TODO: Replace with modal or navigation to staff profile view
    alert(`View profile for: ${staff.name}`);
  };
  return (
    <div className="max-w-[800px] mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {cards.map((staff, idx) =>
          staff ? (
            <div
              key={staff.id}
              className="relative aspect-square bg-gray-100 border border-gray-200 overflow-hidden group hover:shadow-lg transition flex items-center justify-center"
            >
              {/* Avatar image or initials always visible */}
              {staff.avatar ? (
                <img
                  src={staff.avatar}
                  alt={staff.name}
                  className="w-24 h-24 object-cover rounded-full z-10"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-7xl leading-none">
                    {(() => {
                      const name = staff.name || "";
                      const parts = name.trim().split(/\s+/).filter(Boolean);
                      if (parts.length === 0) return "UN";
                      if (parts.length === 1)
                        return parts[0].slice(0, 2).toUpperCase();
                      return (
                        parts[0][0] + parts[parts.length - 1][0]
                      ).toUpperCase();
                    })()}
                  </span>
                </div>
              )}
              {/* Overlay on hover for details only */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/60 transition z-20" />
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition text-white px-2 text-center z-30">
                <div className="font-bold text-lg mb-1 drop-shadow">
                  {staff.name}
                </div>
                <div className="text-xs font-medium mb-0.5 drop-shadow">
                  {staff.role}
                </div>
                {staff.specialization && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium mt-1">
                    <i className="ri-magic-line"></i>
                    <span>{staff.specialization}</span>
                  </div>
                )}
                {/* View Profile button */}
                <button
                  onClick={() => handleViewProfile(staff)}
                  className="mt-2 text-xs font-medium cursor-pointer"
                >
                  <i className="ri-user-line mr-1  transition-all group-hover:shadow-md text-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"></i>
                  View Profile
                </button>
              </div>
            </div>
          ) : idx === staffList.length ? (
            // Plus card for add staff
            <button
              key="plus"
              className="relative aspect-square bg-white border-2  border-gray-300 flex flex-col items-center justify-center group hover:bg-emerald-50 hover:border-emerald-500 transition cursor-pointer"
              onClick={() => navigate(`/admin/${username}/add-staff`)}
              title="Add Staff Member"
              type="button"
            >
              <i className="ri-add-line text-6xl text-gray-400 group-hover:text-emerald-600 " />
              <span className="text-xs text-gray-600 group-hover:text-emerald-600 font-medium">
                Add Staff
              </span>
            </button>
          ) : null
        )}
      </div>
    </div>
  );
}
