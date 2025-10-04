import React from "react";

const ViewCase = ({
  viewingCase,
  onCloseCase,
  onEditCase,
  onStatusChange,
  onCloseThisCase,
  navigateToScheduleHearing,
  navigateToUploadDocuments,
  navigateToAddJudgment,
}) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm mt-8">
      {/* Case Detail View */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Case Number</p>
          <h2 className="text-xl font-semibold">{viewingCase.case_number}</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCloseCase}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Back to Cases
          </button>
          <button
            onClick={() => onEditCase(viewingCase)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            Edit Case
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">{viewingCase.title}</h3>

          {/* Display structured case details */}
          <div className="mt-4 space-y-4">
            {/* Case Background */}
            {viewingCase.case_background && (
              <div className="border-b border-gray-100 pb-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                  Case Background
                </h4>
                <p className="text-gray-600 whitespace-pre-line">
                  {viewingCase.case_background}
                </p>
              </div>
            )}

            {/* Legal Issues */}
            {viewingCase.legal_issues && (
              <div className="border-b border-gray-100 pb-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                  Legal Issues
                </h4>
                <p className="text-gray-600 whitespace-pre-line">
                  {viewingCase.legal_issues}
                </p>
              </div>
            )}

            {/* Relevant Laws */}
            {viewingCase.relevant_laws && (
              <div className="border-b border-gray-100 pb-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                  Relevant Laws & Statutes
                </h4>
                <p className="text-gray-600 whitespace-pre-line">
                  {viewingCase.relevant_laws}
                </p>
              </div>
            )}

            {/* Prayer/Relief */}
            {viewingCase.prayer_relief && (
              <div className="border-b border-gray-100 pb-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                  Prayer/Relief Sought
                </h4>
                <p className="text-gray-600 whitespace-pre-line">
                  {viewingCase.prayer_relief}
                </p>
              </div>
            )}

            {/* Evidence Documents */}
            {viewingCase.evidence_documents && (
              <div className="border-b border-gray-100 pb-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                  Evidence Documents
                </h4>
                <p className="text-gray-600 whitespace-pre-line">
                  {viewingCase.evidence_documents}
                </p>
              </div>
            )}

            {/* Fallback: Parse and display structured case description if structured fields are not available */}
            {!viewingCase.case_background &&
              !viewingCase.legal_issues &&
              !viewingCase.relevant_laws &&
              !viewingCase.prayer_relief &&
              !viewingCase.evidence_documents &&
              viewingCase.description && (
                <div className="space-y-4">
                  {viewingCase.description
                    .split("\n\n")
                    .map((section, index) => {
                      // Check if section has a label (like "Background: ")
                      const labelMatch = section.match(/^([^:]+):\s(.+)$/s);

                      if (labelMatch) {
                        const [, label, content] = labelMatch;
                        return (
                          <div
                            key={index}
                            className="border-b border-gray-100 pb-3"
                          >
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">
                              {label}
                            </h4>
                            <p className="text-gray-600 whitespace-pre-line">
                              {content}
                            </p>
                          </div>
                        );
                      } else if (section.trim()) {
                        // For backwards compatibility with old format
                        return (
                          <div
                            key={index}
                            className="border-b border-gray-100 pb-3"
                          >
                            <p className="text-gray-600">{section}</p>
                          </div>
                        );
                      }
                      return null;
                    })
                    .filter(Boolean)}
                </div>
              )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Case Type</p>
            <p className="font-medium">{viewingCase.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p className="font-medium">
              {viewingCase.status === "not approved" ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Not Approved
                </span>
              ) : viewingCase.status === "pending" ? (
                <button
                  onClick={() => onStatusChange(viewingCase, "active")}
                  className="px-2 py-1 rounded-full text-xs font-medium cursor-pointer bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  title="Click to activate"
                >
                  Pending
                </button>
              ) : viewingCase.status === "active" ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium
                  ${
                    viewingCase.status === "active"
                      ? "bg-green-100 text-green-800"
                      : viewingCase.status === "closed"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {viewingCase.status.charAt(0).toUpperCase() +
                    viewingCase.status.slice(1)}
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Filing Date</p>
            <p className="font-medium">
              {new Date(viewingCase.filing_date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Client</p>
            <p className="font-medium">
              {viewingCase.client?.name || viewingCase.client_name || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Opponent</p>
            <p className="font-medium">{viewingCase.opponent}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Assigned To</p>
            <p className="font-medium">
              {viewingCase.assigned_lawyer_name || "Unassigned"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Court</p>
            <p className="font-medium">{viewingCase.court_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Next Hearing</p>
            <p className="font-medium">
              {viewingCase.next_hearing
                ? new Date(viewingCase.next_hearing).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )
                : "No hearings scheduled"}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <h4 className="font-semibold mb-4">Case Management Options</h4>
          <div className="flex flex-wrap gap-3">
            <button
              className={`px-4 py-2 text-white rounded-lg text-sm font-medium ${
                viewingCase.status === "active"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-300 cursor-not-allowed"
              }`}
              disabled={viewingCase.status !== "active"}
              title={
                viewingCase.status !== "active"
                  ? "Case must be active to schedule hearings"
                  : ""
              }
              onClick={() => navigateToScheduleHearing(viewingCase)}
            >
              <i className="ri-calendar-line mr-2"></i>
              Schedule Hearing
            </button>
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
              onClick={() => navigateToUploadDocuments(viewingCase)}
            >
              <i className="ri-file-upload-line mr-2"></i>
              Upload Documents
            </button>
            <button
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
              onClick={() => navigateToAddJudgment(viewingCase)}
            >
              <i className="ri-scales-line mr-2"></i>
              Add Judgment
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              onClick={() => onCloseThisCase(viewingCase)}
            >
              <i className="ri-close-circle-line mr-2"></i>
              Close Case
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCase;
