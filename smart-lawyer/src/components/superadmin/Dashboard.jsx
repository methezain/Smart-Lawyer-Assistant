import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  useGetAllRegistrationsQuery,
  useUpdateRegistrationStatusMutation,
} from "../../reduxstore/services/RegistrationAPI";

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Add state for notifications
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Use RTK Query hooks
  const {
    data: registrationsData,
    isLoading,
    refetch,
  } = useGetAllRegistrationsQuery();

  const [updateStatus] = useUpdateRegistrationStatusMutation();

  useEffect(() => {
    if (registrationsData?.data?.registrations) {
      const registrations = registrationsData.data.registrations;
      // Calculate statistics
      const stats = {
        total: registrations.length,
        pending: registrations.filter((r) => r.user?.status === "pending")
          .length,
        approved: registrations.filter((r) => r.user?.status === "approved")
          .length,
        rejected: registrations.filter((r) => r.user?.status === "rejected")
          .length,
      };
      setStatistics(stats);
    }
  }, [registrationsData]);

  // Filter firms based on search and status filter
  const filteredFirms =
    registrationsData?.data?.registrations?.filter((registration) => {
      const firm = registration.firm;
      const user = registration.user;
      const contact = registration.contact;

      const matchesSearch =
        firm?.firm_name?.toLowerCase().includes(search.toLowerCase()) ||
        contact?.address?.toLowerCase().includes(search.toLowerCase()) ||
        contact?.email?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || user?.status === statusFilter;

      return matchesSearch && matchesStatus;
    }) || [];

  const handleViewDetails = (registration) => {
    setSelectedFirm(registration);
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const result = await updateStatus({
        registrationId: userId,
        status: newStatus,
      }).unwrap();

      // Show notification if email was sent
      if (result.data?.email_sent) {
        setNotification({
          show: true,
          message: `Status updated to ${newStatus}. Notification email sent.`,
          type: "success",
        });
      } else {
        setNotification({
          show: true,
          message: `Status updated to ${newStatus}.`,
          type: "success",
        });
      }

      // Hide notification after 5 seconds
      setTimeout(() => {
        setNotification((prev) => ({
          ...prev,
          show: false,
        }));
      }, 5000);

      // Refresh the data after status update
      refetch();

      // Update selected firm if viewing details
      if (selectedFirm && selectedFirm.user?.id === userId) {
        setSelectedFirm({
          ...selectedFirm,
          user: { ...selectedFirm.user, status: newStatus },
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      // Show error notification
      setNotification({
        show: true,
        message: error.message || "Error updating status",
        type: "error",
      });

      // Hide notification after 5 seconds
      setTimeout(() => {
        setNotification((prev) => ({
          ...prev,
          show: false,
        }));
      }, 5000);
    }
  };

  const closeModal = () => {
    setSelectedFirm(null);
  };

  const handleRefresh = () => {
    refetch();
    setSearch("");
    setStatusFilter("all");
  };

  const handleResetData = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all data to default mock data? This cannot be undone."
      )
    ) {
      // Implement reset to mock data logic here
      handleRefresh();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <header className="bg-[#0c0c0c] text-white py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">SmartLawyer SuperAdmin</h1>
          <div className="flex items-center space-x-4">
            <button className="text-white hover:text-gray-300 transition">
              <i className="ri-notification-3-line text-lg"></i>
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center mr-2">
                <span className="font-semibold">SA</span>
              </div>
              <span>Admin</span>
            </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-500 transform translate-y-0 ${
            notification.type === "success"
              ? "bg-emerald-100 text-emerald-800 border-l-4 border-emerald-500"
              : "bg-red-100 text-red-800 border-l-4 border-red-500"
          }`}
        >
          <div className="flex items-center">
            {notification.type === "success" ? (
              <i className="ri-check-line text-emerald-500 mr-2"></i>
            ) : (
              <i className="ri-error-warning-line text-red-500 mr-2"></i>
            )}
            <p>{notification.message}</p>
            <button
              onClick={() => setNotification({ ...notification, show: false })}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold mb-6">
          Firm Registration Management
        </h2>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Registrations</p>
                <p className="text-2xl font-semibold">{statistics.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="ri-building-line text-blue-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-semibold">{statistics.pending}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <i className="ri-time-line text-yellow-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-semibold">{statistics.approved}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <i className="ri-check-line text-emerald-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-semibold">{statistics.rejected}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <i className="ri-close-line text-red-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ri-search-line text-gray-400"></i>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Search by firm name, location, or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-4">
              <select
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                onClick={handleRefresh}
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
              >
                <i className="ri-refresh-line mr-1"></i> Refresh
              </button>

              <button
                onClick={handleResetData}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                title="Reset to initial data"
              >
                <i className="ri-restart-line mr-1"></i> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Firm
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Location
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Submitted
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFirms.length > 0 ? (
                filteredFirms.map((registration) => (
                  <tr key={registration.user?.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                          <i className="ri-building-line"></i>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {registration.firm?.firm_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {registration.contact?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registration.contact?.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registration.firm?.firm_type || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(
                        registration.user?.created_at
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          registration.user?.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : registration.user?.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {registration.user?.status?.charAt(0).toUpperCase() +
                          registration.user?.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(registration)}
                        className="text-emerald-600 hover:text-emerald-900 mr-3"
                      >
                        View Details
                      </button>
                      {registration.user?.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusChange(
                                registration.user?.id,
                                "approved"
                              )
                            }
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(
                                registration.user?.id,
                                "rejected"
                              )
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No registrations found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Firm Details Modal */}
      {selectedFirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-emerald-600 to-blue-600 px-6 py-4 text-white flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-semibold">
                {selectedFirm.firm?.firm_name} - Firm Profile
              </h2>
              <button
                onClick={closeModal}
                className="text-white hover:text-gray-200"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="p-6">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-gray-200">
                <div className="flex-shrink-0 h-40 w-40 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={
                      selectedFirm.firm?.profile_image_path ||
                      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop"
                    }
                    alt={selectedFirm.firm?.firm_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {selectedFirm.firm?.firm_name}
                      </h3>
                      <p className="text-gray-600">
                        {selectedFirm.firm?.firm_type}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm leading-5 font-semibold rounded-full 
                      ${
                        selectedFirm.user?.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : selectedFirm.user?.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {selectedFirm.user?.status?.charAt(0).toUpperCase() +
                        selectedFirm.user?.status?.slice(1)}
                    </span>
                  </div>

                  <p className="mt-3 text-gray-600">
                    {selectedFirm.firm?.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {selectedFirm.firm?.specialty &&
                      (typeof selectedFirm.firm.specialty === "string"
                        ? JSON.parse(selectedFirm.firm.specialty)
                        : selectedFirm.firm.specialty
                      ).map((specialty, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                        >
                          {specialty}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {/* Main Content - Two Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Left Column */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Firm Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Established
                      </p>
                      <p className="text-base">
                        {selectedFirm.firm?.established_year}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Location
                      </p>
                      <p className="text-base">
                        {selectedFirm.contact?.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Address
                      </p>
                      <p className="text-base">
                        {selectedFirm.contact?.address},{" "}
                        {selectedFirm.contact?.city},{" "}
                        {selectedFirm.contact?.state}{" "}
                        {selectedFirm.contact?.zip_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Contact Information
                      </p>
                      <p className="text-base">
                        <i className="ri-mail-line mr-2"></i>{" "}
                        {selectedFirm.contact?.email}
                      </p>
                      <p className="text-base">
                        <i className="ri-phone-line mr-2"></i>{" "}
                        {selectedFirm.contact?.phone}
                      </p>
                      {selectedFirm.contact?.website && (
                        <p className="text-base">
                          <i className="ri-global-line mr-2"></i>{" "}
                          {selectedFirm.contact?.website}
                        </p>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mt-6 mb-4">
                    Business Hours
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedFirm.contact?.operating_hours && (
                      <>
                        <div>
                          <p className="font-medium">Monday</p>
                          <p className="text-gray-600">
                            {selectedFirm.contact.operating_hours.monday_closed
                              ? "Closed"
                              : `${
                                  selectedFirm.contact.operating_hours
                                    .monday_start || "9:00 AM"
                                } - ${
                                  selectedFirm.contact.operating_hours
                                    .monday_end || "6:00 PM"
                                }`}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Tuesday</p>
                          <p className="text-gray-600">
                            {selectedFirm.contact.operating_hours.tuesday_closed
                              ? "Closed"
                              : `${
                                  selectedFirm.contact.operating_hours
                                    .tuesday_start || "9:00 AM"
                                } - ${
                                  selectedFirm.contact.operating_hours
                                    .tuesday_end || "6:00 PM"
                                }`}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Wednesday</p>
                          <p className="text-gray-600">
                            {selectedFirm.contact.operating_hours
                              .wednesday_closed
                              ? "Closed"
                              : `${
                                  selectedFirm.contact.operating_hours
                                    .wednesday_start || "9:00 AM"
                                } - ${
                                  selectedFirm.contact.operating_hours
                                    .wednesday_end || "6:00 PM"
                                }`}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Thursday</p>
                          <p className="text-gray-600">
                            {selectedFirm.contact.operating_hours
                              .thursday_closed
                              ? "Closed"
                              : `${
                                  selectedFirm.contact.operating_hours
                                    .thursday_start || "9:00 AM"
                                } - ${
                                  selectedFirm.contact.operating_hours
                                    .thursday_end || "6:00 PM"
                                }`}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Friday</p>
                          <p className="text-gray-600">
                            {selectedFirm.contact.operating_hours.friday_closed
                              ? "Closed"
                              : `${
                                  selectedFirm.contact.operating_hours
                                    .friday_start || "9:00 AM"
                                } - ${
                                  selectedFirm.contact.operating_hours
                                    .friday_end || "6:00 PM"
                                }`}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Saturday</p>
                          <p className="text-gray-600">
                            {selectedFirm.contact.operating_hours
                              .saturday_closed
                              ? "Closed"
                              : `${
                                  selectedFirm.contact.operating_hours
                                    .saturday_start || "10:00 AM"
                                } - ${
                                  selectedFirm.contact.operating_hours
                                    .saturday_end || "2:00 PM"
                                }`}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Sunday</p>
                          <p className="text-gray-600">
                            {selectedFirm.contact.operating_hours.sunday_closed
                              ? "Closed"
                              : `${
                                  selectedFirm.contact.operating_hours
                                    .sunday_start || "Closed"
                                } - ${
                                  selectedFirm.contact.operating_hours
                                    .sunday_end || ""
                                }`}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Registration Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Registration Date
                      </p>
                      <p className="text-base">
                        {new Date(
                          selectedFirm.user?.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Username
                      </p>
                      <p className="text-base">
                        {selectedFirm.credentials?.username}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Document Type
                      </p>
                      <p className="text-base">
                        {selectedFirm.verification?.document_type ===
                        "barLicense"
                          ? "Bar License"
                          : selectedFirm.verification?.document_type ===
                            "enrollmentCertificate"
                          ? "Enrollment Certificate"
                          : selectedFirm.verification?.document_type ===
                            "businessLicense"
                          ? "Business License"
                          : selectedFirm.verification?.document_type ===
                            "barRegistration"
                          ? "Bar Registration"
                          : selectedFirm.verification?.document_type ===
                            "taxCertificate"
                          ? "Tax Certificate"
                          : selectedFirm.verification?.document_type ===
                            "incorporationCertificate"
                          ? "Incorporation Certificate"
                          : "Legal Practice Permit"}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mt-6 mb-4">
                    Pricing Information
                  </h3>
                  <div className="space-y-3">
                    {selectedFirm.pricing && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Case Fee
                          </p>
                          <p className="text-base">
                            {selectedFirm.pricing.case_fee}{" "}
                            {selectedFirm.pricing.case_currency} per{" "}
                            {selectedFirm.pricing.case_unit}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Hourly Rate
                          </p>
                          <p className="text-base">
                            {selectedFirm.pricing.hourly_rate}{" "}
                            {selectedFirm.pricing.hourly_currency} per{" "}
                            {selectedFirm.pricing.hourly_unit}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Consultation Fee
                          </p>
                          <p className="text-base">
                            {selectedFirm.pricing.consultation_fee}{" "}
                            {selectedFirm.pricing.consultation_currency} per{" "}
                            {selectedFirm.pricing.consultation_unit}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Retainer Fee
                          </p>
                          <p className="text-base">
                            {selectedFirm.pricing.retainer_fee}{" "}
                            {selectedFirm.pricing.retainer_currency} per{" "}
                            {selectedFirm.pricing.retainer_unit}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Payment Methods
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(typeof selectedFirm.pricing.payment_methods ===
                            "string"
                              ? JSON.parse(selectedFirm.pricing.payment_methods)
                              : selectedFirm.pricing.payment_methods
                            ).map((method, index) => (
                              <span
                                key={index}
                                className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded"
                              >
                                {method}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Banking Information */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Banking Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Bank Name
                        </p>
                        <p className="text-base">
                          {selectedFirm.billing?.bank_name || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Account Title
                        </p>
                        <p className="text-base">
                          {selectedFirm.billing?.account_title ||
                            "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Account Number
                        </p>
                        <p className="text-base">
                          {selectedFirm.billing?.account_number ||
                            "Not provided"}
                        </p>
                      </div>
                      {selectedFirm.billing?.iban && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            IBAN
                          </p>
                          <p className="text-base">
                            {selectedFirm.billing.iban}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-2">
                  Document Preview
                </h3>
                <div className="border border-dashed border-gray-300 rounded-lg h-40 flex items-center justify-center">
                  <div className="text-center">
                    <i className="ri-file-text-line text-3xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-500">
                      Document preview would appear here
                    </p>
                    <button className="mt-2 text-sm text-emerald-600 hover:text-emerald-800">
                      Download Document
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Admin Actions
                </h3>

                {selectedFirm.user?.status === "pending" ? (
                  <div className="flex space-x-4">
                    <button
                      onClick={() =>
                        handleStatusChange(selectedFirm.user?.id, "approved")
                      }
                      className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition flex-1"
                    >
                      <i className="ri-check-line mr-1"></i> Approve
                      Registration
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(selectedFirm.user?.id, "rejected")
                      }
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition flex-1"
                    >
                      <i className="ri-close-line mr-1"></i> Reject Registration
                    </button>
                  </div>
                ) : selectedFirm.user?.status === "approved" ? (
                  <div className="flex space-x-4">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex-1">
                      <i className="ri-mail-send-line mr-1"></i> Send Welcome
                      Email
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(selectedFirm.user?.id, "pending")
                      }
                      className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition flex-1"
                    >
                      <i className="ri-time-line mr-1"></i> Revert to Pending
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-4">
                    <button
                      onClick={() =>
                        handleStatusChange(selectedFirm.user?.id, "pending")
                      }
                      className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition flex-1"
                    >
                      <i className="ri-time-line mr-1"></i> Revert to Pending
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
