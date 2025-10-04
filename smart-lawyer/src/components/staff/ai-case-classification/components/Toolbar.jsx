import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

export default function Toolbar({
  files,
  categoryCounts,
  selectedCategory,
  setSelectedCategory,
  selectedFiles,
  filteredFiles,
  batchEditName,
  setBatchEditName,
  onBatchRename,
  onBatchDelete,
  isLoading,
  fileInputRef,
  onUploadClick,
  onChange,
}) {
  // Local state for the category dropdown
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectCategory = (cat) => {
    setSelectedCategory(cat);
    setIsMenuOpen(false);
  };
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm mb-4 text-xs">
      {/* Top row: filters and upload */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-nowrap">
          {/* Category Dropdown (Tools.jsx-style) */}
          <div className="relative w-64" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              className={`inline-flex w-full items-center gap-2 px-3 h-9 rounded-lg border border-gray-300 text-gray-700 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all duration-200 ${
                isMenuOpen
                  ? "ring-2 ring-emerald-500 border-emerald-500 shadow"
                  : "shadow-sm"
              }`}
            >
              <span className="flex-1 truncate text-left">
                {selectedCategory === "all"
                  ? "All categories"
                  : selectedCategory}
              </span>
              <span className="ml-auto inline-flex items-center gap-2">
                <span className="inline-flex items-center justify-center min-w-[22px] h-5 w-5 rounded-md bg-emerald-100 text-emerald-700 font-semibold">
                  {selectedCategory === "all"
                    ? files.length
                    : categoryCounts[selectedCategory] || 0}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-all duration-300 ease-in-out transform ${
                    isMenuOpen ? "rotate-180 text-emerald-500" : "rotate-0"
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
              </span>
            </button>

            <div
              className={`absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 transition-all duration-200 ease-in-out origin-top ${
                isMenuOpen
                  ? "opacity-100 scale-y-100 translate-y-0"
                  : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
              }`}
            >
              <button
                type="button"
                onClick={() => selectCategory("all")}
                className={`w-full px-3 h-9 flex items-center justify-between text-left hover:bg-emerald-50 transition-colors ${
                  selectedCategory === "all" ? "bg-emerald-50" : ""
                }`}
              >
                <span className="text-gray-700">All</span>
                <span className="inline-flex items-center justify-center min-w-[24px] h-5 w-5 rounded-md bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                  {files.length}
                </span>
              </button>
              {Object.entries(categoryCounts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, count]) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => selectCategory(category)}
                    className={`w-full px-3 h-9 flex items-center justify-between text-left hover:bg-emerald-50 transition-colors ${
                      selectedCategory === category ? "bg-emerald-50" : ""
                    }`}
                  >
                    <span className="text-gray-700 truncate pr-2">
                      {category}
                    </span>
                    <span className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-md bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                      {count}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Inline selected actions (same row as dropdown) */}
          {selectedFiles.length > 0 && (
            <>
              <span className="font-medium text-gray-700 whitespace-nowrap">
                Selected: {selectedFiles.length} / {filteredFiles.length}
              </span>
              <div className="inline-flex items-center rounded-lg overflow-hidden border border-gray-300">
                <input
                  type="text"
                  placeholder="Batch rename"
                  value={batchEditName}
                  onChange={(e) => setBatchEditName(e.target.value)}
                  className="px-3 h-9 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-0"
                />
                <button
                  className="px-3 h-9 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onBatchRename();
                  }}
                  type="button"
                  disabled={!batchEditName.trim()}
                >
                  Rename
                </button>
              </div>
              <button
                className="px-3 h-9 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors whitespace-nowrap"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBatchDelete();
                }}
                type="button"
              >
                <i className="ri-delete-bin-6-line mr-1" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>

        <div className="shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            onChange={onChange}
            className="hidden"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUploadClick();
            }}
            disabled={isLoading}
            type="button"
            className="px-6 h-9 bg-gradient-to-r from-emerald-600 to-emerald-700 
                text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                transition-all duration-200 shadow-sm hover:shadow-md
                flex items-center gap-2 font-medium whitespace-nowrap"
          >
            <i className="ri-attachment-line" />
            <span>{isLoading ? "Processing..." : "Upload Files"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

Toolbar.propTypes = {
  files: PropTypes.array.isRequired,
  categoryCounts: PropTypes.object.isRequired,
  selectedCategory: PropTypes.string.isRequired,
  setSelectedCategory: PropTypes.func.isRequired,
  selectedFiles: PropTypes.array.isRequired,
  filteredFiles: PropTypes.array.isRequired,
  batchEditName: PropTypes.string.isRequired,
  setBatchEditName: PropTypes.func.isRequired,
  onBatchRename: PropTypes.func.isRequired,
  onBatchDelete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  fileInputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
  onUploadClick: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};
