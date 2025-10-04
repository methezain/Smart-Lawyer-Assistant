// Staff Cases index (staff-only): reuse admin Tools and CasesTable; filter by assigned_lawyer_id
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import Tools from "../../admin/case-management/Tools";
import CasesTable from "../../admin/case-management/CasesTable";
import ViewCase from "../../admin/case-management/ViewCase";
import EditCase from "../../admin/case-management/EditCase";
import AddCase from "../../admin/case-management/AddCase";
import {
  useGetCasesQuery,
  useGetCaseTypesQuery,
} from "../../../reduxstore/services/CaseManagementAPI";
import { useListPermissionsQuery } from "../../../reduxstore/services/PermissionsAPI";
import {
  useUpdateCaseMutation,
  useCreateCaseMutation,
  useDeleteCaseMutation,
} from "../../../reduxstore/services/CaseManagementAPI";
import { useLinkCaseMutation } from "../../../reduxstore/services/ClientsAPI";

const StaffIndexCase = ({ staffId: staffIdProp }) => {
  // Resolve staff (lawyer) id from auth or prop
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

  // Try to infer admin id from auth.user if present (for now, use firmId as a stand-in if admin id isn't available)
  const adminId = useMemo(() => {
    const u = auth?.user || {};
    // Prefer explicit admin_id if available
    return u.admin_id || u.firmId || u.firm_id || null;
  }, [auth?.user]);

  const staffDisplayName = useMemo(() => {
    const u = auth?.user || {};
    const name =
      u.name ||
      [u.first_name, u.last_name].filter(Boolean).join(" ") ||
      u.username ||
      u.email ||
      "";
    return name;
  }, [auth?.user]);

  // Filters & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // View case state
  const [viewingCase, setViewingCase] = useState(null);
  // Edit case state
  const [editingCase, setEditingCase] = useState(null);
  const [updateCase] = useUpdateCaseMutation();
  const [editError, setEditError] = useState("");
  // Add case state
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [createCase] = useCreateCaseMutation();
  const [linkCase] = useLinkCaseMutation();
  const [addError, setAddError] = useState("");
  const [deleteCase] = useDeleteCaseMutation();
  const [deleteError, setDeleteError] = useState("");

  const {
    data: casesResp,
    isLoading,
    error,
    refetch,
  } = useGetCasesQuery(
    {
      page,
      page_size: pageSize,
      assigned_lawyer_id: staffId || "",
      search: searchTerm || "",
      status: filterStatus !== "all" ? filterStatus : "",
      type: filterType !== "all" ? filterType : "",
      sort_by: sortBy,
    },
    { skip: !staffId }
  );

  const cases = casesResp?.cases || [];
  const pagination = casesResp?.pagination || {
    page,
    page_size: pageSize,
    total_items: cases.length,
    total_pages: 1,
    has_next: false,
    has_previous: false,
  };

  const { data: caseTypesData } = useGetCaseTypesQuery();
  // Fetch permissions for this staff on 'cases' module
  const { data: permsData } = useListPermissionsQuery(
    {
      admin_id: adminId ?? undefined,
      assigned_lawyer_id: staffId ?? undefined,
      module: "cases",
    },
    { skip: !staffId }
  );

  const staffCasePerms = React.useMemo(() => {
    const items = permsData?.items || [];
    // Single record per module expected; take first
    const p = items[0];
    return {
      can_add: !!p?.can_add,
      can_edit: !!p?.can_edit,
      can_delete: !!p?.can_delete,
    };
  }, [permsData]);

  // Map permissions to UI flags
  const showAdd = !!staffCasePerms.can_add;
  // View is always allowed for staff regardless of permissions
  const showView = true;
  const showEdit = !!staffCasePerms.can_edit;
  const showDelete = !!staffCasePerms.can_delete;
  // Case number should always be clickable to open case view
  const enableCaseNumberLink = true;
  const availableTypes = React.useMemo(() => {
    if (Array.isArray(caseTypesData)) return caseTypesData;
    if (Array.isArray(caseTypesData?.items)) return caseTypesData.items;
    if (Array.isArray(caseTypesData?.case_types))
      return caseTypesData.case_types;
    return [];
  }, [caseTypesData]);

  if (!staffId) {
    return (
      <div className="p-6 text-center text-amber-600">
        Unable to determine your staff ID. Please sign in again.
      </div>
    );
  }

  if (viewingCase) {
    return (
      <ViewCase
        viewingCase={viewingCase}
        onCloseCase={() => setViewingCase(null)}
        onEditCase={() => {}}
        onStatusChange={() => {}}
        onCloseThisCase={() => {}}
        navigateToScheduleHearing={() => {}}
        navigateToUploadDocuments={() => {}}
        navigateToAddJudgment={() => {}}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters toolbar from admin */}
      <Tools
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterType={filterType}
        setFilterType={setFilterType}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onAddCase={() => setShowAddCaseModal(true)}
        availableTypes={availableTypes}
        showAddButton={showAdd}
      />

      {/* Add modal */}
      {showAddCaseModal && (
        <AddCase
          isOpen={showAddCaseModal}
          onClose={() => setShowAddCaseModal(false)}
          lockedAssignedLawyerId={staffId}
          lockedAssignedLawyerName={staffDisplayName}
          onAddCase={async (payload) => {
            try {
              setAddError("");
              const created = await createCase(payload).unwrap();
              // Best-effort link in Clients service
              try {
                await linkCase({
                  client_id: payload?.client_id,
                  case_id: created?.id,
                  status: payload?.status || created?.status || undefined,
                  staff_id:
                    payload?.staff_id ||
                    payload?.assigned_lawyer_id ||
                    staffId ||
                    undefined,
                  staff_name:
                    payload?.staff_name ||
                    payload?.assigned_lawyer_name ||
                    undefined,
                }).unwrap();
              } catch (e) {
                console.warn("Linking client to case failed (non-fatal):", e);
              }
              setShowAddCaseModal(false);
              refetch();
            } catch (e) {
              setAddError(
                e?.data?.detail || e?.error || "Failed to create the case"
              );
            }
          }}
        />
      )}

      {/* Edit modal */}
      {editingCase && (
        <EditCase
          isOpen={!!editingCase}
          caseToEdit={editingCase}
          onClose={() => setEditingCase(null)}
          onEditCase={async (payload) => {
            try {
              setEditError("");
              await updateCase(payload).unwrap();
              setEditingCase(null);
              refetch();
            } catch (e) {
              setEditError(
                e?.data?.detail || e?.error || "Failed to update the case"
              );
            }
          }}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-48 bg-white rounded-xl shadow-md border border-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 font-medium">Failed to load cases</div>
          <div className="text-red-700 text-sm mt-1">
            {error?.data?.detail || error?.error || "Unknown error"}
          </div>
          <button
            className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      ) : (
        <CasesTable
          casesData={{ cases, pagination }}
          currentPage={pagination.page}
          onPageChange={setPage}
          onViewCase={(c) => setViewingCase(c)}
          onEditCase={(c) => setEditingCase(c)}
          onStatusChange={() => {}}
          onDeleteCase={async (toDelete) => {
            try {
              setDeleteError("");
              const caseId =
                typeof toDelete === "object" ? toDelete?.id : toDelete;
              if (caseId == null) return;
              await deleteCase(caseId).unwrap();
              if (viewingCase && viewingCase.id === caseId) {
                setViewingCase(null);
              }
              refetch();
            } catch (e) {
              setDeleteError(
                e?.data?.detail || e?.error || "Failed to delete the case"
              );
            }
          }}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          showEditButton={showEdit}
          showDeleteButton={showDelete}
          showViewButton={showView}
          enableCaseNumberLink={enableCaseNumberLink}
        />
      )}
      {editError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          {editError}
        </div>
      )}
      {addError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          {addError}
        </div>
      )}
      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}
    </div>
  );
};

export default StaffIndexCase;
