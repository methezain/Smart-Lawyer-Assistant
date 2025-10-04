import React, { useState, useRef, useEffect } from "react";

// Custom Dropdown Component (styled like Cases Tools)
const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  icon = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (selectedValue) => {
    onChange({ target: { value: selectedValue } });
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`w-full min-w-[140px] px-3 py-2 text-left bg-white border border-gray-300 rounded-lg text-xs
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
          hover:border-gray-400 transition-all duration-200
          ${
            isOpen
              ? "ring-2 ring-emerald-500 border-emerald-500 shadow-lg"
              : "shadow-sm"
          }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <span className="text-gray-500">{icon}</span>}
            <span className="text-gray-700 font-medium truncate text-xs">
              {selectedOption?.label || placeholder}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-all duration-300 ease-in-out transform ${
              isOpen ? "rotate-180 text-emerald-500" : "rotate-0"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      <div
        className={`absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl
          transition-all duration-200 ease-in-out origin-top ${
            isOpen
              ? "opacity-100 scale-y-100 translate-y-0"
              : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
          }`}
      >
        <div className="py-1 max-h-60 overflow-auto">
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              className={`w-full px-3 py-2 text-left text-xs hover:bg-emerald-50 hover:text-emerald-700
                transition-colors duration-150 flex items-center gap-2 ${
                  value === option.value
                    ? "bg-emerald-100 text-emerald-800 font-medium"
                    : "text-gray-700"
                } ${index === 0 ? "rounded-t-lg" : ""} ${
                index === options.length - 1 ? "rounded-b-lg" : ""
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.icon && (
                <span className="text-gray-500">{option.icon}</span>
              )}
              <span className="truncate">{option.label}</span>
              {value === option.value && (
                <svg
                  className="w-4 h-4 ml-auto text-emerald-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Tools = ({
  view,
  onChangeView,
  searchTerm,
  onSearchTermChange,
  dateFilter,
  onDateFilterChange,
  statusFilter,
  onStatusFilterChange,
  hearingTypeFilter,
  onHearingTypeFilterChange,
  sortBy,
  onSortByChange,
  dateToFilter,
  onDateToFilterChange,
  onClearFilters,
  onScheduleClick,
  canSchedule = true,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  // Check if any filters are applied
  const hasActiveFilters =
    searchTerm ||
    dateFilter ||
    dateToFilter ||
    statusFilter ||
    hearingTypeFilter;

  const hearingTypes = [
    "Initial Hearing",
    "Preliminary Hearing",
    "Case Management",
    "Motion Hearing",
    "Evidence Presentation",
    "Witness Examination",
    "Cross Examination",
    "Arguments",
    "Final Arguments",
    "Judgment",
    "Mediation",
    "Settlement Conference",
  ];

  const statusOptions = [
    { value: "scheduled", label: "Scheduled" },
    { value: "completed", label: "Completed" },
    { value: "postponed", label: "Postponed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "adjourned", label: "Adjourned" },
  ];

  const sortOptions = [
    { value: "date_asc", label: "Date (Earliest First)" },
    { value: "date_desc", label: "Date (Latest First)" },
    { value: "latest", label: "Recently Added" },
    { value: "oldest", label: "Oldest First" },
    { value: "court", label: "Court Name" },
    { value: "status", label: "Status" },
    { value: "type", label: "Hearing Type" },
  ];
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm mb-6">
      {/* Main toolbar */}
      <div className="flex flex-col gap-4">
        {/* View tabs and main actions */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => onChangeView("upcoming")}
              className={`px-4 py-2 rounded-lg font-medium text-xs ${
                view === "upcoming"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Upcoming Hearings
            </button>
            <button
              onClick={() => onChangeView("past")}
              className={`px-4 py-2 rounded-lg font-medium text-xs ${
                view === "past"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Past Hearings
            </button>
            <button
              onClick={() => onChangeView("calendar")}
              className={`px-4 py-2 rounded-lg font-medium text-xs ${
                view === "calendar"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Calendar View
            </button>
          </div>

          <div className="flex flex-1 gap-3 items-center flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <i className="ri-search-line text-gray-400"></i>
              </span>
              <input
                type="text"
                placeholder="Search hearings, court name, judge name..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
              />
            </div>

            {/* Quick date filter */}
            <div>
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                value={dateFilter}
                onChange={(e) => onDateFilterChange(e.target.value)}
                title="Filter by hearing date"
              />
            </div>

            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs border transition-colors ${
                showFilters || hasActiveFilters
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <i className="ri-filter-line"></i>
              Filters
              {hasActiveFilters && (
                <span className="bg-emerald-600 text-white text-[10px] px-2 pt-0.5 pb-[1px] rounded-xl ml-1">
                  Active
                </span>
              )}
            </button>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="px-3 py-2 rounded-lg flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 border border-red-200"
                title="Clear all filters"
              >
                <i className="ri-close-line"></i>
                Clear
              </button>
            )}

            {/* Schedule button */}
            <button
              onClick={onScheduleClick}
              disabled={!canSchedule}
              title={!canSchedule ? "Add a case first" : undefined}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-medium ${
                canSchedule
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <i className="ri-add-line"></i> Schedule Hearing
            </button>
          </div>
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="border-t pt-3 border-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Date range */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={dateFilter}
                  onChange={(e) => onDateFilterChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={dateToFilter}
                  onChange={(e) => onDateToFilterChange(e.target.value)}
                />
              </div>

              {/* Status filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <CustomDropdown
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                  options={[
                    { value: "", label: "All Statuses" },
                    ...statusOptions,
                  ]}
                  placeholder="All Statuses"
                />
              </div>

              {/* Hearing type filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Hearing Type
                </label>
                <CustomDropdown
                  value={hearingTypeFilter}
                  onChange={(e) => onHearingTypeFilterChange(e.target.value)}
                  options={[
                    { value: "", label: "All Types" },
                    ...hearingTypes.map((t) => ({ value: t, label: t })),
                  ]}
                  placeholder="All Types"
                />
              </div>

              {/* Sort by */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <CustomDropdown
                  value={sortBy}
                  onChange={(e) => onSortByChange(e.target.value)}
                  options={sortOptions}
                  placeholder="Sort By"
                />
              </div>

              {/* Active filters summary */}
              {hasActiveFilters && (
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Active Filters
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {searchTerm && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Search: {searchTerm}
                      </span>
                    )}
                    {statusFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Status:{" "}
                        {
                          statusOptions.find((s) => s.value === statusFilter)
                            ?.label
                        }
                      </span>
                    )}
                    {hearingTypeFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        Type: {hearingTypeFilter}
                      </span>
                    )}
                    {(dateFilter || dateToFilter) && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                        Date Range
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tools;
