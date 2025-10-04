import React, { useEffect, useState } from "react";

// Edit modal for a document. Mirrors the UX pattern of EditCase but tailored for documents.
const EditDocument = ({
  isOpen,
  onClose,
  onEdit,
  documentToEdit,
  casesData,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    caseId: "",
    type: "Petition",
    customType: "",
    status: "Final",
    description: "",
    tags: "",
  });

  const [errors, setErrors] = useState({});
  const [useCustomType, setUseCustomType] = useState(false);

  useEffect(() => {
    if (documentToEdit) {
      const knownTypes = [
        "Petition",
        "Evidence",
        "Court Order",
        "Agreement",
        "Financial",
        "Legal",
        "Medical",
        "Testimony",
        "Contract",
        "Communication",
        "Educational",
      ];

      const isCustom = !knownTypes.includes(documentToEdit.type);
      setUseCustomType(isCustom);

      setFormData({
        title: documentToEdit.title || "",
        caseId: documentToEdit.caseId?.toString() || "",
        type: isCustom ? "Other" : documentToEdit.type || "Petition",
        customType: isCustom ? documentToEdit.type : "",
        status: documentToEdit.status || "Final",
        description: documentToEdit.description || "",
        tags: Array.isArray(documentToEdit.tags)
          ? documentToEdit.tags.join(", ")
          : documentToEdit.tags || "",
      });
      setErrors({});
    }
  }, [documentToEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "type") {
      setUseCustomType(value === "Other");
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Document title is required";
    if (!formData.caseId) newErrors.caseId = "Please select a case";
    if (useCustomType && !formData.customType.trim())
      newErrors.customType = "Custom document type is required";
    if (!useCustomType && !formData.type)
      newErrors.type = "Document type is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const finalType = useCustomType ? formData.customType : formData.type;
    const parsedCaseId = parseInt(formData.caseId, 10);
    const tagsArray = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onEdit({
      id: documentToEdit.id,
      title: formData.title,
      type: finalType,
      caseId: parsedCaseId,
      status: formData.status,
      description: formData.description,
      tags: tagsArray.length ? tagsArray : [finalType, "Document"],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Edit Document</h2>
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
                Title*
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.title ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                placeholder="e.g. Witness Statement"
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Case*
              </label>
              <select
                name="caseId"
                value={formData.caseId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.caseId ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white`}
              >
                <option value="">Select a case</option>
                {casesData.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} — {c.title}
                  </option>
                ))}
              </select>
              {errors.caseId && (
                <p className="text-red-500 text-xs mt-1">{errors.caseId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type*
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Petition">Petition</option>
                <option value="Evidence">Evidence</option>
                <option value="Court Order">Court Order</option>
                <option value="Agreement">Agreement</option>
                <option value="Financial">Financial</option>
                <option value="Legal">Legal</option>
                <option value="Medical">Medical</option>
                <option value="Testimony">Testimony</option>
                <option value="Contract">Contract</option>
                <option value="Communication">Communication</option>
                <option value="Educational">Educational</option>
                <option value="Other">Other (Custom)</option>
              </select>
              {useCustomType && (
                <div className="mt-2">
                  <input
                    type="text"
                    name="customType"
                    value={formData.customType}
                    onChange={handleChange}
                    placeholder="Enter custom document type"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status*
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Final">Final</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`w-full px-3 py-2 border ${
                errors.description ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              placeholder="Briefly describe the document"
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Evidence, Financial, Contract"
            />
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

export default EditDocument;
