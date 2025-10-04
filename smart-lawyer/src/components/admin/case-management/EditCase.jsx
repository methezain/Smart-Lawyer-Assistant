import React, { useEffect, useMemo, useState } from "react";
import { useGetClientsQuery } from "../../../reduxstore/services/ClientsAPI";
import { useListStaffQuery } from "../../../reduxstore/services/StaffAPI";

const EditCase = ({ isOpen, onClose, onEditCase, caseToEdit }) => {
  const [formData, setFormData] = useState({
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
    status: "pending",
  });

  const [errors, setErrors] = useState({});
  const [useCustomType, setUseCustomType] = useState(false);

  // Live data: Clients and Staff for dropdowns
  const { data: clientsResp } = useGetClientsQuery({ page: 1, page_size: 100 });
  const clients = useMemo(() => {
    const arr =
      clientsResp?.data?.clients || clientsResp?.clients || clientsResp || [];
    return Array.isArray(arr) ? arr : [];
  }, [clientsResp]);

  const { data: staffResp } = useListStaffQuery();
  const staffList = useMemo(() => {
    return Array.isArray(staffResp) ? staffResp : staffResp?.data || [];
  }, [staffResp]);

  const getDisplayName = (obj) =>
    (obj &&
      (obj.name ||
        [obj.first_name, obj.last_name].filter(Boolean).join(" ") ||
        obj.username)) ||
    "Unknown";

  // Initialize form data when caseToEdit changes
  useEffect(() => {
    if (caseToEdit) {
      // Parse the description to fill structured fields if available
      let caseBackground = "";
      let legalIssues = "";
      let relevantLaws = "";
      let prayerRelief = "";
      let evidenceDocuments = "";

      if (caseToEdit.description) {
        const sections = caseToEdit.description.split("\n\n");

        sections.forEach((section) => {
          const labelMatch = section.match(/^([^:]+):\s(.+)$/s);
          if (labelMatch) {
            const [, label, content] = labelMatch;
            if (label === "Background") caseBackground = content;
            else if (label === "Legal Issues") legalIssues = content;
            else if (label === "Relevant Laws") relevantLaws = content;
            else if (label === "Prayer/Relief") prayerRelief = content;
            else if (label === "Evidence Documents")
              evidenceDocuments = content;
          }
        });
      }

      // Set the type and check if it's a custom type
      const isCustomType = ![
        "Civil",
        "Criminal",
        "Family",
        "Commercial",
      ].includes(caseToEdit.type);

      setFormData({
        title: caseToEdit.title || "",
        client: caseToEdit.client_id?.toString() || "",
        opponent: caseToEdit.opponent || "",
        type: isCustomType ? "Other" : caseToEdit.type || "Civil",
        customType: isCustomType ? caseToEdit.type : "",
        courtName: caseToEdit.court_name || "",
        filingDate:
          caseToEdit.filing_date || new Date().toISOString().split("T")[0],
        assignedTo: caseToEdit.assigned_lawyer_name || "Unassigned",
        assignedLawyerId: caseToEdit.assigned_lawyer_id?.toString() || "",
        description: caseToEdit.description || "",
        caseBackground: caseToEdit.case_background || caseBackground,
        legalIssues: caseToEdit.legal_issues || legalIssues,
        relevantLaws: caseToEdit.relevant_laws || relevantLaws,
        prayerRelief: caseToEdit.prayer_relief || prayerRelief,
        evidenceDocuments: caseToEdit.evidence_documents || evidenceDocuments,
        status: caseToEdit.status || "pending",
      });

      setUseCustomType(isCustomType);
    }
  }, [caseToEdit]);

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
    if (name === "assignedLawyerId" && value) {
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
    if (!formData.client.trim()) newErrors.client = "Client is required";
    if (!formData.opponent.trim()) newErrors.opponent = "Opponent is required";
    if (!formData.courtName.trim())
      newErrors.courtName = "Court name is required";
    if (!formData.assignedLawyerId)
      newErrors.assignedLawyerId = "Assigned lawyer is required";

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
      const apiFormData = {
        id: caseToEdit.id,
        title: finalFormData.title,
        opponent: finalFormData.opponent,
        type: finalFormData.type,
        court_name: finalFormData.courtName,
        filing_date: finalFormData.filingDate,
        status: finalFormData.status,
        client_id: parseInt(finalFormData.client),
        client_name:
          getDisplayName(
            clients.find((c) => c.id?.toString() === finalFormData.client)
          ) || "Unknown Client",
        assigned_lawyer_id: finalFormData.assignedLawyerId
          ? parseInt(finalFormData.assignedLawyerId)
          : null,
        assigned_lawyer_name: finalFormData.assignedLawyerId
          ? getDisplayName(
              staffList.find(
                (s) => s.id?.toString() === finalFormData.assignedLawyerId
              )
            ) || "Unknown Lawyer"
          : null,
        case_background: finalFormData.caseBackground || null,
        legal_issues: finalFormData.legalIssues || null,
        relevant_laws: finalFormData.relevantLaws || null,
        prayer_relief: finalFormData.prayerRelief || null,
        evidence_documents: finalFormData.evidenceDocuments || null,
        description:
          [
            finalFormData.caseBackground
              ? `Background: ${finalFormData.caseBackground}`
              : "",
            finalFormData.legalIssues
              ? `Legal Issues: ${finalFormData.legalIssues}`
              : "",
            finalFormData.relevantLaws
              ? `Relevant Laws: ${finalFormData.relevantLaws}`
              : "",
            finalFormData.prayerRelief
              ? `Prayer/Relief: ${finalFormData.prayerRelief}`
              : "",
            finalFormData.evidenceDocuments
              ? `Evidence Documents: ${finalFormData.evidenceDocuments}`
              : "",
          ]
            .filter(Boolean)
            .join("\n\n") || null,
      };

      onEditCase(apiFormData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Edit Case</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

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
                        errors.customType ? "border-red-500" : "border-gray-300"
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
                <p className="text-red-500 text-xs mt-1">{errors.courtName}</p>
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
                <p className="text-red-500 text-xs mt-1">{errors.filingDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Lawyer*
              </label>
              <select
                name="assignedLawyerId"
                value={formData.assignedLawyerId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.assignedLawyerId ? "border-red-500" : "border-gray-300"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
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
                    errors.caseBackground ? "border-red-500" : "border-gray-300"
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCase;
