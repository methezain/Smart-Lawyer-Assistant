import React, { useState, useRef, useEffect } from "react";

// Custom Dropdown Component with animated chevron
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
        className={`w-full min-w-[140px] px-3 py-2 text-left bg-white border border-gray-300 rounded-lg 
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
            <span className="text-gray-700 font-medium truncate">
              {selectedOption?.label || placeholder}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-all duration-300 ease-in-out transform
              ${isOpen ? "rotate-180 text-emerald-500" : "rotate-0"}`}
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

      {/* Dropdown Menu with Animation */}
      <div
        className={`absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl
          transition-all duration-200 ease-in-out origin-top
          ${
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
              className={`w-full px-3 py-2 text-left hover:bg-emerald-50 hover:text-emerald-700
                transition-colors duration-150 flex items-center gap-2
                ${
                  value === option.value
                    ? "bg-emerald-100 text-emerald-800 font-medium"
                    : "text-gray-700"
                }
                ${index === 0 ? "rounded-t-lg" : ""}
                ${index === options.length - 1 ? "rounded-b-lg" : ""}`}
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
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
  sortBy,
  setSortBy,
  onAddCase,
  availableTypes,
  showAddButton = true,
}) => {
  // Define dropdown options without icons
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active Cases" },
    { value: "pending", label: "Pending Review" },
    { value: "closed", label: "Closed Cases" },
  ];

  const sortOptions = [
    { value: "latest", label: "Latest Filed" },
    { value: "oldest", label: "Oldest Filed" },
    { value: "upcoming", label: "Upcoming Hearings" },
  ];

  // Build type options dynamically without icons
  const typeOptions = [
    { value: "all", label: "All Types" },
    ...availableTypes.map((type) => ({
      value: type,
      label: type,
    })),
  ];

  // Clear all filters function
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterType("all");
    setSortBy("latest");
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm !== "" ||
    filterStatus !== "all" ||
    filterType !== "all" ||
    sortBy !== "latest";

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm mb-4 ">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Enhanced Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 z-10">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search cases by title, case number, or client..."
            className="pl-10 text-xs pr-4 py-2 border border-gray-300 rounded-lg w-full 
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
              hover:border-gray-400 transition-all duration-200 shadow-sm
              placeholder-gray-400 text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <svg
                className="w-4 h-4 text-gray-400 hover:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Enhanced Filter Controls */}
        <div className="flex flex-wrap gap-3 items-center text-xs">
          <CustomDropdown
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={statusOptions}
            placeholder="All Statuses"
            className="min-w-[150px]"
          />

          <CustomDropdown
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={typeOptions}
            placeholder="All Types"
            className="min-w-[140px]"
          />

          <CustomDropdown
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={sortOptions}
            placeholder="Sort By"
            className="min-w-[160px]"
          />

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2.5 border border-red-300 text-red-700 rounded-lg 
                hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 
                focus:ring-red-500 focus:border-red-500 transition-all duration-200 
                shadow-sm hover:shadow flex items-center gap-2 font-medium whitespace-nowrap"
              title="Clear all filters"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear Filters
            </button>
          )}

          {/* Enhanced Add Case Button */}
          {showAddButton && (
            <button
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 
                text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                transition-all duration-200 shadow-sm hover:shadow-md
                flex items-center gap-2 font-medium whitespace-nowrap"
              onClick={onAddCase}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Case
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tools;
