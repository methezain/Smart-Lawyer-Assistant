import React from "react";
import PropTypes from "prop-types";

const EditJudgment = ({
  judgment,
  form,
  errors,
  onClose,
  onChange,
  onFileChange,
  onSubmit,
}) => {
  if (!judgment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Edit Judgment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Court*
            </label>
            <input
              type="text"
              name="court"
              value={form.court || ""}
              onChange={onChange}
              className={`w-full px-3 py-2 border ${
                errors.court ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
            {errors.court && (
              <p className="text-red-500 text-xs mt-1">{errors.court}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judge*
            </label>
            <input
              type="text"
              name="judge_name"
              value={form.judge_name || ""}
              onChange={onChange}
              className={`w-full px-3 py-2 border ${
                errors.judge_name ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
            {errors.judge_name && (
              <p className="text-red-500 text-xs mt-1">{errors.judge_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judgment Date*
            </label>
            <input
              type="date"
              name="judgment_date"
              value={form.judgment_date || ""}
              onChange={onChange}
              className={`w-full px-3 py-2 border ${
                errors.judgment_date ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
            {errors.judgment_date && (
              <p className="text-red-500 text-xs mt-1">
                {errors.judgment_date}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <input
              type="text"
              name="status"
              value={form.status || ""}
              onChange={onChange}
              placeholder="Allowed, Dismissed, PartlyAllowed, Remanded, ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Details
            </label>
            <input
              type="text"
              name="status_details"
              value={form.status_details || ""}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Summary
            </label>
            <textarea
              name="summary"
              value={form.summary || ""}
              onChange={onChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Points (one per line)
            </label>
            <textarea
              name="key_points"
              value={form.key_points || ""}
              onChange={onChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Replace PDF (optional)
            </label>
            <input type="file" accept=".pdf" onChange={onFileChange} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
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

EditJudgment.propTypes = {
  judgment: PropTypes.object,
  form: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onFileChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default EditJudgment;
