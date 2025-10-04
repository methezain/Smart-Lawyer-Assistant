import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  useGetHearingAttachmentsQuery,
  useGetHearingAttachmentCountQuery,
  useUploadHearingAttachmentMutation,
  useDeleteHearingAttachmentMutation,
} from "../../../reduxstore/services/HearingsManagementAPI";

const Attachments = ({ hearing, onClose, onViewCase }) => {
  // no local list state; rely on API queries
  const hearingId = hearing?.id;
  const token = useSelector((s) => s?.auth?.token);
  const API_BASE = "http://localhost:8002/api/v1"; // TODO: centralize in config if needed

  const { data: listData, refetch: refetchList } =
    useGetHearingAttachmentsQuery(hearingId, { skip: !hearingId });
  const { data: countData, refetch: refetchCount } =
    useGetHearingAttachmentCountQuery(hearingId, { skip: !hearingId });
  const [uploadAttachment] = useUploadHearingAttachmentMutation();
  const [deleteAttachment] = useDeleteHearingAttachmentMutation();

  const attachments = useMemo(() => listData?.data || [], [listData]);
  const count = countData?.data ?? attachments.length;

  // Preview modal state
  const [preview, setPreview] = useState({
    open: false,
    url: null,
    mime: null,
    name: null,
    attachment: null,
    html: null,
    loading: false,
    error: null,
  });

  // Cleanup blob URL on unmount or close
  useEffect(() => {
    return () => {
      if (preview.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview.url]);

  const handleView = useCallback(
    async (attachment) => {
      if (!attachment?.id || !hearingId) return;
      try {
        setPreview((p) => ({ ...p, open: true, loading: true, error: null }));
        const res = await fetch(
          `${API_BASE}/hearings/${hearingId}/attachments/${attachment.id}/view`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (!res.ok) throw new Error(`Failed to load file: ${res.status}`);
        const blob = await res.blob();
        const mime =
          res.headers.get("content-type") ||
          attachment.file_type ||
          "application/octet-stream";
        const lowerName = (attachment.original_filename || "").toLowerCase();
        if (
          lowerName.endsWith(".docx") ||
          mime ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          // Convert DOCX to HTML using mammoth (browser build)
          const arrayBuffer = await blob.arrayBuffer();
          try {
            const mammoth = await import("mammoth/mammoth.browser");
            const result = await mammoth.convertToHtml({ arrayBuffer });
            setPreview((p) => ({
              ...p,
              open: true,
              url: null,
              mime: "text/html",
              name: attachment.original_filename,
              attachment,
              html: result.value,
              loading: false,
              error: null,
            }));
          } catch {
            setPreview((p) => ({
              ...p,
              loading: false,
              error: "Unable to preview DOCX. Please download to view.",
            }));
          }
        } else {
          const url = URL.createObjectURL(blob);
          // Revoke previous
          setPreview((p) => {
            if (p.url && p.url !== url) URL.revokeObjectURL(p.url);
            return {
              open: true,
              url,
              mime,
              name: attachment.original_filename,
              attachment,
              html: null,
              loading: false,
              error: null,
            };
          });
        }
      } catch (err) {
        setPreview((p) => ({
          ...p,
          loading: false,
          error: err?.message || "Unable to preview file",
        }));
      }
    },
    [API_BASE, hearingId, token]
  );

  const handleDownload = useCallback(
    async (attachment) => {
      if (!attachment?.id || !hearingId) return;
      try {
        const res = await fetch(
          `${API_BASE}/hearings/${hearingId}/attachments/${attachment.id}/download`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = attachment.original_filename || "download";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err) {
        console.error("Download failed", err);
      }
    },
    [API_BASE, hearingId, token]
  );

  // Map MIME/filename to a simple label: 'pdf' or 'doc'
  const getSimpleType = (att) => {
    const name = (att?.original_filename || "").toLowerCase();
    const mime = (att?.file_type || "").toLowerCase();
    if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
    if (
      mime.includes("word") ||
      mime.includes("msword") ||
      name.endsWith(".doc") ||
      name.endsWith(".docx")
    )
      return "doc";
    return "";
  };

  if (!hearing) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Hearing Attachments {typeof count === "number" && `(${count})`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="mb-4">
          <h3 className="font-medium text-lg">{hearing.caseTitle}</h3>
          <p className="text-sm text-gray-500">
            <button
              onClick={() => onViewCase(hearing)}
              className="text-blue-600 hover:underline focus:outline-none"
            >
              {hearing.caseNumber}
            </button>{" "}
            - {hearing.date} ({hearing.time})
          </p>
        </div>

        <div className="mb-6 border border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-center">
          <i className="ri-upload-cloud-2-line text-4xl text-gray-400 mb-2"></i>
          <h3 className="font-medium mb-2">Upload Documents</h3>
          <p className="text-sm text-gray-500 mb-4">
            Drag and drop files here, or click to browse
          </p>
          <input
            type="file"
            id="fileUpload"
            className="hidden"
            multiple
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              // Upload sequentially to preserve order
              for (const file of files) {
                try {
                  await uploadAttachment({ hearingId, file }).unwrap();
                } catch (err) {
                  console.error("Upload failed", err);
                }
              }
              await Promise.all([refetchList(), refetchCount()]);
              e.target.value = "";
            }}
          />
          <label
            htmlFor="fileUpload"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 cursor-pointer inline-block"
          >
            Browse Files
          </label>
          <p className="text-xs text-gray-500 mt-4">
            Supported file types: PDF, DOCX, JPG, PNG (Max 10MB per file)
          </p>
        </div>

        <div>
          <h3 className="font-medium mb-4">Current Attachments</h3>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider grid grid-cols-12">
              <div className="col-span-6">Document Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-gray-200">
              {attachments.length > 0 ? (
                attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="px-4 py-3 text-sm grid grid-cols-12 items-center"
                  >
                    <div className="col-span-6 flex items-center">
                      <i
                        className={`${
                          (attachment.file_type || "")
                            .toLowerCase()
                            .includes("pdf")
                            ? "ri-file-pdf-line text-red-500"
                            : (attachment.file_type || "")
                                .toLowerCase()
                                .includes("doc")
                            ? "ri-file-word-line text-blue-500"
                            : (attachment.file_type || "")
                                .toLowerCase()
                                .includes("image") ||
                              ["png", "jpg", "jpeg"].some((ext) =>
                                (attachment.original_filename || "")
                                  .toLowerCase()
                                  .endsWith(ext)
                              )
                            ? "ri-image-line text-green-500"
                            : "ri-file-line text-gray-500"
                        } mr-2 text-xl`}
                      ></i>
                      <span className="truncate w-64">
                        {attachment.original_filename}
                      </span>
                    </div>
                    <div className="col-span-2">
                      {getSimpleType(attachment)}
                    </div>
                    <div className="col-span-2">
                      {Math.round((attachment.file_size || 0) / 1024)} KB
                    </div>
                    <div className="col-span-2 text-right space-x-2">
                      <button
                        className="text-gray-700 hover:text-gray-900"
                        title="View"
                        onClick={() => handleView(attachment)}
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        title="Download"
                        onClick={() => handleDownload(attachment)}
                      >
                        <i className="ri-download-line"></i>
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                        onClick={async () => {
                          try {
                            await deleteAttachment({
                              hearingId,
                              attachmentId: attachment.id,
                            }).unwrap();
                            await Promise.all([refetchList(), refetchCount()]);
                          } catch (err) {
                            console.error("Delete failed", err);
                          }
                        }}
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-500">
                  <i className="ri-file-list-3-line text-2xl mb-2 block"></i>
                  <p className="text-sm">
                    No attachments have been uploaded yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            Done
          </button>
        </div>
      </div>
      {/* Preview Modal */}
      {preview.open && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-xl overflow-hidden shadow-xl flex flex-col">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="ri-file-eye-line text-gray-500"></i>
                <span className="font-medium text-gray-800 truncate max-w-[60vw]">
                  {preview.name || "Preview"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                  onClick={() =>
                    preview.attachment && handleDownload(preview.attachment)
                  }
                  disabled={!preview.attachment}
                  title={
                    preview.attachment
                      ? "Download"
                      : "Use Download in the list below"
                  }
                >
                  <i className="ri-download-line mr-1"></i> Download
                </button>
                <button
                  className="p-2 rounded hover:bg-gray-100"
                  onClick={() => {
                    if (preview.url) URL.revokeObjectURL(preview.url);
                    setPreview({
                      open: false,
                      url: null,
                      mime: null,
                      name: null,
                      attachment: null,
                      loading: false,
                      error: null,
                      html: null,
                    });
                  }}
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-50">
              {preview.loading ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <i className="ri-loader-4-line animate-spin mr-2"></i> Loading
                  preview...
                </div>
              ) : preview.error ? (
                <div className="h-full flex items-center justify-center text-red-600">
                  <i className="ri-error-warning-line mr-2"></i> {preview.error}
                </div>
              ) : preview.url ? (
                preview.mime?.startsWith("image/") ? (
                  <div className="p-4 flex items-center justify-center">
                    <img
                      src={preview.url}
                      alt={preview.name || "preview"}
                      className="max-h-[78vh] object-contain"
                    />
                  </div>
                ) : preview.mime === "application/pdf" ||
                  preview.name?.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    title="Document Preview"
                    src={preview.url}
                    className="w-full h-[78vh] bg-white"
                  />
                ) : preview.mime === "text/html" && preview.html ? (
                  <div className="w-full h-[78vh] bg-white overflow-auto">
                    <div
                      className="prose max-w-none p-6"
                      dangerouslySetInnerHTML={{ __html: preview.html }}
                    />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 p-8 text-center">
                    <i className="ri-file-3-line text-5xl mb-3"></i>
                    <p className="font-medium mb-1">Preview not available</p>
                    <p className="text-sm">
                      Use the Download action to view this file.
                    </p>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attachments;
