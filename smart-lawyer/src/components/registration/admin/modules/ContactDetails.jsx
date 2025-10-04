import React, { useState } from "react";

const ContactDetails = ({
  formData,
  handleChange,
  nextFormStep,
  prevFormStep,
  isActive = true,
}) => {
  const [fieldErrors, setFieldErrors] = useState({});
  const [officeHours, setOfficeHours] = useState(formData.officeHours || []);

  const daysOfWeek = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  // Add new office hours range
  const addOfficeHoursRange = () => {
    const newRange = {
      id: Date.now(),
      startDay: 0, // Monday
      endDay: 4, // Friday
      startTime: "09:00",
      endTime: "17:00",
    };
    const updatedHours = [...officeHours, newRange];
    setOfficeHours(updatedHours);
    handleChange({
      target: {
        name: "officeHours",
        value: updatedHours,
      },
    });
  };

  // Remove office hours range
  const removeOfficeHoursRange = (id) => {
    const updatedHours = officeHours.filter((range) => range.id !== id);
    setOfficeHours(updatedHours);
    handleChange({
      target: {
        name: "officeHours",
        value: updatedHours,
      },
    });
  };

  // Update office hours range
  const updateOfficeHoursRange = (id, field, value) => {
    const updatedHours = officeHours.map((range) =>
      range.id === id ? { ...range, [field]: parseInt(value) || value } : range
    );
    setOfficeHours(updatedHours);
    handleChange({
      target: {
        name: "officeHours",
        value: updatedHours,
      },
    });
  };

  // Get covered days from all ranges
  const getCoveredDays = () => {
    const covered = new Set();
    officeHours.forEach((range) => {
      for (let i = range.startDay; i <= range.endDay; i++) {
        covered.add(i);
      }
    });
    return covered;
  };

  // Get uncovered (closed) days
  const getClosedDays = () => {
    const covered = getCoveredDays();
    return daysOfWeek.filter((_, index) => !covered.has(index));
  };

  const validateContactInfo = () => {
    const errors = {};
    if (!formData.address) errors.address = "Address is required";
    if (!formData.city) errors.city = "City is required";
    if (!formData.state) errors.state = "State/Province is required";
    if (!formData.country) errors.country = "Country is required";
    if (!formData.phone) errors.phone = "Phone number is required";
    if (!formData.email) errors.email = "Email is required";

    // Email validation pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailPattern.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMoveToNextStep = () => {
    // Validate contact info fields before moving to the next step
    if (!validateContactInfo()) {
      return; // Don't proceed if validation fails
    }

    // If validation passes, proceed to next step
    if (nextFormStep) {
      nextFormStep();
    }
  };

  // Helper function to render error message
  const renderError = (field) => {
    return fieldErrors[field] ? (
      <p className="text-red-500 text-xs mt-1">{fieldErrors[field]}</p>
    ) : null;
  };

  return (
    <div>
      <h2 className="text-md font-semibold mb-1">Contact Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Address */}
        <div className="col-span-2">
          <label
            htmlFor="address"
            className="block font-medium text-gray-700 mb-1"
          >
            Address<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 border ${
              fieldErrors.address ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
            placeholder="Street address"
          />
          {renderError("address")}
        </div>

        {/* City */}
        <div>
          <label
            htmlFor="city"
            className="block font-medium text-gray-700 mb-1"
          >
            City<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 border ${
              fieldErrors.city ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
            placeholder="City"
          />
          {renderError("city")}
        </div>

        {/* State/Province */}
        <div>
          <label
            htmlFor="state"
            className="block font-medium text-gray-700 mb-1"
          >
            State/Province<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 border ${
              fieldErrors.state ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
            placeholder="State or province"
          />
          {renderError("state")}
        </div>

        {/* Zip/Postal Code */}
        <div>
          <label
            htmlFor="zipCode"
            className="block font-medium text-gray-700 mb-1"
          >
            Zip/Postal Code<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 border ${
              fieldErrors.zipCode ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
            placeholder="Zip or postal code"
          />
          {renderError("zipCode")}
        </div>

        {/* Country */}
        <div>
          <label
            htmlFor="country"
            className="block font-medium text-gray-700 mb-1"
          >
            Country<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 border ${
              fieldErrors.country ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
            placeholder="Enter your country"
          />
          {renderError("country")}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="block font-medium text-gray-700 mb-1"
          >
            Phone Number<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 border ${
              fieldErrors.phone ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
            placeholder="e.g., +92 300 1234567"
          />
          {renderError("phone")}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block font-medium text-gray-700 mb-1"
          >
            Email<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 border ${
              fieldErrors.email ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
            placeholder="firm@example.com"
          />
          {renderError("email")}
        </div>

        {/* Website */}
        <div>
          <label
            htmlFor="website"
            className="block font-medium text-gray-700 mb-1"
          >
            Website (optional)
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${
              fieldErrors.website ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
            placeholder="https://www.example.com"
          />
          {renderError("website")}
        </div>

        {/* Business Hours */}
        <div className="col-span-2 text-xs">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-gray-700 text-[13px] font-semibold">
              Office Hours<span className="text-red-500 ml-1">*</span>
            </label>
            <button
              type="button"
              onClick={addOfficeHoursRange}
              className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-1 rounded-md hover:bg-emerald-600 transition-colors text-xs"
            >
              <i className="ri-add-line"></i>
              Add Hours Range
            </button>
          </div>

          {/* Office Hours Ranges */}
          <div className="space-y-4">
            {officeHours.map((range, index) => (
              <div
                key={range.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">
                    Range {index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeOfficeHoursRange(range.id)}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                    title="Remove range"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Start Day */}
                  <div>
                    <label className="block text-gray-600 mb-1">From</label>
                    <select
                      value={range.startDay}
                      onChange={(e) =>
                        updateOfficeHoursRange(
                          range.id,
                          "startDay",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {daysOfWeek.map((day, index) => (
                        <option key={day.key} value={index}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* End Day */}
                  <div>
                    <label className="block text-gray-600 mb-1">To</label>
                    <select
                      value={range.endDay}
                      onChange={(e) =>
                        updateOfficeHoursRange(
                          range.id,
                          "endDay",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {daysOfWeek.map((day, index) => (
                        <option
                          key={day.key}
                          value={index}
                          disabled={index < range.startDay}
                        >
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-gray-600 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={range.startTime}
                      onChange={(e) =>
                        updateOfficeHoursRange(
                          range.id,
                          "startTime",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-gray-600 mb-1">End Time</label>
                    <input
                      type="time"
                      value={range.endTime}
                      onChange={(e) =>
                        updateOfficeHoursRange(
                          range.id,
                          "endTime",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Display covered days */}
                <div className="mt-3 p-2 bg-white rounded border">
                  <p className="text-xs text-gray-600 mb-1">Covers:</p>
                  <div className="flex flex-wrap gap-1">
                    {daysOfWeek
                      .slice(range.startDay, range.endDay + 1)
                      .map((day) => (
                        <span
                          key={day.key}
                          className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded"
                        >
                          {day.label}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Show closed days */}
            {getClosedDays().length > 0 && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h4 className="font-medium text-red-700 mb-2">Closed Days</h4>
                <div className="flex flex-wrap gap-1">
                  {getClosedDays().map((day) => (
                    <span
                      key={day.key}
                      className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded"
                    >
                      {day.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {officeHours.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <i className="ri-time-line text-3xl text-gray-400 mb-2 block"></i>
                <p className="text-gray-500 text-sm">No office hours set</p>
                <p className="text-gray-400 text-xs">
                  Click "Add Hours Range" to get started
                </p>
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Create ranges for your office hours. For example: Monday to Friday
            9:00 AM - 5:00 PM, then add another range for Saturday 10:00 AM -
            2:00 PM. Days not covered will be marked as closed.
          </p>
        </div>
      </div>

      <div className="mt-12 flex text-xs justify-center gap-6">
        {isActive && (
          <>
            <button
              type="button"
              onClick={prevFormStep}
              className="bg-gray-200 text-gray-800 px-24 py-2 cursor-pointer hover:bg-gray-300 transition-colors"
            >
              Back to Firm Info
            </button>
            <button
              type="button"
              onClick={handleMoveToNextStep}
              className="bg-[#00A4B4] text-white px-24 py-2 cursor-pointer hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Credentials
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ContactDetails;
