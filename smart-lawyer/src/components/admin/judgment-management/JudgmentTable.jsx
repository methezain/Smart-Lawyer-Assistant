import React, { useState } from "react";
import PropTypes from "prop-types";
import { API_BASE } from "../../../config/apiConfig";

const JudgmentTable = ({
  judgments,
  onViewCase,
  onViewDetails,
  onEdit,
  onDelete,
  formatDate,
  // Optional pagination props (mirror CasesTable behavior)
  pagination,
  currentPage,
  onPageChange,
}) => {
  const baseUrl = API_BASE; // gateway-relative

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    judgmentToDelete: null,
  });

  const handleDeleteClick = (judgment) => {
    setDeleteConfirmation({ isOpen: true, judgmentToDelete: judgment });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation.judgmentToDelete && onDelete) {
      onDelete(deleteConfirmation.judgmentToDelete);
    }
    setDeleteConfirmation({ isOpen: false, judgmentToDelete: null });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false, judgmentToDelete: null });
  };

  const handleViewPdf = (id) => {
    window.open(`${baseUrl}/judgments/${id}/file/view`, "_blank");
  };

  const handleDownloadPdf = (id) => {
    window.open(`${baseUrl}/judgments/${id}/file/download`, "_blank");
  };

  const statusClass = (status) => {
    switch (status) {
      case "Allowed":
        return "bg-green-100 text-green-800";
      case "Dismissed":
        return "bg-red-100 text-red-800";
      case "Favorable":
        return "bg-green-100 text-green-800";
      case "Unfavorable":
        return "bg-red-100 text-red-800";
      case "Partially Favorable":
      case "PartlyAllowed":
      case "PartiallyAllowed":
        return "bg-yellow-100 text-yellow-800";
      case "Remanded":
        return "bg-indigo-100 text-indigo-800";
      case "Withdrawn":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Pagination helpers (optional; only render if pagination provided)
  const effectivePagination = pagination || null;

  // Derived pagination values with fallbacks
  const effectivePage = currentPage || effectivePagination?.page || 1;
  const effectivePageSize =
    effectivePagination?.page_size ||
    effectivePagination?.size ||
    judgments?.length ||
    1;
  const effectiveTotalItems =
    effectivePagination?.total_items ??
    effectivePagination?.total ??
    (judgments?.length || 0);
  const effectiveTotalPages = effectivePagination
    ? effectivePagination.total_pages ||
      Math.max(1, Math.ceil(effectiveTotalItems / (effectivePageSize || 1)))
    : 0;

  const handleInternalPageChange = (page) => {
    if (onPageChange) {
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const generatePageNumbers = () => {
    if (!effectivePagination) return [];
    const pages = [];
    const maxVisiblePages = 5;
    const totalPages = effectiveTotalPages;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let start = Math.max(1, effectivePage - halfVisible);
      let end = Math.min(totalPages, start + maxVisiblePages - 1);

      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }

      for (let i = start; i <= end; i++) pages.push(i);

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider ">
            <tr>
              <th className="p-3 text-left ">#</th>
              <th className="p-3 text-left ">Case</th>
              <th className="p-3 text-left ">Title</th>
              <th className="p-3 text-left ">Client</th>
              <th className="p-3 text-left ">Lawyer</th>
              <th className="p-3 text-left ">Court</th>
              <th className="p-3 text-left ">Judge</th>
              <th className="p-3 text-left ">Date</th>
              <th className="p-3 text-left ">Status</th>
              <th className="p-3 text-left ">PDF</th>
              <th className="p-3 text-left ">Summary</th>
              <th className="p-3 text-left ">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-xs overflow-x-auto">
            {judgments.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                  <i className="ri-file-text-line text-4xl mb-2"></i>
                  <p>No judgments found</p>
                </td>
              </tr>
            ) : (
              judgments.map((judgment, index) => {
                const serialNumber = effectivePagination
                  ? (effectivePage - 1) * effectivePageSize + index + 1
                  : index + 1;
                return (
                  <tr key={judgment.id} className="hover:bg-gray-50">
                    <td className="p-3">{serialNumber}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => onViewCase(judgment.caseNumber)}
                        className="font-medium text-emerald-700 hover:underline whitespace-nowrap"
                      >
                        {judgment.caseNumber}
                      </button>
                    </td>

                    <td className="p-3">
                      <div className=" font-medium text-gray-900 whitespace-nowrap">
                        {judgment.caseTitle}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className=" font-medium text-gray-900 whitespace-nowrap">
                        {judgment.clientName
                          ? `${judgment.clientName} (${
                              judgment.clientId ?? "-"
                            })`
                          : "—"}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className=" font-medium text-gray-900 whitespace-nowrap">
                        {judgment.assignedLawyerName
                          ? `${judgment.assignedLawyerName} (${
                              judgment.assignedLawyerId ?? "-"
                            })`
                          : "—"}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className=" font-medium text-gray-900 whitespace-nowrap">
                        {judgment.courtName}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className=" font-medium text-gray-900 whitespace-nowrap">
                        {judgment.judgeName}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className=" font-medium text-gray-900 whitespace-nowrap">
                        {formatDate(judgment.judgmentDate)}
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold whitespace-nowrap rounded-full ${statusClass(
                          judgment.status
                        )}`}
                        title={judgment.statusDetails}
                      >
                        {judgment.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {judgment.pdfPath ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewPdf(judgment.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            title="View PDF"
                          >
                            View
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => onViewDetails(judgment)}
                        className="text-emerald-600 hover:text-emerald-800 "
                      >
                        View
                      </button>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2 ">
                        <button
                          onClick={() => onEdit(judgment)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          title="Edit Judgment"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDownloadPdf(judgment.id)}
                          className="text-emerald-600 hover:text-emerald-800 text-xs"
                          title="Download PDF"
                        >
                          Download
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDeleteClick(judgment)}
                          className="text-red-600 hover:text-red-800 text-xs"
                          title="Delete Judgment"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Component (optional) */}
      {effectivePagination && effectivePagination.total_items > 0 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 text-xs">
          <div className="flex items-center justify-between">
            {/* Results Summary - mobile */}
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() =>
                  handleInternalPageChange(
                    Math.max(
                      1,
                      (currentPage || effectivePagination.page || 1) - 1
                    )
                  )
                }
                disabled={!effectivePagination.has_previous}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  handleInternalPageChange(
                    Math.min(
                      effectivePagination.total_pages,
                      (currentPage || effectivePagination.page || 1) + 1
                    )
                  )
                }
                disabled={!effectivePagination.has_next}
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
                    {(effectivePage - 1) * (effectivePageSize || 0) + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      effectivePage * (effectivePageSize || 0),
                      effectiveTotalItems || 0
                    )}
                  </span>{" "}
                  of <span className="font-medium">{effectiveTotalItems}</span>{" "}
                  judgments
                </p>
              </div>

              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  {/* Previous Button */}
                  <button
                    onClick={() =>
                      handleInternalPageChange(
                        Math.max(
                          1,
                          (currentPage || effectivePagination.page || 1) - 1
                        )
                      )
                    }
                    disabled={!effectivePagination.has_previous}
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
                          onClick={() => handleInternalPageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === effectivePage
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
                      handleInternalPageChange(
                        Math.min(
                          effectivePagination.total_pages,
                          (currentPage || effectivePagination.page || 1) + 1
                        )
                      )
                    }
                    disabled={!effectivePagination.has_next}
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
                  Delete Judgment
                </h3>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete the judgment for case "
                <span className="font-medium">
                  {deleteConfirmation.judgmentToDelete?.caseTitle}
                </span>
                "?
              </p>
              <div className="mt-2 text-xs text-gray-500">
                <p>
                  Case Number: {deleteConfirmation.judgmentToDelete?.caseNumber}
                </p>
                <p>
                  Date:{" "}
                  {deleteConfirmation.judgmentToDelete?.judgmentDate
                    ? formatDate(
                        deleteConfirmation.judgmentToDelete.judgmentDate
                      )
                    : "N/A"}
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
                Delete Judgment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

JudgmentTable.propTypes = {
  judgments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      caseNumber: PropTypes.string,
      caseTitle: PropTypes.string,
      courtName: PropTypes.string,
      judgeName: PropTypes.string,
      judgmentDate: PropTypes.string,
      status: PropTypes.string,
      statusDetails: PropTypes.string,
      status_details: PropTypes.string,
      pdfPath: PropTypes.string,
      summary: PropTypes.string,
    })
  ).isRequired,
  onViewCase: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  // Optional pagination props
  pagination: PropTypes.shape({
    page: PropTypes.number,
    page_size: PropTypes.number,
    total_items: PropTypes.number,
    total_pages: PropTypes.number,
    has_next: PropTypes.bool,
    has_previous: PropTypes.bool,
  }),
  currentPage: PropTypes.number,
  onPageChange: PropTypes.func,
};

export default JudgmentTable;
