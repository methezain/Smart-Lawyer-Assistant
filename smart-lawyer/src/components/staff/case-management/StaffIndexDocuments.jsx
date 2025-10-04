import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";

// Reuse admin document components
import Tools from "../../admin/document-management/Tools";
import DocumentTable from "../../admin/document-management/DocumentTable";
import ViewDocument from "../../admin/document-management/ViewDocument";
import UploadDocument from "../../admin/document-management/UploadDocument";
import EditDocument from "../../admin/document-management/EditDocument";

// Services
import { useGetCasesQuery } from "../../../reduxstore/services/CaseManagementAPI";
import {
  useListDocumentsQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
} from "../../../reduxstore/services/DocumentsAPI";
import { useListPermissionsQuery } from "../../../reduxstore/services/PermissionsAPI";

const StaffIndexDocuments = ({ staffId: staffIdProp }) => {
  // Resolve staff/admin IDs from auth
  const auth = useSelector((s) => s.auth);
  const staffId = useMemo(() => {
    const u = auth?.user || {};
    return (
      staffIdProp ||
      u.id ||
      u.user_id ||
      u.staff_id ||
      u.assigned_lawyer_id ||
      null
    );
  }, [auth?.user, staffIdProp]);

  const adminId = useMemo(() => {
    const u = auth?.user || {};
    return u.admin_id || u.firmId || u.firm_id || null;
  }, [auth?.user]);

  // Permissions (module: documents)
  const { data: permsData } = useListPermissionsQuery(
    {
      admin_id: adminId ?? undefined,
      assigned_lawyer_id: staffId ?? undefined,
      module: "documents",
    },
    { skip: !staffId }
  );
  const perms = useMemo(() => {
    const p = (permsData?.items || [])[0] || {};
    return {
      can_add: !!p.can_add,
      can_edit: !!p.can_edit,
      can_delete: !!p.can_delete,
    };
  }, [permsData]);

  // Fetch cases assigned to this lawyer (server filter first)
  const { data: assignedCasesResp } = useGetCasesQuery(
    {
      page: 1,
      page_size: 100,
      assigned_lawyer_id: staffId || "",
      sort_by: "latest",
    },
    { skip: !staffId }
  );

  // Fallback: fetch all cases and filter client-side (covers staff_id linkage)
  const { data: allCasesResp } = useGetCasesQuery(
    { page: 1, page_size: 100, sort_by: "latest" },
    {
      skip:
        !staffId ||
        (Array.isArray(assignedCasesResp?.cases) &&
          assignedCasesResp.cases.length > 0),
    }
  );

  const assignedCases = useMemo(() => {
    const staffIdStr = staffId != null ? String(staffId) : null;
    if (
      Array.isArray(assignedCasesResp?.cases) &&
      assignedCasesResp.cases.length > 0
    ) {
      return assignedCasesResp.cases;
    }
    const base = allCasesResp?.cases || [];
    return base.filter(
      (c) =>
        String(c?.assigned_lawyer_id ?? "") === staffIdStr ||
        String(c?.staff_id ?? "") === staffIdStr
    );
  }, [assignedCasesResp, allCasesResp, staffId]);

  const casesForSelect = useMemo(
    () =>
      (assignedCases || []).map((c) => ({
        id: c.id,
        case_number: c.case_number,
        title: c.title,
        client_id: c.client_id,
        client_name: c.client_name,
        assigned_lawyer_id: c.assigned_lawyer_id,
        assigned_lawyer_name: c.assigned_lawyer_name,
      })),
    [assignedCases]
  );

  // Documents: fetch page and then client-filter to assigned cases
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCase, setFilterCase] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterLawyer, setFilterLawyer] = useState("all");

  const { data: docsResp, refetch } = useListDocumentsQuery(
    {
      page,
      page_size: Math.min(pageSize, 100),
      search: searchTerm,
      doc_type: filterType === "all" ? "" : filterType,
    },
    { skip: !staffId }
  );

  const [documentsData, setDocumentsData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total_items: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false,
  });

  const caseById = useMemo(() => {
    const map = new Map();
    (assignedCases || []).forEach((c) => map.set(c.id, c));
    // As a fallback, enrich with all-cases map (if available)
    (allCasesResp?.cases || []).forEach((c) => {
      if (!map.has(c.id)) map.set(c.id, c);
    });
    return map;
  }, [assignedCases, allCasesResp]);

  useEffect(() => {
    const items = docsResp?.documents || docsResp?.items || [];
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

    // Scope to assigned cases only
    const allowedCaseIds = new Set(
      (assignedCases || []).map((c) => Number(c.id))
    );
    const scoped = mapped.filter((d) =>
      d.caseId != null ? allowedCaseIds.has(Number(d.caseId)) : false
    );
    setDocumentsData(scoped);

    // Pagination passthrough (server pagination; counts may not reflect client filter)
    if (docsResp?.pagination) {
      setPagination(docsResp.pagination);
    } else if (
      typeof docsResp?.total === "number" &&
      typeof docsResp?.page === "number" &&
      typeof docsResp?.page_size === "number"
    ) {
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
  }, [docsResp, assignedCases, caseById]);

  // Upload/Edit modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [newDocumentData, setNewDocumentData] = useState({
    title: "",
    caseId: "",
    type: "Petition",
    status: "Final",
    description: "",
    tags: "",
    fileType: "PDF",
    fileSize: "0 KB",
    file: null,
  });
  const [errors, setErrors] = useState({});

  const [createDocument] = useCreateDocumentMutation();
  const [updateDocument] = useUpdateDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();

  // Handlers
  const openUploadModal = () => {
    if (!perms.can_add) {
      alert("You don't have permission to upload documents.");
      return;
    }
    setNewDocumentData({
      title: "",
      caseId: "",
      type: "Petition",
      status: "Final",
      description: "",
      tags: "",
      fileType: "PDF",
      fileSize: "0 KB",
      file: null,
    });
    setErrors({});
    setShowUploadModal(true);
  };
  const closeUploadModal = () => setShowUploadModal(false);

  const openEditModal = (doc) => {
    if (!perms.can_edit) {
      alert("You don't have permission to edit documents.");
      return;
    }
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
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, file: "File size must be less than 10MB" });
        return;
      }
      const sizeInKB = file.size / 1024;
      const fileSize =
        sizeInKB < 1024
          ? `${sizeInKB.toFixed(1)} KB`
          : `${(sizeInKB / 1024).toFixed(1)} MB`;
      setNewDocumentData((prev) => ({ ...prev, file, fileSize }));
      setErrors((prev) => ({ ...prev, file: "" }));
    }
  };
  const removeSelectedFile = () => {
    setNewDocumentData((prev) => ({ ...prev, file: null, fileSize: "0 KB" }));
  };

  const validateUploadForm = () => {
    const formErrors = {};
    if (!newDocumentData.title.trim())
      formErrors.title = "Document title is required";
    if (!newDocumentData.caseId) formErrors.caseId = "Please select a case";
    if (!newDocumentData.type) formErrors.type = "Document type is required";
    if (!newDocumentData.description.trim())
      formErrors.description = "Description is required";
    if (!newDocumentData.file) formErrors.file = "Please upload a file";
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleUploadDocument = async () => {
    if (!validateUploadForm()) return;

    const selectedCase = casesForSelect.find(
      (c) => String(c.id) === String(newDocumentData.caseId)
    );

    const payload = {
      title: newDocumentData.title,
      description: newDocumentData.description,
      doc_type: newDocumentData.type,
      status: newDocumentData.status,
      tags: newDocumentData.tags || "",
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
      await createDocument(payload).unwrap();
      closeUploadModal();
      // reset filters to ensure visibility
      setSearchTerm("");
      setFilterType("all");
      setFilterCase("all");
      await refetch();
    } catch (err) {
      const msg = err?.data?.detail || err?.error || "Upload failed";
      setErrors((prev) => ({ ...prev, file: msg }));
    }
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
      await refetch();
    } catch {
      // optionally surface error
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const handleDeleteDocument = (docId) => {
    if (!perms.can_delete) {
      alert("You don't have permission to delete documents.");
      return;
    }
    setConfirmDeleteId(docId);
  };
  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteDocument(confirmDeleteId).unwrap();
      if (selectedDocument?.id === confirmDeleteId) setSelectedDocument(null);
      setConfirmDeleteId(null);
      await refetch();
    } catch {
      // ignore
    }
  };
  const cancelDelete = () => setConfirmDeleteId(null);

  const uniqueCases = useMemo(() => {
    return (casesForSelect || []).map((c) => ({
      number: c.case_number,
      title: c.title,
    }));
  }, [casesForSelect]);

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

  // Client-side filters
  const filteredDocuments = useMemo(() => {
    return documentsData.filter((document) => {
      const matchesSearch =
        document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.tags.some((t) =>
          t.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesType = filterType === "all" || document.type === filterType;
      const matchesCase =
        filterCase === "all" || document.caseNumber === filterCase;
      const matchesStatus =
        filterStatus === "all" || document.status === filterStatus;
      const matchesLawyer =
        filterLawyer === "all" || document.uploadedBy === filterLawyer;

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

  const [selectedDocument, setSelectedDocument] = useState(null);

  if (!staffId) {
    return (
      <div className="p-6 text-center text-amber-600">
        Unable to determine your staff ID. Please sign in again.
      </div>
    );
  }

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
        onClearFilters={() => {
          setSearchTerm("");
          setFilterType("all");
          setFilterCase("all");
          setFilterStatus("all");
          setFilterLawyer("all");
          setStartDate("");
          setEndDate("");
        }}
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
          onEdit={(doc) => openEditModal(doc)}
          onDelete={(id) => handleDeleteDocument(id)}
          onViewCase={() => {}}
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

      {/* Delete confirmation */}
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
          casesData={casesForSelect.map((c) => ({
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
          casesData={casesForSelect.map((c) => ({
            id: c.id,
            caseNumber: c.case_number,
            title: c.title,
          }))}
        />
      )}
    </div>
  );
};

StaffIndexDocuments.propTypes = {
  staffId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default StaffIndexDocuments;
