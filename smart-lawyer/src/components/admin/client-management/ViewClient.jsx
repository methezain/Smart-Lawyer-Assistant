import React from "react";

const field = (label, value) => (
  <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-b-0">
    <span className="text-gray-500 text-sm">{label}</span>
    <span className="text-gray-900 font-medium text-sm text-right max-w-[65%]">
      {value || "—"}
    </span>
  </div>
);

const ViewClient = ({ isOpen, onClose, client }) => {
  if (!isOpen || !client) return null;

  const isBusiness = client.type === "Business";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Client Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{client.name}</h3>
                <p className="text-xs text-gray-500">
                  {client.type || "Individual"}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  client.onlineStatus === "online"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-gray-50 text-gray-700 border border-gray-200"
                }`}
              >
                {client.onlineStatus === "online" ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Contact
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {field("Email", client.email)}
              {field("Phone", client.phone)}
              {field("Address", client.address)}
            </div>
          </div>

          {isBusiness ? (
            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Business Info
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {field("NTN", client.ntn)}
                {field("Industry", client.industry)}
                {field("Contact Person", client.contactPerson)}
              </div>
            </div>
          ) : (
            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Personal Info
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {field("CNIC", client.cnic)}
                {field("Occupation", client.occupation)}
                {field("Nationality", client.nationality)}
                {field("Religion", client.religion)}
                {field("Marital Status", client.maritalStatus)}
                {field("Gender", client.gender)}
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {client.notes || "No notes"}
              </p>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Cases</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {field(
                "Summary",
                `${client.totalCases ?? 0} total | ${
                  client.activeCases ?? 0
                } active | ${client.pendingCases ?? 0} pending | ${
                  client.closedCases ?? client.pastCases ?? 0
                } closed`
              )}
              {field("Linked Case ID", client.case_id)}
              {field(
                "Linked Case Status",
                (client.case_status || "").toString().toUpperCase() || "—"
              )}
              {field("Assigned Lawyer", client.assigned_lawyer_name)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewClient;
