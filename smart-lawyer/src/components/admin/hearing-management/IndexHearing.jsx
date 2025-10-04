import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Hearings.css";
import Tools from "./Tools";
import CalendarView from "./CalendarView";
import UpcomingHearing from "./UpcomingHearing";
import PastHearing from "./PastHearing";
import ScheduleHearing from "./ScheduleHearing";
import EditHearing from "./EditHearing";
import Attachments from "./Attachments";
// Use backend cases and hearings via RTK Query instead of static data
import { useGetCasesQuery } from "../../../reduxstore/services/CaseManagementAPI";
import {
  useGetHearingsQuery,
  useCreateHearingMutation,
  useUpdateHearingMutation,
  useDeleteHearingMutation,
  useGetHearingTypesQuery,
} from "../../../reduxstore/services/HearingsManagementAPI";

const IndexHearing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState("upcoming");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [hearingTypeFilter, setHearingTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("date_asc");
  const [showAddHearingModal, setShowAddHearingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditHearing, setCurrentEditHearing] = useState(null);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [currentAttachmentsHearing, setCurrentAttachmentsHearing] =
    useState(null);

  const [hearingAttachments, setHearingAttachments] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Fetch cases and hearings from backend
  const { data: casesDataResponse } = useGetCasesQuery({
    page: 1,
    page_size: 100,
    status: "active",
  });

  const { data: hearingsDataResponse, refetch: refetchHearings } =
    useGetHearingsQuery({
      page: currentPage,
      page_size: pageSize,
      sort_by: sortBy || (view === "upcoming" ? "date_asc" : "date_desc"),
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      hearing_type: hearingTypeFilter || undefined,
      hearing_date_from: dateFilter || undefined,
      hearing_date_to: dateToFilter || undefined,
    });

  const { data: hearingTypesResponse } = useGetHearingTypesQuery();

  // Mutations for hearings CRUD operations
  const [createHearing] = useCreateHearingMutation();
  const [updateHearing] = useUpdateHearingMutation();
  const [deleteHearing] = useDeleteHearingMutation();

  const activeCasesData = useMemo(() => {
    const active = casesDataResponse?.cases || [];
    // Normalize shape to match usage in this component
    const normalize = (c) => ({
      id: c.id,
      caseNumber: c.case_number,
      title: c.title,
      court: c.court_name,
      status: c.status,
      // include client linkage for hearings create/update
      client_id: c.client_id,
      client_name: c.client_name,
      assigned_lawyer_id: c.assigned_lawyer_id,
      assigned_lawyer_name: c.assigned_lawyer_name,
    });
    return active.map(normalize);
  }, [casesDataResponse]);

  const hearingsData = useMemo(() => {
    const hearings = hearingsDataResponse?.data?.hearings || [];
    // Transform backend hearing data to match component expectations
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
        ? hearing.required_documents.split(",").map((doc) => doc.trim())
        : ["No documents specified"],
      assignedStaffId: hearing.assigned_lawyer_id,
      advocate: hearing.assigned_lawyer_name
        ? `Adv. ${hearing.assigned_lawyer_name}`
        : "Unassigned",
    }));
  }, [hearingsDataResponse]);

  const availableHearingTypes = useMemo(() => {
    return (
      hearingTypesResponse?.data || [
        "Initial Hearing",
        "Arguments",
        "Evidence",
        "Final Hearing",
        "Bail Hearing",
        "Interim Application",
        "Case Management",
        "Settlement Conference",
        "Mediation",
        "Other",
      ]
    );
  }, [hearingTypesResponse]);

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

  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(
    new Date().getMonth()
  );
  const [currentCalendarYear, setCurrentCalendarYear] = useState(
    new Date().getFullYear()
  );
  const [showNotification, setShowNotification] = useState(false);
  const [upcomingHearings, setUpcomingHearings] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hearingToDelete, setHearingToDelete] = useState(null);

  // Reset pagination when view, search, or filters change
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

  // Clear all filters function
  const clearAllFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setDateToFilter("");
    setStatusFilter("");
    setHearingTypeFilter("");
    setSortBy(view === "upcoming" ? "date_asc" : "date_desc");
  };

  // Auto-adjust sort order when view changes (only if using default sort)
  useEffect(() => {
    if (sortBy === "date_asc" || sortBy === "date_desc") {
      setSortBy(view === "upcoming" ? "date_asc" : "date_desc");
    }
  }, [view, sortBy]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const caseNumber = queryParams.get("case");
    if (caseNumber && activeCasesData.length > 0) {
      const selectedCase = activeCasesData.find(
        (c) => c.caseNumber === caseNumber
      );
      if (selectedCase) {
        setNewHearingData((prevData) => ({
          ...prevData,
          caseId: selectedCase.id.toString(),
          court: selectedCase.court || "",
        }));
        setShowAddHearingModal(true);
      }
    }
  }, [location, activeCasesData]);

  const openAddHearingModal = () => {
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
    setCurrentEditHearing(hearing);
    const documentsString = Array.isArray(hearing.requiredDocuments)
      ? hearing.requiredDocuments.join(", ")
      : "";

    setNewHearingData({
      caseId:
        activeCasesData
          .find((c) => c.caseNumber === hearing.caseNumber)
          ?.id.toString() || "",
      date: hearing.date,
      time: hearing.time,
      duration: hearing.duration,
      type: hearing.type,
      court: hearing.court,
      judge: hearing.judge,
      location: hearing.location,
      notes: hearing.notes,
      requiredDocuments: documentsString,
    });

    setNewHearingErrors({});
    setShowEditModal(true);
  };

  const closeEditHearingModal = () => {
    setShowEditModal(false);
    setCurrentEditHearing(null);
  };

  const handleEditHearing = async () => {
    if (validateHearingForm()) {
      const selectedCase = activeCasesData.find(
        (c) => c.id.toString() === newHearingData.caseId
      );
      const formattedDocuments = newHearingData.requiredDocuments
        .split(",")
        .map((doc) => doc.trim())
        .filter((doc) => doc.length > 0);

      try {
        await updateHearing({
          id: currentEditHearing.id,
          case_id: parseInt(newHearingData.caseId),
          case_number:
            selectedCase?.caseNumber || currentEditHearing.caseNumber,
          case_title: selectedCase?.title || currentEditHearing.caseTitle,
          // ensure client linkage is persisted on update
          client_id: selectedCase?.client_id || null,
          client_name: selectedCase?.client_name || null,
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
          assigned_lawyer_id: selectedCase?.assigned_lawyer_id || null,
          assigned_lawyer_name: selectedCase?.assigned_lawyer_name || null,
        }).unwrap();

        closeEditHearingModal();
        console.log("Hearing updated successfully");
      } catch (error) {
        console.error("Failed to update hearing:", error);
        alert("Failed to update hearing. Please try again.");
      }
    }
  };

  const handleDeleteHearing = (hearing) => {
    setHearingToDelete(hearing);
    setShowDeleteModal(true);
  };

  const confirmDeleteHearing = async () => {
    if (hearingToDelete) {
      try {
        await deleteHearing(hearingToDelete.id).unwrap();
        console.log("Hearing deleted successfully");
        // Refetch hearings to update the list
        refetchHearings();
        setShowDeleteModal(false);
        setHearingToDelete(null);
      } catch (error) {
        console.error("Failed to delete hearing:", error);
        alert("Failed to delete hearing. Please try again.");
      }
    }
  };

  const cancelDeleteHearing = () => {
    setShowDeleteModal(false);
    setHearingToDelete(null);
  };

  const openAttachmentsModal = (hearing) => {
    setCurrentAttachmentsHearing(hearing);
    setShowAttachmentsModal(true);
  };

  const handleAttachmentFileSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newFiles = files.map((file) => {
        const fileExtension = file.name.split(".").pop().toLowerCase();
        let fileType = "Unknown";
        if (fileExtension === "pdf") fileType = "PDF";
        else if (["doc", "docx"].includes(fileExtension)) fileType = "DOCX";
        else if (["jpg", "jpeg", "png"].includes(fileExtension))
          fileType = "Image";
        else if (["xls", "xlsx"].includes(fileExtension)) fileType = "XLSX";

        const sizeInKB = file.size / 1024;
        let fileSize;
        if (sizeInKB < 1024) fileSize = `${sizeInKB.toFixed(1)} KB`;
        else fileSize = `${(sizeInKB / 1024).toFixed(1)} MB`;

        return {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: fileType,
          size: fileSize,
          file: file,
          uploadDate: new Date().toISOString().split("T")[0],
        };
      });

      if (currentAttachmentsHearing) {
        const hearingId = currentAttachmentsHearing.id;
        setHearingAttachments((prev) => ({
          ...prev,
          [hearingId]: [...(prev[hearingId] || []), ...newFiles],
        }));
      }
    }
  };

  const removeAttachment = (attachmentId) => {
    if (currentAttachmentsHearing) {
      const hearingId = currentAttachmentsHearing.id;
      const updatedAttachments = (hearingAttachments[hearingId] || []).filter(
        (attachment) => attachment.id !== attachmentId
      );
      setHearingAttachments((prev) => ({
        ...prev,
        [hearingId]: updatedAttachments,
      }));
    }
  };

  const getCurrentAttachments = (hearingId) =>
    hearingAttachments[hearingId] || [];

  const handleViewCase = (hearing) => {
    // Directly navigate by case number; case page will fetch from backend
    if (hearing?.caseNumber) {
      navigate(`/admin/:username/cases/${hearing.caseNumber}`);
    } else {
      alert("Case number not available for this hearing");
    }
  };

  const handleHearingInputChange = (e) => {
    const { name, value } = e.target;
    if (newHearingErrors[name])
      setNewHearingErrors({ ...newHearingErrors, [name]: "" });

    setNewHearingData({ ...newHearingData, [name]: value });

    if (name === "caseId" && value) {
      const selectedCase = activeCasesData.find(
        (c) => c.id.toString() === value
      );
      if (selectedCase)
        setNewHearingData((prev) => ({ ...prev, court: selectedCase.court }));
    }
  };

  const handleDocumentsInput = (e) => {
    setNewHearingData({ ...newHearingData, requiredDocuments: e.target.value });
  };

  const validateHearingForm = () => {
    const errors = {};
    if (!newHearingData.caseId) errors.caseId = "Please select a case";
    if (!newHearingData.date) errors.date = "Hearing date is required";
    else {
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
    if (validateHearingForm()) {
      const selectedCase = activeCasesData.find(
        (c) => c.id.toString() === newHearingData.caseId
      );
      const formattedDocuments = newHearingData.requiredDocuments
        .split(",")
        .map((doc) => doc.trim())
        .filter((doc) => doc.length > 0);

      try {
        await createHearing({
          case_id: parseInt(newHearingData.caseId),
          case_number: selectedCase.caseNumber,
          case_title: selectedCase.title,
          // include client linkage so backend stores it
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
          assigned_lawyer_id: selectedCase.assigned_lawyer_id || null,
          assigned_lawyer_name: selectedCase.assigned_lawyer_name || null,
        }).unwrap();

        closeAddHearingModal();
        console.log("New hearing scheduled successfully");
      } catch (error) {
        console.error("Failed to create hearing:", error);
        alert("Failed to schedule hearing. Please try again.");
      }
    }
  };

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
        if (dateFilter && hearing.date !== dateFilter) return false;
        return true;
      })
      .sort((a, b) =>
        view === "upcoming"
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date)
      );
    return list;
  }, [hearingsData, view, searchTerm, dateFilter]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const groupedHearings = useMemo(() => {
    return filteredHearings.reduce((acc, hearing) => {
      if (!acc[hearing.date]) acc[hearing.date] = [];
      acc[hearing.date].push(hearing);
      return acc;
    }, {});
  }, [filteredHearings]);

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

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const upcoming = hearingsData.filter((hearing) => {
      const hearingDate = new Date(hearing.date);
      hearingDate.setHours(0, 0, 0, 0);
      return (
        hearingDate >= today &&
        hearingDate <= nextWeek &&
        hearing.status === "scheduled"
      );
    });

    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    setUpcomingHearings(upcoming);

    if (upcoming.length > 0) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [hearingsData]);

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

  return (
    <div>
      {activeCasesData.length === 0 && (
        <div className="mb-4 p-4 border border-amber-200 bg-amber-50 rounded-lg text-amber-800">
          <p className="text-sm">
            You have no active cases. Add a case first to schedule hearings.
          </p>
        </div>
      )}

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
        canSchedule={activeCasesData.length > 0}
        activeCasesData={activeCasesData}
      />

      {view === "calendar" ? (
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
          onAttachments={openAttachmentsModal}
          formatDate={formatDate}
          pagination={hearingsDataResponse?.data?.pagination}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      ) : (
        <PastHearing
          groupedHearings={groupedHearings}
          onViewCase={handleViewCase}
          onEdit={openEditHearingModal}
          onDelete={handleDeleteHearing}
          onAttachments={openAttachmentsModal}
          formatDate={formatDate}
          pagination={hearingsDataResponse?.data?.pagination}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      )}

      {showAddHearingModal && (
        <ScheduleHearing
          activeCasesData={activeCasesData}
          newHearingData={newHearingData}
          newHearingErrors={newHearingErrors}
          onClose={closeAddHearingModal}
          onChange={handleHearingInputChange}
          onDocumentsChange={handleDocumentsInput}
          onSubmit={handleAddHearing}
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

      {showAttachmentsModal && (
        <Attachments
          hearing={currentAttachmentsHearing}
          getCurrentAttachments={getCurrentAttachments}
          onClose={() => setShowAttachmentsModal(false)}
          onSelectFiles={handleAttachmentFileSelection}
          onRemoveAttachment={removeAttachment}
          onViewCase={handleViewCase}
        />
      )}

      {showDeleteModal && hearingToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="ri-delete-bin-line text-red-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Hearing
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-700 mb-4">
                  Are you sure you want to delete this hearing?
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Case:
                      </span>
                      <span className="text-sm text-gray-900">
                        {hearingToDelete.caseTitle}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Date:
                      </span>
                      <span className="text-sm text-gray-900">
                        {hearingToDelete.date}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Time:
                      </span>
                      <span className="text-sm text-gray-900">
                        {hearingToDelete.time}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Court:
                      </span>
                      <span className="text-sm text-gray-900">
                        {hearingToDelete.court}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDeleteHearing}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteHearing}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete Hearing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNotification && upcomingHearings.length > 0 && (
        <div className="fixed bottom-5 right-5 max-w-sm z-50 notification-animation">
          <div className="bg-white rounded-lg shadow-lg border-l-4 border-emerald-500 overflow-hidden">
            <div className="bg-emerald-50 px-4 py-2 flex justify-between items-center">
              <h4 className="font-medium text-emerald-800 flex items-center">
                <i className="ri-notification-3-line mr-2"></i>
                Upcoming Hearings
              </h4>
              <button
                onClick={() => setShowNotification(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto">
              <p className="text-sm text-gray-600 mb-3">
                You have {upcomingHearings.length} upcoming hearing
                {upcomingHearings.length > 1 ? "s" : ""} in the next 7 days:
              </p>
              <ul className="space-y-2">
                {upcomingHearings.map((hearing, index) => (
                  <li
                    key={index}
                    className="border-b border-gray-100 pb-2 last:border-b-0 last:pb-0"
                  >
                    <p className="text-sm font-medium">{hearing.caseTitle}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {new Date(hearing.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span>{hearing.time}</span>
                    </div>
                    <p className="text-xs mt-1">{hearing.court}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setView("upcoming");
                    setShowNotification(false);
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                >
                  View all upcoming hearings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndexHearing;
