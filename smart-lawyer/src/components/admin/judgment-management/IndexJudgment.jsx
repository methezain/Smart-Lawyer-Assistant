import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// Fetch active cases from backend instead of using static data
import { useGetCasesQuery } from "../../../reduxstore/services/CaseManagementAPI";
import Tools from "./Tools";
import JudgmentTable from "./JudgmentTable";
import ViewJudgment from "./ViewJudgment";
import AddJudgment from "./AddJudgment";
import {
  useListJudgmentsQuery,
  useUpdateJudgmentMutation,
  useDeleteJudgmentMutation,
} from "../../../reduxstore/services/JudgmentsAPI";
import EditJudgment from "./EditJudgment";

const IndexJudgment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const [selectedJudgment, setSelectedJudgment] = useState(null);
  const [judgmentsData, setJudgmentsData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editFile, setEditFile] = useState(null);
  const [newJudgmentData, setNewJudgmentData] = useState({
    caseId: "",
    judgmentDate: "",
    judgeName: "",
    status: "",
    court: "",
    bench: "",
    summary: "",
    keyPoints: "",
    fullText: "",
    remarks: "",
  });

  // Load active cases from backend
  const { data: casesRes } = useGetCasesQuery({
    page: 1,
    page_size: 100,
    status: "active",
    sort_by: "latest",
  });

  const activeCasesData = useMemo(() => {
    const items = casesRes?.cases || [];
    return items.map((c) => ({
      id: c.id,
      caseNumber: c.case_number,
      title: c.title,
      client_id: c.client_id,
      client_name: c.client_name,
      assigned_lawyer_id: c.assigned_lawyer_id,
      assigned_lawyer_name: c.assigned_lawyer_name,
    }));
  }, [casesRes]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const caseNumber = queryParams.get("case");
    if (caseNumber && activeCasesData?.length) {
      const selectedCase = activeCasesData.find(
        (c) => c.caseNumber === caseNumber
      );
      if (selectedCase) {
        setNewJudgmentData((prev) => ({
          ...prev,
          caseId: selectedCase.id.toString(),
        }));
        setShowAddModal(true);
      }
    }
  }, [location, activeCasesData]);

  // Reset to first page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const handleViewCase = (caseNumber) => {
    // Navigate; case details page can handle fetching by number
    navigate(`/admin/:username/cases/${caseNumber}`);
  };

  const openAddJudgmentModal = () => {
    setNewJudgmentData({
      caseId: "",
      judgmentDate: "",
      judgeName: "",
      status: "",
      court: "",
      bench: "",
      summary: "",
      keyPoints: "",
      fullText: "",
      remarks: "",
    });
    setShowAddModal(true);
  };

  const closeAddJudgmentModal = () => setShowAddModal(false);

  const { data: listRes, refetch: refetchJudgments } = useListJudgmentsQuery(
    {
      page: currentPage,
      size: pageSize,
      search: searchTerm,
    },
    { refetchOnMountOrArgChange: true }
  );

  const [updateJudgment] = useUpdateJudgmentMutation();
  const [deleteJudgment] = useDeleteJudgmentMutation();

  useEffect(() => {
    if (listRes?.data) {
      const d = listRes.data;
      // Map backend shape to table shape if needed
      const items = (d.items || []).map((j) => ({
        id: j.id,
        caseId: j.case_id,
        caseNumber: j.case_number || String(j.case_id),
        caseTitle: j.case_title || "Case",
        clientId: j.client_id || null,
        clientName: j.client_name || "",
        assignedLawyerId: j.assigned_lawyer_id || null,
        assignedLawyerName: j.assigned_lawyer_name || "",
        courtName: j.court,
        judgeName: j.judge_name,
        statusDetails: j.status_details || "",
        judgmentDate: j.judgment_date,
        status: j.status,
        summary: j.summary || "",
        keyPoints: j.key_points || [],
        fullText: "",
        remarks: j.remarks || "",
        pdfPath: j.pdf_path || null,
      }));
      setJudgmentsData(items);

      // Build pagination object similar to CasesTable
      const pag = {
        page: d.page || currentPage,
        page_size: d.page_size || d.size || pageSize,
        total_items: d.total_items ?? d.total ?? items.length,
        total_pages:
          d.total_pages ||
          (d.total_items && (d.page_size || d.size)
            ? Math.ceil(d.total_items / (d.page_size || d.size))
            : 0),
        has_next:
          typeof d.has_next === "boolean"
            ? d.has_next
            : (d.page || currentPage) * (d.page_size || d.size || pageSize) <
              (d.total_items ?? d.total ?? 0),
        has_previous:
          typeof d.has_previous === "boolean"
            ? d.has_previous
            : (d.page || currentPage) > 1,
      };
      setPagination(pag);
    }
  }, [listRes, currentPage, pageSize]);

  const filteredJudgments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    // status filter mapping
    const matchesStatus = (status) => {
      if (!status || filterStatus === "all") return true;
      const s = String(status).toLowerCase();
      if (filterStatus === "partial")
        return s.includes("partly") || s.includes("partial");
      return s === filterStatus;
    };
    return judgmentsData
      .filter((j) =>
        [j.caseTitle, j.caseNumber, j.judgeName, j.courtName]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(term))
      )
      .filter((j) => matchesStatus(j.status));
  }, [judgmentsData, searchTerm, filterStatus]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleAddJudgment = async () => {
    // Close modal and refresh list to show the newly added row immediately
    closeAddJudgmentModal();
    await refetchJudgments();
  };

  const openEditJudgment = (judgment) => {
    setEditTarget(judgment);
    // Map current values into backend field names for editing
    setEditForm({
      court: judgment.courtName || "",
      judge_name: judgment.judgeName || "",
      judgment_date: judgment.judgmentDate || "",
      status: judgment.status || "",
      status_details: judgment.statusDetails || "",
      summary: judgment.summary || "",
      key_points: Array.isArray(judgment.keyPoints)
        ? judgment.keyPoints.join("\n")
        : judgment.keyPoints || "",
      remarks: judgment.remarks || "",
    });
    setEditErrors({});
    setEditFile(null);
    setShowEditModal(true);
  };

  const closeEditJudgment = () => {
    setShowEditModal(false);
    setEditTarget(null);
    setEditForm({});
    setEditErrors({});
    setEditFile(null);
  };

  const onEditFormChange = (e) => {
    const { name, value } = e.target;
    if (editErrors[name]) {
      setEditErrors({ ...editErrors, [name]: "" });
    }
    setEditForm({ ...editForm, [name]: value });
  };

  const onEditFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type !== "application/pdf") {
      setEditErrors((prev) => ({
        ...prev,
        file: "Only PDF files are allowed",
      }));
      return;
    }
    if (file && file.size > 15 * 1024 * 1024) {
      setEditErrors((prev) => ({ ...prev, file: "File size must be < 15MB" }));
      return;
    }
    setEditErrors((prev) => ({ ...prev, file: "" }));
    setEditFile(file || null);
  };

  const submitEditJudgment = async () => {
    // Minimal validation
    const errs = {};
    if (!editForm.court) errs.court = "Court is required";
    if (!editForm.judge_name) errs.judge_name = "Judge is required";
    if (!editForm.judgment_date) errs.judgment_date = "Date is required";
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      court: editForm.court,
      judge_name: editForm.judge_name,
      judgment_date: editForm.judgment_date,
      status: editForm.status || undefined,
      status_details: editForm.status_details || undefined,
      summary: editForm.summary || undefined,
      key_points: editForm.key_points
        ? editForm.key_points
            .split("\n")
            .map((p) => p.trim())
            .filter((p) => p.length > 0)
        : undefined,
      remarks: editForm.remarks || undefined,
    };
    try {
      await updateJudgment({
        id: editTarget.id,
        data: payload,
        file: editFile,
      }).unwrap();
      await refetchJudgments();
      closeEditJudgment();
    } catch {
      setEditErrors((prev) => ({ ...prev, form: "Failed to update judgment" }));
    }
  };

  const deleteJudgmentConfirmed = async (judgment) => {
    try {
      await deleteJudgment(judgment.id).unwrap();
      await refetchJudgments();
    } catch {
      // Optionally surface an error toast
    }
  };

  return (
    <div>
      <Tools
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={openAddJudgmentModal}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      <JudgmentTable
        judgments={filteredJudgments}
        onViewCase={handleViewCase}
        onViewDetails={setSelectedJudgment}
        onEdit={openEditJudgment}
        onDelete={deleteJudgmentConfirmed}
        formatDate={formatDate}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {selectedJudgment && (
        <ViewJudgment
          judgment={selectedJudgment}
          onClose={() => setSelectedJudgment(null)}
          formatDate={formatDate}
        />
      )}

      {showAddModal && (
        <AddJudgment
          casesData={activeCasesData}
          existingCaseIds={judgmentsData.map((j) => String(j.caseId))}
          initialData={newJudgmentData}
          onCancel={closeAddJudgmentModal}
          onAdd={handleAddJudgment}
        />
      )}

      {showEditModal && (
        <EditJudgment
          judgment={editTarget}
          form={editForm}
          errors={editErrors}
          onClose={closeEditJudgment}
          onChange={onEditFormChange}
          onFileChange={onEditFileChange}
          onSubmit={submitEditJudgment}
        />
      )}
    </div>
  );
};

export default IndexJudgment;
