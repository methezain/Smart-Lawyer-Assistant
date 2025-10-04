import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { estimatePdfPageCount, getTypeFromName } from "../utils/file";

export function useFileManager() {
  const [files, setFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(new Set());
  const fileInputRef = useRef(null);

  // Prevent full-page reload on unhandled errors/rejections inside this feature area
  useEffect(() => {
    const handleError = (event) => {
      console.error("Caught error:", event.error);
      event.preventDefault();
    };
    const handleUnhandledRejection = (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      setFiles([]);
    };
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = {};
    files.forEach((file) => {
      if (file.status === "completed") {
        counts[file.class] = (counts[file.class] || 0) + 1;
      }
    });
    return counts;
  }, [files]);

  const filteredFiles = useMemo(() => {
    if (selectedCategory === "all") return files;
    return files.filter((file) => file.class === selectedCategory);
  }, [files, selectedCategory]);

  const handleFileUpload = useCallback(async (event) => {
    try {
      setIsLoading(true);
      const fileList = Array.from(event.target.files || []);
      // Only allow PDFs
      const pdfOnly = fileList.filter(
        (f) => (f.type || getTypeFromName(f.name)) === "application/pdf"
      );
      if (pdfOnly.length !== fileList.length) {
        console.warn("Some files were ignored because only PDF is allowed.");
      }
      const maxFiles = 10;
      const filesToProcess = pdfOnly.slice(0, maxFiles);

      const newFiles = await Promise.all(
        filesToProcess.map(async (file, index) => {
          try {
            const type = "application/pdf";
            const pages = await estimatePdfPageCount(file);
            return {
              id: Date.now() + Math.random() + index,
              name: file.name,
              type,
              pages,
              date: new Date().toLocaleString(),
              class: "Processing...",
              status: "pending",
              fileObject: file,
            };
          } catch (err) {
            console.error(`Error processing file ${file.name}:`, err);
            return null;
          }
        })
      );

      const valid = newFiles.filter(Boolean);
      setFiles((prev) => [...valid, ...prev]);
      if (event?.target) event.target.value = ""; // allow re-upload same file
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleSelectAll = useCallback(
    (e, list = filteredFiles) => {
      if (e.target.checked) {
        setSelectedFiles(list.map((f) => f.id));
      } else {
        setSelectedFiles([]);
      }
    },
    [filteredFiles]
  );

  const toggleSelectFile = useCallback((e, fileId) => {
    if (e.target.checked) {
      setSelectedFiles((prev) => [...prev, fileId]);
    } else {
      setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
    }
  }, []);

  const handleDelete = useCallback((fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
  }, []);

  const handleBatchDelete = useCallback(() => {
    if (!selectedFiles.length) return;
    setFiles((prev) => prev.filter((f) => !selectedFiles.includes(f.id)));
    setSelectedFiles([]);
  }, [selectedFiles]);

  const replaceFileProps = useCallback((fileId, patch) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, ...patch } : f))
    );
  }, []);

  return {
    files,
    setFiles,
    selectedCategory,
    setSelectedCategory,
    selectedFiles,
    setSelectedFiles,
    categoryCounts,
    filteredFiles,
    isLoading,
    setIsLoading,
    processingFiles,
    setProcessingFiles,
    fileInputRef,
    handleFileUpload,
    toggleSelectAll,
    toggleSelectFile,
    handleDelete,
    handleBatchDelete,
    replaceFileProps,
  };
}
