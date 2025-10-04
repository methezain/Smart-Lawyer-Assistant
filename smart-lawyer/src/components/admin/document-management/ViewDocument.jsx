import React from "react";
import { useSelector } from "react-redux";
import { DOCUMENTS_BASE_URL } from "../../../reduxstore/services/DocumentsAPI";

const ViewDocument = ({ document, onBack, formatDate }) => {
  const token = useSelector((s) => s?.auth?.token);
  if (!document) return null;
  const docId = document._raw?.id || document.id;

  const fetchBlob = async (endpoint) => {
    const res = await fetch(
      `${DOCUMENTS_BASE_URL}/documents/${docId}/${endpoint}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    if (!res.ok) throw new Error(`Failed to ${endpoint}`);
    return await res.blob();
  };

  const handleDownload = async () => {
    try {
      const blob = await fetchBlob("download");
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      const ft = document.fileType?.toLowerCase() || "";
      const ext = ft.includes("pdf")
        ? ".pdf"
        : ft.includes("docx")
        ? ".docx"
        : ft.includes("doc")
        ? ".doc"
        : ft.includes("xlsx")
        ? ".xlsx"
        : ft.includes("xls")
        ? ".xls"
        : "";
      a.href = url;
      a.download = `${document.title || "document"}${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Download failed");
    }
  };

  const handleOpen = async () => {
    try {
      const blob = await fetchBlob("view");
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      console.error(e);
      alert("Open failed");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{document.title}</h2>
          <p className="text-sm text-blue-600">
            {document.caseNumber} - {document.caseTitle}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Back to List
          </button>
          {/* <button
            onClick={handleDownload}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            <i className="ri-download-line mr-1"></i> Download
          </button> */}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-sm text-gray-500 mb-1">Client</p>
                <p className="font-medium">
                  {document.clientName
                    ? `${document.clientName} (${document.clientId ?? "-"})`
                    : "—"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500 mb-1">Assigned Lawyer</p>
                <p className="font-medium">
                  {document.assignedLawyerName
                    ? `${document.assignedLawyerName} (${
                        document.assignedLawyerId ?? "-"
                      })`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Type</p>
                <p className="font-medium">{document.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="font-medium">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      document.status === "Final"
                        ? "bg-green-100 text-green-800"
                        : document.status === "Draft"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {document.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Uploaded By</p>
                <p className="font-medium">{document.uploadedBy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="font-medium">
                  {formatDate(document.uploadedDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Size</p>
                <p className="font-medium">{document.fileSize}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Format</p>
                <p className="font-medium">{document.fileType}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg border border-gray-100">
                {document.description}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-1">Tags</p>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center min-h-[300px] border border-gray-200">
            {document.fileType?.toUpperCase().includes("PDF") ? (
              <div className="text-center">
                <div className="text-red-500 mb-2">
                  <i className="ri-file-pdf-line text-5xl"></i>
                </div>
                <p className="text-gray-700 font-medium">
                  PDF Document Preview
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Click the button below to view
                </p>
                <button
                  onClick={handleOpen}
                  className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
                >
                  Open Document
                </button>
              </div>
            ) : document.fileType?.toUpperCase().includes("DOC") ? (
              <div className="text-center">
                <div className="text-blue-600 mb-2">
                  <i className="ri-file-word-line text-5xl"></i>
                </div>
                <p className="text-gray-700 font-medium">Word Document</p>
                <p className="text-sm text-gray-500 mt-1">
                  Download to view this document
                </p>
                <button
                  onClick={handleDownload}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Download
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-green-600 mb-2">
                  <i className="ri-file-excel-line text-5xl"></i>
                </div>
                <p className="text-gray-700 font-medium">Excel Document</p>
                <p className="text-sm text-gray-500 mt-1">
                  Download to view this document
                </p>
                <button
                  onClick={handleDownload}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Download
                </button>
              </div>
            )}
          </div>
        </div>

        {/* <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <i className="ri-share-line mr-1"></i> Share
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <i className="ri-file-copy-line mr-1"></i> Copy Link
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <i className="ri-edit-line mr-1"></i> Edit Details
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default ViewDocument;
