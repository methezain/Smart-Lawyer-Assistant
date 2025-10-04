import React from "react";

export default function InvoiceTools({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onAdd,
}) {
  return (
    <div className="bg-white rounded-xl p-3 text-xs shadow-sm mb-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by ID, client, or contract..."
            className="px-4 py-2 border border-gray-300 rounded-lg w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <button
          onClick={onAdd}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 self-start md:self-auto"
        >
          <i className="ri-add-line"></i> New Invoice
        </button>
      </div>
    </div>
  );
}
