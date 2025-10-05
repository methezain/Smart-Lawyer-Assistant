import React, { useState } from "react";

const UserInfo = ({
  formData,
  handleChange,
  nextFormStep,
  isActive = true,
}) => {
  const [fieldErrors, setFieldErrors] = useState({});

  const validateUserInfo = () => {
    const errors = {};
    if (!formData.firstName) errors.firstName = "First name is required";
    if (!formData.lastName) errors.lastName = "Last name is required";
    if (!formData.cnicNumber) errors.cnicNumber = "CNIC number is required";
    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!formData.cnicFront) errors.cnicFront = "CNIC front image is required";
    if (!formData.cnicBack) errors.cnicBack = "CNIC back image is required";

    // CNIC validation pattern
    const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;
    if (formData.cnicNumber && !cnicPattern.test(formData.cnicNumber)) {
      errors.cnicNumber = "CNIC must be in format: 12345-1234567-1";
    }

    // Date validation - ensure it's in YYYY-MM-DD format
    if (formData.dateOfBirth) {
      // Convert date to YYYY-MM-DD format if it's not already
      const dateObj = new Date(formData.dateOfBirth);
      if (!isNaN(dateObj.getTime())) {
        // Valid date, ensure correct format for API
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        // Update the form data with properly formatted date
        if (formattedDate !== formData.dateOfBirth) {
          handleChange({
            target: {
              name: "dateOfBirth",
              value: formattedDate,
            },
          });
        }
      } else {
        errors.dateOfBirth = "Please enter a valid date";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateUserInfo()) {
      setFieldErrors({});
      nextFormStep();
    }
  };

  // Helper function to render error message
  const renderError = (field) => {
    return fieldErrors[field] ? (
      <p className="text-red-500 text-xs mt-1">{fieldErrors[field]}</p>
    ) : null;
  };

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    handleChange({
      target: {
        name: "dateOfBirth",
        value: dateValue,
      },
    });
  };

  // Handle CNIC front image upload
  const handleCNICFrontUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleChange({
        target: {
          name: "cnicFront",
          type: "file",
          files: e.target.files,
        },
      });
    }
  };

  // Handle CNIC back image upload
  const handleCNICBackUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleChange({
        target: {
          name: "cnicBack",
          type: "file",
          files: e.target.files,
        },
      });
    }
  };

  return (
    <div>
      <h2 className="text-md font-semibold mb-4">User Information</h2>
      <p className="m-6 text-[11px] leading-relaxed bg-[#00A4B4]/20 text-[#04121B] rounded-xl p-3">
        Welcome to SmartLawyer.ai's firm registration process. As a legal
        service provider, we prioritize the security and authenticity of our
        platform. Your personal information is crucial for establishing your
        professional identity and ensuring compliance with legal regulations.
        This information will be used to verify your credentials and maintain
        the integrity of our legal services marketplace. Rest assured, all
        information provided will be handled with the utmost confidentiality and
        in accordance with data protection laws.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 text-xs">
        {/* First Name */}
        <div>
          <label
            htmlFor="firstName"
            className="block font-medium text-gray-700 mb-1"
          >
            First Name<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 border ${
              fieldErrors.firstName ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
            placeholder="Enter your first name"
          />
          {renderError("firstName")}
        </div>

        {/* Middle Name */}
        <div>
          <label
            htmlFor="middleName"
            className="block font-medium text-gray-700 mb-1"
          >
            Middle Name
          </label>
          <input
            type="text"
            id="middleName"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter your middle name (optional)"
          />
          {renderError("middleName")}
        </div>

        {/* Last Name */}
        <div>
          <label
            htmlFor="lastName"
            className="block font-medium text-gray-700 mb-1"
          >
            Last Name<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 border ${
              fieldErrors.lastName ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
            placeholder="Enter your last name"
          />
          {renderError("lastName")}
        </div>
      </div>

      {/* CNIC Number */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div>
          <label
            htmlFor="cnicNumber"
            className="block font-medium text-gray-700 mb-1"
          >
            CNIC Number<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="cnicNumber"
            name="cnicNumber"
            value={formData.cnicNumber}
            onChange={handleChange}
            required
            pattern="[0-9]{5}-[0-9]{7}-[0-9]"
            className={`w-full px-3 py-2 border ${
              fieldErrors.cnicNumber ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
            placeholder="XXXXX-XXXXXXX-X"
          />
          {renderError("cnicNumber")}
        </div>

        {/* Date of Birth */}
        <div>
          <label
            htmlFor="dateOfBirth"
            className="block font-medium text-gray-700 mb-1"
          >
            Date of Birth<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleDateChange}
            required
            className={`w-full px-3 py-2 border ${
              fieldErrors.dateOfBirth ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
          />
          {renderError("dateOfBirth")}
        </div>

        {/* CNIC Front Image */}
        <div>
          <label
            htmlFor="cnicFront"
            className="block font-medium text-gray-700 mb-1"
          >
            CNIC Front Image<span className="text-red-500 ml-1">*</span>
          </label>
          <div className="mt-1 flex items-center">
            <input
              type="file"
              id="cnicFront"
              name="cnicFront"
              accept="image/*"
              onChange={handleCNICFrontUpload}
              required
              className="hidden"
            />
            <label
              htmlFor="cnicFront"
              className={`bg-[#04121B] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-opacity-90 transition-colors ${
                fieldErrors.cnicFront ? "bg-red-500" : ""
              }`}
            >
              Upload CNIC Front
            </label>
            {formData.cnicFront && (
              <span className="ml-3 text-sm text-gray-600">
                {formData.cnicFront.name}
              </span>
            )}
          </div>
          {renderError("cnicFront")}
          <p className="mt-1 text-xs text-gray-500">
            Upload a clear image of your CNIC front side
          </p>
        </div>

        {/* CNIC Back Image */}
        <div>
          <label
            htmlFor="cnicBack"
            className="block font-medium text-gray-700 mb-1"
          >
            CNIC Back Image<span className="text-red-500 ml-1">*</span>
          </label>
          <div className="mt-1 flex items-center">
            <input
              type="file"
              id="cnicBack"
              name="cnicBack"
              accept="image/*"
              onChange={handleCNICBackUpload}
              required
              className="hidden"
            />
            <label
              htmlFor="cnicBack"
              className={`bg-[#04121B] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-opacity-90 transition-colors ${
                fieldErrors.cnicBack ? "bg-red-500" : ""
              }`}
            >
              Upload CNIC Back
            </label>
            {formData.cnicBack && (
              <span className="ml-3 text-sm text-gray-600">
                {formData.cnicBack.name}
              </span>
            )}
          </div>
          {renderError("cnicBack")}
          <p className="mt-1 text-xs text-gray-500">
            Upload a clear image of your CNIC back side
          </p>
        </div>
      </div>

      <div className="mt-12 flex text-xs justify-center">
        {isActive && (
          <button
            type="button"
            onClick={handleNext}
            className="bg-[#00A4B4] text-white px-24 py-2 cursor-pointer hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Firm Info
          </button>
        )}
      </div>
    </div>
  );
};

export default UserInfo;
