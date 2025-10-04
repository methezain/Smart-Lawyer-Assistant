import React from "react";
import PropTypes from "prop-types";

function renderClassificationBadge(file) {
  if (file?.status === "pending") {
    return (
      <span className="inline-flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">
        <i className="ri-loader-4-line animate-spin mr-2"></i>
        <span>Processing...</span>
      </span>
    );
  }
  if (file?.status === "failed") {
    return (
      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
        Failed
      </span>
    );
  }
  return (
    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
      {file?.class || "—"}
    </span>
  );
}

export default function FilesTable({
  filteredFiles,
  selectedFiles,
  toggleSelectAll,
  toggleSelectFile,
  onEdit,
  onSaveEdit,
  onDelete,
  editName,
  setEditName,
  editingFile,
  setEditingFile,
  // Optional server-side pagination props (mirror ClientTable.jsx)
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}) {
  const hasPagination =
    typeof page === "number" &&
    typeof pageSize === "number" &&
    typeof total === "number" &&
    onPageChange;

  const startIndex = hasPagination
    ? (Math.max(1, page) - 1) * Math.max(1, pageSize)
    : 0;
  const endIndex = hasPagination
    ? startIndex + (filteredFiles?.length || 0)
    : filteredFiles?.length || 0;
  const totalCount = hasPagination
    ? total || endIndex
    : filteredFiles?.length || 0;
  const canPrev = hasPagination ? page > 1 : false;
  const canNext = hasPagination ? endIndex < totalCount : false;
  return (
    <div className="flex-1 w-full text-sm flex flex-col">
      <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={
                      selectedFiles.length === filteredFiles.length &&
                      filteredFiles.length > 0
                    }
                    onChange={(e) => toggleSelectAll(e)}
                  />
                </th>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Document Name</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Pages</th>
                <th className="p-3 text-left">Date & Time</th>
                <th className="p-3 text-left">Classification</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-xs">
              {filteredFiles.map((file, idx) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedFiles.includes(file.id)}
                      onChange={(e) => toggleSelectFile(e, file.id)}
                    />
                  </td>
                  <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                    {hasPagination ? startIndex + idx + 1 : idx + 1}
                  </td>
                  <td className="p-3 text-gray-800">
                    {editingFile === file.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border border-gray-300 rounded px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSaveEdit(file.id);
                          }}
                          type="button"
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded"
                        >
                          <i className="ri-check-line"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <i className="ri-file-pdf-line text-red-500 mr-2"></i>
                        <span className="truncate">{file.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                    pdf
                  </td>
                  <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                    {file.pages || "-"}
                  </td>
                  <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                    {file.date}
                  </td>
                  <td className="p-3">{renderClassificationBadge(file)}</td>
                  <td className="p-3 whitespace-nowrap text-left font-medium">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingFile(file.id);
                        onEdit(file);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      type="button"
                      title="Edit filename"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(file.id);
                      }}
                      className="text-gray-500 hover:text-gray-900"
                      type="button"
                      title="Delete file"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {hasPagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl text-xs mt-0">
          <span className="text-gray-600">
            {totalCount === 0
              ? "Showing 0 to 0 of 0 files"
              : `Showing ${Math.min(startIndex + 1, totalCount)} to ${Math.min(
                  endIndex,
                  totalCount
                )} of ${totalCount} files`}
          </span>
          <div className="flex items-center gap-2">
            {/* Prev */}
            <button
              className={`h-8 w-8 flex items-center justify-center rounded-xl border bg-white text-gray-700 hover:bg-gray-50 ${
                canPrev
                  ? "border-gray-300"
                  : "border-gray-200 opacity-50 cursor-not-allowed"
              }`}
              disabled={!canPrev}
              onClick={() => canPrev && onPageChange(page - 1)}
              aria-label="Previous"
            >
              <i className="ri-arrow-left-s-line"></i>
            </button>
            {/* Current page chip */}
            <span className="h-8 min-w-[2rem] px-2 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              {page}
            </span>
            {/* Next */}
            <button
              className={`h-8 w-8 flex items-center justify-center rounded-xl border bg-white text-gray-700 hover:bg-gray-50 ${
                canNext
                  ? "border-gray-300"
                  : "border-gray-200 opacity-50 cursor-not-allowed"
              }`}
              disabled={!canNext}
              onClick={() => canNext && onPageChange(page + 1)}
              aria-label="Next"
            >
              <i className="ri-arrow-right-s-line"></i>
            </button>

            {/* Page size dropdown styled as pill */}
            <div className="relative">
              <select
                className="h-8 pr-8 pl-3 rounded-xl border border-gray-300 bg-white text-gray-800 appearance-none cursor-pointer"
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              >
                {[10, 15, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"></i>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

FilesTable.propTypes = {
  filteredFiles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string.isRequired,
      pages: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      date: PropTypes.string,
      class: PropTypes.string,
      status: PropTypes.string,
    })
  ).isRequired,
  selectedFiles: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  ).isRequired,
  toggleSelectAll: PropTypes.func.isRequired,
  toggleSelectFile: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onSaveEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  editName: PropTypes.string.isRequired,
  setEditName: PropTypes.func.isRequired,
  editingFile: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  setEditingFile: PropTypes.func.isRequired,
  page: PropTypes.number,
  pageSize: PropTypes.number,
  total: PropTypes.number,
  onPageChange: PropTypes.func,
  onPageSizeChange: PropTypes.func,
};
