import React from "react";

const ClientTable = ({
  clients,
  onView,
  onEdit,
  onDelete,
  page = 1,
  pageSize = 15,
  total = 0,
  onPageChange,
  onPageSizeChange,
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const startIndex = (Math.max(1, page) - 1) * Math.max(1, pageSize);
  const endIndex = startIndex + (clients?.length || 0);
  const totalCount = total || endIndex; // fallback if total unknown
  const canPrev = page > 1;
  const canNext = endIndex < totalCount;

  if (!clients || clients.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <i className="ri-user-search-line text-2xl text-gray-400"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-1">
          No clients found
        </h3>
        <p className="text-gray-500">Try adjusting your search</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
          <tr>
            <th className="p-3 text-left ">#</th>
            <th className="p-3 text-left ">Client</th>
            <th className="p-3 text-left ">Joined Date</th>
            <th className="p-3 text-left ">Email</th>
            <th className="p-3 text-left ">Phone Number</th>
            <th className="p-3 text-left ">Cases</th>
            <th className="p-3 text-left ">Type</th>
            <th className="p-3 text-left ">Status</th>
            <th className="p-3 text-left ">Gender</th>
            <th className="p-3 text-left ">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 text-xs">
          {clients.map((client, idx) => (
            <tr key={client.id} className="hover:bg-gray-50">
              <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                {startIndex + idx + 1}
              </td>
              <td className="p-3">
                <div className="flex items-center">
                  <div className="flex--0 h-8 w-8 relative">
                    {client.photo ? (
                      <img
                        className="h-8 w-8 rounded-full object-cover"
                        src={client.photo}
                        alt={client.name}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <i className="ri-building-line text-lg text-gray-400"></i>
                      </div>
                    )}
                    <span
                      className={`w-2 h-2 rounded-full mr-2 absolute top-0 right--6 ${
                        client.onlineStatus === "online"
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    ></span>
                  </div>
                  <div className="ml-4">
                    <div className="text-xs font-medium text-gray-900">
                      {client.name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                {formatDate(client.joinDate)}
              </td>
              <td className="p-3 text-xs text-gray-800 whitespace-nowrap">
                {client.email}
              </td>
              <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                {client.phone}
              </td>
              <td className="p-3 text-xs text-gray-600 whitespace-nowrap">
                <span className="mr-2">{client.totalCases ?? 0} Total</span>
                <span className="mr-2">- {client.activeCases ?? 0} Active</span>
                <span className="mr-2">
                  - {client.pendingCases ?? 0} Pending
                </span>
                <span>
                  - {client.closedCases ?? client.pastCases ?? 0} Closed
                </span>
              </td>

              <td className="p-3 whitespace-nowrap">
                <div className="text-xs  text-gray-900">{client.type}</div>
              </td>

              <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                {client.maritalStatus}
              </td>
              <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                {client.gender}
              </td>

              <td className="p-3 whitespace-nowrap text-left font-medium">
                <button
                  onClick={() => onView && onView(client)}
                  className="text-emerald-600 hover:text-emerald-900 mr-3"
                >
                  View
                </button>
                <button
                  onClick={() => onEdit && onEdit(client)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Edit
                </button>
                <button className="text-gray-500 hover:text-gray-900">
                  <span onClick={() => onDelete && onDelete(client)}>
                    Delete
                  </span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl text-xs">
        <span className="text-gray-600">
          {totalCount === 0
            ? "Showing 0 to 0 of 0 clients"
            : `Showing ${Math.min(startIndex + 1, totalCount)} to ${Math.min(
                endIndex,
                totalCount
              )} of ${totalCount} clients`}
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
            onClick={() => canPrev && onPageChange && onPageChange(page - 1)}
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
            onClick={() => canNext && onPageChange && onPageChange(page + 1)}
            aria-label="Next"
          >
            <i className="ri-arrow-right-s-line"></i>
          </button>

          {/* Page size dropdown styled as pill */}
          <div className="relative">
            <select
              className="h-8 pr-8 pl-3 rounded-xl border border-gray-300 bg-white text-gray-800 appearance-none cursor-pointer"
              value={pageSize}
              onChange={(e) =>
                onPageSizeChange && onPageSizeChange(Number(e.target.value))
              }
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
};

export default ClientTable;
