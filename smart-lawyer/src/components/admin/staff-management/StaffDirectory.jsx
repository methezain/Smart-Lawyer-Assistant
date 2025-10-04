import React from "react";

const StaffDirectory = ({
  staffList,
  onViewProfile,
  activeDropdown,
  onToggleDropdown,
  onStaffAction,
  dropdownRef,
  noResults,
  onResetFilters,
  onAddStaff,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
      {staffList.map((staff) => (
        <div
          key={staff.id}
          className="group relative overflow-hidden rounded-md border border-gray-200/80 bg-white/80 backdrop-blur-sm shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300/60 hover:shadow-lg"
        >
          <div className="relative">
            <div className="h-20 bg-gradient-to-r from-emerald-500 to-teal-600 transition-colors group-hover:from-emerald-600 group-hover:to-teal-700"></div>
            <div className="absolute top-2 right-2">
              <div
                className="relative"
                ref={activeDropdown === staff.id ? dropdownRef : null}
              >
                <button
                  onClick={() => onToggleDropdown(staff.id)}
                  className="p-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white shadow-sm ring-1 ring-gray-200/70 transition-all opacity-90 group-hover:opacity-100"
                  aria-label="More options"
                >
                  <i className="ri-more-2-fill"></i>
                </button>

                {activeDropdown === staff.id && (
                  <div className="absolute right-0 mt-2 w-40 text-xs bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 z-10 py-1 overflow-hidden">
                    <button
                      onClick={() => onStaffAction("view", staff)}
                      className="flex items-center w-full px-4 py-2  text-gray-700 hover:bg-gray-50"
                    >
                      <i className="ri-user-line mr-2 text-emerald-600"></i>
                      View Profile
                    </button>
                    <button
                      onClick={() => onStaffAction("edit", staff)}
                      className="flex items-center w-full px-4 py-2  text-gray-700 hover:bg-gray-50"
                    >
                      <i className="ri-edit-line mr-2 text-blue-600"></i>
                      Edit Details
                    </button>
                    <button
                      onClick={() => onStaffAction("updatePassword", staff)}
                      className="flex items-center w-full px-4 py-2  text-gray-700 hover:bg-gray-50"
                    >
                      <i className="ri-key-line mr-2 text-purple-600"></i>
                      Update Password
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => onStaffAction("deactivate", staff)}
                      className="flex items-center w-full px-4 py-2  text-gray-700 hover:bg-gray-50"
                    >
                      <i className="ri-user-unfollow-line mr-2 text-orange-500"></i>
                      Deactivate
                    </button>
                    <button
                      onClick={() => onStaffAction("delete", staff)}
                      className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      <i className="ri-delete-bin-line mr-2"></i>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute top-16 left-0 right-0 flex justify-center">
              <div className="w-28 h-28 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-white -translate-y-1/2 group-hover:scale-105 transition-transform relative">
                {/* Fallback initials avatar */}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-emerald-100">
                  <span className="text-emerald-600 font-semibold text-2xl leading-none">
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
                {/* Image if provided; hide it on error to reveal fallback */}
                {staff.avatar ? (
                  <img
                    src={staff.avatar}
                    alt={staff.name}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="p-6 pt-14 text-center">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
              {staff.name}
            </h3>
            <p className="text-xs text-gray-500">{staff.role}</p>
            {staff.specialization && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-medium group-hover:bg-emerald-100 transition-colors">
                <i className="ri-magic-line"></i>
                <span>{staff.specialization}</span>
              </div>
            )}

            <div className="my-4 flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <i className="ri-briefcase-4-line"></i>
                </span>
                {staff.activeCases} Cases
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <i className="ri-calendar-line"></i>
                </span>
                {(() => {
                  const d = staff.joinDate ? new Date(staff.joinDate) : null;
                  if (!d || isNaN(d.getTime())) return "-";
                  return d.toLocaleDateString("en-GB", {
                    month: "short",
                    year: "numeric",
                  });
                })()}
              </div>
            </div>

            <button
              onClick={() => onViewProfile(staff)}
              className="w-full py-2 rounded-lg text-xs font-medium text-white shadow-sm transition-all group-hover:shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <i className="ri-user-line mr-1"></i>
              View Profile
            </button>
          </div>
        </div>
      ))}

      {noResults && (
        <div className="col-span-full bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
            <i className="ri-user-search-line text-3xl"></i>
          </div>
          <p className="text-gray-600 text-base">
            No staff members found matching your criteria.
          </p>
          <button
            onClick={onResetFilters}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center"
          >
            <i className="ri-refresh-line mr-1"></i>
            Reset Filters
          </button>
          <div className="mt-3">
            <button
              onClick={onAddStaff}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-flex items-center"
            >
              <i className="ri-user-add-line mr-1"></i>
              Add Staff Member
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDirectory;
