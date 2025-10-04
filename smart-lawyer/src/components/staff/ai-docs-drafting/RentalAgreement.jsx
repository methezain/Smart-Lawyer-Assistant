import React, { useState } from "react";
import { useGenerateLeaseMutation } from "../../../reduxstore/services/RentalAgreementAPI";

// Fields mapping to backend LeaseAgreementRequest schema
const fields = [
  { id: "landlord_name", label: "Landlord Name", type: "text", required: true },
  {
    id: "landlord_address",
    label: "Landlord Address",
    type: "text",
    required: true,
  },
  { id: "tenant_name", label: "Tenant Name", type: "text", required: true },
  {
    id: "tenant_address",
    label: "Tenant Address",
    type: "text",
    required: true,
  },
  {
    id: "property_address",
    label: "Property Address",
    type: "text",
    required: true,
  },
  {
    id: "lease_start_date",
    label: "Lease Start Date",
    type: "date",
    required: true,
  },
  {
    id: "lease_end_date",
    label: "Lease End Date",
    type: "date",
    required: true,
  },
  { id: "rent_amount", label: "Rent Amount", type: "text", required: true },
  {
    id: "payment_due_date",
    label: "Payment Due Date (e.g. 5th of every month)",
    type: "text",
    required: true,
  },
  {
    id: "payment_method",
    label: "Payment Method",
    type: "text",
    required: true,
  },
  {
    id: "security_deposit",
    label: "Security Deposit",
    type: "text",
    required: true,
  },
  {
    id: "utilities_maintenance",
    label: "Utilities & Maintenance",
    type: "textarea",
    required: true,
    description:
      "Describe who pays which utilities, and maintenance responsibilities",
  },
  {
    id: "restrictions",
    label: "Restrictions",
    type: "textarea",
    required: false,
    description: "Optional: e.g. No pets, no smoking",
  },
  {
    id: "termination_clause",
    label: "Termination Clause",
    type: "textarea",
    required: true,
    description: "Grounds and notice period for early termination",
  },
  {
    id: "governing_law",
    label: "Governing Law",
    type: "text",
    required: false,
    placeholder: "Applicable local laws",
  },
  {
    id: "date_of_agreement",
    label: "Date of Agreement",
    type: "date",
    required: false,
  },
];

const initialState = () => {
  const o = {};
  fields.forEach((f) => {
    o[f.id] = "";
  });
  return o;
};

const RentalAgreement = () => {
  const [formData, setFormData] = useState(initialState);
  const [generated, setGenerated] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [generateLease, { isLoading, error }] = useGenerateLeaseMutation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCopySuccess(false);
    try {
      const sanitized = { ...formData };
      if (!sanitized.governing_law)
        sanitized.governing_law = "Applicable local laws";
      const result = await generateLease(sanitized).unwrap();
      setGenerated({
        title: `Lease / Rental Agreement - ${
          formData.property_address || "Generated"
        }`,
        content: result.agreement_text || "No agreement text returned.",
      });
    } catch (err) {
      console.error("Generation failed", err);
    }
  };

  const copyContent = () => {
    if (generated?.content) {
      navigator.clipboard.writeText(generated.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const resetForm = () => {
    setFormData(initialState());
    setGenerated(null);
    setCopySuccess(false);
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 p-4">
            {!generated ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-emerald-50 p-2.5 rounded-xl mb-4 flex justify-start items-center gap-2.5">
                  <div className="text-emerald-500">
                    <i className="ri-file-text-line text-3xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-emerald-700">
                      Lease / Rental Agreement - Standard
                    </h3>
                    <p className="text-xs text-emerald-600">
                      Fill the details to generate a professional lease
                      agreement
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {fields.map((field) =>
                    field.type === "textarea" ? (
                      <div key={field.id} className="md:col-span-2 space-y-1">
                        <label
                          htmlFor={field.id}
                          className="block text-xs font-semibold text-gray-700"
                        >
                          {field.label}{" "}
                          {field.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <textarea
                          id={field.id}
                          name={field.id}
                          rows={4}
                          required={field.required}
                          value={formData[field.id]}
                          onChange={handleChange}
                          placeholder={
                            field.description ||
                            field.placeholder ||
                            `Enter ${field.label.toLowerCase()}...`
                          }
                          className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        {field.description && (
                          <p className="text-[10px] text-gray-500 leading-snug">
                            {field.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div key={field.id} className="space-y-1">
                        <label
                          htmlFor={field.id}
                          className="block text-xs font-semibold text-gray-700"
                        >
                          {field.label}{" "}
                          {field.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <input
                          id={field.id}
                          type={field.type}
                          name={field.id}
                          required={field.required}
                          value={formData[field.id]}
                          onChange={handleChange}
                          placeholder={
                            field.placeholder ||
                            `Enter ${field.label.toLowerCase()}...`
                          }
                          className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    )
                  )}
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    Failed to generate. Please try again.
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 text-white text-xs py-2.5 px-6 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="ri-file-paper-line mr-2" />
                        Generate Document
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs py-2.5 px-4 rounded-xl font-medium border border-gray-300 hover:bg-gray-50"
                  >
                    Reset
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {generated.title}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={copyContent}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                      title="Copy to clipboard"
                    >
                      <i className="ri-clipboard-line" />
                    </button>
                    <button
                      onClick={() => setGenerated(null)}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                      title="Back to form"
                    >
                      <i className="ri-arrow-go-back-line" />
                    </button>
                  </div>
                </div>
                <div className="whitespace-pre-wrap font-mono text-[11px] bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-[560px] overflow-y-auto leading-relaxed">
                  {generated.content}
                </div>
                <div className="mt-4 flex items-center gap-3 justify-end">
                  <button
                    onClick={copyContent}
                    className="bg-emerald-600 text-white py-2 px-4 rounded-lg text-xs hover:bg-emerald-700 flex items-center"
                  >
                    <i className="ri-clipboard-line mr-2" />
                    {copySuccess ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={() => setGenerated(null)}
                    className="text-xs py-2 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50"
                  >
                    Edit Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md overflow-hidden text-sm border border-gray-200 p-4 sticky top-0">
            <h3 className="font-semibold text-gray-800 mb-4 pb-2.5 flex items-center border-b border-gray-100">
              <i className="ri-information-line text-emerald-600 mr-2" />
              Template Information
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-0.5">
                  Document Type
                </h4>
                <p className="text-gray-600 text-xs">
                  Lease / Rental Agreement
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-0.5">
                  Description
                </h4>
                <p className="text-gray-600 text-xs">
                  Legally binding agreement between landlord and tenant.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-0.5">
                  Required Fields
                </h4>
                <ul className="text-gray-600 text-sm mt-2 space-y-1">
                  {fields
                    .filter((f) => f.required)
                    .map((f) => (
                      <li
                        key={f.id}
                        className="flex items-start text-xs gap-0.5"
                      >
                        <span className="inline-flex items-center justify-center w-4 h-4 mt-[1px] rounded-full bg-emerald-100 text-emerald-600 mr-2">
                          <i className="ri-check-line text-xs" />
                        </span>
                        {f.label}
                      </li>
                    ))}
                </ul>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-semibold text-gray-700">Tips</h4>
                <ul className="text-gray-600 text-xs mt-2 space-y-1">
                  <li className="flex items-start">
                    <i className="ri-information-line text-blue-500 mr-2" />
                    <span>Verify local law compliance.</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-information-line text-blue-500 mr-2" />
                    <span>Be specific about payment dates.</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-information-line text-blue-500 mr-2" />
                    <span>Clarify maintenance responsibilities.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalAgreement;
