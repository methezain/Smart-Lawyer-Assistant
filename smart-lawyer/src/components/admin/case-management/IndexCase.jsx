import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Import API hooks for backend integration
import {
  useGetCasesQuery,
  useGetCaseByNumberQuery,
  useCreateCaseMutation,
  useUpdateCaseMutation,
  useDeleteCaseMutation,
  useGetCaseTypesQuery,
} from "../../../reduxstore/services/CaseManagementAPI";
import { useLinkCaseMutation } from "../../../reduxstore/services/ClientsAPI";
// Import sub-components
import Tools from "./Tools";
import CasesTable from "./CasesTable";
import ViewCase from "./ViewCase";
import AddCase from "./AddCase";
import EditCase from "./EditCase";

const IndexCase = ({ viewingCaseNumber }) => {
  const navigate = useNavigate();

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal and viewing state
  const [viewingCase, setViewingCase] = useState(null);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showEditCaseModal, setShowEditCaseModal] = useState(false);
  const [editingCase, setEditingCase] = useState(null);

  // API hooks
  const {
    data: casesData,
    error: casesError,
    isLoading: casesLoading,
    refetch: refetchCases,
  } = useGetCasesQuery({
    page: currentPage,
    page_size: pageSize,
    search: searchTerm || undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
    type: filterType !== "all" ? filterType : undefined,
    sort_by: sortBy,
  });

  const {
    data: caseByNumber,
    error: caseByNumberError,
    isLoading: caseByNumberLoading,
  } = useGetCaseByNumberQuery(viewingCaseNumber, {
    skip: !viewingCaseNumber,
  });

  const { data: caseTypes = [] } = useGetCaseTypesQuery();

  // Mutations
  const [createCase] = useCreateCaseMutation();
  const [updateCase] = useUpdateCaseMutation();
  const [deleteCase] = useDeleteCaseMutation();
  const [linkCase] = useLinkCaseMutation();

  // Set viewing case from URL case number
  useEffect(() => {
    if (viewingCaseNumber && caseByNumber) {
      setViewingCase(caseByNumber);
    }
  }, [viewingCaseNumber, caseByNumber]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterType, sortBy]);

  // Clear filters function
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterType("all");
    setSortBy("latest");
    setCurrentPage(1);
    setPageSize(15);
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm !== "" ||
    filterStatus !== "all" ||
    filterType !== "all" ||
    sortBy !== "latest";

  // Handle case status change
  const handleStatusChange = async (caseItem, newStatus) => {
    try {
      await updateCase({
        id: caseItem.id,
        status: newStatus,
      }).unwrap();

      // If we're viewing this case, update the viewing case as well
      if (viewingCase && viewingCase.id === caseItem.id) {
        setViewingCase({ ...viewingCase, status: newStatus });
      }

      // Refetch cases to get updated data
      refetchCases();
    } catch (error) {
      console.error("Failed to update case status:", error);
      // You might want to show a toast notification here
    }
  };

  const handleViewCase = (caseItem) => {
    setViewingCase(caseItem);
    // Update URL with case number
    navigate(`/admin/:username/cases/${caseItem.case_number}`);
  };

  const closeCase = () => {
    setViewingCase(null);
    // Remove case number from URL
    navigate("/admin/:username/cases");
  };

  const openNewCaseModal = () => {
    setShowNewCaseModal(true);
  };

  const closeNewCaseModal = () => {
    setShowNewCaseModal(false);
  };

  const openEditCaseModal = (caseItem) => {
    setEditingCase(caseItem);
    setShowEditCaseModal(true);
  };

  const closeEditCaseModal = () => {
    setShowEditCaseModal(false);
    setEditingCase(null);
  };

  const handleEditCase = async (editedCase) => {
    try {
      await updateCase({
        id: editedCase.id,
        ...editedCase,
      }).unwrap();

      // If we're viewing this case, update the viewing case as well
      if (viewingCase && viewingCase.id === editedCase.id) {
        setViewingCase({ ...editedCase });
      }

      // Close the modal
      closeEditCaseModal();

      // Refetch cases to get updated data
      refetchCases();
    } catch (error) {
      console.error("Failed to update case:", error);
      // You might want to show a toast notification here
    }
  };

  const handleAddNewCase = async (newCaseData) => {
    try {
      const created = await createCase(newCaseData).unwrap();

      // Best-effort link in client service with staff
      try {
        await linkCase({
          client_id: newCaseData.client_id,
          case_id: created?.id,
          status: newCaseData?.status || created?.status || undefined,
          staff_id:
            newCaseData.staff_id || newCaseData.assigned_lawyer_id || undefined,
          staff_name:
            newCaseData.staff_name ||
            newCaseData.assigned_lawyer_name ||
            undefined,
        }).unwrap();
      } catch (e) {
        console.warn("Linking client to case failed (non-fatal):", e);
      }

      // Close the modal
      closeNewCaseModal();

      // Refetch cases to get updated data
      refetchCases();
    } catch (error) {
      // Enhanced diagnostics
      console.error("Failed to create case", {
        status: error?.status,
        data: error?.data,
        payload: newCaseData,
      });
      if (error?.data?.detail) {
        console.error("Validation detail:", error.data.detail);
      }
      // You might want to show a toast notification here
    }
  };

  // Function to navigate to other components with the case information
  const navigateToScheduleHearing = (caseItem) => {
    navigate(`/admin/:username/hearings?case=${caseItem.case_number}`);
  };

  const navigateToUploadDocuments = (caseItem) => {
    navigate(`/admin/:username/documents?case=${caseItem.case_number}`);
  };

  const navigateToAddJudgment = (caseItem) => {
    navigate(`/admin/:username/judgments?case=${caseItem.case_number}`);
  };

  const handleCloseCase = async (caseItem) => {
    try {
      await updateCase({
        id: caseItem.id,
        status: "closed",
      }).unwrap();

      // If we're viewing this case, update the viewing case as well
      if (viewingCase && viewingCase.id === caseItem.id) {
        setViewingCase({ ...viewingCase, status: "closed" });
      }

      // Refetch cases to get updated data
      refetchCases();
    } catch (error) {
      console.error("Failed to close case:", error);
      // You might want to show a toast notification here
    }
  };

  const handleDeleteCase = async (caseToDelete) => {
    try {
      // Extract the ID from the case object if it's an object, otherwise use directly
      const caseId =
        typeof caseToDelete === "object" ? caseToDelete.id : caseToDelete;

      await deleteCase(caseId).unwrap();

      // If we're viewing this case, close the view
      if (viewingCase && viewingCase.id === caseId) {
        closeCase();
      }

      // Refetch cases to get updated data
      refetchCases();
    } catch (error) {
      console.error("Failed to delete case:", error);
      // You might want to show a toast notification here
    }
  };

  // Get all unique case types for the filter dropdown
  const getAllCaseTypes = () => {
    return caseTypes;
  };

  // Handle loading states
  if (viewingCaseNumber && caseByNumberLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Handle error states
  if (casesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading cases
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                {casesError.message || "An error occurred while loading cases"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewingCaseNumber && caseByNumberError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Case not found</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                The case with number "{viewingCaseNumber}" could not be found.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {viewingCase ? (
        <ViewCase
          viewingCase={viewingCase}
          onCloseCase={closeCase}
          onEditCase={openEditCaseModal}
          onStatusChange={handleStatusChange}
          onCloseThisCase={handleCloseCase}
          onDeleteCase={handleDeleteCase}
          navigateToScheduleHearing={navigateToScheduleHearing}
          navigateToUploadDocuments={navigateToUploadDocuments}
          navigateToAddJudgment={navigateToAddJudgment}
        />
      ) : (
        <>
          {/* Tools Component - Search, Filter, Add Case Button */}
          <Tools
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterType={filterType}
            setFilterType={setFilterType}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onAddCase={openNewCaseModal}
            availableTypes={getAllCaseTypes()}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Cases Table Component */}
          {casesLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <CasesTable
              casesData={casesData}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              onViewCase={handleViewCase}
              onEditCase={openEditCaseModal}
              onStatusChange={handleStatusChange}
              onDeleteCase={handleDeleteCase}
            />
          )}
        </>
      )}

      {/* Add Case Modal */}
      <AddCase
        isOpen={showNewCaseModal}
        onClose={closeNewCaseModal}
        onAddCase={handleAddNewCase}
      />

      {/* Edit Case Modal */}
      <EditCase
        isOpen={showEditCaseModal}
        onClose={closeEditCaseModal}
        onEditCase={handleEditCase}
        caseToEdit={editingCase}
      />
    </div>
  );
};

export default IndexCase;
