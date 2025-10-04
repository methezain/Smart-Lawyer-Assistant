import React, { useCallback, useEffect, useState } from "react";
import { useFileManager } from "./hooks/useFileManager";
import { useClassifier } from "./hooks/useClassifier";
import EmptyState from "./components/EmptyState";
import FilesTable from "./components/FilesTable";
import Toolbar from "./components/Toolbar";

export default function Classification() {
  const {
    files,
    setFiles,
    selectedCategory,
    setSelectedCategory,
    selectedFiles,
    categoryCounts,
    filteredFiles,
    isLoading,
    processingFiles,
    setProcessingFiles,
    fileInputRef,
    handleFileUpload,
    toggleSelectAll,
    toggleSelectFile,
    handleDelete,
    handleBatchDelete,
    replaceFileProps,
  } = useFileManager();

  const { handleClassify } = useClassifier({
    files,
    replaceFileProps,
    processingFiles,
    setProcessingFiles,
  });

  const [editingFile, setEditingFile] = useState(null);
  const [editName, setEditName] = useState("");
  const [batchEditName, setBatchEditName] = useState("");

  // Client-side pagination for FilesTable (mirror ClientTable.jsx defaults)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const total = filteredFiles.length;
  const startIndex = (Math.max(1, page) - 1) * Math.max(1, pageSize);
  const pagedFiles = filteredFiles.slice(startIndex, startIndex + pageSize);

  // Reset to first page when filter set or file list changes
  useEffect(() => {
    setPage(1);
  }, [filteredFiles.length]);

  const handleEdit = useCallback((file) => {
    setEditingFile(file.id);
    setEditName(file.name);
  }, []);

  const handleSaveEdit = useCallback(
    (fileId) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, name: editName } : f))
      );
      setEditingFile(null);
      setEditName("");
    },
    [editName, setFiles]
  );

  const handleBatchRename = useCallback(() => {
    if (!batchEditName.trim()) return;
    setFiles((prev) =>
      prev.map((f) =>
        selectedFiles.includes(f.id) ? { ...f, name: batchEditName } : f
      )
    );
    setBatchEditName("");
  }, [batchEditName, selectedFiles, setFiles]);

  const handleUploadClick = () => fileInputRef.current?.click();

  // Auto-classify any newly added files that are pending
  useEffect(() => {
    if (!files?.length) return;
    files.forEach((f) => {
      if (f.status === "pending" && !processingFiles.has(f.id)) {
        handleClassify(f.id);
      }
    });
  }, [files, processingFiles, handleClassify]);

  return (
    <div>
      <Toolbar
        files={files}
        categoryCounts={categoryCounts}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedFiles={selectedFiles}
        filteredFiles={filteredFiles}
        batchEditName={batchEditName}
        setBatchEditName={setBatchEditName}
        onBatchRename={handleBatchRename}
        onBatchDelete={handleBatchDelete}
        isLoading={isLoading}
        fileInputRef={fileInputRef}
        onUploadClick={handleUploadClick}
        onChange={handleFileUpload}
      />
      {files.length === 0 ? (
        <EmptyState />
      ) : (
        <FilesTable
          filteredFiles={pagedFiles}
          selectedFiles={selectedFiles}
          toggleSelectAll={toggleSelectAll}
          toggleSelectFile={toggleSelectFile}
          onEdit={handleEdit}
          onSaveEdit={handleSaveEdit}
          onDelete={handleDelete}
          editName={editName}
          setEditName={setEditName}
          editingFile={editingFile}
          setEditingFile={setEditingFile}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
