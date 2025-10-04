import React, { useMemo, useState } from "react";
import { useGetClientsQuery } from "../../../reduxstore/services/ClientsAPI";
import { useListStaffQuery } from "../../../reduxstore/services/StaffAPI";

const AddCase = ({
  isOpen,
  onClose,
  onAddCase,
  lockedAssignedLawyerId,
  lockedAssignedLawyerName,
}) => {
  // Using all staff data for the dropdown
  const [activeTab, setActiveTab] = useState("manual"); // Added tab state
  const [uploadedFile, setUploadedFile] = useState(null); // Added file state

  const [formData, setFormData] = useState({
    title: "",
    client: "",
    opponent: "",
    type: "Civil",
    customType: "",
    courtName: "",
    filingDate: new Date().toISOString().split("T")[0],
    assignedTo: "",
    assignedLawyerId: lockedAssignedLawyerId
      ? String(lockedAssignedLawyerId)
      : "", // Store the selected lawyer ID (locked if provided)
    description: "",
    // New structured fields for case description
    caseBackground: "",
    legalIssues: "",
    relevantLaws: "",
    prayerRelief: "",
    evidenceDocuments: "",
  });

  const [errors, setErrors] = useState({});
  const [useCustomType, setUseCustomType] = useState(false);

  // Live data: Clients and Staff for dropdowns
  const { data: clientsResp } = useGetClientsQuery({ page: 1, page_size: 100 });
  const clients = useMemo(() => {
    // Prefer same shape as AddAgreement.jsx
    const arr =
      clientsResp?.data?.clients || clientsResp?.clients || clientsResp || [];
    return Array.isArray(arr) ? arr : [];
  }, [clientsResp]);

  const { data: staffResp } = useListStaffQuery();
  const staffList = useMemo(() => {
    // listStaff is already normalized to an array
    return Array.isArray(staffResp) ? staffResp : staffResp?.data || [];
  }, [staffResp]);

  const getDisplayName = (obj) =>
    (obj &&
      (obj.name ||
        [obj.first_name, obj.last_name].filter(Boolean).join(" ") ||
        obj.username)) ||
    "Unknown";

  // If locked ID provided while mounted, keep form in sync
  React.useEffect(() => {
    if (lockedAssignedLawyerId) {
      setFormData((prev) => ({
        ...prev,
        assignedLawyerId: String(lockedAssignedLawyerId),
        assignedTo:
          lockedAssignedLawyerName ||
          getDisplayName(
            staffList.find(
              (s) => s.id?.toString() === String(lockedAssignedLawyerId)
            )
          ),
      }));
    }
  }, [lockedAssignedLawyerId, lockedAssignedLawyerName, staffList]);

  // File upload handling
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, file: "Only PDF files are allowed" });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, file: "File size must be less than 10MB" });
        return;
      }

      setUploadedFile(file);
      setErrors({ ...errors, file: "" });
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setErrors({ ...errors, file: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    // Special handling for type field
    if (name === "type" && value === "Other") {
      setUseCustomType(true);
    } else if (name === "type") {
      setUseCustomType(false);
    }

    // Special handling for lawyer selection
    if (!lockedAssignedLawyerId && name === "assignedLawyerId" && value) {
      const selectedStaff = staffList.find(
        (staff) => staff.id?.toString() === value
      );
      if (selectedStaff) {
        // Format the name based on role
        const baseName = getDisplayName(selectedStaff);
        const roleStr = (selectedStaff.role || "").toLowerCase();
        const formattedName = roleStr.includes("advocate")
          ? `Adv. ${baseName}`
          : baseName;

        setFormData((prev) => ({
          ...prev,
          assignedTo: formattedName,
          assignedLawyerId: value,
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.title.trim()) newErrors.title = "Title is required";
    else if (formData.title.trim().length < 5)
      newErrors.title = "Title must be at least 5 characters";
    if (!formData.client.trim()) newErrors.client = "Client is required";
    if (!formData.opponent.trim()) newErrors.opponent = "Opponent is required";
    else if (formData.opponent.trim().length < 2)
      newErrors.opponent = "Opponent must be at least 2 characters";
    if (!formData.courtName.trim())
      newErrors.courtName = "Court name is required";
    else if (formData.courtName.trim().length < 5)
      newErrors.courtName = "Court name must be at least 5 characters";
    if (!formData.assignedLawyerId)
      newErrors.assignedLawyerId = "Assigned lawyer is required";
    else if (!Number.isInteger(parseInt(formData.assignedLawyerId)))
      newErrors.assignedLawyerId = "Assigned lawyer selection is invalid";

    // Validate at least one description field is filled
    if (
      !formData.caseBackground.trim() &&
      !formData.legalIssues.trim() &&
      !formData.relevantLaws.trim() &&
      !formData.prayerRelief.trim()
    ) {
      newErrors.caseBackground = "At least one case detail field is required";
    }

    // Validate type
    if (useCustomType && !formData.customType.trim()) {
      newErrors.customType = "Custom case type is required";
    }

    // Date validation
    if (!formData.filingDate) {
      newErrors.filingDate = "Filing date is required";
    }

    // Numeric validations
    if (formData.client && !Number.isInteger(parseInt(formData.client))) {
      newErrors.client = "Invalid client selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // If using custom type, update the type before submitting
      const finalFormData = { ...formData };
      if (useCustomType) {
        finalFormData.type = formData.customType;
      }

      // Transform field names to match API schema
      const clientIdInt = parseInt(finalFormData.client);
      const staffIdInt = finalFormData.assignedLawyerId
        ? parseInt(finalFormData.assignedLawyerId)
        : null;

      const apiFormData = {
        title: finalFormData.title,
        opponent: finalFormData.opponent,
        type: finalFormData.type,
        court_name: finalFormData.courtName,
        filing_date: finalFormData.filingDate, // Keep as ISO string format
        client_id: Number.isInteger(clientIdInt) ? clientIdInt : null,
        client_name:
          getDisplayName(
            clients.find((c) => c.id?.toString() === finalFormData.client)
          ) || "Unknown Client",
        // Backward-compatible AND new alias fields for staff
        assigned_lawyer_id: staffIdInt ?? null,
        assigned_lawyer_name: staffIdInt
          ? getDisplayName(
              staffList.find(
                (s) => s.id?.toString() === finalFormData.assignedLawyerId
              )
            ) ||
            lockedAssignedLawyerName ||
            "Unknown Lawyer"
          : null,
        staff_id: staffIdInt ?? null,
        staff_name: staffIdInt
          ? getDisplayName(
              staffList.find(
                (s) => s.id?.toString() === finalFormData.assignedLawyerId
              )
            ) ||
            lockedAssignedLawyerName ||
            "Unknown Staff"
          : null,
        case_background: finalFormData.caseBackground || null,
        legal_issues: finalFormData.legalIssues || null,
        relevant_laws: finalFormData.relevantLaws || null,
        prayer_relief: finalFormData.prayerRelief || null,
        evidence_documents: finalFormData.evidenceDocuments || null,
        // Remove description field - backend creates it automatically from structured fields
      };

      console.log("Sending case data to API:", apiFormData);
      console.log(
        "Date value:",
        finalFormData.filingDate,
        "Type:",
        typeof finalFormData.filingDate
      );
      onAddCase(apiFormData);

      // Reset form
      setFormData({
        title: "",
        client: "",
        opponent: "",
        type: "Civil",
        customType: "",
        courtName: "",
        filingDate: new Date().toISOString().split("T")[0],
        assignedTo: "",
        assignedLawyerId: "",
        description: "",
        caseBackground: "",
        legalIssues: "",
        relevantLaws: "",
        prayerRelief: "",
        evidenceDocuments: "",
      });
      setErrors({});
      setUseCustomType(false);
      setUploadedFile(null);
      setActiveTab("manual");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add New Case</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "manual"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className="ri-edit-line mr-2"></i>
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "upload"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className="ri-upload-line mr-2"></i>
            Upload Case PDF
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "manual" ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Title*
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.title ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  placeholder="e.g. Smith vs. Johnson"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Type*
                </label>
                <div className="flex flex-col">
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Civil">Civil</option>
                    <option value="Criminal">Criminal</option>
                    <option value="Family">Family</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Other">Other (Custom)</option>
                  </select>

                  {useCustomType && (
                    <div className="mt-2">
                      <input
                        type="text"
                        name="customType"
                        value={formData.customType}
                        onChange={handleChange}
                        placeholder="Enter custom case type"
                        className={`w-full px-3 py-2 border ${
                          errors.customType
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                      />
                      {errors.customType && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.customType}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name*
                </label>
                <select
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.client ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white`}
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => {
                    const label = getDisplayName(client);
                    return (
                      <option key={client.id} value={client.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                {errors.client && (
                  <p className="text-red-500 text-xs mt-1">{errors.client}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opponent*
                </label>
                <input
                  type="text"
                  name="opponent"
                  value={formData.opponent}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.opponent ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  placeholder="Opposing party"
                />
                {errors.opponent && (
                  <p className="text-red-500 text-xs mt-1">{errors.opponent}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Court Name*
                </label>
                <input
                  type="text"
                  name="courtName"
                  value={formData.courtName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.courtName ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  placeholder="e.g. District Court, Lahore"
                />
                {errors.courtName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.courtName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filing Date*
                </label>
                <input
                  type="date"
                  name="filingDate"
                  value={formData.filingDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.filingDate ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
                {errors.filingDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.filingDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Lawyer*
                </label>
                {lockedAssignedLawyerId ? (
                  <input
                    type="text"
                    value={
                      lockedAssignedLawyerName ||
                      getDisplayName(
                        staffList.find(
                          (s) =>
                            s.id?.toString() === String(lockedAssignedLawyerId)
                        )
                      )
                    }
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                  />
                ) : (
                  <>
                    <select
                      name="assignedLawyerId"
                      value={formData.assignedLawyerId}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${
                        errors.assignedLawyerId
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                    >
                      <option value="">Select a staff member</option>
                      {staffList.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {getDisplayName(staff)}
                        </option>
                      ))}
                    </select>
                    {errors.assignedLawyerId && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.assignedLawyerId}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Details*
              </label>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Case Background
                  </label>
                  <textarea
                    name="caseBackground"
                    value={formData.caseBackground}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full px-3 py-2 border ${
                      errors.caseBackground
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                    placeholder="Provide background and facts of the case..."
                  ></textarea>
                  {errors.caseBackground && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.caseBackground}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Issues
                  </label>
                  <textarea
                    name="legalIssues"
                    value={formData.legalIssues}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Describe the key legal issues to be resolved..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relevant Laws & Statutes
                  </label>
                  <textarea
                    name="relevantLaws"
                    value={formData.relevantLaws}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="List applicable laws, statutes, and precedents..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prayer/Relief Sought
                  </label>
                  <textarea
                    name="prayerRelief"
                    value={formData.prayerRelief}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Specify what relief or remedy is being sought..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Evidence Documents
                  </label>
                  <textarea
                    name="evidenceDocuments"
                    value={formData.evidenceDocuments}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="List key evidence documents and witnesses..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Information note */}
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-700">
                <i className="ri-information-line mr-2"></i>
                <strong>Note:</strong> After creating a case, it will be in
                pending status. Click on the pending status to activate it
                before scheduling hearings.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                Create Case
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* PDF Upload Section */}
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-emerald-400 transition-colors">
                {!uploadedFile ? (
                  <div>
                    <i className="ri-file-pdf-line text-4xl text-gray-400 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      Upload Case PDF
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Select a PDF file containing case information
                    </p>
                    <label className="inline-block">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <span className="px-4 py-2 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors">
                        <i className="ri-upload-line mr-2"></i>
                        Choose PDF File
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="text-left">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center">
                        <i className="ri-file-pdf-line text-emerald-600 text-2xl mr-3"></i>
                        <div>
                          <p className="font-medium text-emerald-700">
                            {uploadedFile.name}
                          </p>
                          <p className="text-sm text-emerald-600">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removeUploadedFile}
                        className="text-emerald-600 hover:text-emerald-800 p-1"
                      >
                        <i className="ri-delete-bin-line text-xl"></i>
                      </button>
                    </div>
                  </div>
                )}
                {errors.file && (
                  <p className="text-red-500 text-sm mt-2">{errors.file}</p>
                )}
              </div>
            </div>

            {/* Override fields for PDF upload */}
            {uploadedFile && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Case Title*
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Override title from PDF if needed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Lawyer*
                  </label>
                  {lockedAssignedLawyerId ? (
                    <input
                      type="text"
                      value={
                        lockedAssignedLawyerName ||
                        getDisplayName(
                          staffList.find(
                            (s) =>
                              s.id?.toString() ===
                              String(lockedAssignedLawyerId)
                          )
                        )
                      }
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                    />
                  ) : (
                    <select
                      name="assignedLawyerId"
                      value={formData.assignedLawyerId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select a staff member</option>
                      {staffList.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {getDisplayName(staff)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* PDF Upload Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-700">
                <i className="ri-information-line mr-2"></i>
                <strong>Note:</strong> The system will automatically extract
                case information from the PDF. You can review and modify the
                extracted data before creating the case.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!uploadedFile}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  uploadedFile
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <i className="ri-ai-generate mr-2"></i>
                Process PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddCase;
