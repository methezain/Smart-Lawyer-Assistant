import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useListDocumentsQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
} from "../../../reduxstore/services/DocumentsAPI";
import { useGetCasesQuery } from "../../../reduxstore/services/CaseManagementAPI";
import Tools from "./Tools";
import DocumentTable from "./DocumentTable";
import ViewDocument from "./ViewDocument";
import UploadDocument from "./UploadDocument";
import EditDocument from "./EditDocument";

const IndexDocument = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCase, setFilterCase] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterLawyer, setFilterLawyer] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentsData, setDocumentsData] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total_items: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false,
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [newDocumentData, setNewDocumentData] = useState({
    title: "",
    caseId: "",
    type: "",
    status: "",
    description: "",
    tags: "",
    fileType: "PDF",
    fileSize: "0 KB",
  });
  const [errors, setErrors] = useState({});

  // Remote data: cases (for mapping UI) and documents
  const { data: casesResp } = useGetCasesQuery({
    page: 1,
    page_size: 100, // backend limit
    // Fetch all cases for the dropdown (no status filter)
  });
  const activeCases = useMemo(() => casesResp?.cases || [], [casesResp]);
  const caseById = useMemo(() => {
    const map = new Map();
    activeCases.forEach((c) => map.set(c.id, c));
    return map;
  }, [activeCases]);

  const { data: docsResp, refetch } = useListDocumentsQuery({
    page,
    page_size: Math.min(pageSize, 100),
    search: searchTerm,
    doc_type: filterType === "all" ? "" : filterType,
  });
  const [createDocument] = useCreateDocumentMutation();
  const [updateDocument] = useUpdateDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const caseNumber = queryParams.get("case");
    if (caseNumber && activeCases.length) {
      const selectedCase = activeCases.find(
        (c) => c.case_number === caseNumber
      );
      if (selectedCase) {
        setNewDocumentData((prevData) => ({
          ...prevData,
          caseId: String(selectedCase.id),
          description: `Document for case ${caseNumber} - ${selectedCase.title}`,
        }));
        setShowUploadModal(true);
      }
    }
  }, [location, activeCases]);

  // Map backend docs to UI shape with case enrichment
  useEffect(() => {
    const items = docsResp?.documents || docsResp?.items || [];
    const mapFileType = (mime, filename) => {
      const ext = (filename || "").split(".").pop()?.toLowerCase();
      // Prefer extension when available (backend filenames include .xlsx etc.)
      if (ext) {
        if (ext === "pdf") return "PDF";
        if (ext === "doc") return "DOC";
        if (ext === "docx") return "DOCX";
        if (ext === "xls") return "XLS";
        if (ext === "xlsx") return "XLSX";
      }
      if (!mime) return "FILE";
      const m = mime.toLowerCase();
      if (m.includes("pdf")) return "PDF";
      // Strict Word checks (avoid matching 'officedocument' for Excel)
      if (
        m === "application/msword" ||
        m.includes("wordprocessingml") ||
        m.includes("application/vnd.ms-word") ||
        m.includes(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
      ) {
        return "DOCX";
      }
      // Excel checks
      if (
        m.includes("spreadsheet") ||
        m.includes("excel") ||
        m.includes("sheet") ||
        m.includes("application/vnd.ms-excel") ||
        m.includes(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
      ) {
        return "XLSX";
      }
      return "FILE";
    };
    const mapped = items.map((doc) => {
      const relatedCase = doc.case_id ? caseById.get(doc.case_id) : null;
      const assignedLawyerName =
        doc.assigned_lawyer_name || relatedCase?.assigned_lawyer_name || "";
      const assignedLawyerId =
        doc.assigned_lawyer_id || relatedCase?.assigned_lawyer_id || null;
      return {
        id: doc.id,
        title: doc.title,
        type: doc.doc_type || "Other",
        caseId: doc.case_id || null,
        caseNumber: doc.case_number || relatedCase?.case_number || "-",
        caseTitle: doc.case_title || relatedCase?.title || "-",
        clientId: doc.client_id || relatedCase?.client_id || null,
        clientName: doc.client_name || relatedCase?.client_name || "",
        assignedLawyerName,
        assignedLawyerId,
        uploadedBy: assignedLawyerName
          ? `Adv. ${assignedLawyerName}`
          : "Unknown",
        uploadedDate: doc.created_at,
        fileSize: doc.file_size
          ? `${(doc.file_size / 1024).toFixed(1)} KB`
          : "-",
        fileType: mapFileType(doc.file_type, doc.file_path || doc.title),
        status: doc.status || "uploaded",
        description: doc.description || "",
        tags: doc.tags
          ? doc.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        _raw: doc,
      };
    });
    setDocumentsData(mapped);
    if (docsResp?.pagination) {
      setPagination(docsResp.pagination);
    } else if (
      typeof docsResp?.total === "number" &&
      typeof docsResp?.page === "number" &&
      typeof docsResp?.page_size === "number"
    ) {
      // Back-compat with old response
      const total_pages = Math.max(
        1,
        Math.ceil((docsResp.total || 0) / (docsResp.page_size || 10))
      );
      setPagination({
        page: docsResp.page,
        page_size: docsResp.page_size,
        total_items: docsResp.total || 0,
        total_pages,
        has_next: (docsResp.page || 1) < total_pages,
        has_previous: (docsResp.page || 1) > 1,
      });
    }
  }, [docsResp, caseById]);

  const openUploadModal = () => {
    setNewDocumentData({
      title: "",
      caseId: "",
      type: "Petition",
      status: "Final",
      description: "",
      tags: "",
      fileType: "PDF",
      fileSize: "0 KB",
    });
    setErrors({});
    setShowUploadModal(true);
  };

  const closeUploadModal = () => setShowUploadModal(false);

  const openEditModal = (doc) => {
    setDocumentToEdit(doc);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setDocumentToEdit(null);
  };

  const handleDocumentInputChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) setErrors({ ...errors, [name]: "" });
    setNewDocumentData({ ...newDocumentData, [name]: value });
  };

  const handleFileSelection = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, file: "File size must be less than 10MB" });
        return;
      }
      const fileExtension = file.name.split(".").pop().toLowerCase();
      let fileType = "Unknown";
      if (fileExtension === "pdf") fileType = "PDF";
      else if (["doc", "docx"].includes(fileExtension)) fileType = "DOCX";
      else if (["xls", "xlsx"].includes(fileExtension)) fileType = "XLSX";

      const sizeInKB = file.size / 1024;
      const fileSize =
        sizeInKB < 1024
          ? `${sizeInKB.toFixed(1)} KB`
          : `${(sizeInKB / 1024).toFixed(1)} MB`;

      setNewDocumentData({ ...newDocumentData, fileType, fileSize, file });
      setErrors({ ...errors, file: "" });
    }
  };

  const removeSelectedFile = () => {
    setNewDocumentData({
      ...newDocumentData,
      fileType: "PDF",
      fileSize: "0 KB",
      file: null,
    });
  };

  const validateUploadForm = () => {
    const formErrors = {};
    if (!newDocumentData.title.trim())
      formErrors.title = "Document title is required";
    if (!newDocumentData.caseId) formErrors.caseId = "Please select a case";
    if (!newDocumentData.type) formErrors.type = "Document type is required";
    if (!newDocumentData.description.trim())
      formErrors.description = "Description is required";
    if (!newDocumentData.file && !newDocumentData.fileSize.startsWith("0"))
      formErrors.file = "Please upload a file";
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleUploadDocument = async () => {
    if (!validateUploadForm()) return;

    const selectedCase = activeCases.find(
      (c) => c.id.toString() === newDocumentData.caseId
    );
    const tagsString = newDocumentData.tags || "";
    const payload = {
      title: newDocumentData.title,
      description: newDocumentData.description,
      doc_type: newDocumentData.type,
      status: newDocumentData.status,
      tags: tagsString,
      case_id: selectedCase?.id,
      case_number: selectedCase?.case_number,
      case_title: selectedCase?.title,
      client_id: selectedCase?.client_id,
      client_name: selectedCase?.client_name,
      assigned_lawyer_id: selectedCase?.assigned_lawyer_id || null,
      assigned_lawyer_name: selectedCase?.assigned_lawyer_name || null,
      file: newDocumentData.file,
    };
    try {
      const created = await createDocument(payload).unwrap();
      closeUploadModal();
      // Ensure new document is visible (clear local filters)
      setSearchTerm("");
      setFilterType("all");
      setFilterCase("all");
      // Optimistic add to local table while refetch happens
      const mapFileType = (mime, filename) => {
        const ext = (filename || "").split(".").pop()?.toLowerCase();
        if (ext) {
          if (ext === "pdf") return "PDF";
          if (ext === "doc") return "DOC";
          if (ext === "docx") return "DOCX";
          if (ext === "xls") return "XLS";
          if (ext === "xlsx") return "XLSX";
        }
        if (!mime) return "FILE";
        const m = mime.toLowerCase();
        if (m.includes("pdf")) return "PDF";
        if (
          m === "application/msword" ||
          m.includes("wordprocessingml") ||
          m.includes("application/vnd.ms-word") ||
          m.includes(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          )
        ) {
          return "DOCX";
        }
        if (
          m.includes("spreadsheet") ||
          m.includes("excel") ||
          m.includes("sheet") ||
          m.includes("application/vnd.ms-excel") ||
          m.includes(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          )
        ) {
          return "XLSX";
        }
        return "FILE";
      };
      setDocumentsData((prev) => [
        {
          id: created.id,
          title: created.title,
          type: created.doc_type || "Other",
          caseId: created.case_id || null,
          caseNumber:
            created.case_number ||
            caseById.get(created.case_id)?.case_number ||
            "-",
          caseTitle:
            created.case_title || caseById.get(created.case_id)?.title || "-",
          clientId:
            created.client_id ||
            caseById.get(created.case_id)?.client_id ||
            null,
          clientName:
            created.client_name ||
            caseById.get(created.case_id)?.client_name ||
            "",
          assignedLawyerName:
            created.assigned_lawyer_name ||
            caseById.get(created.case_id)?.assigned_lawyer_name ||
            "",
          assignedLawyerId:
            created.assigned_lawyer_id ||
            caseById.get(created.case_id)?.assigned_lawyer_id ||
            null,
          uploadedBy:
            created.assigned_lawyer_name ||
            caseById.get(created.case_id)?.assigned_lawyer_name
              ? `Adv. ${
                  created.assigned_lawyer_name ||
                  caseById.get(created.case_id)?.assigned_lawyer_name
                }`
              : "Unknown",
          uploadedDate: created.created_at,
          fileSize: created.file_size
            ? `${(created.file_size / 1024).toFixed(1)} KB`
            : "-",
          fileType: mapFileType(
            created.file_type,
            created.file_path || created.title
          ),
          status: created.status || "uploaded",
          description: created.description || "",
          tags: created.tags
            ? created.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
          _raw: created,
        },
        ...prev,
      ]);
      refetch();
    } catch (e) {
      console.error("Upload failed", e);
      const msg = e?.data?.detail || e?.error || "Upload failed";
      setErrors((prev) => ({ ...prev, file: msg }));
    }
  };

  const handleViewCase = (caseNumber) => {
    if (caseNumber) navigate(`/admin/:username/cases/${caseNumber}`);
  };

  const handleEditDocument = async (updatedPartial) => {
    const relatedCase = updatedPartial.caseId
      ? caseById.get(updatedPartial.caseId)
      : null;
    const patch = {
      title: updatedPartial.title,
      doc_type: updatedPartial.type,
      status: updatedPartial.status,
      description: updatedPartial.description,
      tags: Array.isArray(updatedPartial.tags)
        ? updatedPartial.tags.join(", ")
        : updatedPartial.tags,
      case_id: updatedPartial.caseId,
      case_number: relatedCase?.case_number,
      case_title: relatedCase?.title,
    };
    try {
      await updateDocument({ id: updatedPartial.id, patch }).unwrap();
      closeEditModal();
      refetch();
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const handleDeleteDocument = (docId) => {
    setConfirmDeleteId(docId);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteDocument(confirmDeleteId).unwrap();
      if (selectedDocument?.id === confirmDeleteId) setSelectedDocument(null);
      setConfirmDeleteId(null);
      refetch();
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const cancelDelete = () => setConfirmDeleteId(null);

  const uniqueCases = useMemo(() => {
    // prefer activeCases list for options
    if (activeCases.length) {
      return activeCases.map((c) => ({
        number: c.case_number,
        title: c.title,
      }));
    }
    // fallback from docs listing
    return [...new Set(documentsData.map((doc) => doc.caseNumber))].map(
      (caseNumber) => {
        const caseData = documentsData.find(
          (doc) => doc.caseNumber === caseNumber
        );
        return { number: caseNumber, title: caseData?.caseTitle || "-" };
      }
    );
  }, [documentsData, activeCases]);

  const uniqueTypes = useMemo(
    () => [...new Set(documentsData.map((doc) => doc.type))],
    [documentsData]
  );

  const uniqueStatuses = useMemo(
    () => [...new Set(documentsData.map((doc) => doc.status))],
    [documentsData]
  );

  const uniqueLawyers = useMemo(
    () =>
      [...new Set(documentsData.map((doc) => doc.uploadedBy))].filter(Boolean),
    [documentsData]
  );

  const filteredDocuments = useMemo(() => {
    return documentsData.filter((document) => {
      const matchesSearch =
        document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesType = filterType === "all" || document.type === filterType;
      const matchesCase =
        filterCase === "all" || document.caseNumber === filterCase;
      const matchesStatus =
        filterStatus === "all" || document.status === filterStatus;

      const matchesLawyer =
        filterLawyer === "all" || document.uploadedBy === filterLawyer;

      // Date filtering (inclusive)
      let matchesDate = true;
      if (startDate) {
        matchesDate =
          matchesDate &&
          new Date(document.uploadedDate) >= new Date(startDate + "T00:00:00");
      }
      if (endDate) {
        matchesDate =
          matchesDate &&
          new Date(document.uploadedDate) <= new Date(endDate + "T23:59:59");
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesCase &&
        matchesStatus &&
        matchesLawyer &&
        matchesDate
      );
    });
  }, [
    documentsData,
    searchTerm,
    filterType,
    filterCase,
    filterStatus,
    startDate,
    endDate,
    filterLawyer,
  ]);

  // Reset to first page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    filterType,
    filterCase,
    filterStatus,
    startDate,
    endDate,
    filterLawyer,
  ]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterCase("all");
    setFilterStatus("all");
    setFilterLawyer("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div>
      <Tools
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterCase={filterCase}
        onFilterCaseChange={setFilterCase}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        filterLawyer={filterLawyer}
        onFilterLawyerChange={setFilterLawyer}
        uniqueTypes={uniqueTypes}
        uniqueStatuses={uniqueStatuses}
        uniqueCases={uniqueCases}
        uniqueLawyers={uniqueLawyers}
        onUploadClick={openUploadModal}
        onClearFilters={clearAllFilters}
      />

      {selectedDocument ? (
        <ViewDocument
          document={selectedDocument}
          onBack={() => setSelectedDocument(null)}
          formatDate={formatDate}
        />
      ) : (
        <DocumentTable
          documents={filteredDocuments}
          onView={setSelectedDocument}
          onEdit={openEditModal}
          onDelete={handleDeleteDocument}
          onViewCase={handleViewCase}
          formatDate={formatDate}
          startIndex={(page - 1) * pageSize}
          pagination={pagination}
          currentPage={page}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}

      {/* Page size control moved into DocumentTable footer */}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <i className="ri-error-warning-line text-2xl text-red-500"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Delete document?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This action cannot be undone. The file will be removed from
                  storage as well.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <UploadDocument
          casesData={activeCases.map((c) => ({
            id: c.id,
            caseNumber: c.case_number,
            title: c.title,
          }))}
          data={newDocumentData}
          errors={errors}
          onChange={handleDocumentInputChange}
          onFileChange={handleFileSelection}
          onRemoveFile={removeSelectedFile}
          onCancel={closeUploadModal}
          onUpload={handleUploadDocument}
        />
      )}

      {showEditModal && documentToEdit && (
        <EditDocument
          isOpen={showEditModal}
          onClose={closeEditModal}
          onEdit={handleEditDocument}
          documentToEdit={documentToEdit}
          casesData={activeCases.map((c) => ({
            id: c.id,
            caseNumber: c.case_number,
            title: c.title,
          }))}
        />
      )}
    </div>
  );
};

export default IndexDocument;
