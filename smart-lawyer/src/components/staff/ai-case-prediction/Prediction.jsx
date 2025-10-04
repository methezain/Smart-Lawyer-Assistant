import React from "react";
import usePrediction from "./hooks/usePrediction";
import InputSection from "./components/InputSection";
import PredictionResult from "./components/PredictionResult";
import PreviousPredictions from "./components/PreviousPredictions";

const Prediction = () => {
  const {
    selectedFiles,
    predictions,
    selectedPrediction,
    isUploading,
    isLoadingPredictions,
    fileInputRef,
    handleFileChange,
    handleUploadAndPredict,
    removeFile,
    clearFiles,
    handleViewPrediction,
    closeSelectedPrediction,
    handleCopy,
  } = usePrediction();

  const latestPrediction =
    !selectedPrediction && predictions.length
      ? predictions[predictions.length - 1]
      : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-8 space-y-4">
        <InputSection
          selectedFiles={selectedFiles}
          isUploading={isUploading}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
          onRemoveFile={removeFile}
          onClear={clearFiles}
          onUpload={handleUploadAndPredict}
        />

        {selectedPrediction ? (
          <PredictionResult
            prediction={selectedPrediction}
            variant="selected"
            onClose={closeSelectedPrediction}
            onCopy={handleCopy}
          />
        ) : (
          <>
            <PredictionResult
              prediction={latestPrediction}
              variant="current"
              onCopy={handleCopy}
            />
            {!latestPrediction && (
              <div className=" p-8 flex flex-col items-center justify-center text-center">
                <span
                  className="ri-file-chart-line text-7xl text-gray-400 mt-8 mb-2"
                  aria-hidden="true"
                ></span>
                <p className="font-semibold text-gray-600">No prediction yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Upload one or more PDF case files, then click Upload &
                  Predict.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="lg:col-span-4 lg:sticky lg:top-0 self-start">
        <PreviousPredictions
          predictions={predictions}
          loading={isLoadingPredictions}
          onView={handleViewPrediction}
          onCopy={handleCopy}
          standalone
        />
      </div>
    </div>
  );
};

export default Prediction;
