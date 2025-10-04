import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

// Reuse admin judgment UI
import Tools from "../../admin/judgment-management/Tools";
import JudgmentTable from "../../admin/judgment-management/JudgmentTable";
import ViewJudgment from "../../admin/judgment-management/ViewJudgment";
import AddJudgment from "../../admin/judgment-management/AddJudgment";
import EditJudgment from "../../admin/judgment-management/EditJudgment";

// Services
import { useGetCasesQuery } from "../../../reduxstore/services/CaseManagementAPI";
import {
  useListJudgmentsQuery,
  useUpdateJudgmentMutation,
  useDeleteJudgmentMutation,
} from "../../../reduxstore/services/JudgmentsAPI";
import { useListPermissionsQuery } from "../../../reduxstore/services/PermissionsAPI";

const StaffIndexJudgment = ({ staffId: staffIdProp }) => {
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

  // Permissions for judgments module
  const { data: permsData } = useListPermissionsQuery(
    {
      admin_id: adminId ?? undefined,
      assigned_lawyer_id: staffId ?? undefined,
      module: "judgments",
    },
    { skip: !staffId }
  );

  const perms = useMemo(() => {
    const items = permsData?.items || [];
    const p = items[0] || {};
    return {
      can_add: !!p.can_add,
      can_edit: !!p.can_edit,
      can_delete: !!p.can_delete,
    };
  }, [permsData]);

  // Filters & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Fetch cases assigned to this lawyer (for Add modal and visibility scoping)
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

  const casesDataForModal = useMemo(() => {
    return (assignedCases || []).map((c) => ({
      id: c.id,
      caseNumber: c.case_number,
      title: c.title,
      client_id: c.client_id,
      client_name: c.client_name,
      assigned_lawyer_id: c.assigned_lawyer_id,
      assigned_lawyer_name: c.assigned_lawyer_name,
    }));
  }, [assignedCases]);

  // Judgments list (we’ll filter client-side to show only those linked to the assigned cases)
  const { data: listRes, refetch: refetchJudgments } = useListJudgmentsQuery(
    { page: currentPage, size: pageSize, search: searchTerm },
    { skip: !staffId, refetchOnMountOrArgChange: true }
  );

  const [updateJudgment] = useUpdateJudgmentMutation();
  const [deleteJudgment] = useDeleteJudgmentMutation();

  const [selectedJudgment, setSelectedJudgment] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editFile, setEditFile] = useState(null);

  // Normalize judgments and filter to this staff’s cases
  const { judgmentsForTable, pagination } = useMemo(() => {
    const d = listRes?.data || {};
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

    const allowedCaseIds = new Set(
      (assignedCases || []).map((c) => Number(c.id))
    );
    const scoped = items.filter((j) => allowedCaseIds.has(Number(j.caseId)));

    const pag = {
      page: d.page || currentPage,
      page_size: d.page_size || d.size || pageSize,
      total_items: d.total_items ?? d.total ?? scoped.length,
      total_pages:
        d.total_pages ||
        (d.total_items && (d.page_size || d.size)
          ? Math.ceil(d.total_items / (d.page_size || d.size))
          : 0),
      has_next: typeof d.has_next === "boolean" ? d.has_next : false,
      has_previous:
        typeof d.has_previous === "boolean" ? d.has_previous : false,
    };
    return { judgmentsForTable: scoped, pagination: pag };
  }, [listRes, assignedCases, currentPage]);

  // Search/status filter (client-side)
  const filteredJudgments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const matchesStatus = (status) => {
      if (!status || filterStatus === "all") return true;
      const s = String(status).toLowerCase();
      if (filterStatus === "partial")
        return s.includes("partly") || s.includes("partial");
      return s === filterStatus;
    };
    return (judgmentsForTable || [])
      .filter((j) =>
        [j.caseTitle, j.caseNumber, j.judgeName, j.courtName]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(term))
      )
      .filter((j) => matchesStatus(j.status));
  }, [judgmentsForTable, searchTerm, filterStatus]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // CRUD handlers
  const openAddJudgment = () => {
    if (!perms.can_add) {
      alert("You don't have permission to add judgments.");
      return;
    }
    setShowAddModal(true);
  };
  const closeAddJudgment = () => setShowAddModal(false);

  const openEditJudgment = (judgment) => {
    if (!perms.can_edit) {
      alert("You don't have permission to edit judgments.");
      return;
    }
    setEditTarget(judgment);
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
    if (editErrors[name]) setEditErrors({ ...editErrors, [name]: "" });
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
    if (!perms.can_delete) {
      alert("You don't have permission to delete judgments.");
      return;
    }
    try {
      await deleteJudgment(judgment.id).unwrap();
      await refetchJudgments();
    } catch {
      // optionally show toast
    }
  };

  if (!staffId) {
    return (
      <div className="p-6 text-center text-amber-600">
        Unable to determine your staff ID. Please sign in again.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Tools
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={openAddJudgment}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      <JudgmentTable
        judgments={filteredJudgments}
        onViewCase={(caseNumber) => {
          /* optional: navigate or modal */
        }}
        onViewDetails={setSelectedJudgment}
        onEdit={openEditJudgment}
        onDelete={deleteJudgmentConfirmed}
        formatDate={(d) =>
          new Date(d).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        }
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {selectedJudgment && (
        <ViewJudgment
          judgment={selectedJudgment}
          onClose={() => setSelectedJudgment(null)}
          formatDate={(d) =>
            new Date(d).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          }
        />
      )}

      {showAddModal && (
        <AddJudgment
          casesData={casesDataForModal}
          existingCaseIds={(judgmentsForTable || []).map((j) =>
            String(j.caseId)
          )}
          initialData={{}}
          onCancel={closeAddJudgment}
          onAdd={async () => {
            closeAddJudgment();
            await refetchJudgments();
          }}
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

export default StaffIndexJudgment;
