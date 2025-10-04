import React from "react";

const DocumentTable = ({
  documents,
  onView,
  onEdit,
  onDelete,
  onViewCase,
  formatDate,
  startIndex = 0,
  // Optional pagination props (mirror other tables)
  pagination,
  currentPage,
  onPageChange,
  onPageSizeChange,
}) => {
  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="ri-file-search-line text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-1">
            No documents found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      </div>
    );
  }

  // Derive effective pagination values if provided
  const effectivePagination = pagination || null;
  const effectivePage = currentPage || effectivePagination?.page || 1;
  const effectivePageSize =
    effectivePagination?.page_size || documents?.length || 0;
  const currentPageSize = effectivePageSize || documents?.length || 10;
  const effectiveTotalItems =
    effectivePagination?.total_items ?? documents?.length ?? 0;
  const effectiveTotalPages = effectivePagination
    ? effectivePagination.total_pages ||
      Math.max(
        1,
        Math.ceil((effectiveTotalItems || 0) / (effectivePageSize || 1))
      )
    : 0;
  const hasPrev = effectivePagination?.has_previous ?? effectivePage > 1;
  const hasNext =
    effectivePagination?.has_next ??
    (effectiveTotalPages ? effectivePage < effectiveTotalPages : false);

  // If caller didn't provide startIndex, compute from effective values
  const computedStartIndex = (effectivePage - 1) * (effectivePageSize || 0);
  const rowStartIndex = startIndex || computedStartIndex || 0;

  const showingStart = effectiveTotalItems
    ? Math.min(rowStartIndex + 1, effectiveTotalItems)
    : 0;
  const showingEnd = effectiveTotalItems
    ? Math.min(rowStartIndex + (documents?.length || 0), effectiveTotalItems)
    : 0;

  const handleInternalPageChange = (page) => {
    if (!onPageChange) return;
    const next = Math.max(1, page);
    if (effectiveTotalPages && next > effectiveTotalPages) return;
    onPageChange(next);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-[10px] text-medium text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="text-left">File</th>
              <th className="p-3 text-left ">Case</th>
              <th className="p-3 text-left ">Client</th>
              <th className="p-3 text-left ">Lawyer</th>
              <th className="p-3 text-left ">Document Name</th>
              <th className="p-3 text-left">Size</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left ">Uploaded</th>
              <th className="p-3 text-left ">Status</th>
              <th className="p-3 text-left ">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-xs text-gray-700">
            {documents.map((document, idx) => (
              <tr key={document.id} className="hover:bg-gray-50">
                <td className="p-3 whitespace-nowrap ">
                  {rowStartIndex + idx + 1}
                </td>

                <td className=" whitespace-nowrap">
                  <div className="flex-shrink-0 h-5 w-5 flex items-center justify-center bg-gray-200 rounded-md">
                    {(() => {
                      const t = (document.fileType || "")
                        .toString()
                        .toUpperCase();
                      const isPdf = t === "PDF";
                      const isWord =
                        t === "DOC" || t === "DOCX" || t.includes("WORD");
                      const isExcel =
                        t === "XLS" || t === "XLSX" || t.includes("EXCEL");
                      const iconClass = isPdf
                        ? "ri-file-pdf-line text-red-500"
                        : isWord
                        ? "ri-file-word-line text-blue-600"
                        : isExcel
                        ? "ri-file-excel-line text-green-600"
                        : "ri-file-line text-gray-500";
                      return <i className={`${iconClass} text-sm`}></i>;
                    })()}
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <button
                    onClick={() => onViewCase(document.caseNumber)}
                    className="hover:underline text-blue-600 mr-1 cursor-pointer"
                  >
                    {document.caseNumber}
                  </button>
                  {document.caseTitle}
                </td>

                <td className="p-3 whitespace-nowrap">
                  {document.clientName
                    ? `${document.clientName} (${document.clientId ?? "-"})`
                    : "—"}
                </td>

                <td className="p-3 whitespace-nowrap">
                  {document.assignedLawyerName
                    ? `${document.assignedLawyerName} (${
                        document.assignedLawyerId ?? "-"
                      })`
                    : "—"}
                </td>

                <td className="p-3 whitespace-nowrap">{document.title}</td>
                <td className="p-3 whitespace-nowrap">{document.fileSize}</td>

                <td className="p-3 whitespace-nowrap">
                  <div className="text-gray-900">{document.type}</div>
                </td>

                <td className="p-3 whitespace-nowrap">
                  {formatDate(document.uploadedDate)}
                </td>
                <td className="p-3 whitespace-nowrap">{document.uploadedBy}</td>

                <td className="p-3 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-[10px] font-semibold rounded-full ${
                      document.status === "Final"
                        ? "bg-green-100 text-green-800"
                        : document.status === "Draft"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {document.status}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap font-medium">
                  <button
                    onClick={() => onView(document)}
                    className="text-emerald-600 cursor-pointer hover:text-emerald-900 mr-3"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(document)}
                    className="text-blue-600 cursor-pointer hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(document.id)}
                    className="text-red-600 cursor-pointer hover:text-red-900 mr-3"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer (optional) */}
      {effectivePagination && (
        <div className="px-4 py-3 flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="text-xs text-gray-600 whitespace-nowrap">
            {`Showing ${showingStart} to ${showingEnd} of ${effectiveTotalItems} documents`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleInternalPageChange(effectivePage - 1)}
              disabled={!hasPrev}
              className={`w-8 h-8 rounded-lg border text-sm ${
                hasPrev
                  ? "bg-white hover:bg-gray-50"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              title="Previous page"
            >
              <i className="ri-arrow-left-s-line"></i>
            </button>
            <span className="inline-flex items-center justify-center w-10 h-8 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 text-sm font-medium">
              {effectivePage}
            </span>
            <button
              onClick={() => handleInternalPageChange(effectivePage + 1)}
              disabled={!hasNext}
              className={`w-8 h-8 rounded-lg border text-sm ${
                hasNext
                  ? "bg-white hover:bg-gray-50"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              title="Next page"
            >
              <i className="ri-arrow-right-s-line"></i>
            </button>
            {onPageSizeChange && (
              <div className="flex items-center gap-2">
                {/* <span className="text-xs text-gray-600">Rows per page</span> */}
                <div className="relative">
                  <select
                    value={currentPageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="appearance-none pl-3 pr-8 py-[7px] text-xs border rounded-lg bg-gray-100 border-gray-400 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    title="Rows per page"
                  >
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                    <option value={75}>75</option>
                  </select>
                  <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-sm"></i>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTable;
