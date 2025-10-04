import React, { useState } from "react";

const Pricing = ({ formData, handleChange, nextFormStep, prevFormStep }) => {
  const [fieldErrors, setFieldErrors] = useState({});

  // Validate pricing fields
  const validatePricing = () => {
    const errors = {};

    // Either case fee or hourly rate is required, but not both
    const hasCaseFee = formData.caseFee && parseFloat(formData.caseFee) > 0;
    const hasHourlyRate =
      formData.hourlyRate && parseFloat(formData.hourlyRate) > 0;

    if (!hasCaseFee && !hasHourlyRate) {
      errors.pricing = "Please set either a case fee or hourly rate";
    }

    // Consultation fee validation (only if not free)
    if (!formData.freeConsultation && !formData.consultationFee) {
      errors.consultationFee = "Consultation fee is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle continue button click
  const handleContinue = () => {
    if (!validatePricing()) {
      return; // Don't proceed if validation fails
    }

    // Check if CNIC number is available (should be set from previous step)
    if (!formData.cnicNumber) {
      setFieldErrors({
        general:
          "Missing CNIC number from user information. Please go back and complete the first step.",
      });
      return;
    }

    // If validation passes, proceed to next step
    if (nextFormStep) {
      nextFormStep();
    }
  };

  // Helper function to render error message
  const renderError = (field) => {
    return fieldErrors[field] ? (
      <p className="mt-1 text-xs text-red-500">{fieldErrors[field]}</p>
    ) : null;
  };

  return (
    <div>
      <h2 className="text-md font-bold text-[#04121B] mb-3">Service Pricing</h2>
      <p className="text-xs mb-3 opacity-45">
        Set your pricing for various legal services you offer. Transparent
        pricing helps clients choose your services.
      </p>

      {/* General error message if any */}
      {fieldErrors.general && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-xs">
          {fieldErrors.general}
        </div>
      )}

      <div className="space-y-6 text-xs">
        {/* Pricing Method Selection Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-xs font-medium mb-1">
            Pricing Method
          </p>
          <p className="text-blue-700 text-xs">
            Choose either case-based pricing OR hourly billing. You don't need
            to fill both.
          </p>
        </div>

        {/* General pricing error */}
        {fieldErrors.pricing && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-xs">
            {fieldErrors.pricing}
          </div>
        )}

        {/* Case Fee */}
        <div>
          <label
            htmlFor="caseFee"
            className="block font-semibold text-gray-700 mb-1"
          >
            Standard Case Fee
            <span className="text-gray-500 font-normal ml-1">
              (Choose this OR hourly rate)
            </span>
          </label>
          <div className="flex">
            <select
              id="caseCurrency"
              name="caseCurrency"
              value={formData.caseCurrency || "PKR"}
              onChange={handleChange}
              className="w-24 px-2 py-2 bg-gray-100 border border-gray-300 rounded-l-lg focus:outline-none cursor-pointer "
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            <input
              type="number"
              id="caseFee"
              name="caseFee"
              value={formData.caseFee}
              onChange={handleChange}
              required
              min="0"
              className={`flex-1 px-3 py-2 border-t border-b border-gray-300 focus:outline-none ${
                fieldErrors.caseFee ? "border-red-500" : ""
              }`}
              placeholder="0.00"
            />
            <span className="bg-gray-100 w-28 text-center py-2 border border-gray-300 rounded-r-lg">
              per case
            </span>
          </div>
          {renderError("caseFee")}
          <p className="mt-1 text-xs text-gray-500">
            This is the fee you charge for handling a standard case
          </p>
        </div>

        {/* Hourly Rate */}
        <div>
          <label
            htmlFor="hourlyRate"
            className="block font-semibold text-gray-700 mb-1"
          >
            Standard Hourly Rate
            <span className="text-gray-500 font-normal ml-1">
              (Choose this OR case fee)
            </span>
          </label>
          <div className="flex">
            <select
              id="hourlyCurrency"
              name="hourlyCurrency"
              value={formData.hourlyCurrency || "PKR"}
              onChange={handleChange}
              className="w-24 px-2 py-2 bg-gray-100 border border-gray-300 rounded-l-lg focus:outline-none cursor-pointer "
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            <input
              type="number"
              id="hourlyRate"
              name="hourlyRate"
              value={formData.hourlyRate}
              onChange={handleChange}
              required
              min="0"
              className={`flex-1 px-3 py-2 border border-gray-300 focus:outline-none ${
                fieldErrors.hourlyRate ? "border-red-500" : ""
              }`}
              placeholder="0.00"
            />
            <span className="bg-gray-100 w-28 text-center py-2 border border-gray-300 rounded-r-lg text-gray-700">
              per hour
            </span>
          </div>
          {renderError("hourlyRate")}
          <p className="mt-1 text-xs text-gray-500">
            Your standard rate for legal services charged by the hour
          </p>
        </div>

        {/* Consultation Fee */}
        <div>
          <label
            htmlFor="consultationFee"
            className="block font-semibold text-gray-700 mb-1"
          >
            Consultation Fee<span className="text-red-500 ml-1">*</span>
          </label>

          {/* Free Consultation Checkbox */}
          <div className="flex items-center my-4">
            <input
              type="checkbox"
              id="freeConsultation"
              name="freeConsultation"
              checked={formData.freeConsultation || false}
              onChange={handleChange}
              className="size-3.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="freeConsultation" className="ml-2 text-gray-700">
              Offer free consultation
            </label>
          </div>

          {/* Consultation Fee Input - Hidden when free consultation is checked */}
          {!formData.freeConsultation && (
            <div className="flex">
              <select
                id="consultationCurrency"
                name="consultationCurrency"
                value={formData.consultationCurrency || "PKR"}
                onChange={handleChange}
                className="w-24 px-2 py-2 bg-gray-100 border border-gray-300 rounded-l-lg focus:outline-none cursor-pointer "
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
              <input
                type="number"
                id="consultationFee"
                name="consultationFee"
                value={formData.consultationFee}
                onChange={handleChange}
                required={!formData.freeConsultation}
                min="0"
                className={`flex-1 px-3 py-2 border-t border-b border-gray-300 focus:outline-none ${
                  fieldErrors.consultationFee ? "border-red-500" : ""
                }`}
                placeholder="0.00"
              />
              <select
                id="consultationUnit"
                name="consultationUnit"
                value={formData.consultationUnit || "hourly"}
                onChange={handleChange}
                className="w-28 px-2 py-2 bg-gray-100 border border-gray-300 rounded-r-lg focus:outline-none cursor-pointer"
              >
                <option value="hourly">per hour</option>
                <option value="session">per session</option>
                <option value="fixed">fixed fee</option>
              </select>
            </div>
          )}

          {!formData.freeConsultation && renderError("consultationFee")}

          <p className="mt-1 text-xs text-gray-500">
            {formData.freeConsultation
              ? "You're offering free consultations to attract more clients"
              : "This is the fee you charge for initial consultations"}
          </p>
        </div>

        {/* Retainer Fee */}
        <div>
          <label
            htmlFor="retainerFee"
            className="block font-semibold text-gray-700 mb-1"
          >
            Retainer Fee (optional)
          </label>
          <div className="flex">
            <select
              id="retainerCurrency"
              name="retainerCurrency"
              value={formData.retainerCurrency || "PKR"}
              onChange={handleChange}
              className="w-24 px-2 py-2 bg-gray-100 border border-gray-300 rounded-l-lg focus:outline-none cursor-pointer "
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            <input
              type="number"
              id="retainerFee"
              name="retainerFee"
              value={formData.retainerFee}
              onChange={handleChange}
              min="0"
              className={`flex-1 px-3 py-2 border-t border-b border-gray-300 focus:outline-none ${
                fieldErrors.retainerFee ? "border-red-500" : ""
              }`}
              placeholder="0.00"
            />
            <select
              id="retainerUnit"
              name="retainerUnit"
              value={formData.retainerUnit || "monthly"}
              onChange={handleChange}
              className="w-28 px-2 py-2 bg-gray-100 border border-gray-300 rounded-r-lg focus:outline-none cursor-pointer"
            >
              <option value="monthly">per month</option>
              <option value="quarterly">per quarter</option>
              <option value="annually">per year</option>
            </select>
          </div>
          {renderError("retainerFee")}
          <p className="mt-1 text-xs text-gray-500">
            Minimum amount clients must deposit to secure your services
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex text-xs justify-center gap-6">
        <button
          type="button"
          onClick={prevFormStep}
          className="bg-gray-200 text-gray-800 px-24 py-2 cursor-pointer hover:bg-gray-300 transition-colors"
        >
          Back to Credentials
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="bg-[#00A4B4] text-white px-24 py-2 cursor-pointer hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Billing Info
        </button>
      </div>
    </div>
  );
};

export default Pricing;
