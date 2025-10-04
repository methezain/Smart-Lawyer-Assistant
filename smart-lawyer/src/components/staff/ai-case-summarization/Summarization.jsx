import React from "react";
import useSummarization from "./hooks/useSummarization";
import InputSection from "./components/InputSection";
import SummaryResult from "./components/SummaryResult";
import PreviousSummaries from "./components/PreviousSummaries";

const SummarizationContainer = () => {
  const {
    // state
    text,
    uploadedFile,
    summary,
    inputMode,
    uploadError,
    selectedSummary,
    isUploading,
    uploadApiError,
    allSummaries,
    fileInputRef,
    // actions
    setInputMode,
    setSelectedSummary,
    handleTextChange,
    handleFileUpload,
    handleGenerateSummary,
    handleClear,
    handleCopy,
    handleViewSummary,
    calculateReduction,
  } = useSummarization();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Main column */}
      <div className="lg:col-span-8 space-y-4">
        {/* Input card */}
        <InputSection
          fileInputRef={fileInputRef}
          uploadedFile={uploadedFile}
          text={text}
          isUploading={isUploading}
          inputMode={inputMode}
          uploadError={uploadError}
          uploadApiError={uploadApiError}
          onClear={handleClear}
          onFileUpload={handleFileUpload}
          onTextChange={handleTextChange}
          onGenerate={handleGenerateSummary}
          onModeChange={setInputMode}
        />

        {selectedSummary ? (
          <SummaryResult
            summary={selectedSummary}
            onCopy={handleCopy}
            calculateReduction={calculateReduction}
            variant="selected"
            onClose={() => setSelectedSummary(null)}
          />
        ) : (
          <>
            <SummaryResult
              summary={summary}
              onCopy={handleCopy}
              calculateReduction={calculateReduction}
              variant="current"
            />
            {!summary && (
              <div className="flex flex-col items-center justify-center text-center min-h-60 ">
                <span
                  className="ri-file-text-line text-8xl text-gray-400 mb-2"
                  aria-hidden="true"
                ></span>
                <p className="font-semibold text-gray-600">No summary yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Upload a PDF or paste text, then click Generate Summary.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Aside column */}
      <div className="lg:col-span-4 lg:sticky lg:top-0 lg:bottom-0 self-start">
        <PreviousSummaries
          allSummaries={allSummaries}
          onView={handleViewSummary}
          onCopy={handleCopy}
          standalone
        />
      </div>
    </div>
  );
};

export default SummarizationContainer;
