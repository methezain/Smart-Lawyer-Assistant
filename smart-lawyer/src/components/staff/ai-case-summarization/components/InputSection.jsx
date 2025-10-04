import React from "react";
import PropTypes from "prop-types";

const InputSection = ({
  fileInputRef,
  uploadedFile,
  text,
  inputMode,
  isUploading,
  uploadError,
  uploadApiError,
  onClear,
  onFileUpload,
  onTextChange,
  onGenerate,
  onModeChange,
}) => {
  const disableGenerate =
    isUploading || (inputMode === "file" ? !uploadedFile : !text?.trim());
  const hasAnyInput = Boolean(uploadedFile) || Boolean(text?.trim());

  return (
    <div className="space-y-4">
      {/* Header: mode + actions */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-[7px]">
        {/* Mode Toggle */}
        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 text-xs shadow-sm">
          {[
            { key: "file", label: "Upload PDF", icon: "ri-upload-2-line" },
            { key: "text", label: "Paste Text", icon: "ri-text" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => onModeChange(opt.key)}
              className={`flex items-center gap-2 px-3 py-1 rounded-xl transition-all ${
                inputMode === opt.key
                  ? "bg-white text-gray-900 shadow"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              type="button"
            >
              <i className={`${opt.icon} text-base`}></i>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {hasAnyInput && (
            <button
              onClick={onClear}
              type="button"
              className="px-2 py-1 text-xs border border-red-200 rounded-xl text-red-700 hover:bg-red-50 active:scale-[0.99] transition-all flex items-center gap-2"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          )}

          <button
            onClick={onGenerate}
            disabled={disableGenerate}
            type="button"
            className="px-4 py-2.5 text-xs rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <i className="ri-file-reduce-line"></i>
                <span>
                  {inputMode === "file" ? "Summarize PDF" : "Summarize Text"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {inputMode === "file" && (
        <FileUploadPanel
          fileInputRef={fileInputRef}
          uploadedFile={uploadedFile}
          onFileUpload={onFileUpload}
          isUploading={isUploading}
        />
      )}

      {/* Text mode */}
      {inputMode === "text" && (
        <textarea
          value={text}
          onChange={onTextChange}
          className="w-full border text-xs bg-white shadow-sm border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[205px]"
          placeholder="Paste the text to summarize..."
        />
      )}

      {uploadError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-xs">{uploadError}</p>
        </div>
      )}

      {uploadApiError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-xs">
            API Error: {uploadApiError.error || "Failed to process request"}
          </p>
        </div>
      )}
    </div>
  );
};

export default InputSection;

// --- File Upload Panel (extracted for clarity) ---
const FileUploadPanel = ({
  fileInputRef,
  uploadedFile,
  onFileUpload,
  isUploading,
}) => {
  const [dragActive, setDragActive] = React.useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (dragActive) setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (isUploading) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      const syntheticEvent = { target: { files: [file] } };
      onFileUpload(syntheticEvent);
    }
  };

  return (
    <div
      className={`mb-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        dragActive
          ? "border-emerald-400 bg-emerald-50"
          : "border-gray-300 bg-gray-50 hover:bg-gray-100"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
      }}
    >
      <i
        className="ri-upload-cloud-2-line text-4xl text-gray-400 mb-2"
        aria-hidden="true"
      ></i>
      <h3 className="font-medium mb-2 text-sm">Upload PDF</h3>
      {!uploadedFile && (
        <p className="text-xs text-gray-500 mb-4">
          Drag & drop your PDF here, or click to browse
        </p>
      )}

      <input
        type="file"
        id="summaryPdfUpload"
        ref={fileInputRef}
        className="hidden"
        accept="application/pdf,.pdf"
        onChange={onFileUpload}
        disabled={isUploading}
      />

      <label
        htmlFor="summaryPdfUpload"
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 cursor-pointer inline-block shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {uploadedFile ? "Change File" : "Browse File"}
      </label>

      {uploadedFile && (
        <div className="mt-4 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-xs text-gray-600 max-w-full">
            <i className="ri-file-pdf-line text-emerald-600"></i>
            <span className="truncate max-w-[14rem]" title={uploadedFile.name}>
              {uploadedFile.name}
            </span>
            <span className="text-gray-400">
              {(uploadedFile.size / 1024).toFixed(1)} KB
            </span>
          </div>
          <p className="text-[10px] text-gray-400">
            Only PDF files are supported (max ~10MB)
          </p>
        </div>
      )}

      {!uploadedFile && (
        <p className="text-[10px] text-gray-400 mt-4">
          Supported: PDF (Max ~10MB)
        </p>
      )}
    </div>
  );
};

FileUploadPanel.propTypes = {
  fileInputRef: PropTypes.object.isRequired,
  uploadedFile: PropTypes.instanceOf(File),
  onFileUpload: PropTypes.func.isRequired,
  isUploading: PropTypes.bool,
};

InputSection.propTypes = {
  fileInputRef: PropTypes.object.isRequired,
  uploadedFile: PropTypes.instanceOf(File),
  text: PropTypes.string,
  inputMode: PropTypes.oneOf(["file", "text"]).isRequired,
  isUploading: PropTypes.bool,
  uploadError: PropTypes.string,
  uploadApiError: PropTypes.any,
  onClear: PropTypes.func.isRequired,
  onFileUpload: PropTypes.func.isRequired,
  onTextChange: PropTypes.func.isRequired,
  onGenerate: PropTypes.func.isRequired,
  onModeChange: PropTypes.func.isRequired,
};
