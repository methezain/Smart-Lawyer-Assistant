import React, { useState } from "react";
import PropTypes from "prop-types";

/**
 * Dynamic Case Type Color System
 *
 * Features:
 * - Predefined colors for common case types (Civil, Criminal, Family, etc.)
 * - Dynamic color generation for custom case types using string hashing
 * - Status-aware color intensity (base, active, closed)
 * - Consistent color assignment (same case type always gets same color)
 * - Accessibility-friendly contrast ratios
 * - Hover effects and transitions
 *
 * Usage: getCaseTypeColor(caseType, caseStatus)
 * Examples:
 * - getCaseTypeColor("Civil") → base blue color
 * - getCaseTypeColor("Civil", "active") → darker blue for active cases
 * - getCaseTypeColor("Civil", "closed") → lighter blue for closed cases
 * - getCaseTypeColor("Custom Type") → consistent generated color
 */

// Dynamic color assignment utility for case types
const getCaseTypeColor = (caseType, caseStatus = null) => {
  // Safety check for undefined or null case type
  if (!caseType || typeof caseType !== "string") {
    return "bg-gray-100 text-gray-800 border-gray-200"; // fallback color
  }

  // Predefined colors for common case types
  const predefinedColors = {
    Civil: {
      base: "bg-blue-100 text-blue-800 border-blue-200",
      active: "bg-blue-200 text-blue-900 border-blue-300",
      closed: "bg-blue-50 text-blue-600 border-blue-100",
    },
    Criminal: {
      base: "bg-red-100 text-red-800 border-red-200",
      active: "bg-red-200 text-red-900 border-red-300",
      closed: "bg-red-50 text-red-600 border-red-100",
    },
    Family: {
      base: "bg-purple-100 text-purple-800 border-purple-200",
      active: "bg-purple-200 text-purple-900 border-purple-300",
      closed: "bg-purple-50 text-purple-600 border-purple-100",
    },
    Commercial: {
      base: "bg-green-100 text-green-800 border-green-200",
      active: "bg-green-200 text-green-900 border-green-300",
      closed: "bg-green-50 text-green-600 border-green-100",
    },
    Corporate: {
      base: "bg-indigo-100 text-indigo-800 border-indigo-200",
      active: "bg-indigo-200 text-indigo-900 border-indigo-300",
      closed: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    Property: {
      base: "bg-yellow-100 text-yellow-800 border-yellow-200",
      active: "bg-yellow-200 text-yellow-900 border-yellow-300",
      closed: "bg-yellow-50 text-yellow-600 border-yellow-100",
    },
    Employment: {
      base: "bg-pink-100 text-pink-800 border-pink-200",
      active: "bg-pink-200 text-pink-900 border-pink-300",
      closed: "bg-pink-50 text-pink-600 border-pink-100",
    },
    Immigration: {
      base: "bg-teal-100 text-teal-800 border-teal-200",
      active: "bg-teal-200 text-teal-900 border-teal-300",
      closed: "bg-teal-50 text-teal-600 border-teal-100",
    },
    Intellectual: {
      base: "bg-cyan-100 text-cyan-800 border-cyan-200",
      active: "bg-cyan-200 text-cyan-900 border-cyan-300",
      closed: "bg-cyan-50 text-cyan-600 border-cyan-100",
    },
    Tax: {
      base: "bg-orange-100 text-orange-800 border-orange-200",
      active: "bg-orange-200 text-orange-900 border-orange-300",
      closed: "bg-orange-50 text-orange-600 border-orange-100",
    },
  };

  // Return predefined color if exists
  if (predefinedColors[caseType]) {
    const colorSet = predefinedColors[caseType];
    if (caseStatus === "active") return colorSet.active;
    if (caseStatus === "closed") return colorSet.closed;
    return colorSet.base;
  }

  // For custom case types, generate color based on string hash
  const generateColorFromString = (str, status) => {
    // Safety check for undefined or null strings
    if (!str || typeof str !== "string") {
      return "bg-gray-100 text-gray-800 border-gray-200"; // fallback color
    }

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Color palette for custom types with status variations
    const colorPalette = [
      {
        base: "bg-slate-100 text-slate-800 border-slate-200",
        active: "bg-slate-200 text-slate-900 border-slate-300",
        closed: "bg-slate-50 text-slate-600 border-slate-100",
      },
      {
        base: "bg-zinc-100 text-zinc-800 border-zinc-200",
        active: "bg-zinc-200 text-zinc-900 border-zinc-300",
        closed: "bg-zinc-50 text-zinc-600 border-zinc-100",
      },
      {
        base: "bg-stone-100 text-stone-800 border-stone-200",
        active: "bg-stone-200 text-stone-900 border-stone-300",
        closed: "bg-stone-50 text-stone-600 border-stone-100",
      },
      {
        base: "bg-amber-100 text-amber-800 border-amber-200",
        active: "bg-amber-200 text-amber-900 border-amber-300",
        closed: "bg-amber-50 text-amber-600 border-amber-100",
      },
      {
        base: "bg-lime-100 text-lime-800 border-lime-200",
        active: "bg-lime-200 text-lime-900 border-lime-300",
        closed: "bg-lime-50 text-lime-600 border-lime-100",
      },
      {
        base: "bg-emerald-100 text-emerald-800 border-emerald-200",
        active: "bg-emerald-200 text-emerald-900 border-emerald-300",
        closed: "bg-emerald-50 text-emerald-600 border-emerald-100",
      },
      {
        base: "bg-sky-100 text-sky-800 border-sky-200",
        active: "bg-sky-200 text-sky-900 border-sky-300",
        closed: "bg-sky-50 text-sky-600 border-sky-100",
      },
      {
        base: "bg-violet-100 text-violet-800 border-violet-200",
        active: "bg-violet-200 text-violet-900 border-violet-300",
        closed: "bg-violet-50 text-violet-600 border-violet-100",
      },
      {
        base: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
        active: "bg-fuchsia-200 text-fuchsia-900 border-fuchsia-300",
        closed: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
      },
      {
        base: "bg-rose-100 text-rose-800 border-rose-200",
        active: "bg-rose-200 text-rose-900 border-rose-300",
        closed: "bg-rose-50 text-rose-600 border-rose-100",
      },
    ];

    const index = Math.abs(hash) % colorPalette.length;
    const colorSet = colorPalette[index];

    if (status === "active") return colorSet.active;
    if (status === "closed") return colorSet.closed;
    return colorSet.base;
  };

  return generateColorFromString(caseType, caseStatus);
};

// Helper function to get case type priority/importance level
const getCaseTypePriority = (caseType) => {
  const priorityLevels = {
    Criminal: "high",
    Family: "high",
    Civil: "medium",
    Commercial: "medium",
    Corporate: "medium",
    Property: "medium",
    Employment: "medium",
    Immigration: "high",
    Intellectual: "low",
    Tax: "low",
  };

  return priorityLevels[caseType] || "medium";
};

// Helper function to get case urgency based on next hearing
const getHearingUrgency = (nextHearing) => {
  if (!nextHearing) return null;

  const hearingDate = new Date(nextHearing);
  const today = new Date();
  const diffDays = Math.ceil((hearingDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue"; // Past hearing
  if (diffDays <= 3) return "urgent"; // Within 3 days
  if (diffDays <= 7) return "soon"; // Within a week
  return "normal";
};

const CasesTable = ({
  casesData,
  currentPage,
  onPageChange,
  onViewCase,
  onEditCase,
  onStatusChange,
  onDeleteCase,
  onPageSizeChange,
  showEditButton = true,
  showDeleteButton = true,
  showViewButton = true,
  enableCaseNumberLink = true,
}) => {
  // State for delete confirmation popup
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    caseToDelete: null,
  });

  // Extract cases and pagination info from API response
  const pagination = casesData?.pagination || {
    page: 1,
    page_size: 15,
    total_items: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false,
  };

  const cases = casesData?.cases || [];

  // Delete confirmation handlers
  const handleDeleteClick = (caseItem) => {
    setDeleteConfirmation({
      isOpen: true,
      caseToDelete: caseItem,
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation.caseToDelete && onDeleteCase) {
      onDeleteCase(deleteConfirmation.caseToDelete);
    }
    setDeleteConfirmation({
      isOpen: false,
      caseToDelete: null,
    });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({
      isOpen: false,
      caseToDelete: null,
    });
  };

  const handlePageChange = (page) => {
    onPageChange(page);
    // Scroll to top of table when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const totalPages = pagination.total_pages;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let start = Math.max(1, currentPage - halfVisible);
      let end = Math.min(totalPages, start + maxVisiblePages - 1);

      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              <th className="p-3 text-left ">#</th>
              <th className="p-3 text-left">Case Number</th>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Assigned Lawyer</th>
              <th className="p-3 text-left">Client</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Next Hearing</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white text-xs">
            {cases.map((caseItem, index) => {
              const urgency = getHearingUrgency(caseItem.next_hearing);
              const isHighPriority =
                getCaseTypePriority(caseItem.type) === "high";
              const serialNumber =
                (pagination.page - 1) * pagination.page_size + index + 1;

              return (
                <tr
                  key={caseItem.id}
                  className={`hover:bg-gray-50 transition-colors duration-150 ${
                    caseItem.status === "closed"
                      ? "opacity-75 bg-gray-50"
                      : urgency === "overdue"
                      ? "bg-red-50 border-l-4 border-red-400"
                      : urgency === "urgent"
                      ? "bg-orange-50 border-l-4 border-orange-400"
                      : isHighPriority && caseItem.status === "active"
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  <td className="p-3 whitespace-nowrap text-gray-500 font-medium">
                    {serialNumber}
                  </td>
                  <td className="p-3 whitespace-nowrap font-medium">
                    {enableCaseNumberLink ? (
                      <button
                        onClick={() => onViewCase(caseItem)}
                        className="text-blue-600 cursor-pointer hover:text-blue-900 hover:underline focus:outline-none"
                      >
                        {caseItem.case_number}
                      </button>
                    ) : (
                      <span className="text-gray-700">
                        {caseItem.case_number}
                      </span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">{caseItem.title}</td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {caseItem.assigned_lawyer_name
                          ? caseItem.assigned_lawyer_name
                              .charAt(0)
                              .toUpperCase()
                          : "U"}
                      </div>
                      <span className="text-sm">
                        {caseItem.assigned_lawyer_name || "Unassigned"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap ">
                    {caseItem.client?.name || caseItem.client_name || "N/A"}
                  </td>
                  <td className="p-3 whitespace-nowrap ">
                    <span
                      className={` font-medium border rounded px-0.5 transition-all duration-200 hover:shadow-sm ${getCaseTypeColor(
                        caseItem.type,
                        caseItem.status
                      )}`}
                      title={`${caseItem.type} Case`}
                    >
                      {caseItem.type}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {caseItem.status === "not approved" ? (
                      <span className=" font-medium ">Not Approved</span>
                    ) : caseItem.status === "pending" ? (
                      <button
                        onClick={() => onStatusChange(caseItem, "active")}
                        className=" cursor-pointer font-medium "
                        title="Click to activate"
                      >
                        Pending
                      </button>
                    ) : caseItem.status === "active" ? (
                      <span className=" font-medium ">Active</span>
                    ) : (
                      <span className=" font-medium">
                        {caseItem.status.charAt(0).toUpperCase() +
                          caseItem.status.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {caseItem.status === "pending" ? (
                      <span className="text-gray-400">Not Applicable</span>
                    ) : caseItem.status === "closed" ? (
                      <span className="text-gray-500">Case Closed</span>
                    ) : caseItem.next_hearing &&
                      caseItem.status === "active" ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded font-medium ${
                            getHearingUrgency(caseItem.next_hearing) ===
                            "overdue"
                              ? " text-red-800"
                              : getHearingUrgency(caseItem.next_hearing) ===
                                "urgent"
                              ? " text-orange-800"
                              : getHearingUrgency(caseItem.next_hearing) ===
                                "soon"
                              ? " text-yellow-800"
                              : " text-gray-800"
                          }`}
                        >
                          {new Date(caseItem.next_hearing).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not Scheduled</span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap text-left font-medium ">
                    {showViewButton && (
                      <button
                        onClick={() => onViewCase(caseItem)}
                        className="text-emerald-600 cursor-pointer hover:text-emerald-900 mr-3"
                      >
                        View
                      </button>
                    )}
                    {showEditButton && (
                      <button
                        onClick={() => onEditCase(caseItem)}
                        className="text-blue-600 cursor-pointer hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                    )}
                    {showDeleteButton && (
                      <button
                        onClick={() => handleDeleteClick(caseItem)}
                        className="text-red-600 cursor-pointer hover:text-red-900 mr-3"
                        title="Delete case"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {cases.length === 0 && (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center">
                  {pagination.total_items === 0 ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 mb-4 text-gray-300">
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          className="w-full h-full"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No cases yet
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 max-w-sm">
                        Your case management system is ready! Start by creating
                        your first case to track legal matters and organize your
                        work.
                      </p>
                      <div className="text-xs text-gray-400">
                        <p>💡 Tip: Click "Add New Case" to get started</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 mb-3 text-gray-300">
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          className="w-full h-full"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">
                        No cases found on this page
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Try navigating to a different page or adjusting your
                        filters
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Component */}
      {pagination.total_items > 0 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 text-xs">
          <div className="flex items-center justify-between">
            {/* Results Summary */}
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={!pagination.has_previous}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  handlePageChange(
                    Math.min(pagination.total_pages, currentPage + 1)
                  )
                }
                disabled={!pagination.has_next}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>

            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className=" text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.page_size + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      pagination.page * pagination.page_size,
                      pagination.total_items
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{pagination.total_items}</span>{" "}
                  cases
                </p>
              </div>

              <div className="flex items-center gap-3">
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  {/* Previous Button */}
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={!pagination.has_previous}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  {generatePageNumbers().map((page, index) => (
                    <span key={index}>
                      {page === "..." ? (
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? "z-10 bg-emerald-50 border-emerald-500 text-emerald-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      )}
                    </span>
                  ))}

                  {/* Next Button */}
                  <button
                    onClick={() =>
                      handlePageChange(
                        Math.min(pagination.total_pages, currentPage + 1)
                      )
                    }
                    disabled={!pagination.has_next}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
                {onPageSizeChange && (
                  <div className="relative">
                    <select
                      value={pagination.page_size || 15}
                      onChange={(e) => onPageSizeChange(Number(e.target.value))}
                      className="appearance-none pl-3 pr-8 py-[7px] text-xs border rounded-lg bg-gray-100 border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      title="Rows per page"
                    >
                      <option value={15}>15</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={75}>75</option>
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-sm"></i>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 19.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Case
                </h3>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete the case "
                <span className="font-medium">
                  {deleteConfirmation.caseToDelete?.title}
                </span>
                "? This action cannot be undone.
              </p>
              <div className="mt-2 text-xs text-gray-500">
                <p>
                  Case Number: {deleteConfirmation.caseToDelete?.case_number}
                </p>
                <p>
                  Client:{" "}
                  {deleteConfirmation.caseToDelete?.client_name || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CasesTable.propTypes = {
  casesData: PropTypes.shape({
    cases: PropTypes.array,
    pagination: PropTypes.shape({
      page: PropTypes.number,
      page_size: PropTypes.number,
      total_items: PropTypes.number,
      total_pages: PropTypes.number,
      has_next: PropTypes.bool,
      has_previous: PropTypes.bool,
    }),
  }),
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onViewCase: PropTypes.func.isRequired,
  onEditCase: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onDeleteCase: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func,
  showEditButton: PropTypes.bool,
  showDeleteButton: PropTypes.bool,
  showViewButton: PropTypes.bool,
  enableCaseNumberLink: PropTypes.bool,
};

CasesTable.defaultProps = {
  casesData: {
    cases: [],
    pagination: {
      page: 1,
      page_size: 15,
      total_items: 0,
      total_pages: 0,
      has_next: false,
      has_previous: false,
    },
  },
};

export default CasesTable;
