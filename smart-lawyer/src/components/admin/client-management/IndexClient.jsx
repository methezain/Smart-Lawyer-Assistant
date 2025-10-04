import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Tools from "./Tools";
import ClientTable from "./ClientTable";
import AddClient from "./AddClient";
import ViewClient from "./ViewClient";
import EditClient from "./EditClient";
import {
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from "../../../reduxstore/services/ClientsAPI";

const IndexClient = () => {
  const location = useLocation();

  // Filters & pagination (page size kept static for now)
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  // New filters
  const [filterType, setFilterType] = useState("all"); // Individual | Business | all
  const [filterStatus, setFilterStatus] = useState("all"); // Single | Married | Divorced | Widowed | all
  const [filterGender, setFilterGender] = useState("all"); // Male | Female | Eunuch | all
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // API hooks
  const { data, currentData, isError } = useGetClientsQuery({
    page,
    page_size: pageSize,
    search: searchTerm,
    type: filterType !== "all" ? filterType : undefined,
    marital_status: filterStatus !== "all" ? filterStatus : undefined,
    gender: filterGender !== "all" ? filterGender : undefined,
    join_date_from: startDate || undefined,
    join_date_to: endDate || undefined,
  });
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

  // Handle convert from message (prefill add form)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const convertId = params.get("convert");
    if (convertId) {
      const name = params.get("name") || "";
      const email = params.get("email") || "";
      const phone = params.get("phone") || "";

      setAddInitialData({
        name,
        email,
        phone,
        type: "Individual",
        onlineStatus: "offline",
        notes: `Converted from inquiry. Original conversation ID: ${convertId}`,
      });
      setIsAddOpen(true);
    }
  }, [location]);

  // Extract clients list from API response
  const listData = currentData ?? data;
  const apiClients = listData?.data?.clients || [];
  const total = listData?.data?.pagination?.total || 0;

  // Client-side fallback filtering (in case backend params are ignored by env)
  const norm = (v) => (v || "").toString().trim().toLowerCase();
  const uiClients = apiClients.filter((c) => {
    if (filterType !== "all" && c.type !== filterType) return false;
    if (filterStatus !== "all" && norm(c.maritalStatus) !== norm(filterStatus))
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

  // Reset to first page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterType, filterStatus, filterGender, startDate, endDate]);

  // Handlers
  const handleAdd = async (formData) => {
    try {
      await createClient(formData).unwrap();
      setIsAddOpen(false);
      setAddInitialData(null);
    } catch (e) {
      console.error("Failed to create client", e);
    }
  };

  const handleView = (client) => {
    setViewClient(client);
    setIsViewOpen(true);
  };

  const handleEditOpen = (client) => {
    setEditClient(client);
    setIsEditOpen(true);
  };

  const handleEditSave = async (updated) => {
    try {
      const { id, ...body } = updated;
      await updateClient({ id, ...body }).unwrap();
      setIsEditOpen(false);
      setEditClient(null);
    } catch (e) {
      console.error("Failed to update client", e);
    }
  };

  const requestDelete = (client) => {
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
    } catch (e) {
      console.error("Failed to delete client", e);
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
          setAddInitialData(null);
          setIsAddOpen(true);
        }}
      />

      <div className="bg-white rounded-xl shadow-sm">
        <ClientTable
          clients={isError ? [] : uiClients}
          page={page}
          pageSize={pageSize}
          total={uiClients.length || total}
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

export default IndexClient;
