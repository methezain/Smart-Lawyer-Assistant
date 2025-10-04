import React from "react";

const EditHearing = ({
  currentEditHearing,
  newHearingData,
  newHearingErrors,
  onClose,
  onChange,
  onDocumentsChange,
  onSubmit,
}) => {
  if (!currentEditHearing) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Edit Hearing</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="mb-6">
          <p className="mb-4">
            Editing hearing for case:{" "}
            <span className="font-bold">{currentEditHearing.caseTitle}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hearing Date*
              </label>
              <input
                type="date"
                name="date"
                value={newHearingData.date}
                onChange={onChange}
                className={`w-full px-3 py-2 border ${
                  newHearingErrors.date ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {newHearingErrors.date && (
                <p className="text-red-500 text-xs mt-1">
                  {newHearingErrors.date}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hearing Time*
              </label>
              <input
                type="time"
                name="time"
                value={newHearingData.time}
                onChange={onChange}
                className={`w-full px-3 py-2 border ${
                  newHearingErrors.time ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {newHearingErrors.time && (
                <p className="text-red-500 text-xs mt-1">
                  {newHearingErrors.time}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hearing Type*
              </label>
              <select
                name="type"
                value={newHearingData.type}
                onChange={onChange}
                className={`w-full px-3 py-2 border ${
                  newHearingErrors.type ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              >
                <option value="Initial Hearing">Initial Hearing</option>
                <option value="Preliminary Hearing">Preliminary Hearing</option>
                <option value="Case Management">Case Management</option>
                <option value="Motion Hearing">Motion Hearing</option>
                <option value="Evidence Presentation">
                  Evidence Presentation
                </option>
                <option value="Witness Examination">Witness Examination</option>
                <option value="Cross Examination">Cross Examination</option>
                <option value="Arguments">Arguments</option>
                <option value="Final Arguments">Final Arguments</option>
                <option value="Judgment">Judgment</option>
                <option value="Mediation">Mediation</option>
                <option value="Settlement Conference">
                  Settlement Conference
                </option>
              </select>
              {newHearingErrors.type && (
                <p className="text-red-500 text-xs mt-1">
                  {newHearingErrors.type}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration*
              </label>
              <select
                name="duration"
                value={newHearingData.duration}
                onChange={onChange}
                className={`w-full px-3 py-2 border ${
                  newHearingErrors.duration
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              >
                <option value="30 minutes">30 minutes</option>
                <option value="1 hour">1 hour</option>
                <option value="1.5 hours">1.5 hours</option>
                <option value="2 hours">2 hours</option>
                <option value="2.5 hours">2.5 hours</option>
                <option value="3 hours">3 hours</option>
                <option value="4 hours">4 hours</option>
                <option value="Full Day">Full Day</option>
              </select>
              {newHearingErrors.duration && (
                <p className="text-red-500 text-xs mt-1">
                  {newHearingErrors.duration}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Court*
              </label>
              <input
                type="text"
                name="court"
                value={newHearingData.court}
                onChange={onChange}
                className={`w-full px-3 py-2 border ${
                  newHearingErrors.court ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {newHearingErrors.court && (
                <p className="text-red-500 text-xs mt-1">
                  {newHearingErrors.court}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Judge*
              </label>
              <input
                type="text"
                name="judge"
                value={newHearingData.judge}
                onChange={onChange}
                className={`w-full px-3 py-2 border ${
                  newHearingErrors.judge ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {newHearingErrors.judge && (
                <p className="text-red-500 text-xs mt-1">
                  {newHearingErrors.judge}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location*
              </label>
              <input
                type="text"
                name="location"
                value={newHearingData.location}
                onChange={onChange}
                className={`w-full px-3 py-2 border ${
                  newHearingErrors.location
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {newHearingErrors.location && (
                <p className="text-red-500 text-xs mt-1">
                  {newHearingErrors.location}
                </p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={newHearingData.notes}
              onChange={onChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Documents (comma-separated)
            </label>
            <input
              type="text"
              name="requiredDocuments"
              value={newHearingData.requiredDocuments}
              onChange={onDocumentsChange}
              placeholder="e.g. Witness Statements, Investigation Report, Evidence List"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter document names separated by commas
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditHearing;
