import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";

// Reuse admin client components
import Tools from "../../admin/client-management/Tools";
import ClientTable from "../../admin/client-management/ClientTable";
import AddClient from "../../admin/client-management/AddClient";
import ViewClient from "../../admin/client-management/ViewClient";
import EditClient from "../../admin/client-management/EditClient";

// Services
import { useGetCasesQuery } from "../../../reduxstore/services/CaseManagementAPI";
import {
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from "../../../reduxstore/services/ClientsAPI";
import { useListPermissionsQuery } from "../../../reduxstore/services/PermissionsAPI";

const StaffIndexClient = ({ staffId: staffIdProp }) => {
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

  // Permissions (module: clients)
  const { data: permsData } = useListPermissionsQuery(
    {
      admin_id: adminId ?? undefined,
      assigned_lawyer_id: staffId ?? undefined,
      module: "clients",
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

  // Build allowed client IDs from assigned cases
  const allowedClientIds = useMemo(() => {
    const set = new Set();
    (assignedCases || []).forEach((c) => {
      if (c?.client_id != null) set.add(Number(c.client_id));
    });
    return set;
  }, [assignedCases]);

  // Filters & pagination similar to admin IndexClient
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch clients (then client-side scope to allowed IDs)
  const { data, currentData, isError } = useGetClientsQuery(
    {
      page,
      page_size: Math.min(pageSize, 100),
      search: searchTerm,
      type: filterType !== "all" ? filterType : undefined,
      marital_status: filterStatus !== "all" ? filterStatus : undefined,
      gender: filterGender !== "all" ? filterGender : undefined,
      join_date_from: startDate || undefined,
      join_date_to: endDate || undefined,
    },
    { skip: !staffId }
  );
  const [createClient] = useCreateClientMutation();
  const [updateClient] = useUpdateClientMutation();
  const [deleteClient] = useDeleteClientMutation();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addInitialData, setAddInitialData] = useState(null);

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewClient, setViewClient] = useState(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);

  // Delete confirmation modal state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState("");

  // Extract clients list from API response and scope to assigned cases' clients
  const listData = currentData ?? data;
  const apiClients = useMemo(() => listData?.data?.clients || [], [listData]);
  const scopedClients = useMemo(() => {
    if (!allowedClientIds.size) return [];
    return apiClients.filter((c) => allowedClientIds.has(Number(c.id)));
  }, [apiClients, allowedClientIds]);

  // Client-side search/filters (same as admin), applied after scoping
  const norm = (v) => (v || "").toString().trim().toLowerCase();
  const uiClients = useMemo(() => {
    return scopedClients.filter((c) => {
      if (filterType !== "all" && c.type !== filterType) return false;
      if (
        filterStatus !== "all" &&
        norm(c.maritalStatus) !== norm(filterStatus)
      )
        return false;
      if (filterGender !== "all" && norm(c.gender) !== norm(filterGender))
        return false;
      if (startDate) {
        const cd = new Date(c.joinDate);
        const sd = new Date(startDate);
        if (cd < sd) return false;
      }
      if (endDate) {
        const cd = new Date(c.joinDate);
        const ed = new Date(endDate);
        if (cd > ed) return false;
      }
      if (searchTerm) {
        const s = norm(searchTerm);
        const hit = [c.name, c.email, c.phone].some((v) => norm(v).includes(s));
        if (!hit) return false;
      }
      return true;
    });
  }, [
    scopedClients,
    filterType,
    filterStatus,
    filterGender,
    startDate,
    endDate,
    searchTerm,
  ]);

  // Reset to first page when search/filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterType, filterStatus, filterGender, startDate, endDate]);

  // Handlers with permission checks
  const handleAdd = async (formData) => {
    if (!perms.can_add) {
      alert("You don't have permission to add clients.");
      return;
    }
    try {
      await createClient(formData).unwrap();
      setIsAddOpen(false);
      setAddInitialData(null);
    } catch (err) {
      console.error("Failed to create client", err);
    }
  };

  const handleView = (client) => {
    setViewClient(client);
    setIsViewOpen(true);
  };

  const handleEditOpen = (client) => {
    if (!perms.can_edit) {
      alert("You don't have permission to edit clients.");
      return;
    }
    setEditClient(client);
    setIsEditOpen(true);
  };

  const handleEditSave = async (updated) => {
    if (!perms.can_edit) {
      alert("You don't have permission to edit clients.");
      return;
    }
    try {
      const { id, ...body } = updated;
      await updateClient({ id, ...body }).unwrap();
      setIsEditOpen(false);
      setEditClient(null);
    } catch (err) {
      console.error("Failed to update client", err);
    }
  };

  const requestDelete = (client) => {
    if (!perms.can_delete) {
      alert("You don't have permission to delete clients.");
      return;
    }
    setConfirmDeleteId(client?.id ?? null);
    setConfirmDeleteName(client?.name ?? "");
  };

  const cancelDelete = () => {
    setConfirmDeleteId(null);
    setConfirmDeleteName("");
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteClient(confirmDeleteId).unwrap();
    } catch (err) {
      console.error("Failed to delete client", err);
    } finally {
      cancelDelete();
    }
  };

  return (
    <>
      <Tools
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterGender={filterGender}
        onFilterGenderChange={setFilterGender}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClearFilters={() => {
          setFilterType("all");
          setFilterStatus("all");
          setFilterGender("all");
          setStartDate("");
          setEndDate("");
          setPage(1);
        }}
        onAddClient={() => {
          if (!perms.can_add) {
            alert("You don't have permission to add clients.");
            return;
          }
          setAddInitialData(null);
          setIsAddOpen(true);
        }}
      />

      <div className="bg-white rounded-xl shadow-sm">
        <ClientTable
          clients={isError ? [] : uiClients}
          page={page}
          pageSize={pageSize}
          total={uiClients.length}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onView={handleView}
          onEdit={handleEditOpen}
          onDelete={requestDelete}
        />
      </div>

      {/* Modals */}
      <AddClient
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAdd}
        initialData={addInitialData}
      />

      <ViewClient
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        client={viewClient}
      />

      <EditClient
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        client={editClient}
        onSave={handleEditSave}
      />

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <i className="ri-error-warning-line text-2xl text-red-500"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Delete client?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This action cannot be undone. This will permanently remove{" "}
                  <span className="font-medium">{confirmDeleteName}</span>.
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
    </>
  );
};

StaffIndexClient.propTypes = {
  staffId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default StaffIndexClient;
