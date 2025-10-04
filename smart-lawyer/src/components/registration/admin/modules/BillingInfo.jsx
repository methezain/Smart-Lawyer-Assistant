import React, { useState } from "react";

export default function BillingInfo({
  formData,
  handleChange,
  nextFormStep,
  prevFormStep,
}) {
  const [fieldErrors, setFieldErrors] = useState({});

  // Validate billing info fields
  const validateBillingInfo = () => {
    const errors = {};

    // Required fields validation
    const requiredFields = [
      { name: "bankName", label: "Bank name" },
      { name: "accountTitle", label: "Account title" },
      { name: "accountNumber", label: "Account number" },
      { name: "iban", label: "IBAN" },
      { name: "swiftCode", label: "SWIFT code" },
      { name: "branchCode", label: "Branch code" },
      { name: "taxId", label: "Tax ID" },
      { name: "billingAddress", label: "Billing address" },
      { name: "billingCity", label: "Billing city" },
      { name: "billingState", label: "Billing state" },
      { name: "billingZipCode", label: "Billing ZIP code" },
      { name: "billingCountry", label: "Billing country" },
    ];

    requiredFields.forEach((field) => {
      if (!formData[field.name]) {
        errors[field.name] = `${field.label} is required`;
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle continue button click
  const handleContinue = async () => {
    if (!validateBillingInfo()) {
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
    <div className="max-w-3xl mx-auto">
      <h2 className="text-md font-semibold text-gray-900 mb-3">
        Billing Information
      </h2>
      <p className="text-xs text-gray-600 mb-3">
        Provide your banking details to receive payments from clients. All
        information is encrypted and securely stored.
      </p>

      {/* General error message if any */}
      {fieldErrors.general && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-xs">
          {fieldErrors.general}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                SmartLawyer.ai Professional Plan
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Monthly subscription for legal practice management
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">$39.99</p>
              <p className="text-xs text-gray-500">per month</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              To activate your SmartLawyer.ai account and access our
              comprehensive legal practice management platform, you'll need to
              provide your billing information. This enables us to:
            </p>
            <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
              <li>Process your monthly subscription fee of $39.99</li>
              <li>
                Facilitate secure payment processing for your legal services
              </li>
              <li>Generate professional invoices and payment receipts</li>
              <li>Manage your firm's financial transactions</li>
              <li>Provide detailed billing reports and analytics</li>
            </ul>
            <p className="text-[11px] leading-relaxed bg-[#00A4B4]/40 text-[#04121B] rounded-xl px-4 py-2">
              <span className="font-semibold">Note:</span> Your subscription
              will automatically renew each month. You can cancel or modify your
              subscription at any time through your account settings. All
              payment information is encrypted and securely stored using
              industry-standard security protocols.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Bank Details Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Bank Account Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Bank Name */}
            <div className="col-span-2">
              <label
                htmlFor="bankName"
                className="block font-semibold text-gray-700 mb-1"
              >
                Bank Name<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.bankName ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter your bank name"
              />
              {renderError("bankName")}
            </div>

            {/* Account Title */}
            <div className="col-span-2">
              <label
                htmlFor="accountTitle"
                className="block font-semibold text-gray-700 mb-1"
              >
                Account Title<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="accountTitle"
                name="accountTitle"
                value={formData.accountTitle}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.accountTitle
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter account holder name"
              />
              {renderError("accountTitle")}
              <p className="mt-1 text-xs text-gray-500">
                Enter the name exactly as it appears on your bank account
              </p>
            </div>

            {/* Account Number */}
            <div>
              <label
                htmlFor="accountNumber"
                className="block font-semibold text-gray-700 mb-1"
              >
                Account Number<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.accountNumber
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter account number"
              />
              {renderError("accountNumber")}
            </div>

            {/* IBAN */}
            <div>
              <label
                htmlFor="iban"
                className="block font-semibold text-gray-700 mb-1"
              >
                IBAN<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="iban"
                name="iban"
                value={formData.iban}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.iban ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter IBAN"
              />
              {renderError("iban")}
            </div>

            {/* SWIFT/BIC Code */}
            <div>
              <label
                htmlFor="swiftCode"
                className="block font-semibold text-gray-700 mb-1"
              >
                SWIFT/BIC Code<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="swiftCode"
                name="swiftCode"
                value={formData.swiftCode}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.swiftCode ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter SWIFT/BIC code"
              />
              {renderError("swiftCode")}
            </div>

            {/* Branch Code */}
            <div>
              <label
                htmlFor="branchCode"
                className="block font-semibold text-gray-700 mb-1"
              >
                Branch Code<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="branchCode"
                name="branchCode"
                value={formData.branchCode}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.branchCode ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter branch code"
              />
              {renderError("branchCode")}
            </div>
          </div>
        </div>

        {/* Tax Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-xs">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Tax Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tax ID */}
            <div>
              <label
                htmlFor="taxId"
                className="block font-semibold text-gray-700 mb-1"
              >
                Tax ID/NTN<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.taxId ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter tax identification number"
              />
              {renderError("taxId")}
            </div>

            {/* VAT Number */}
            <div>
              <label
                htmlFor="vatNumber"
                className="block font-semibold text-gray-700 mb-1"
              >
                VAT Number (if applicable)
              </label>
              <input
                type="text"
                id="vatNumber"
                name="vatNumber"
                value={formData.vatNumber}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  fieldErrors.vatNumber ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter VAT number"
              />
              {renderError("vatNumber")}
            </div>
          </div>
        </div>

        {/* Billing Address Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-xs">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Billing Address
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address */}
            <div className="col-span-2">
              <label
                htmlFor="billingAddress"
                className="block font-semibold text-gray-700 mb-1"
              >
                Street Address<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="billingAddress"
                name="billingAddress"
                value={formData.billingAddress}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.billingAddress
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter street address"
              />
              {renderError("billingAddress")}
            </div>

            {/* City */}
            <div>
              <label
                htmlFor="billingCity"
                className="block font-semibold text-gray-700 mb-1"
              >
                City<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="billingCity"
                name="billingCity"
                value={formData.billingCity}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.billingCity ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter city"
              />
              {renderError("billingCity")}
            </div>

            {/* State/Province */}
            <div>
              <label
                htmlFor="billingState"
                className="block font-semibold text-gray-700 mb-1"
              >
                State/Province<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="billingState"
                name="billingState"
                value={formData.billingState}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.billingState
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter state/province"
              />
              {renderError("billingState")}
            </div>

            {/* ZIP/Postal Code */}
            <div>
              <label
                htmlFor="billingZipCode"
                className="block font-semibold text-gray-700 mb-1"
              >
                ZIP/Postal Code<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="billingZipCode"
                name="billingZipCode"
                value={formData.billingZipCode}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.billingZipCode
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter ZIP/postal code"
              />
              {renderError("billingZipCode")}
            </div>

            {/* Country */}
            <div>
              <label
                htmlFor="billingCountry"
                className="block font-semibold text-gray-700 mb-1"
              >
                Country<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="billingCountry"
                name="billingCountry"
                value={formData.billingCountry}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.billingCountry
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter country"
              />
              {renderError("billingCountry")}
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 m-6">
        <div className="flex items-start">
          <i className="ri-information-line text-yellow-500 text-lg"></i>
          <div className="ml-3">
            <h3 className="text-xs font-semibold mb-1 text-yellow-800">
              Secure Information
            </h3>
            <div className="text-xs text-yellow-700">
              <p>
                Your banking information is encrypted and securely stored. We
                use industry-standard security protocols to protect your data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex text-xs justify-center gap-6">
        <button
          type="button"
          onClick={prevFormStep}
          className="bg-gray-200 text-gray-800 px-24 py-2 cursor-pointer hover:bg-gray-300 transition-colors"
        >
          Back to Pricing Info
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="bg-[#00A4B4] text-white px-24 py-2 cursor-pointer hover:bg-opacity-90 transition-colors"
        >
          Continue to Verification
        </button>
      </div>
    </div>
  );
}
