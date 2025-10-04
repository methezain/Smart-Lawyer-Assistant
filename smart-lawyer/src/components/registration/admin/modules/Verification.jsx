import React, { useState, useEffect } from "react";

const Verification = ({
  formData,
  handleChange,
  nextFormStep,
  prevFormStep,
  apiMessages,
  isSubmitting,
}) => {
  const [fieldErrors, setFieldErrors] = useState({});
  const [_generalError, setGeneralError] = useState("");
  const [_isDebugMode] = useState(false);

  // Listen for API error messages from parent component
  useEffect(() => {
    if (apiMessages?.general) {
      setGeneralError(apiMessages.general);
    }
  }, [apiMessages]);

  // Keep track of file upload states
  const [uploadedFiles, setUploadedFiles] = useState({
    documentFile_front: null,
    documentFile_back: null,
    documentFile_certificate: null,
  });

  // RTK Query hook for creating verification

  // Handle file change for document uploads
  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Update the form data with the file
      handleChange({
        target: {
          name: type,
          type: "file",
          files: [file],
        },
      });

      // Also track uploaded files separately for display
      setUploadedFiles((prev) => ({
        ...prev,
        [type]: file,
      }));
    }
  };

  const _handleRemoveFile = (type) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [type]: null,
    }));
    handleChange({
      target: {
        name: type,
        value: null,
        type: "file",
      },
    });
  };

  // Validate all fields for the verification step
  const validateFields = () => {
    const errors = {};

    // Document type is required
    if (!formData.documentType) {
      errors.documentType = "Please select a document type";
    }

    // Validation based on document type
    if (formData.documentType === "barLicense") {
      if (!formData.documentFile_front && !uploadedFiles.documentFile_front) {
        errors.documentFile_front =
          "Please upload the front of your Bar License";
      }
      if (!formData.documentFile_back && !uploadedFiles.documentFile_back) {
        errors.documentFile_back = "Please upload the back of your Bar License";
      }
    } else if (formData.documentType === "enrollmentCertificate") {
      if (
        !formData.documentFile_certificate &&
        !uploadedFiles.documentFile_certificate
      ) {
        errors.documentFile_certificate =
          "Please upload your Enrollment Certificate";
      }
    }

    // Bar council number is required
    if (!formData.barCouncilNumber) {
      errors.barCouncilNumber = "Bar Council Registration Number is required";
    }

    // Affiliation is required
    if (!formData.affiliation) {
      errors.affiliation = "Please select your Bar Council affiliation";
    }

    // Terms acceptance is required
    if (!formData.termsAccepted) {
      errors.termsAccepted = "You must accept the terms and conditions";
    }

    // Set error state and return validation result
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle continue button click
  const handleSubmit = () => {
    // Validate all fields first
    if (!validateFields()) {
      return; // Don't proceed if validation fails
    }

    // Check if CNIC number is available
    if (!formData.cnicNumber) {
      setFieldErrors({
        general:
          "Missing CNIC number from personal information. Please complete previous steps properly.",
      });
      return;
    }

    // Prepare the verification data
    const verificationData = {
      documentType: formData.documentType,
      documentFile_front: formData.documentFile_front,
      documentFile_back: formData.documentFile_back,
      documentFile_certificate: formData.documentFile_certificate,
      barCouncilNumber: formData.barCouncilNumber,
      affiliation: formData.affiliation,
      termsAccepted: formData.termsAccepted,
      cnicNumber: formData.cnicNumber,
    };

    // Log the verification data for debugging
    console.log("Verification data being sent:", verificationData);

    // Call the next step handler which will trigger the final submission
    if (nextFormStep) {
      nextFormStep(verificationData);
    }
  };

  // Helper function to render error message
  const renderError = (field) => {
    return fieldErrors[field] ? (
      <p className="mt-1 text-xs text-red-500">{fieldErrors[field]}</p>
    ) : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-md font-bold text-[#04121B] mb-3">
          Verification Documents
        </h2>
        <p className="text-xs mb-3 opacity-45">
          Please provide the necessary verification documents to complete your
          registration. This information will be used to verify your identity
          and legal credentials.
        </p>
      </div>

      {/* Document Type Selection */}
      <div className="max-w-md mx-auto text-xs">
        <label
          htmlFor="documentType"
          className="block font-semibold text-gray-700 mb-2"
        >
          Document Type<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`border rounded-lg p-4 cursor-pointer hover:border-[#00A4B4] transition ${
              formData.documentType === "barLicense"
                ? "border-[#00A4B4] bg-blue-50"
                : "border-gray-200"
            }`}
            onClick={() =>
              handleChange({
                target: { name: "documentType", value: "barLicense" },
              })
            }
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  formData.documentType === "barLicense"
                    ? "border-[#00A4B4]"
                    : "border-gray-400"
                }`}
              >
                {formData.documentType === "barLicense" && (
                  <div className="w-2 h-2 rounded-full bg-[#00A4B4]"></div>
                )}
              </div>
              <span
                className={
                  formData.documentType === "barLicense"
                    ? "font-semibold text-[#00A4B4]"
                    : ""
                }
              >
                Bar Council License
              </span>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 ml-6">
              Front and back of your Bar Council license or registration card
            </p>
          </div>

          <div
            className={`border rounded-lg p-4 cursor-pointer hover:border-[#00A4B4] transition ${
              formData.documentType === "enrollmentCertificate"
                ? "border-[#00A4B4] bg-blue-50"
                : "border-gray-200"
            }`}
            onClick={() =>
              handleChange({
                target: {
                  name: "documentType",
                  value: "enrollmentCertificate",
                },
              })
            }
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  formData.documentType === "enrollmentCertificate"
                    ? "border-[#00A4B4]"
                    : "border-gray-400"
                }`}
              >
                {formData.documentType === "enrollmentCertificate" && (
                  <div className="w-2 h-2 rounded-full bg-[#00A4B4]"></div>
                )}
              </div>
              <span
                className={
                  formData.documentType === "enrollmentCertificate"
                    ? "font-semibold text-[#00A4B4]"
                    : ""
                }
              >
                Enrollment Certificate
              </span>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 ml-6">
              Your Bar Council enrollment or practice certificate
            </p>
          </div>
        </div>
        {renderError("documentType")}
      </div>

      {/* Bar License Document Upload */}
      {formData.documentType === "barLicense" && (
        <div className="max-w-md mx-auto space-y-4 text-xs">
          {/* Front of Bar License */}
          <div>
            <label
              htmlFor="documentFile_front"
              className="block font-semibold text-gray-700 mb-2"
            >
              Front of Bar License<span className="text-red-500 ml-1">*</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                fieldErrors.documentFile_front
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300 hover:border-[#00A4B4]"
              } transition-colors cursor-pointer`}
              onClick={() => {
                document.getElementById("documentFile_front").click();
              }}
            >
              {uploadedFiles.documentFile_front ? (
                <div className="flex flex-col items-center">
                  <div className="text-green-500 mb-2">
                    <i className="ri-file-upload-line text-2xl"></i>
                  </div>
                  <p className="font-medium text-gray-800">
                    {uploadedFiles.documentFile_front.name}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Click to change file
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="text-gray-400 mb-2">
                    <i className="ri-upload-cloud-line text-2xl"></i>
                  </div>
                  <p className="font-medium text-gray-600">
                    Upload front of license
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    JPG, PNG or PDF, max 5MB
                  </p>
                </div>
              )}
              <input
                id="documentFile_front"
                name="documentFile_front"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "documentFile_front")}
              />
            </div>
            {renderError("documentFile_front")}
          </div>

          {/* Back of Bar License */}
          <div>
            <label
              htmlFor="documentFile_back"
              className="block font-semibold text-gray-700 mb-2"
            >
              Back of Bar License<span className="text-red-500 ml-1">*</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                fieldErrors.documentFile_back
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300 hover:border-[#00A4B4]"
              } transition-colors cursor-pointer`}
              onClick={() => {
                document.getElementById("documentFile_back").click();
              }}
            >
              {uploadedFiles.documentFile_back ? (
                <div className="flex flex-col items-center">
                  <div className="text-green-500 mb-2">
                    <i className="ri-file-upload-line text-2xl"></i>
                  </div>
                  <p className="font-medium text-gray-800">
                    {uploadedFiles.documentFile_back.name}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Click to change file
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="text-gray-400 mb-2">
                    <i className="ri-upload-cloud-line text-2xl"></i>
                  </div>
                  <p className="font-medium text-gray-600">
                    Upload back of license
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    JPG, PNG or PDF, max 5MB
                  </p>
                </div>
              )}
              <input
                id="documentFile_back"
                name="documentFile_back"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "documentFile_back")}
              />
            </div>
            {renderError("documentFile_back")}
          </div>
        </div>
      )}

      {/* Enrollment Certificate Upload */}
      {formData.documentType === "enrollmentCertificate" && (
        <div className="max-w-md mx-auto text-xs">
          <label
            htmlFor="documentFile_certificate"
            className="block font-semibold text-gray-700 mb-2"
          >
            Enrollment Certificate<span className="text-red-500 ml-1">*</span>
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              fieldErrors.documentFile_certificate
                ? "border-red-400 bg-red-50"
                : "border-gray-300 hover:border-[#00A4B4]"
            } transition-colors cursor-pointer`}
            onClick={() => {
              document.getElementById("documentFile_certificate").click();
            }}
          >
            {uploadedFiles.documentFile_certificate ? (
              <div className="flex flex-col items-center">
                <div className="text-green-500 mb-2">
                  <i className="ri-file-upload-line text-2xl"></i>
                </div>
                <p className="font-medium text-gray-800">
                  {uploadedFiles.documentFile_certificate.name}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Click to change file
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-gray-400 mb-2">
                  <i className="ri-upload-cloud-line text-2xl"></i>
                </div>
                <p className="font-medium text-gray-600">
                  Upload enrollment certificate
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  JPG, PNG or PDF, max 5MB
                </p>
              </div>
            )}
            <input
              id="documentFile_certificate"
              name="documentFile_certificate"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "documentFile_certificate")}
            />
          </div>
          {renderError("documentFile_certificate")}
        </div>
      )}

      {/* Bar Council Number */}
      <div className="max-w-md mx-auto text-xs">
        <label
          htmlFor="barCouncilNumber"
          className="block font-semibold text-gray-700 mb-2"
        >
          Bar Council Registration Number
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          id="barCouncilNumber"
          name="barCouncilNumber"
          value={formData.barCouncilNumber}
          onChange={handleChange}
          className={`w-full px-4 py-2 border ${
            fieldErrors.barCouncilNumber ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:ring-2 focus:ring-[#00A4B4] focus:border-transparent`}
          placeholder="Enter your Bar Council Registration Number"
        />
        {renderError("barCouncilNumber")}
        <p className="mt-1 text-[10px] text-gray-500">
          This is the unique number issued by your Bar Council when you
          registered as a lawyer
        </p>
      </div>

      {/* Bar Council Affiliation */}
      <div className="max-w-md mx-auto text-xs">
        <label
          htmlFor="affiliation"
          className="block font-semibold text-gray-700 mb-2"
        >
          Bar Council Affiliation<span className="text-red-500 ml-1">*</span>
        </label>
        <select
          id="affiliation"
          name="affiliation"
          value={formData.affiliation}
          onChange={handleChange}
          className={`w-full px-4 py-2 border ${
            fieldErrors.affiliation ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:ring-2 focus:ring-[#00A4B4] focus:border-transparent`}
        >
          <option value="">Select your Bar Council</option>
          <option value="Pakistan Bar Council">Pakistan Bar Council</option>
          <option value="Punjab Bar Council">Punjab Bar Council</option>
          <option value="Sindh Bar Council">Sindh Bar Council</option>
          <option value="Khyber Pakhtunkhwa Bar Council">
            Khyber Pakhtunkhwa Bar Council
          </option>
          <option value="Balochistan Bar Council">
            Balochistan Bar Council
          </option>
          <option value="Islamabad Bar Council">Islamabad Bar Council</option>
        </select>
        {renderError("affiliation")}
      </div>

      {/* Terms and Conditions */}
      <div className="max-w-md mx-auto text-xs">
        <div className="flex items-start gap-2">
          <div className="pt-1">
            <input
              type="checkbox"
              id="termsAccepted"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={(e) =>
                handleChange({
                  target: {
                    name: "termsAccepted",
                    type: "checkbox",
                    checked: e.target.checked,
                  },
                })
              }
              className="h-4 w-4 text-[#00A4B4] focus:ring-[#00A4B4] border-gray-300 rounded"
            />
          </div>
          <div>
            <label
              htmlFor="termsAccepted"
              className="font-medium text-gray-700"
            >
              I accept the Terms and Conditions
              <span className="text-red-500 ml-1">*</span>
            </label>
            <p className="mt-1 text-gray-500 text-[10px]">
              By checking this box, you agree to the{" "}
              <a
                href="#"
                className="text-[#00A4B4] underline"
                onClick={(e) => e.preventDefault()}
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-[#00A4B4] underline"
                onClick={(e) => e.preventDefault()}
              >
                Privacy Policy
              </a>
              . You also confirm that all information and documents provided are
              accurate and authentic.
            </p>
            {renderError("termsAccepted")}
          </div>
        </div>
      </div>
      {/* General error message if any */}
      {fieldErrors.general && (
        <div className="bg-red-100 border max-w-md mx-auto border-red-400 text-red-700 px-4 py-3 rounded-xl text-xs">
          {fieldErrors.general}
        </div>
      )}

      {/* General error message if any */}
      {fieldErrors.general && (
        <div className="bg-red-100 border max-w-md mx-auto border-red-400 text-red-700 px-4 py-3 rounded-xl  text-xs">
          {fieldErrors.general}
        </div>
      )}

      {/* API error messages */}
      {apiMessages && apiMessages.general && (
        <div className="bg-red-100 border max-w-md mx-auto border-red-400 text-red-700 px-4 py-3 rounded-xl  text-xs">
          {apiMessages.general}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-12 flex justify-center gap-6 text-xs">
        <button
          type="button"
          onClick={prevFormStep}
          className="bg-gray-200 text-gray-800 px-24 py-2 cursor-pointer hover:bg-gray-300 transition-colors"
        >
          Back to Billing Info
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-[#00A4B4] text-white px-24 py-2 cursor-pointer hover:bg-opacity-90 transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : (
            "Submit Registration"
          )}
        </button>
      </div>
    </div>
  );
};

export default Verification;
