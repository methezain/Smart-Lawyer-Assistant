import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  useProcessJudgmentPdfMutation,
  useCreateJudgmentMutation,
} from "../../../reduxstore/services/JudgmentsAPI";

const AddJudgment = ({
  casesData,
  existingCaseIds = [],
  initialData,
  onCancel,
  onAdd,
}) => {
  const [newJudgmentData, setNewJudgmentData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processJudgmentPdf] = useProcessJudgmentPdfMutation();
  const [createJudgment, { isLoading: creating }] = useCreateJudgmentMutation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    setNewJudgmentData({ ...newJudgmentData, [name]: value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, file: "Only PDF files are allowed" });
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setErrors({ ...errors, file: "File size must be less than 15MB" });
        return;
      }
      setUploadedFile(file);
      setErrors({ ...errors, file: "" });

      // Call OCR API and prefill fields
      try {
        setProcessing(true);
        const res = await processJudgmentPdf(file).unwrap();
        const data = res?.data || {};
        // Normalize date for HTML input (e.g., 02.07.2024 -> 2024-07-02)
        const rd = (data["Judgement Date"] || "").trim();
        const dateMatch = rd.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
        const isoDate = dateMatch
          ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
          : rd;
        const keyPointsArr = Array.isArray(data["Key Points"])
          ? data["Key Points"]
          : [];
        const ocrStatus = (data["Judgement Status"] || "").trim();
        const ocrStatusDetails = (data["Status Details"] || "").trim();
        setNewJudgmentData((prev) => ({
          ...prev,
          court: data["Court Name"] || prev.court || "",
          judgeName: data["Judge Name"] || prev.judgeName || "",
          judgmentDate: isoDate || prev.judgmentDate || "",
          summary: data["Judgement Summary"] || prev.summary || "",
          keyPoints: keyPointsArr.join("\n"),
          fullText: prev.fullText || "",
          status: ocrStatus || prev.status || "",
          statusDetails: ocrStatusDetails || prev.statusDetails || "",
        }));
      } catch (err) {
        console.error("OCR error", err);
        setErrors((prev) => ({
          ...prev,
          file: "Failed to process PDF for OCR",
        }));
      } finally {
        setProcessing(false);
      }
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setErrors({ ...errors, file: "" });
  };

  const validate = () => {
    const formErrors = {};
    if (!newJudgmentData.caseId) formErrors.caseId = "Please select a case";
    // Block duplicate judgment for same case
    if (
      newJudgmentData.caseId &&
      existingCaseIds?.includes(String(newJudgmentData.caseId))
    ) {
      formErrors.caseId = "A judgment for this case already exists";
    }
    if (!newJudgmentData.judgmentDate)
      formErrors.judgmentDate = "Judgment date is required";
    if (!newJudgmentData.judgeName)
      formErrors.judgeName = "Judge name is required";
    if (!newJudgmentData.court) formErrors.court = "Court is required";
    if (!newJudgmentData.summary && !uploadedFile)
      formErrors.summary = "Summary is required when no PDF is uploaded";
    if (!newJudgmentData.keyPoints && !uploadedFile)
      formErrors.keyPoints =
        "At least one key point is required when no PDF is uploaded";
    if (!uploadedFile && !newJudgmentData.fullText)
      formErrors.fullText = "Full text or PDF upload is required";
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const formattedKeyPoints = newJudgmentData.keyPoints
      ? newJudgmentData.keyPoints
          .split("\n")
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
      : [];

    // Map UI fields to backend payload
    const data = {
      case_id: parseInt(newJudgmentData.caseId, 10),
      court: newJudgmentData.court,
      judge_name: newJudgmentData.judgeName,
      status_details: newJudgmentData.statusDetails || null,
      judgment_date: newJudgmentData.judgmentDate,
      summary: newJudgmentData.summary || null,
      key_points: formattedKeyPoints,
      remarks: newJudgmentData.remarks || null,
    };
    // Include denormalized case meta so backend can store exact case number/title
    const selectedCase = casesData?.find(
      (c) => String(c.id) === String(newJudgmentData.caseId)
    );
    if (selectedCase) {
      data.case_number = selectedCase.caseNumber;
      data.case_title = selectedCase.title;
      data.client_id = selectedCase.client_id;
      data.client_name = selectedCase.client_name;
      data.assigned_lawyer_id = selectedCase.assigned_lawyer_id || null;
      data.assigned_lawyer_name = selectedCase.assigned_lawyer_name || null;
    }
    if (newJudgmentData.status) {
      data.status = newJudgmentData.status;
    }

    try {
      await createJudgment({ data, file: uploadedFile }).unwrap();
      onAdd?.();
    } catch (e) {
      console.error("Create judgment failed", e);
      setErrors((prev) => ({ ...prev, form: "Failed to create judgment" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add New Judgment</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Upload Judgment PDF
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-400 transition-colors">
              {!uploadedFile ? (
                <div>
                  <i className="ri-file-pdf-line text-3xl text-gray-400 mb-2"></i>
                  <p className="text-sm text-gray-500 mb-3">
                    Upload judgment PDF file (optional)
                  </p>
                  <input
                    id="pdfUpload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="pdfUpload"
                    className="px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors inline-flex items-center"
                  >
                    <i className="ri-upload-line mr-1" aria-hidden="true"></i>
                    <span>Choose PDF</span>
                  </label>
                  {processing && (
                    <div className="flex items-center gap-2 text-emerald-700 text-sm mt-3 justify-center">
                      <i
                        className="ri-loader-4-line animate-spin"
                        aria-hidden="true"
                      ></i>
                      <span className="ml-1">Processing...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center">
                    <i className="ri-file-pdf-line text-emerald-600 text-xl mr-2"></i>
                    <div className="text-left">
                      <p className="text-sm font-medium text-emerald-700">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-emerald-600">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeUploadedFile}
                    className="text-emerald-600 hover:text-emerald-800 p-1"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              )}
              {errors.file && (
                <p className="text-red-500 text-xs mt-2">{errors.file}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="caseId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Case*
              </label>
              <select
                id="caseId"
                name="caseId"
                value={newJudgmentData.caseId}
                onChange={handleInputChange}
                disabled={!casesData || casesData.length === 0}
                className={`w-full px-3 py-2 border ${
                  errors.caseId ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              >
                {!casesData || casesData.length === 0 ? (
                  <option value="">No active cases available</option>
                ) : (
                  <>
                    <option value="">-- Select a Case --</option>
                    {casesData.map((caseItem) => {
                      const used = existingCaseIds?.includes(
                        String(caseItem.id)
                      );
                      return (
                        <option
                          key={caseItem.id}
                          value={caseItem.id}
                          disabled={used}
                        >
                          {caseItem.caseNumber} - {caseItem.title}
                          {used ? " (already has judgment)" : ""}
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
              {errors.caseId && (
                <p className="text-red-500 text-xs mt-1">{errors.caseId}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Judgment Status
              </label>
              <input
                type="text"
                disabled
                id="status"
                name="status"
                value={newJudgmentData.status || ""}
                onChange={handleInputChange}
                placeholder="e.g. Allowed, Dismissed, PartlyAllowed"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="court"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Court*
              </label>
              <input
                type="text"
                disabled
                id="court"
                name="court"
                value={newJudgmentData.court}
                onChange={handleInputChange}
                placeholder="e.g. Supreme Court of Pakistan"
                className={`w-full px-3 py-2 border ${
                  errors.court ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {errors.court && (
                <p className="text-red-500 text-xs mt-1">{errors.court}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="judgeName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Judge/Bench*
              </label>
              <input
                type="text"
                disabled
                id="judgeName"
                name="judgeName"
                value={newJudgmentData.judgeName}
                onChange={handleInputChange}
                placeholder="e.g. Hon. Justice Syed Mansoor Ali Shah"
                className={`w-full px-3 py-2 border ${
                  errors.judgeName ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {errors.judgeName && (
                <p className="text-red-500 text-xs mt-1">{errors.judgeName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="statusDetails"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status Details
              </label>
              <input
                type="text"
                disabled
                id="statusDetails"
                name="statusDetails"
                value={newJudgmentData.statusDetails || ""}
                onChange={handleInputChange}
                placeholder="Why the judgment is Favorable/Unfavorable, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="judgmentDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Judgment Date*
              </label>
              <input
                type="date"
                disabled
                id="judgmentDate"
                name="judgmentDate"
                value={newJudgmentData.judgmentDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${
                  errors.judgmentDate ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {errors.judgmentDate && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.judgmentDate}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="summary"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Summary {!uploadedFile && "*"}
            </label>
            <textarea
              id="summary"
              disabled
              name="summary"
              value={newJudgmentData.summary}
              onChange={handleInputChange}
              rows="2"
              placeholder={
                uploadedFile
                  ? "Will be extracted from PDF if left empty"
                  : "Provide a brief summary of the judgment"
              }
              className={`w-full px-3 py-2 border ${
                errors.summary ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
            {errors.summary && (
              <p className="text-red-500 text-xs mt-1">{errors.summary}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="keyPoints"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Key Points {!uploadedFile && "*"}
            </label>
            <textarea
              id="keyPoints"
              disabled
              name="keyPoints"
              value={newJudgmentData.keyPoints}
              onChange={handleInputChange}
              rows="3"
              placeholder={
                uploadedFile
                  ? "Will be extracted from PDF if left empty (one per line)"
                  : "Enter key points, one per line"
              }
              className={`w-full px-3 py-2 border ${
                errors.keyPoints ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
            {errors.keyPoints && (
              <p className="text-red-500 text-xs mt-1">{errors.keyPoints}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="remarks"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Remarks & Additional Notes
            </label>
            <textarea
              id="remarks"
              name="remarks"
              value={newJudgmentData.remarks}
              onChange={handleInputChange}
              rows="2"
              placeholder="Additional comments, observations, or follow-up actions"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>

          {uploadedFile && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-700">
                <i className="ri-information-line mr-2"></i>
                <strong>Note:</strong> When a PDF is uploaded, the system will
                automatically extract content for empty fields. You can still
                override by manually filling the fields above.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={creating}
              className={`px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 ${
                creating ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <i className="ri-add-line mr-1"></i>
              {creating ? "Saving..." : "Add Judgment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddJudgment;

AddJudgment.propTypes = {
  casesData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      caseNumber: PropTypes.string,
      title: PropTypes.string,
    })
  ).isRequired,
  existingCaseIds: PropTypes.arrayOf(PropTypes.string),
  initialData: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  onAdd: PropTypes.func,
};
