import React, { useEffect, useRef, useState } from "react";

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
        className={`absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl transition-all duration-200 ease-in-out origin-top ${
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
              className={`w-full px-3 py-2 text-left hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-150 flex items-center gap-2 ${
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
  onAddClick,
  filterStatus,
  setFilterStatus,
}) => {
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "allowed", label: "Allowed" },
    { value: "dismissed", label: "Dismissed" },
    { value: "favorable", label: "Favorable" },
    { value: "unfavorable", label: "Unfavorable" },
    { value: "partial", label: "Partially Allowed" },
    { value: "remanded", label: "Remanded" },
    { value: "withdrawn", label: "Withdrawn" },
  ];

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm mb-6 text-xs">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative md:w-1/2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <i className="ri-search-line text-gray-400"></i>
          </span>
          <input
            type="text"
            placeholder="Search judgments by case, number or judge..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <CustomDropdown
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={statusOptions}
            placeholder="All Statuses"
            className="min-w-[150px]"
          />

          <button
            onClick={onAddClick}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Add New Judgment
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tools;
