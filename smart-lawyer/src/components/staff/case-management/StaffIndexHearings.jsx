import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

// Reuse admin hearing components
import Tools from "../../admin/hearing-management/Tools";
import CalendarView from "../../admin/hearing-management/CalendarView";
import UpcomingHearing from "../../admin/hearing-management/UpcomingHearing";
import PastHearing from "../../admin/hearing-management/PastHearing";
import ScheduleHearing from "../../admin/hearing-management/ScheduleHearing";
import EditHearing from "../../admin/hearing-management/EditHearing";
import Attachments from "../../admin/hearing-management/Attachments";

// Reuse admin case view
import ViewCase from "../../admin/case-management/ViewCase";

// APIs
import {
  useGetCasesQuery,
  useLazyGetCaseByNumberQuery,
} from "../../../reduxstore/services/CaseManagementAPI";
import { useListPermissionsQuery } from "../../../reduxstore/services/PermissionsAPI";
import {
  useGetHearingsQuery,
  useCreateHearingMutation,
  useUpdateHearingMutation,
  useDeleteHearingMutation,
} from "../../../reduxstore/services/HearingsManagementAPI";

const StaffIndexHearings = ({ staffId: staffIdProp }) => {
  // Resolve staff and admin ids
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

  // Permissions (module: hearings)
  const { data: permsData } = useListPermissionsQuery(
    {
      admin_id: adminId ?? undefined,
      assigned_lawyer_id: staffId ?? undefined,
      module: "hearings",
    },
    { skip: !staffId }
  );

  const perms = useMemo(() => {
    const items = permsData?.items || [];
    const p = items[0];
    return {
      can_add: !!p?.can_add,
      can_edit: !!p?.can_edit,
      can_delete: !!p?.can_delete,
    };
  }, [permsData]);

  // State: view and filters
  const [view, setView] = useState("upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [hearingTypeFilter, setHearingTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("date_asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Cases for this staff (to schedule against and for ViewCase)
  // Note: don't filter by status here so we can view cases even if not active
  const {
    data: casesResp,
    refetch: refetchStaffCases,
    isFetching: isFetchingStaffCases,
  } = useGetCasesQuery(
    {
      page: 1,
      page_size: 100,
      assigned_lawyer_id: staffId || "",
      sort_by: "latest",
    },
    { skip: !staffId }
  );

  // Note: We avoid calling server with staff_id to reduce 422 noise; we'll still consider staff_id in client-side fallback.

  // Fallback: if backend assigned filter yields empty, fetch ALL cases and filter client-side by assigned_lawyer_id
  const {
    data: allCasesResp,
    refetch: refetchAllCases,
    isFetching: isFetchingAllCases,
  } = useGetCasesQuery(
    {
      page: 1,
      page_size: 100,
      sort_by: "latest",
    },
    {
      // Only fetch all cases if assigned_lawyer_id query returned nothing
      skip:
        !staffId ||
        (Array.isArray(casesResp?.cases) && casesResp.cases.length > 0),
    }
  );

  // Map utilities
  const mapCase = (c) => ({
    id: c.id,
    caseNumber: c.case_number,
    title: c.title,
    court: c.court_name,
    status: c.status,
    client_id: c.client_id,
    client_name: c.client_name,
    assigned_lawyer_id: c.assigned_lawyer_id,
    assigned_lawyer_name: c.assigned_lawyer_name,
  });

  // Assigned-only list (server if available, else client-side filtered from all)
  const assignedCasesData = useMemo(() => {
    const hasAssignedQuery =
      Array.isArray(casesResp?.cases) && casesResp.cases.length > 0;
    const staffIdStr = staffId != null ? String(staffId) : null;

    if (hasAssignedQuery) {
      return casesResp.cases.map(mapCase);
    }

    // Fallback to client-side filtering of all cases
    const base = allCasesResp?.cases || [];
    const list = base.filter((c) => {
      const assigned = String(c?.assigned_lawyer_id ?? "") === staffIdStr;
      const byStaff = String(c?.staff_id ?? "") === staffIdStr;
      return assigned || byStaff;
    });
    return list.map(mapCase);
  }, [casesResp, allCasesResp, staffId]);

  // All cases mapped (for a last-resort fallback display)
  const allMappedCases = useMemo(
    () => (allCasesResp?.cases || []).map(mapCase),
    [allCasesResp]
  );

  // (Status filter removed for staff scheduling to avoid hiding assigned cases.)

  // Use assigned cases for dropdown; fallback to all cases if none
  const casesForDropdown = useMemo(() => {
    if (assignedCasesData && assignedCasesData.length > 0) {
      return assignedCasesData;
    }
    return allMappedCases;
  }, [assignedCasesData, allMappedCases]);

  // Hearings scoped to staff
  const {
    data: hearingsDataResponse,
    refetch: refetchHearings,
    isLoading,
    error,
  } = useGetHearingsQuery(
    {
      page: currentPage,
      page_size: pageSize,
      sort_by: sortBy || (view === "upcoming" ? "date_asc" : "date_desc"),
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      hearing_type: hearingTypeFilter || undefined,
      hearing_date_from: dateFilter || undefined,
      hearing_date_to: dateToFilter || undefined,
      assigned_lawyer_id: staffId || undefined,
    },
    { skip: !staffId }
  );

  // Mutations
  const [createHearing] = useCreateHearingMutation();
  const [updateHearing] = useUpdateHearingMutation();
  const [deleteHearing] = useDeleteHearingMutation();

  // New/Edit hearing state
  const [showAddHearingModal, setShowAddHearingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditHearing, setCurrentEditHearing] = useState(null);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [attachmentsHearing, setAttachmentsHearing] = useState(null);
  const [newHearingData, setNewHearingData] = useState({
    caseId: "",
    date: "",
    time: "10:00",
    duration: "1 hour",
    type: "Initial Hearing",
    court: "",
    judge: "",
    location: "",
    notes: "",
    requiredDocuments: "",
  });
  const [newHearingErrors, setNewHearingErrors] = useState({});

  // Case view state
  const [viewingCase, setViewingCase] = useState(null);

  // Reset pagination on filter/view change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    view,
    searchTerm,
    dateFilter,
    dateToFilter,
    statusFilter,
    hearingTypeFilter,
    sortBy,
  ]);

  // Adjust sort with view
  useEffect(() => {
    if (sortBy === "date_asc" || sortBy === "date_desc") {
      setSortBy(view === "upcoming" ? "date_asc" : "date_desc");
    }
  }, [view, sortBy]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setDateToFilter("");
    setStatusFilter("");
    setHearingTypeFilter("");
    setSortBy(view === "upcoming" ? "date_asc" : "date_desc");
  };

  const hearingsData = useMemo(() => {
    const hearings = hearingsDataResponse?.data?.hearings || [];
    return hearings.map((hearing) => ({
      id: hearing.id,
      caseId: hearing.case_id,
      caseNumber: hearing.case_number,
      caseTitle: hearing.case_title,
      court: hearing.court_name,
      judge: hearing.judge_name,
      date: hearing.hearing_date,
      time: hearing.hearing_time,
      duration: hearing.duration,
      type: hearing.hearing_type,
      status: hearing.status,
      notes: hearing.notes || "",
      location: hearing.court_location,
      requiredDocuments: hearing.required_documents
        ? hearing.required_documents.split(",").map((d) => d.trim())
        : ["No documents specified"],
      assignedStaffId: hearing.assigned_lawyer_id,
      advocate: hearing.assigned_lawyer_name
        ? `Adv. ${hearing.assigned_lawyer_name}`
        : "Unassigned",
    }));
  }, [hearingsDataResponse]);

  // Front-end filter/group similar to admin for view segregation
  const filteredHearings = useMemo(() => {
    const list = hearingsData
      .filter((hearing) => {
        if (
          view === "upcoming" &&
          new Date(hearing.date) < new Date() &&
          hearing.status !== "adjourned"
        ) {
          return false;
        }
        if (
          view === "past" &&
          (new Date(hearing.date) >= new Date() ||
            hearing.status === "adjourned")
        ) {
          return false;
        }
        if (
          searchTerm &&
          !hearing.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !hearing.caseNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) &&
          !hearing.court.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }
        if (dateFilter && hearing.date < dateFilter) return false;
        if (dateToFilter && hearing.date > dateToFilter) return false;
        if (statusFilter && hearing.status !== statusFilter) return false;
        if (hearingTypeFilter && hearing.type !== hearingTypeFilter)
          return false;
        return true;
      })
      .sort((a, b) =>
        view === "upcoming"
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date)
      );
    return list;
  }, [
    hearingsData,
    view,
    searchTerm,
    dateFilter,
    dateToFilter,
    statusFilter,
    hearingTypeFilter,
  ]);

  const groupedHearings = useMemo(() => {
    return filteredHearings.reduce((acc, hearing) => {
      if (!acc[hearing.date]) acc[hearing.date] = [];
      acc[hearing.date].push(hearing);
      return acc;
    }, {});
  }, [filteredHearings]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calendar helpers
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(
    new Date().getMonth()
  );
  const [currentCalendarYear, setCurrentCalendarYear] = useState(
    new Date().getFullYear()
  );

  const goToPreviousMonth = () => {
    if (currentCalendarMonth === 0) {
      setCurrentCalendarMonth(11);
      setCurrentCalendarYear(currentCalendarYear - 1);
    } else setCurrentCalendarMonth(currentCalendarMonth - 1);
  };

  const goToNextMonth = () => {
    if (currentCalendarMonth === 11) {
      setCurrentCalendarMonth(0);
      setCurrentCalendarYear(currentCalendarYear + 1);
    } else setCurrentCalendarMonth(currentCalendarMonth + 1);
  };

  function generateCalendarDays() {
    const firstDayOfMonth = new Date(
      currentCalendarYear,
      currentCalendarMonth,
      1
    );
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(
      currentCalendarYear,
      currentCalendarMonth + 1,
      0
    ).getDate();

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ date: null, isCurrentMonth: false, isToday: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentCalendarYear, currentCalendarMonth, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
      });
    }

    const totalCells = 42;
    while (days.length < totalCells)
      days.push({ date: null, isCurrentMonth: false, isToday: false });

    return days;
  }

  function formatDateForComparison(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  }

  // Handlers
  const openAddHearingModal = () => {
    if (!perms.can_add) {
      alert("You don't have permission to schedule hearings.");
      return;
    }
    try {
      // Proactively refresh cases to populate dropdown
      refetchStaffCases?.();
      refetchAllCases?.();
      // Debug counts (non-intrusive)
      const assignedCount = Array.isArray(casesResp?.cases)
        ? casesResp.cases.length
        : 0;
      const allCount = Array.isArray(allCasesResp?.cases)
        ? allCasesResp.cases.length
        : 0;
      console.debug(
        "[Staff Hearings] Cases for dropdown — assigned:",
        assignedCount,
        "all:",
        allCount,
        "fetching:",
        { isFetchingStaffCases, isFetchingAllCases }
      );
    } catch (e) {
      console.debug(
        "[Staff Hearings] Cases refetch attempt failed (non-fatal)",
        e
      );
    }
    setNewHearingData({
      caseId: "",
      date: "",
      time: "10:00",
      duration: "1 hour",
      type: "Initial Hearing",
      court: "",
      judge: "",
      location: "",
      notes: "",
      requiredDocuments: "",
    });
    setNewHearingErrors({});
    setShowAddHearingModal(true);
  };

  const closeAddHearingModal = () => setShowAddHearingModal(false);

  const openEditHearingModal = (hearing) => {
    if (!perms.can_edit) {
      alert("You don't have permission to edit hearings.");
      return;
    }
    setCurrentEditHearing(hearing);
    setNewHearingData({
      caseId: hearing.caseId?.toString() || "",
      date: hearing.date || "",
      time: hearing.time || "10:00",
      duration: hearing.duration || "1 hour",
      type: hearing.type || "Initial Hearing",
      court: hearing.court || "",
      judge: hearing.judge || "",
      location: hearing.location || "",
      notes: hearing.notes || "",
      requiredDocuments: (hearing.requiredDocuments || []).join(", "),
    });
    setNewHearingErrors({});
    setShowEditModal(true);
  };

  const closeEditHearingModal = () => {
    setShowEditModal(false);
    setCurrentEditHearing(null);
  };

  const openAttachments = (hearing) => {
    setAttachmentsHearing(hearing);
    setShowAttachmentsModal(true);
  };

  const closeAttachments = () => {
    setShowAttachmentsModal(false);
    setAttachmentsHearing(null);
  };

  const handleHearingInputChange = (e) => {
    const { name, value } = e.target;
    setNewHearingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocumentsInput = (e) => {
    setNewHearingData((prev) => ({
      ...prev,
      requiredDocuments: e.target.value,
    }));
  };

  const validateHearingForm = () => {
    const errors = {};
    if (!newHearingData.caseId) errors.caseId = "Case selection is required";
    if (!newHearingData.date) {
      errors.date = "Hearing date is required";
    } else {
      const hearingDate = new Date(newHearingData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (hearingDate < today)
        errors.date = "Hearing date cannot be in the past";
    }
    if (!newHearingData.time) errors.time = "Hearing time is required";
    if (!newHearingData.duration)
      errors.duration = "Estimated duration is required";
    if (!newHearingData.type) errors.type = "Hearing type is required";
    if (!newHearingData.court) errors.court = "Court name is required";
    if (!newHearingData.judge) errors.judge = "Judge name is required";
    if (!newHearingData.location)
      errors.location = "Court location is required";
    setNewHearingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddHearing = async () => {
    if (!validateHearingForm()) return;
    const selectedCase = (casesForDropdown || []).find(
      (c) => c.id.toString() === newHearingData.caseId
    );
    if (!selectedCase) {
      setNewHearingErrors((prev) => ({
        ...prev,
        caseId: "Selected case not found",
      }));
      return;
    }
    const formattedDocuments = newHearingData.requiredDocuments
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
    try {
      await createHearing({
        case_id: parseInt(newHearingData.caseId),
        case_number: selectedCase.caseNumber,
        case_title: selectedCase.title,
        client_id: selectedCase.client_id,
        client_name: selectedCase.client_name,
        court_name: newHearingData.court,
        judge_name: newHearingData.judge,
        hearing_date: newHearingData.date,
        hearing_time: newHearingData.time,
        duration: newHearingData.duration,
        hearing_type: newHearingData.type,
        notes: newHearingData.notes,
        court_location: newHearingData.location,
        required_documents:
          formattedDocuments.length > 0
            ? formattedDocuments.join(", ")
            : "No documents specified",
        assigned_lawyer_id: selectedCase.assigned_lawyer_id || staffId || null,
        assigned_lawyer_name: selectedCase.assigned_lawyer_name || null,
      }).unwrap();
      setShowAddHearingModal(false);
      refetchHearings();
    } catch (e) {
      alert(e?.data?.detail || e?.error || "Failed to schedule hearing");
    }
  };

  const handleEditHearing = async () => {
    if (!currentEditHearing) return;
    if (!validateHearingForm()) return;
    const selectedCase = (casesForDropdown || []).find(
      (c) => c.id.toString() === newHearingData.caseId
    );
    if (!selectedCase) {
      setNewHearingErrors((prev) => ({
        ...prev,
        caseId: "Selected case not found",
      }));
      return;
    }
    const formattedDocuments = newHearingData.requiredDocuments
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
    try {
      await updateHearing({
        id: currentEditHearing.id,
        case_id: parseInt(newHearingData.caseId),
        case_number: selectedCase.caseNumber,
        case_title: selectedCase.title,
        client_id: selectedCase.client_id,
        client_name: selectedCase.client_name,
        court_name: newHearingData.court,
        judge_name: newHearingData.judge,
        hearing_date: newHearingData.date,
        hearing_time: newHearingData.time,
        duration: newHearingData.duration,
        hearing_type: newHearingData.type,
        notes: newHearingData.notes,
        court_location: newHearingData.location,
        required_documents:
          formattedDocuments.length > 0
            ? formattedDocuments.join(", ")
            : "No documents specified",
        assigned_lawyer_id: selectedCase.assigned_lawyer_id || staffId || null,
        assigned_lawyer_name: selectedCase.assigned_lawyer_name || null,
      }).unwrap();
      closeEditHearingModal();
      refetchHearings();
    } catch (e) {
      alert(e?.data?.detail || e?.error || "Failed to update hearing");
    }
  };

  const handleDeleteHearing = async (hearing) => {
    if (!perms.can_delete) {
      alert("You don't have permission to delete hearings.");
      return;
    }
    const ok = window.confirm(
      "Delete this hearing? This action cannot be undone."
    );
    if (!ok) return;
    try {
      await deleteHearing(hearing.id).unwrap();
      refetchHearings();
    } catch (e) {
      alert(e?.data?.detail || e?.error || "Failed to delete hearing");
    }
  };

  const [fetchCaseByNumber] = useLazyGetCaseByNumberQuery();

  const handleViewCase = async (hearing) => {
    // Prefer the raw case from API so field names align with ViewCase expectations
    const rawCases = casesResp?.cases || [];
    const targetId = hearing?.caseId != null ? Number(hearing.caseId) : null;
    const targetNumber = hearing?.caseNumber;

    let raw = null;
    if (targetId != null) {
      raw = rawCases.find((c) => Number(c.id) === targetId);
    }
    if (!raw && targetNumber) {
      raw = rawCases.find((c) => c.case_number === targetNumber);
    }

    if (raw) {
      setViewingCase(raw);
      return;
    }

    // Fallback: fetch directly by case number if available
    if (targetNumber) {
      try {
        const fetched = await fetchCaseByNumber(targetNumber).unwrap();
        if (fetched) {
          setViewingCase(fetched);
          return;
        }
      } catch {
        /* continue to simplified fallback */
      }
    }

    // Fallback: adapt our simplified case shape to expected keys
    const simplified =
      (assignedCasesData || []).find(
        (c) => Number(c.id) === targetId || c.caseNumber === targetNumber
      ) ||
      (allMappedCases || []).find(
        (c) => Number(c.id) === targetId || c.caseNumber === targetNumber
      );
    if (simplified) {
      const adapted = {
        ...simplified,
        // Map to ViewCase field names
        case_number: simplified.caseNumber,
        court_name: simplified.court,
      };
      setViewingCase(adapted);
      return;
    }

    alert("Case details not available.");
  };

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

  const pagination = hearingsDataResponse?.data?.pagination;
  const canSchedule = perms.can_add;

  return (
    <div className="space-y-3">
      <Tools
        view={view}
        onChangeView={setView}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        hearingTypeFilter={hearingTypeFilter}
        onHearingTypeFilterChange={setHearingTypeFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        dateToFilter={dateToFilter}
        onDateToFilterChange={setDateToFilter}
        onClearFilters={clearAllFilters}
        onScheduleClick={openAddHearingModal}
        canSchedule={canSchedule}
        activeCasesData={assignedCasesData}
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-48 bg-white rounded-xl shadow-md border border-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 font-medium">
            Failed to load hearings
          </div>
          <div className="text-red-700 text-sm mt-1">
            {error?.data?.detail || error?.error || "Unknown error"}
          </div>
          <button
            className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => refetchHearings()}
          >
            Retry
          </button>
        </div>
      ) : view === "calendar" ? (
        <CalendarView
          currentCalendarMonth={currentCalendarMonth}
          currentCalendarYear={currentCalendarYear}
          goToPreviousMonth={goToPreviousMonth}
          goToNextMonth={goToNextMonth}
          generateCalendarDays={generateCalendarDays}
          formatDateForComparison={formatDateForComparison}
          hearingsData={hearingsData}
          onViewCase={handleViewCase}
        />
      ) : view === "upcoming" ? (
        <UpcomingHearing
          groupedHearings={groupedHearings}
          onViewCase={handleViewCase}
          onEdit={openEditHearingModal}
          onDelete={handleDeleteHearing}
          onAttachments={openAttachments}
          formatDate={formatDate}
          pagination={pagination}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          showEdit={perms.can_edit}
          showDelete={perms.can_delete}
        />
      ) : (
        <PastHearing
          groupedHearings={groupedHearings}
          onViewCase={handleViewCase}
          onEdit={openEditHearingModal}
          onDelete={handleDeleteHearing}
          onAttachments={openAttachments}
          formatDate={formatDate}
          pagination={pagination}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          showEdit={perms.can_edit}
          showDelete={perms.can_delete}
        />
      )}

      {showAddHearingModal && (
        <ScheduleHearing
          activeCasesData={casesForDropdown}
          newHearingData={newHearingData}
          newHearingErrors={newHearingErrors}
          onClose={closeAddHearingModal}
          onChange={handleHearingInputChange}
          onDocumentsChange={handleDocumentsInput}
          onSubmit={handleAddHearing}
          // Treat as loading until we have at least one cases response available to avoid misleading empty state
          loadingCases={Boolean(
            isFetchingStaffCases ||
              isFetchingAllCases ||
              (!casesResp && !allCasesResp)
          )}
        />
      )}

      {showEditModal && (
        <EditHearing
          currentEditHearing={currentEditHearing}
          newHearingData={newHearingData}
          newHearingErrors={newHearingErrors}
          onClose={closeEditHearingModal}
          onChange={handleHearingInputChange}
          onDocumentsChange={handleDocumentsInput}
          onSubmit={handleEditHearing}
        />
      )}

      {showAttachmentsModal && attachmentsHearing && (
        <Attachments
          hearing={attachmentsHearing}
          onClose={closeAttachments}
          onViewCase={handleViewCase}
        />
      )}
    </div>
  );
};

export default StaffIndexHearings;
