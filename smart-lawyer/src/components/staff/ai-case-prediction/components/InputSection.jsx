import React from "react";
import PropTypes from "prop-types";

const InputSection = ({
  selectedFiles,
  isUploading,
  fileInputRef,
  onFileChange,
  onRemoveFile,
  onClear,
  onUpload,
}) => {
  return (
    <div className="space-y-4">
      <FileDropZone
        fileInputRef={fileInputRef}
        onFileChange={onFileChange}
        isUploading={isUploading}
        selectedFiles={selectedFiles}
        onRemoveFile={onRemoveFile}
        onClear={onClear}
        onUpload={onUpload}
      />
    </div>
  );
};

const FileDropZone = ({
  fileInputRef,
  onFileChange,
  isUploading,
  selectedFiles,
  onRemoveFile,
  onClear,
  onUpload,
}) => {
  const [dragActive, setDragActive] = React.useState(false);
  const disableUpload = isUploading || !selectedFiles.length;

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
    const files = e.dataTransfer?.files;
    if (files?.length) {
      const syntheticEvent = { target: { files } };
      onFileChange(syntheticEvent);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 bg-gray-50 hover:bg-gray-100"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <button
        type="button"
        className="w-full focus:outline-none"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
      >
        <i
          className="ri-upload-cloud-2-line text-4xl text-gray-400 mb-2"
          aria-hidden="true"
        ></i>
        <h3 className="font-medium mb-2 text-sm">Upload Documents</h3>
        <p className="text-xs text-gray-500 mb-4">
          Drag and drop files here, or click to browse
        </p>
      </button>

      <input
        type="file"
        id="predictionUpload"
        multiple
        ref={fileInputRef}
        className="hidden"
        accept="application/pdf,.pdf"
        onChange={onFileChange}
        disabled={isUploading}
      />
      <button
        type="button"
        aria-controls="predictionUpload"
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 cursor-pointer inline-block shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      >
        {selectedFiles.length ? "Add More" : "Browse Files"}
      </button>

      <p className="text-[10px] text-gray-400 mt-4">
        Supported: PDF (Max ~10MB each)
      </p>

      {selectedFiles.length > 0 && (
        <>
          <div className="mt-4 space-y-2 max-w-md mx-auto text-left">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${file.lastModified}`}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <i className="ri-file-pdf-line text-red-500 text-base"></i>
                  <span className="truncate max-w-[12rem]" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(index);
                  }}
                  className="text-white w-7 h-7 flex items-center justify-center text-sm rounded-xl bg-red-500 transition-colors"
                  aria-label="Remove file"
                >
                  <i className="ri-close-line mt-0.5"></i>
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center">
            <button
              type="button"
              disabled={disableUpload}
              onClick={(e) => {
                e.stopPropagation();
                onUpload();
              }}
              className="px-5 py-2.5 text-xs rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <i className="ri-upload-cloud-2-line"></i>
                  <span>Upload & Predict</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

InputSection.propTypes = {
  selectedFiles: PropTypes.array.isRequired,
  isUploading: PropTypes.bool,
  fileInputRef: PropTypes.object.isRequired,
  onFileChange: PropTypes.func.isRequired,
  onRemoveFile: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
};

FileDropZone.propTypes = {
  fileInputRef: PropTypes.object.isRequired,
  onFileChange: PropTypes.func.isRequired,
  isUploading: PropTypes.bool,
  selectedFiles: PropTypes.array.isRequired,
  onRemoveFile: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
};

export default InputSection;
