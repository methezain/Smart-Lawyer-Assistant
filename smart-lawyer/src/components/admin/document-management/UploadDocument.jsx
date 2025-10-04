import React from "react";

// Detect icon/label from the file object instead of relying on data.fileType
const detectFileMeta = (file) => {
  const name = file?.name || "";
  const mime = (file?.type || "").toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";

  const isPdf = mime === "application/pdf" || ext === "pdf";
  const isWord = mime.includes("word") || ext === "doc" || ext === "docx";
  const isExcel =
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    ext === "xls" ||
    ext === "xlsx";

  if (isPdf) {
    return {
      iconClass: "ri-file-pdf-line",
      colorClass: "text-red-500",
      typeLabel: "PDF",
    };
  }
  if (isWord) {
    return {
      iconClass: "ri-file-word-line",
      colorClass: "text-blue-500",
      typeLabel: ext === "doc" ? "DOC" : "DOCX",
    };
  }
  if (isExcel) {
    return {
      iconClass: "ri-file-excel-line",
      colorClass: "text-green-500",
      typeLabel: ext === "xls" ? "XLS" : "XLSX",
    };
  }
  return {
    iconClass: "ri-file-line",
    colorClass: "text-gray-500",
    typeLabel: ext ? ext.toUpperCase() : "FILE",
  };
};

const UploadDocument = ({
  casesData,
  data,
  errors,
  onChange,
  onFileChange,
  onRemoveFile,
  onCancel,
  onUpload,
}) => {
  const fileMeta = React.useMemo(
    () => detectFileMeta(data?.file),
    [data?.file]
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Upload Document</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Title*
            </label>
            <input
              type="text"
              name="title"
              value={data.title}
              onChange={onChange}
              placeholder="e.g. Petition for Land Acquisition Compensation"
              className={`w-full px-3 py-2 border ${
                errors.title ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Case*
            </label>
            <select
              name="caseId"
              value={data.caseId}
              onChange={onChange}
              className={`w-full px-3 py-2 border ${
                errors.caseId ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            >
              <option value="">Select a case</option>
              {casesData.map((caseItem) => (
                <option key={caseItem.id} value={caseItem.id}>
                  {caseItem.caseNumber} - {caseItem.title}
                </option>
              ))}
            </select>
            {errors.caseId && (
              <p className="text-red-500 text-xs mt-1">{errors.caseId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type*
            </label>
            <select
              name="type"
              value={data.type}
              onChange={onChange}
              className={`w-full px-3 py-2 border ${
                errors.type ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            >
              <option value="">Select a type</option>
              <option value="Petition">Petition</option>
              <option value="Memo">Memo</option>
              <option value="Report">Report</option>
              <option value="Agreement">Agreement</option>
              <option value="Contract">Contract</option>
              <option value="Other">Other</option>
            </select>
            {errors.type && (
              <p className="text-red-500 text-xs mt-1">{errors.type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Status*
            </label>
            <select
              name="status"
              value={data.status}
              onChange={onChange}
              className={`w-full px-3 py-2 border ${
                errors.status ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            >
              <option value="">Select a status</option>
              <option value="Final">Final</option>
              <option value="Draft">Draft</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Review">Awaiting Review</option>
              <option value="Rejected">Rejected</option>
            </select>
            {errors.status && (
              <p className="text-red-500 text-xs mt-1">{errors.status}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              name="description"
              value={data.description}
              onChange={onChange}
              placeholder="Enter a description for the document"
              className={`w-full px-3 py-2 border ${
                errors.description ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={data.tags}
              onChange={onChange}
              placeholder="Enter tags for the document"
              className={`w-full px-3 py-2 border ${
                errors.tags ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
            {errors.tags && (
              <p className="text-red-500 text-xs mt-1">{errors.tags}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload File*
            </label>
            {!data.file ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors bg-gray-50">
                <div className="space-y-4">
                  <div>
                    <i className="ri-file-upload-line text-4xl text-gray-400"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-700">
                      Upload Document
                    </h3>
                    <p className="text-sm text-gray-500">
                      Select a file to upload for this case
                    </p>
                  </div>
                  <div>
                    <label className="inline-block">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        onChange={onFileChange}
                        className="hidden"
                      />
                      <span className="px-6 py-3 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors font-medium">
                        <i className="ri-folder-open-line mr-2"></i>
                        Choose File
                      </span>
                    </label>
                  </div>
                  <div className="text-xs text-gray-500">
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX (Max 10MB)
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <i
                        className={`${fileMeta.iconClass} text-2xl ${fileMeta.colorClass}`}
                      ></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-700">
                        {data.file.name}
                      </p>
                      <p className="text-xs text-emerald-600">
                        {data.fileSize} • {fileMeta.typeLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      <i className="ri-check-line mr-1"></i>
                      Ready
                    </span>
                    <button
                      onClick={onRemoveFile}
                      className="text-emerald-600 hover:text-emerald-800 p-1"
                      type="button"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {errors.file && (
              <p className="text-red-500 text-xs mt-2">{errors.file}</p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onUpload}
            disabled={!data.file}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              data.file
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <i className="ri-upload-cloud-line mr-2"></i>
            {data.file ? "Upload Document" : "Select File First"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadDocument;
