import React, { useState, useRef, useEffect } from "react";

// Custom Dropdown Component (styled similar to Cases Tools)
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
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  filterCase,
  onFilterCaseChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  filterLawyer,
  onFilterLawyerChange,
  uniqueTypes,
  uniqueStatuses,
  uniqueCases,
  uniqueLawyers = [],
  onUploadClick,
  onClearFilters,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const inputCls =
    "w-full px-3 py-2  border border-gray-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

  const hasActiveFilters =
    !!searchTerm ||
    !!startDate ||
    !!endDate ||
    (filterType && filterType !== "all") ||
    (filterStatus && filterStatus !== "all") ||
    (filterCase && filterCase !== "all") ||
    (filterLawyer && filterLawyer !== "all");

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm mb-6">
      <div className="flex flex-col gap-3">
        {/* Top toolbar */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <i className="ri-search-line text-gray-400"></i>
            </span>
            <input
              type="text"
              placeholder="Search documents..."
              className={`pl-10 pr-4 ${inputCls}`}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Quick date */}
          <div>
            <input
              type="date"
              className={inputCls}
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              title="Filter from date"
            />
          </div>

          {/* Case quick filter */}
          <div className="min-w-[200px]">
            <CustomDropdown
              value={filterCase}
              onChange={(e) => onFilterCaseChange(e.target.value)}
              options={[
                { value: "all", label: "All Cases" },
                ...uniqueCases.map((c) => ({
                  value: c.number,
                  label: `${c.number} - ${c.title}`,
                })),
              ]}
              placeholder="All Cases"
            />
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs border transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
            title="Show filters"
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

          {/* Upload */}
          <div className="flex-0">
            <button
              onClick={onUploadClick}
              className="px-3 py-2 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <i className="ri-upload-line"></i>
              Upload Document
            </button>
          </div>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="border-t pt-3 border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 text-xs">
              {/* Date From */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className={inputCls}
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                />
                to
              </div>
              {/* Date To */}
              <div>
                <input
                  type="date"
                  className={inputCls}
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                />
              </div>
              {/* Type */}
              <div>
                <CustomDropdown
                  value={filterType}
                  onChange={(e) => onFilterTypeChange(e.target.value)}
                  options={[
                    { value: "all", label: "All Types" },
                    ...uniqueTypes.map((type) => ({
                      value: type,
                      label: type,
                    })),
                  ]}
                  placeholder="All Types"
                />
              </div>
              {/* Status */}
              <div>
                <CustomDropdown
                  value={filterStatus}
                  onChange={(e) => onFilterStatusChange(e.target.value)}
                  options={[
                    { value: "all", label: "All Status" },
                    ...uniqueStatuses.map((status) => ({
                      value: status,
                      label: status,
                    })),
                  ]}
                  placeholder="All Status"
                />
              </div>
              {/* Lawyer */}
              <div>
                <CustomDropdown
                  value={filterLawyer}
                  onChange={(e) => onFilterLawyerChange(e.target.value)}
                  options={[
                    { value: "all", label: "All Lawyers" },
                    ...uniqueLawyers.map((lawyer) => ({
                      value: lawyer,
                      label: lawyer,
                    })),
                  ]}
                  placeholder="All Lawyers"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tools;
