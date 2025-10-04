import React from "react";

const Tools = ({
  searchTerm,
  onSearchChange,
  filterRole,
  onFilterChange,
  roles,
  onAddStaff,
}) => {
  return (
    <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100 mb-4 text-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <i className="ri-search-line text-gray-400"></i>
          </span>
          <input
            type="text"
            placeholder="Search by name, email, or specialization..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm text-gray-700"
            value={filterRole}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onAddStaff}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm flex items-center gap-2 transition-all"
        >
          <i className="ri-user-add-line"></i>
          <span>Add New Staff</span>
        </button>
      </div>
    </div>
  );
};

export default Tools;
