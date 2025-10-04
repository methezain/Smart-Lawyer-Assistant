import React from "react";

const ViewJudgment = ({ judgment, onClose, formatDate }) => {
  if (!judgment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Judgment Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Case Information
              </h3>
              <p className="text-sm text-gray-900">
                {judgment.caseNumber} - {judgment.caseTitle}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Client</h3>
              <p className="text-sm text-gray-900">
                {judgment.clientName
                  ? `${judgment.clientName} (${judgment.clientId ?? "-"})`
                  : "—"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Assigned Lawyer
              </h3>
              <p className="text-sm text-gray-900">
                {judgment.assignedLawyerName
                  ? `${judgment.assignedLawyerName} (${
                      judgment.assignedLawyerId ?? "-"
                    })`
                  : "—"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Court</h3>
              <p className="text-sm text-gray-900">{judgment.courtName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Judge</h3>
              <p className="text-sm text-gray-900">{judgment.judgeName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Judgment Date
              </h3>
              <p className="text-sm text-gray-900">
                {formatDate(judgment.judgmentDate)}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
              {judgment.summary}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Key Points
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-900">
              {judgment.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>

          {judgment.fullText && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Full Judgment Text
              </h3>
              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto whitespace-pre-wrap">
                {judgment.fullText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewJudgment;
