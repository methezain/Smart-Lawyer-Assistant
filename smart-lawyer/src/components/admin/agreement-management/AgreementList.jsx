import React, { useState } from "react";
import { useDeleteAgreementMutation } from "../../../reduxstore/services/AgreementsAPI";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const AgreementList = ({ contracts, onSelect, onEdit, statusColors }) => {
  const [deleteAgreement, { isLoading: isDeleting }] =
    useDeleteAgreementMutation();
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    agreement: null,
  });

  const handleDeleteClick = (agreement) => {
    setDeleteConfirmation({ isOpen: true, agreement });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false, agreement: null });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.agreement) return;
    try {
      await deleteAgreement(deleteConfirmation.agreement.id).unwrap();
      setDeleteConfirmation({ isOpen: false, agreement: null });
    } catch (err) {
      console.error("Failed to delete agreement", err);
      alert("Failed to delete agreement. Please try again.");
    }
  };
  if (!contracts || contracts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <i className="ri-file-text-line text-2xl text-gray-400"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-1">
          No contracts found
        </h3>
        <p className="text-gray-500">No contracts match your search criteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {contracts.map((contract) => (
        <div
          key={contract.id}
          className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h3
                  className="font-semibold text-lg text-gray-900 cursor-pointer hover:text-emerald-600"
                  onClick={() => onSelect(contract)}
                >
                  {contract.title}
                </h3>
                <p className="text-sm text-gray-500">
                  Client: <span className="font-medium">{contract.client}</span>
                  {contract.clientCNIC && (
                    <span className="ml-2 text-xs text-gray-400">
                      (CNIC: {contract.clientCNIC})
                    </span>
                  )}
                </p>
              </div>
              <div className="mt-2 md:mt-0 flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    statusColors[contract.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {contract.status}
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                  {contract.caseType}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Client Info</p>
                <p className="text-sm">
                  CNIC: {contract.clientCNIC || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Effective Date</p>
                <p className="text-sm">
                  {contract.effectiveDate
                    ? formatDate(contract.effectiveDate)
                    : contract.filedDate
                    ? formatDate(contract.filedDate)
                    : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Duration</p>
                <p className="text-sm">
                  {contract.contractDuration
                    ? `${contract.contractDuration} months`
                    : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Termination Date</p>
                <p className="text-sm">
                  {contract.terminationDate
                    ? formatDate(contract.terminationDate)
                    : "Not specified"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <p className="text-sm text-gray-700 truncate">
                  {contract.clientAddress || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Financials</p>
                <p className="text-sm text-gray-700 truncate">
                  {contract.amount || contract.amount === 0
                    ? new Intl.NumberFormat("en-PK", {
                        style: "currency",
                        currency: contract.currency || "PKR",
                      }).format(Number(contract.amount || 0))
                    : "Not specified"}
                </p>
              </div>
            </div>

            {contract.description && (
              <p className="text-sm text-gray-600 line-clamp-2 border-t pt-3">
                {contract.description}
              </p>
            )}

            <div className="flex justify-end mt-4 gap-3">
              <button
                className="text-emerald-600 hover:text-emerald-800 text-sm flex items-center gap-1"
                onClick={() => onSelect(contract)}
              >
                <i className="ri-eye-line"></i> View Details
              </button>
              <button
                className="text-emerald-600 hover:text-emerald-800 text-sm flex items-center gap-1"
                onClick={() => (onEdit ? onEdit(contract) : onSelect(contract))}
              >
                <i className="ri-eye-line"></i> Edit Contract
              </button>
              <button
                className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1 disabled:opacity-50"
                onClick={() => handleDeleteClick(contract)}
                disabled={isDeleting}
                title="Delete agreement"
              >
                <i className="ri-delete-bin-line"></i>{" "}
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ))}
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
                  Delete Agreement
                </h3>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete the agreement "
                <span className="font-medium">
                  {deleteConfirmation.agreement?.title}
                </span>
                "? This action cannot be undone.
              </p>
              <div className="mt-2 text-xs text-gray-500">
                <p>Client: {deleteConfirmation.agreement?.client || "N/A"}</p>
                <p>Agreement ID: {deleteConfirmation.agreement?.id}</p>
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
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Agreement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgreementList;
