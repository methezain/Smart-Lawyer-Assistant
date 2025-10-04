import { useState, useRef, useEffect, useCallback } from "react";
import {
  useUploadPdfForVerdictMutation,
  useGetAllPredictionsQuery,
} from "../../../../reduxstore/services/VerdictPredictionAPI";

/**
 * usePrediction hook
 * Manages multi-file selection, upload, predictions history, and modal selection state.
 */
export default function usePrediction() {
  const [selectedFiles, setSelectedFiles] = useState([]); // File[]
  const [currentBatchResult, setCurrentBatchResult] = useState(null); // API result of latest upload
  const [selectedPrediction, setSelectedPrediction] = useState(null); // Chosen history item
  const fileInputRef = useRef(null);

  // API hooks
  const [uploadPdfForVerdict, { isLoading: isUploading }] =
    useUploadPdfForVerdictMutation();
  const {
    data: allPredictions,
    isLoading: isLoadingPredictions,
    refetch,
  } = useGetAllPredictionsQuery();

  // Derived local list (flat list of predictions)
  const [predictions, setPredictions] = useState([]);
  useEffect(() => {
    if (allPredictions) setPredictions(allPredictions);
  }, [allPredictions]);

  // File handling
  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files || []).filter(
      (f) => f.type === "application/pdf"
    );
    setSelectedFiles(files);
  }, []);

  const removeFile = useCallback((index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleUploadAndPredict = useCallback(async () => {
    if (!selectedFiles.length) return;
    try {
      const result = await uploadPdfForVerdict(selectedFiles).unwrap();
      setCurrentBatchResult(result);
      clearFiles();
      await refetch();
    } catch (err) {
      console.error("Upload failed", err);
      // Could set an error state here
    }
  }, [selectedFiles, uploadPdfForVerdict, refetch, clearFiles]);

  const handleViewPrediction = useCallback((prediction) => {
    setSelectedPrediction(prediction);
  }, []);

  const closeSelectedPrediction = useCallback(
    () => setSelectedPrediction(null),
    []
  );

  const handleCopy = useCallback((text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
  }, []);

  return {
    // state
    selectedFiles,
    predictions,
    currentBatchResult,
    selectedPrediction,
    isUploading,
    isLoadingPredictions,
    fileInputRef,
    // actions
    handleFileChange,
    handleUploadAndPredict,
    removeFile,
    clearFiles,
    handleViewPrediction,
    closeSelectedPrediction,
    handleCopy,
    refetch,
  };
}
