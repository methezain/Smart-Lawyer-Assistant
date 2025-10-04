import React, { useState } from "react";

const fields = [
  {
    id: "affidavitTitle",
    label: "Affidavit Title",
    type: "text",
    required: true,
  },
  {
    id: "caseNumber",
    label: "Related Case Number",
    type: "text",
    required: false,
  },
  { id: "courtName", label: "Court Name", type: "text", required: true },
  { id: "deponentName", label: "Deponent Name", type: "text", required: true },
  {
    id: "deponentAddress",
    label: "Deponent Address",
    type: "text",
    required: true,
  },
  {
    id: "deponentOccupation",
    label: "Deponent Occupation",
    type: "text",
    required: true,
  },
  {
    id: "affidavitStatements",
    label: "Affidavit Statements",
    type: "textarea",
    required: true,
    description: "Number each paragraph and state facts clearly",
  },
  {
    id: "dateOfAffidavit",
    label: "Date of Affidavit",
    type: "date",
    required: true,
  },
];

const generateDocument = (d) =>
  `AFFIDAVIT\n\nTitle: ${d.affidavitTitle}\n${
    d.caseNumber ? `In the matter of Case No. ${d.caseNumber}\n` : ""
  }In the Court of ${d.courtName}\n\nI, ${d.deponentName}, ${
    d.deponentOccupation
  }, residing at ${
    d.deponentAddress
  }, do hereby solemnly affirm and state as follows:\n\n${
    d.affidavitStatements
  }\n\nI solemnly affirm that the contents of this affidavit are true to the best of my knowledge, information, and belief, and nothing material has been concealed.\n\nVerified at [Place] on this ${
    d.dateOfAffidavit
  }.\n\nDEPONENT\n\nVerification:\nVerified that the contents of the above affidavit are true and correct to the best of my knowledge and belief and nothing material has been concealed therefrom.\n\nVerified at [Place] on this ${
    d.dateOfAffidavit
  }.\n\nDEPONENT`;

const Affidavit = () => {
  const [formData, setFormData] = useState(() => {
    const o = {};
    fields.forEach((f) => (o[f.id] = ""));
    return o;
  });
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setGenerated({
        title: `Affidavit - ${formData.affidavitTitle}`,
        content: generateDocument(formData),
      });
      setLoading(false);
    }, 800);
  };
  const copyContent = () => {
    if (generated) navigator.clipboard.writeText(generated.content);
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
                      Affidavit - Standard
                    </h3>
                    <p className="text-xs text-emerald-600">
                      Standard template for affidavit
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
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
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
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className="w-full p-2.5 border text-xs border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    )
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white text-xs py-2.5 px-6 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
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
              </form>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
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
                <div className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-6 rounded-lg border border-gray-200 max-h-[600px] overflow-y-auto">
                  {generated.content}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={copyContent}
                    className="bg-emerald-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-emerald-700 flex items-center"
                  >
                    <i className="ri-clipboard-line mr-2" />
                    Copy
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
                <p className="text-gray-600 text-xs">Affidavit</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-0.5">
                  Description
                </h4>
                <p className="text-gray-600 text-xs">
                  A written statement under oath
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
                    <span>State facts, not arguments.</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-information-line text-blue-500 mr-2" />
                    <span>Number each paragraph.</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-information-line text-blue-500 mr-2" />
                    <span>Review for accuracy.</span>
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

export default Affidavit;
