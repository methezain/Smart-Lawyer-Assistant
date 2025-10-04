import React, { useEffect, useRef, useState } from "react";

// Styled dropdown copied from Documents Tools for visual parity
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
        className={`w-full min-w-[160px] px-3 py-2 text-left bg-white border border-gray-300 rounded-lg text-xs
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
          hover:border-gray-400 transition-all duration-200 ${
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
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onAddNew,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  sortBy,
  onSortByChange,
  caseTypeFilter,
  onCaseTypeChange,
  onExport,
  onClearFilters, // optional: notify parent when clearing
  onAdvancedFiltersChange, // optional: emit advanced filters state
}) => {
  const inputCls =
    "px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

  // Advanced filters state and helpers
  const [showFilters, setShowFilters] = useState(false);
  const [adv, setAdv] = useState({
    minAmount: "",
    maxAmount: "",
    hasDocuments: false,
    hasContent: false,
    hasTerms: false,
  });

  const hasActiveFilters = Boolean(
    (search && search.trim().length > 0) ||
      dateFrom ||
      dateTo ||
      (statusFilter && statusFilter !== "all") ||
      (caseTypeFilter && caseTypeFilter !== "all") ||
      adv.minAmount ||
      adv.maxAmount ||
      adv.hasDocuments ||
      adv.hasContent ||
      adv.hasTerms
  );

  const updateAdv = (patch) => {
    const next = { ...adv, ...patch };
    setAdv(next);
    onAdvancedFiltersChange && onAdvancedFiltersChange(next);
  };

  const clearAll = () => {
    onSearchChange && onSearchChange("");
    onStatusChange && onStatusChange("all");
    onCaseTypeChange && onCaseTypeChange("all");
    onDateFromChange && onDateFromChange("");
    onDateToChange && onDateToChange("");
    onSortByChange && onSortByChange("recent");
    const reset = {
      minAmount: "",
      maxAmount: "",
      hasDocuments: false,
      hasContent: false,
      hasTerms: false,
    };
    setAdv(reset);
    onAdvancedFiltersChange && onAdvancedFiltersChange(reset);
    onClearFilters && onClearFilters();
  };

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm mb-4 text-xs">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch">
        {/* Search */}
        <div className="relative flex-1 min-w-[230px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <i className="ri-search-line text-gray-400"></i>
          </span>
          <input
            type="text"
            placeholder="Search by client or title..."
            className={`pl-10 pr-4 ${inputCls} w-full`}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Status */}
          <CustomDropdown
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            options={[
              {
                value: "all",
                label: "All Statuses",
                icon: <i className="ri-equalizer-line"></i>,
              },
              { value: "Pending Signature", label: "Pending Signature" },
              { value: "Signed", label: "Signed" },
              { value: "In Review", label: "In Review" },
              { value: "Completed", label: "Completed" },
              { value: "Rejected", label: "Rejected" },
            ]}
            placeholder="All Statuses"
          />

          {/* Case Type */}
          <CustomDropdown
            value={caseTypeFilter || "all"}
            onChange={(e) =>
              onCaseTypeChange && onCaseTypeChange(e.target.value)
            }
            options={[
              {
                value: "all",
                label: "All Case Types",
                icon: <i className="ri-briefcase-line"></i>,
              },
              { value: "Civil", label: "Civil" },
              { value: "Criminal", label: "Criminal" },
              { value: "Family", label: "Family" },
              { value: "Commercial", label: "Commercial" },
              { value: "Employment", label: "Employment" },
            ]}
            placeholder="All Case Types"
          />

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs border transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
            title="More filters"
          >
            <i className="ri-filter-line"></i>
            Filters
          </button>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="px-3 py-2 rounded-lg flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 border border-red-200"
              title="Clear all filters"
            >
              <i className="ri-close-line"></i>
              Clear
            </button>
          )}

          {/* Export */}
          {onExport && (
            <button
              onClick={onExport}
              type="button"
              className="px-3 py-2 border border-gray-300 rounded-lg text-[11px] hover:bg-gray-50 flex items-center gap-2"
              title="Export filtered list to CSV"
            >
              <i className="ri-download-2-line"></i>
              Export CSV
            </button>
          )}

          {/* New Contract */}
          {onAddNew && (
            <button
              onClick={onAddNew}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <i className="ri-add-line"></i> New Contract
            </button>
          )}
        </div>
      </div>
      {/* Advanced filters section */}
      {showFilters && (
        <div className="border-t mt-3 pt-3 border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs items-start">
            {/* Dates */}
            <div className="flex items-center gap-2 w-full sm:col-span-2 lg:col-span-2">
              <input
                type="date"
                className={`${inputCls} flex-1`}
                value={dateFrom || ""}
                onChange={(e) =>
                  onDateFromChange && onDateFromChange(e.target.value)
                }
                title="From date"
              />
              <span className="text-gray-400 text-[10px]">To</span>
              <input
                type="date"
                className={`${inputCls} flex-1`}
                value={dateTo || ""}
                onChange={(e) =>
                  onDateToChange && onDateToChange(e.target.value)
                }
                title="To date"
              />
            </div>
            {/* Sort */}
            <CustomDropdown
              className="w-full"
              value={sortBy || "recent"}
              onChange={(e) => onSortByChange && onSortByChange(e.target.value)}
              options={[
                {
                  value: "recent",
                  label: "Sort: Most Recent",
                  icon: <i className="ri-time-line"></i>,
                },
                { value: "oldest", label: "Sort: Oldest" },
                { value: "amount-desc", label: "Sort: Amount (High → Low)" },
                { value: "amount-asc", label: "Sort: Amount (Low → High)" },
                { value: "status", label: "Sort: Status A→Z" },
              ]}
              placeholder="Sort: Most Recent"
            />
            {/* Min Amount */}
            <div className="flex flex-col gap-1">
              <input
                type="number"
                className={`${inputCls} w-full`}
                value={adv.minAmount}
                onChange={(e) => updateAdv({ minAmount: e.target.value })}
                min="0"
                placeholder="Minimum Amount"
              />
            </div>
            {/* Max Amount */}
            <div className="flex flex-col gap-1">
              <input
                type="number"
                className={`${inputCls} w-full`}
                value={adv.maxAmount}
                onChange={(e) => updateAdv({ maxAmount: e.target.value })}
                min="0"
                placeholder="Maximum Amount"
              />
            </div>
          </div>
          {/* Toggles */}
          <div className="flex items-center gap-4 flex-wrap mt-3">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={adv.hasDocuments}
                onChange={(e) => updateAdv({ hasDocuments: e.target.checked })}
              />
              <span>Has Attachments</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={adv.hasContent}
                onChange={(e) => updateAdv({ hasContent: e.target.checked })}
              />
              <span>Has Content</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={adv.hasTerms}
                onChange={(e) => updateAdv({ hasTerms: e.target.checked })}
              />
              <span>Has Terms</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tools;
