import React, { useState } from "react";
import PropTypes from "prop-types";

export default function InvoiceTable({
  invoices,
  onView,
  onDownload,
  onEdit,
  onDelete,
  formatCurrency,
  statusColors,
  printInvoice,
  page = 1,
  pageSize = 15,
  total = 0,
  onPageChange,
  onPageSizeChange,
}) {
  const [confirming, setConfirming] = useState(null); // invoice pending deletion
  // Pagination calculations (mirror ClientTable.jsx behavior)
  const startIndex = (Math.max(1, page) - 1) * Math.max(1, pageSize);
  const endIndex = startIndex + (invoices?.length || 0);
  const totalCount = total || endIndex; // fallback if total unknown
  const canPrev = page > 1;
  const canNext = endIndex < totalCount;

  // Event handlers
  const handlePrev = () => {
    if (canPrev) onPageChange?.(page - 1);
  };
  const handleNext = () => {
    if (canNext) onPageChange?.(page + 1);
  };
  const handleSizeChange = (e) => {
    onPageSizeChange?.(Number(e.target.value));
  };
  return (
    <div className="bg-white rounded-xl shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-[10px] font-medium text-gray-500 uppercase">
        <thead>
          <tr>
            <th className="p-3 text-left ">#</th>
            <th className="p-3 text-left ">Invoice ID</th>
            <th className="p-3 text-left ">Contract</th>
            <th className="p-3 text-left ">Client</th>
            <th className="p-3 text-left ">Total</th>
            <th className="p-3 text-left ">Paid</th>
            <th className="p-3 text-left ">Balance</th>
            <th className="p-3 text-left ">Issued Date</th>
            <th className="p-3 text-left ">Due Date</th>
            <th className="p-3 text-left ">Status</th>
            <th className="p-3 text-left ">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.length === 0 ? (
            <tr>
              <td colSpan={11} className="text-center py-8 text-gray-400">
                No invoices found
              </td>
            </tr>
          ) : (
            invoices.map((invoice, idx) => (
              <tr key={invoice.id}>
                <td className="p-3">{startIndex + idx + 1}</td>

                <td className="p-3 font-medium text-gray-900">{invoice.id}</td>
                <td className="p-3">
                  {invoice.contractTitle || invoice.contract_title}
                </td>
                <td className="p-3">
                  {invoice.clientName || invoice.client_name}
                </td>
                <td className="p-3 font-medium">
                  {formatCurrency(invoice.amount || invoice.total_amount)}
                </td>
                <td className="p-3">
                  {formatCurrency(invoice.amount_paid || 0)}
                </td>
                <td className="p-3">
                  {formatCurrency(
                    (invoice.amount || invoice.total_amount || 0) -
                      (invoice.amount_paid || 0)
                  )}
                </td>
                <td className="p-3">
                  {invoice.issuedDate || invoice.issued_date}
                </td>
                <td className="p-3">{invoice.dueDate || invoice.due_date}</td>
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-semibold ${
                      statusColors[invoice.status] ||
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="p-3 text-left">
                  <button
                    className="text-emerald-600 hover:text-emerald-800 mr-2"
                    onClick={() => onView(invoice)}
                  >
                    <i className="ri-eye-line" aria-hidden="true"></i>{" "}
                    <span>View</span>
                  </button>
                  <button
                    className="text-emerald-600 hover:text-emerald-800 mr-2"
                    onClick={() => onEdit(invoice)}
                  >
                    <i className="ri-edit-line" aria-hidden="true"></i>{" "}
                    <span>Edit</span>
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800 mr-2"
                    onClick={() => setConfirming(invoice)}
                  >
                    <i className="ri-delete-bin-line" aria-hidden="true"></i>{" "}
                    <span>Delete</span>
                  </button>
                  <button
                    className="text-emerald-600 hover:text-emerald-800"
                    onClick={() =>
                      onDownload ? onDownload(invoice) : printInvoice(invoice)
                    }
                  >
                    <i className="ri-download-line" aria-hidden="true"></i>{" "}
                    <span>PDF</span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Confirm Delete Modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-5 py-4 border-b">
              <h3 className="text-sm font-semibold text-gray-900">
                Delete Invoice
              </h3>
            </div>
            <div className="px-5 py-4 text-sm text-gray-700">
              <p className="mb-2">
                Are you sure you want to delete this invoice?
              </p>
              <ul className="text-gray-600 list-disc ml-5">
                <li>ID: {confirming?.id}</li>
                <li>
                  Client: {confirming?.clientName || confirming?.client_name}
                </li>
                <li>
                  Contract:{" "}
                  {confirming?.contractTitle || confirming?.contract_title}
                </li>
              </ul>
            </div>
            <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
              <button
                className="h-8 px-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setConfirming(null)}
              >
                Cancel
              </button>
              <button
                className="h-8 px-3 rounded-lg bg-red-600 text-white hover:bg-red-700"
                onClick={async () => {
                  const inv = confirming;
                  setConfirming(null);
                  await onDelete?.(inv);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pagination footer (same design as ClientTable.jsx) */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl text-xs">
        <span className="text-gray-600">
          {totalCount === 0
            ? "Showing 0 to 0 of 0 invoices"
            : `Showing ${Math.min(startIndex + 1, totalCount)} to ${Math.min(
                endIndex,
                totalCount
              )} of ${totalCount} invoices`}
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
            onClick={handlePrev}
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
            onClick={handleNext}
            aria-label="Next"
          >
            <i className="ri-arrow-right-s-line"></i>
          </button>

          {/* Page size dropdown styled as pill */}
          <div className="relative">
            <select
              className="h-8 pr-8 pl-3 rounded-xl border border-gray-300 bg-white text-gray-800 appearance-none cursor-pointer"
              value={pageSize}
              onChange={handleSizeChange}
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
    </div>
  );
}

InvoiceTable.propTypes = {
  invoices: PropTypes.array.isRequired,
  onView: PropTypes.func,
  onDownload: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  formatCurrency: PropTypes.func.isRequired,
  statusColors: PropTypes.object.isRequired,
  printInvoice: PropTypes.func,
  page: PropTypes.number,
  pageSize: PropTypes.number,
  total: PropTypes.number,
  onPageChange: PropTypes.func,
  onPageSizeChange: PropTypes.func,
};
