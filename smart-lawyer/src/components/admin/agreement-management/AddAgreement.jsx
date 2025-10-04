import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
// Inlined from constants.js
const defaultStatusOptions = [
  "Pending Signature",
  "Signed",
  "In Review",
  "Completed",
  "Rejected",
];
import { useCreateAgreementMutation } from "../../../reduxstore/services/AgreementsAPI";
import { useGetClientsQuery } from "../../../reduxstore/services/ClientsAPI";

const EditAgreement = ({
  onClose,
  onSubmit,
  statusOptions = defaultStatusOptions,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useParams();
  const [lockFirm, setLockFirm] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  // Single-section form (content merged into details)
  const [formData, setFormData] = useState({
    title: "",
    caseType: "Civil",
    customCaseType: "",
    client: "",
    clientCNIC: "",
    clientAddress: "",
    lawFirm: "",
    status: "Pending Signature",
    filedDate: "",
    expectedFileDate: "",
    effectiveDate: "",
    contractDuration: "",
    terminationDate: "",
    amount: "",
    currency: "PKR",
    terms: [""],
    documents: [],
    contractContent: "",
  });
  const [errors, setErrors] = useState({});
  const [createAgreement, { isLoading: isSaving }] =
    useCreateAgreementMutation();

  // Load clients list for dropdown
  const { data: clientsResp, isLoading: isClientsLoading } = useGetClientsQuery(
    {
      page: 1,
      page_size: 100,
    }
  );
  const clients = clientsResp?.data?.clients || [];

  const getClientCNIC = (c) =>
    c?.cnic || c?.cnicNo || c?.cnic_no || c?.clientCNIC || c?.cnicNumber || "";
  const getClientAddress = (c) =>
    c?.address ||
    c?.clientAddress ||
    c?.address1 ||
    c?.residentialAddress ||
    c?.currentAddress ||
    "";

  // Prefill law firm name like Header.jsx does (from stored user)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const firmName =
        parsed?.firmName ||
        parsed?.userDetails?.firm_name ||
        parsed?.userDetails?.firmName ||
        "";
      if (firmName) {
        setFormData((prev) => ({ ...prev, lawFirm: firmName }));
        setLockFirm(true); // make non-editable when auto-fetched
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "caseType") {
      setFormData((prev) => ({ ...prev, caseType: value, customCaseType: "" }));
    } else if (name === "clientSelect") {
      setSelectedClientId(value);
      const found = clients.find((c) => String(c.id) === String(value));
      if (found) {
        setFormData((prev) => ({
          ...prev,
          client: found.name || "",
          clientCNIC: getClientCNIC(found),
          clientAddress: getClientAddress(found),
        }));
      }
    } else if (name === "documents") {
      setFormData((prev) => ({ ...prev, documents: files }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required.";
    if (!formData.caseType) newErrors.caseType = "Case type is required.";
    if (formData.caseType === "Other" && !formData.customCaseType.trim())
      newErrors.customCaseType = "Custom case type required.";
    if (!formData.client.trim()) newErrors.client = "Client name is required.";
    if (!formData.clientCNIC?.trim())
      newErrors.clientCNIC = "Client CNIC is required.";
    if (!formData.clientAddress?.trim())
      newErrors.clientAddress = "Client address is required.";
    if (!formData.lawFirm.trim()) newErrors.lawFirm = "Law firm is required.";
    if (!formData.status) newErrors.status = "Status is required.";
    if (!formData.contractDuration)
      newErrors.contractDuration = "Contract duration is required.";
    if (!formData.terminationDate)
      newErrors.terminationDate = "Termination date is required.";
    // removed description validation
    if (
      !Array.isArray(formData.terms) ||
      formData.terms.every((t) => !t || !String(t).trim())
    )
      newErrors.terms = "Terms & Conditions are required.";
    if (!formData.contractContent?.trim())
      newErrors.contractContent = "Contract content is required.";
    if (formData.amount && Number(formData.amount) < 0)
      newErrors.amount = "Amount must be positive.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Terms & Conditions dynamic list handlers
  const handleTermChange = (index, value) => {
    setFormData((prev) => {
      const next = Array.isArray(prev.terms) ? [...prev.terms] : [""];
      next[index] = value;
      return { ...prev, terms: next };
    });
  };
  const addTermField = () => {
    setFormData((prev) => ({
      ...prev,
      terms: [...(Array.isArray(prev.terms) ? prev.terms : [""]), ""],
    }));
  };
  const removeTermField = (index) => {
    setFormData((prev) => {
      const arr = Array.isArray(prev.terms) ? [...prev.terms] : [""];
      arr.splice(index, 1);
      return { ...prev, terms: arr.length ? arr : [""] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (onSubmit) {
      onSubmit(formData);
    } else {
      // Create via API
      const payload = {
        title: formData.title,
        case_type:
          formData.caseType === "Other" && formData.customCaseType
            ? formData.customCaseType
            : formData.caseType,
        status: formData.status,
        client: formData.client,
        client_cnic: formData.clientCNIC,
        client_address: formData.clientAddress,
        law_firm: formData.lawFirm,
        amount: formData.amount ? Number(formData.amount) : undefined,
        currency: formData.currency,
        contract_content: formData.contractContent,
        filed_date: formData.filedDate || undefined,
        expected_file_date: formData.expectedFileDate || undefined,
        effective_date: formData.effectiveDate || undefined,
        contract_duration: formData.contractDuration
          ? Number(formData.contractDuration)
          : undefined,
        termination_date: formData.terminationDate || undefined,
        terms: (formData.terms || []).filter(
          (t) => t && String(t).trim().length
        ),
        documents: [],
      };
      try {
        await createAgreement(payload).unwrap();
        const isUsernameRoute = location.pathname.startsWith("/admin/");
        const baseRoute = isUsernameRoute
          ? `/admin/${username}`
          : "/auth/admin/profile";
        navigate(`${baseRoute}/contracts`);
      } catch (err) {
        console.error("Failed to create agreement", err);
        alert("Failed to save agreement. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Error summary (matches staff add style) */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-sm">
          <p className="font-medium flex items-center">
            <i className="ri-error-warning-line mr-2"></i>
            Please fix the following errors:
          </p>
          <ul className="list-disc ml-5 mt-1 text-xs">
            {Object.values(errors).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Layout: main form + aside */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
          {/* Page header */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-3">
            <h1 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
              <i className="ri-file-add-line"></i>
              Create New Contract
            </h1>
          </div>

          {/* Basic Contract Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-file-text-line text-emerald-600"></i>
              <h3 className="font-semibold">Basic Contract Details</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Law Firm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lawFirm"
                  value={formData.lawFirm}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.lawFirm ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                  placeholder={
                    lockFirm ? "Auto-filled from your profile" : "Law firm name"
                  }
                  disabled={lockFirm}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.title ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                  placeholder="e.g. Property Sale Agreement"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Case Type <span className="text-red-500">*</span>
                </label>
                {formData.caseType === "Other" ? (
                  <div className="relative">
                    <input
                      type="text"
                      name="customCaseType"
                      value={formData.customCaseType}
                      onChange={handleChange}
                      placeholder="Enter custom case type"
                      className={`w-full border ${
                        errors.customCaseType
                          ? "border-red-300"
                          : "border-gray-300"
                      } rounded-lg px-3 py-2 text-xs pr-9 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          caseType: "Civil",
                          customCaseType: "",
                        }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Back to list"
                    >
                      <i className="ri-arrow-down-s-line text-lg"></i>
                    </button>
                  </div>
                ) : (
                  <select
                    name="caseType"
                    value={formData.caseType}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  >
                    <option value="Civil">Civil</option>
                    <option value="Criminal">Criminal</option>
                    <option value="Family">Family</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Employment">Employment</option>
                    <option value="Other">Other (Custom)</option>
                  </select>
                )}
                {errors.caseType && (
                  <p className="text-xs text-red-600">{errors.caseType}</p>
                )}
                {errors.customCaseType && (
                  <p className="text-xs text-red-600">
                    {errors.customCaseType}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.status ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                >
                  {(statusOptions || defaultStatusOptions).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="text-xs text-red-600">{errors.status}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Contract Duration (Months){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="contractDuration"
                  value={formData.contractDuration || ""}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.contractDuration
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                  placeholder="e.g. 12"
                  min="1"
                />
                {errors.contractDuration && (
                  <p className="text-xs text-red-600">
                    {errors.contractDuration}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Amount
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className={`w-full border ${
                      errors.amount ? "border-red-300" : "border-gray-300"
                    } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                    placeholder="e.g. 250000"
                    min="0"
                    step="0.01"
                  />
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  >
                    <option value="PKR">PKR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                {errors.amount && (
                  <p className="text-xs text-red-600">{errors.amount}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Effective Date
                </label>
                <input
                  type="date"
                  name="effectiveDate"
                  value={formData.effectiveDate || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Termination Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="terminationDate"
                  value={formData.terminationDate || ""}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.terminationDate
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                />
                {errors.terminationDate && (
                  <p className="text-xs text-red-600">
                    {errors.terminationDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-contacts-line text-emerald-600"></i>
              <h3 className="font-semibold">Client Information</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <select
                  name="clientSelect"
                  value={selectedClientId}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.client ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                >
                  <option value="" disabled>
                    {isClientsLoading
                      ? "Loading clients..."
                      : "Select a client"}
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.client && (
                  <p className="text-xs text-red-600">{errors.client}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Client CNIC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="clientCNIC"
                  value={formData.clientCNIC || ""}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.clientCNIC ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                  placeholder="Format: xxxxx-xxxxxxx-x"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-medium text-gray-700">
                  Client Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="clientAddress"
                  value={formData.clientAddress || ""}
                  onChange={handleChange}
                  rows={2}
                  className={`w-full border ${
                    errors.clientAddress ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                  placeholder="Full address of the client"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Contract Content */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-file-text-line text-emerald-600"></i>
              <h3 className="font-semibold">Contract Content</h3>
            </div>
            <div className="p-4">
              <div className="bg-gray-50 p-2 rounded mb-2 flex justify-between items-center border border-gray-100">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-200"
                    title="Bold"
                  >
                    <i className="ri-bold"></i>
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-200"
                    title="Italic"
                  >
                    <i className="ri-italic"></i>
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-200"
                    title="Underline"
                  >
                    <i className="ri-underline"></i>
                  </button>
                  <span className="border-r border-gray-300 h-6 mx-1"></span>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-200"
                    title="Numbered List"
                  >
                    <i className="ri-list-ordered"></i>
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-200"
                    title="Bullet List"
                  >
                    <i className="ri-list-unordered"></i>
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    className="text-xs text-emerald-600 hover:text-emerald-800"
                  >
                    Use Template
                  </button>
                </div>
              </div>
              <textarea
                name="contractContent"
                value={formData.contractContent}
                onChange={handleChange}
                rows={10}
                className={`w-full border ${
                  errors.contractContent ? "border-red-300" : "border-gray-300"
                } rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                placeholder="Write your contract content here..."
              ></textarea>
              {errors.contractContent && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.contractContent}
                </p>
              )}
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-scales-line text-emerald-600"></i>
              <h3 className="font-semibold">Terms & Conditions</h3>
            </div>
            <div className="p-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <label className="text-xs font-medium text-gray-700 mb-3 flex items-center">
                  <i className="ri-scales-line text-emerald-600 mr-2"></i>
                  Add Terms <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="space-y-2">
                  {Array.isArray(formData.terms) &&
                    formData.terms.map((term, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder={`Term #${index + 1}`}
                          value={term}
                          onChange={(e) =>
                            handleTermChange(index, e.target.value)
                          }
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeTermField(index)}
                          className="px-3 py-2 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                          disabled={(formData.terms?.length || 0) === 1}
                          title="Remove"
                        >
                          <i className="ri-subtract-line"></i>
                        </button>
                      </div>
                    ))}
                </div>
                {errors.terms && (
                  <p className="text-xs text-red-600 mt-1">{errors.terms}</p>
                )}
                <button
                  type="button"
                  onClick={addTermField}
                  className="mt-3 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 shadow-sm transition-colors inline-flex items-center text-xs"
                >
                  <i className="ri-add-line mr-1"></i> Add Term
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-2 bg-white/80 backdrop-blur rounded-xl border border-gray-200 p-3 flex items-center justify-end gap-3 shadow-sm">
            <button
              type="button"
              onClick={() => {
                if (onClose) return onClose();
                const isUsernameRoute = location.pathname.startsWith("/admin/");
                const baseRoute = isUsernameRoute
                  ? `/admin/${username}`
                  : "/auth/admin/profile";
                navigate(`${baseRoute}/contracts`);
              }}
              className="px-4 py-2 text-xs border border-gray-300 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center"
            >
              <i className="ri-close-line mr-1"></i>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-colors flex items-center disabled:opacity-50"
            >
              <i className="ri-file-add-line mr-1"></i>
              {isSaving ? "Saving..." : "Add Contract"}
            </button>
          </div>
        </form>

        {/* Aside: Guidelines & Quick Preview */}
        <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-information-line text-emerald-600"></i>
              <h3 className="font-semibold">Guidelines</h3>
            </div>
            <div className="p-4 text-xs text-gray-700 space-y-2">
              <div className="flex items-start gap-2">
                <i className="ri-asterisk text-gray-400 mt-0.5"></i>
                <span>
                  Required: Title, Case Type, Status, Contract Duration,
                  Termination Date, Client details, Content, and Terms.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <i className="ri-calendar-line text-gray-400 mt-0.5"></i>
                <span>
                  Effective Date is when obligations start; Termination Date is
                  when the agreement ends.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <i className="ri-file-text-line text-gray-400 mt-0.5"></i>
                <span>
                  Keep the Contract Content concise and include key clauses like
                  scope, payment, and termination.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-eye-line text-emerald-600"></i>
              <h3 className="font-semibold">Quick Preview</h3>
            </div>
            <div className="p-4 pb-2.5 text-xs text-gray-700 space-y-2">
              <div className="flex items-center gap-2">
                <i className="ri-file-text-line text-gray-400"></i>
                <span className="font-medium truncate">
                  {formData.title || "Contract Title"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-user-line text-gray-400"></i>
                <span className="truncate">{formData.client || "Client"}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-price-tag-3-line text-gray-400"></i>
                <span>
                  {formData.amount
                    ? `${formData.amount} ${formData.currency}`
                    : "Amount"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-timer-line text-gray-400"></i>
                <span>{formData.status || "Status"}</span>
              </div>
              {(formData.effectiveDate || formData.terminationDate) && (
                <div className="flex items-center gap-2">
                  <i className="ri-calendar-line text-gray-400"></i>
                  <span className="truncate">
                    {formData.effectiveDate || "—"} →{" "}
                    {formData.terminationDate || "—"}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
                This is a quick glance of the agreement details before saving.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default EditAgreement;
