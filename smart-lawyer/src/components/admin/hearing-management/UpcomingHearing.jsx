import React from "react";
import { useGetHearingAttachmentCountQuery } from "../../../reduxstore/services/HearingsManagementAPI";

const AttachmentCountBadge = ({ hearingId }) => {
  const { data } = useGetHearingAttachmentCountQuery(hearingId, {
    skip: !hearingId,
    pollingInterval: 15000,
  });
  const count = data?.data ?? 0;
  return <span className="ml-2 text-xs text-white">{count}</span>;
};

const UpcomingHearing = ({
  groupedHearings,
  onViewCase,
  onEdit,
  onDelete,
  onAttachments,
  formatDate,
  pagination,
  currentPage,
  onPageChange,
  pageSize,
  onPageSizeChange,
  showEdit = true,
  showDelete = true,
}) => {
  if (Object.keys(groupedHearings).length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="ri-calendar-event-line text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-1">
            No hearings found
          </h3>
          <p className="text-gray-500">
            No upcoming hearings match your search criteria
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {Object.keys(groupedHearings).map((date) => (
        <div key={date} className="border-b border-gray-200 last:border-b-0">
          <div className="bg-gray-50 px-6 py-3 sticky top-0">
            <h2 className="font-medium text-gray-700">{formatDate(date)}</h2>
          </div>

          <ul className="divide-y divide-gray-200">
            {groupedHearings[date].map((hearing) => (
              <li
                key={hearing.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {hearing.caseTitle}
                    </h3>
                    <p className="text-sm text-blue-600">
                      <button
                        onClick={() => onViewCase(hearing)}
                        className="hover:underline focus:outline-none"
                      >
                        {hearing.caseNumber}
                      </button>
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0 flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        hearing.status === "scheduled"
                          ? "bg-green-100 text-green-800"
                          : hearing.status === "completed"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {hearing.status.charAt(0).toUpperCase() +
                        hearing.status.slice(1)}
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      {hearing.type}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Time</p>
                    <p className="text-sm flex items-center">
                      <i className="ri-time-line mr-1 text-gray-400"></i>
                      {hearing.time}{" "}
                      <span className="text-gray-500 mx-1">•</span>{" "}
                      {hearing.duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Court</p>
                    <p className="text-sm">{hearing.court}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Judge</p>
                    <p className="text-sm">{hearing.judge}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <p className="text-sm flex items-start">
                      <i className="ri-map-pin-line mr-1 text-gray-400 mt-0.5"></i>
                      {hearing.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Advocate</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {hearing.advocate && hearing.advocate !== "Unassigned"
                          ? hearing.advocate.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      <span className="text-sm">
                        {hearing.advocate && hearing.advocate !== "Unassigned"
                          ? hearing.advocate
                          : "Unassigned"}
                      </span>
                    </div>
                  </div>
                </div>

                {hearing.notes && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                      {hearing.notes}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Required Documents
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hearing.requiredDocuments.map((doc, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <button
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700"
                    onClick={() => onAttachments(hearing)}
                  >
                    <i className="ri-attachment-2 mr-1"></i>
                    Attachments
                    <AttachmentCountBadge hearingId={hearing.id} />
                  </button>

                  <div className="flex gap-2">
                    <button
                      className="px-3 py-2 border border-gray-300 rounded-lg text-xs hover:bg-gray-50"
                      onClick={() => onViewCase(hearing)}
                    >
                      <i className="ri-eye-line mr-1"></i> View Case
                    </button>
                    {showEdit && (
                      <button
                        className="px-3 py-2 border border-gray-300 rounded-lg text-xs hover:bg-gray-50"
                        onClick={() => onEdit(hearing)}
                      >
                        <i className="ri-edit-line mr-1"></i> Edit
                      </button>
                    )}
                    {showDelete && (
                      <button
                        className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
                        onClick={() => onDelete(hearing)}
                        title="Delete hearing"
                      >
                        <i className="ri-delete-bin-line mr-1"></i> Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Pagination Component */}
      {pagination && pagination.total_items > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Pagination Info */}
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, pagination.total_items)} of{" "}
              {pagination.total_items} hearings
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              {/* First Page */}
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                <i className="ri-skip-back-line"></i>
              </button>

              {/* Previous Page */}
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!pagination.has_prev}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <i className="ri-arrow-left-s-line"></i>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {(() => {
                  const pages = [];
                  const maxPagesToShow = 5;
                  const totalPages = pagination.total_pages;

                  let startPage = Math.max(
                    1,
                    currentPage - Math.floor(maxPagesToShow / 2)
                  );
                  let endPage = Math.min(
                    totalPages,
                    startPage + maxPagesToShow - 1
                  );

                  if (endPage - startPage + 1 < maxPagesToShow) {
                    startPage = Math.max(1, endPage - maxPagesToShow + 1);
                  }

                  // Add first page and ellipsis if needed
                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => onPageChange(1)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(
                        <span
                          key="start-ellipsis"
                          className="px-2 text-gray-500"
                        >
                          ...
                        </span>
                      );
                    }
                  }

                  // Add visible page numbers
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => onPageChange(i)}
                        className={`px-3 py-1 text-sm border rounded ${
                          i === currentPage
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  // Add last page and ellipsis if needed
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span key="end-ellipsis" className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => onPageChange(totalPages)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pages;
                })()}
              </div>

              {/* Next Page */}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!pagination.has_next}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <i className="ri-arrow-right-s-line"></i>
              </button>

              {/* Last Page */}
              <button
                onClick={() => onPageChange(pagination.total_pages)}
                disabled={currentPage === pagination.total_pages}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last page"
              >
                <i className="ri-skip-forward-line"></i>
              </button>

              {/* Page Size Selector */}
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingHearing;
