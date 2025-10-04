import { useRef, useState } from "react";
import {
  useUploadAndSummarizePdfMutation,
  useGetSummariesQuery,
  useSummarizeTextMutation,
} from "../../../../reduxstore/services/SummarizationAPI";

export function useSummarization() {
  const fileInputRef = useRef(null);
  const [text, setText] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [summary, setSummary] = useState(null);
  // input mode: 'file' or 'text'
  const [inputMode, setInputMode] = useState("file");
  const [uploadError, setUploadError] = useState("");
  const [selectedSummary, setSelectedSummary] = useState(null);

  const [
    uploadAndSummarizePdf,
    { isLoading: isUploadingPdf, error: uploadApiError },
  ] = useUploadAndSummarizePdfMutation();
  const [summarizeText, { isLoading: isUploadingText }] =
    useSummarizeTextMutation();

  const { data: allSummaries = [], refetch: refetchSummaries } =
    useGetSummariesQuery(undefined, {
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    });

  const handleTextChange = (e) => {
    setText(e.target.value);
    setSummary(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploadedFile(null);
    setSummary(null);

    if (file.type !== "application/pdf") {
      setUploadError("Please upload a PDF file only");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size should be less than 10MB");
      return;
    }

    setUploadedFile(file);
  };

  const handleGenerateSummary = async () => {
    try {
      setUploadError("");
      if (inputMode === "file") {
        if (!uploadedFile) {
          setUploadError("Please upload a PDF file first");
          return;
        }
        const formData = new FormData();
        formData.append("file", uploadedFile);
        const result = await uploadAndSummarizePdf(formData).unwrap();
        setSummary({
          text: result.case_summary,
          originalLength:
            result.pdf_text_length ?? result.pdf_text?.length ?? 0,
          summaryLength: result.case_summary?.length || 0,
          type: "pdf",
          timestamp: new Date().toISOString(),
          case_id: result.case_id,
          filename: uploadedFile.name,
        });
      } else {
        const cleanText = (text || "").trim();
        if (!cleanText) {
          setUploadError("Please paste some text first");
          return;
        }
        const result = await summarizeText(cleanText).unwrap();
        setSummary({
          text: result.case_summary,
          originalLength: result.pdf_text_length ?? cleanText.length,
          summaryLength: result.case_summary?.length || 0,
          type: "text",
          timestamp: new Date().toISOString(),
          case_id: result.case_id,
          filename: "Text Input",
        });
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      setUploadError(
        error.error || error.data?.message || "Failed to generate summary"
      );
    }
  };

  const handleClear = () => {
    setText("");
    setUploadedFile(null);
    setSummary(null);
    setSelectedSummary(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopy = (textToCopy) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    alert("Summary copied to clipboard!");
  };

  const handleViewSummary = (summaryItem) => {
    setSelectedSummary({
      text: summaryItem.case_summary,
      originalLength: summaryItem.pdf_text?.length || 0,
      summaryLength: summaryItem.case_summary?.length || 0,
      type: "previous",
      timestamp: new Date().toISOString(),
      case_id: summaryItem.case_id,
      filename: summaryItem.filename,
    });
    setSummary(null);
  };

  const calculateReduction = (s) => {
    const source = s ?? summary;
    if (!source?.originalLength) return 0;
    return Math.round(
      ((source.originalLength - source.summaryLength) / source.originalLength) *
        100
    );
  };

  return {
    // state
    text,
    uploadedFile,
    summary,
    inputMode,
    uploadError,
    selectedSummary,
    isUploading: isUploadingPdf || isUploadingText,
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
    refetchSummaries,
  };
}

export default useSummarization;
