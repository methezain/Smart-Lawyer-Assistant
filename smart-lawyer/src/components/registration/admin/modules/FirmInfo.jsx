import React, { useState, useEffect } from "react";
import UserInfo from "./UserInfo";
import ContactDetails from "./ContactDetails";

const FirmInfo = ({ formData, handleChange, nextFormStep }) => {
  const [activeSection, setActiveSection] = useState(1);
  const [profileImage, setProfileImage] = useState(
    formData.profileImage ? URL.createObjectURL(formData.profileImage) : null
  );
  const [bannerImage, setBannerImage] = useState(
    formData.bannerImage ? URL.createObjectURL(formData.bannerImage) : null
  );
  const [fieldErrors, setFieldErrors] = useState({});

  const nextSection = () => {
    setActiveSection(activeSection + 1);
  };

  const prevSection = () => {
    setActiveSection(activeSection - 1);
  };

  // Ensure arrays are initialized
  useEffect(() => {
    // Initialize arrays if they don't exist
    if (!formData.services) {
      handleChange({
        target: {
          name: "services",
          value: [],
        },
      });
    }

    if (!formData.specialty) {
      handleChange({
        target: {
          name: "specialty",
          value: [],
        },
      });
    }

    if (!formData.secondarySpecialties) {
      handleChange({
        target: {
          name: "secondarySpecialties",
          value: [],
        },
      });
    }

    if (!formData.advisory) {
      handleChange({
        target: {
          name: "advisory",
          value: [],
        },
      });
    }
  }, [
    formData.services,
    formData.specialty,
    formData.secondarySpecialties,
    formData.advisory,
    handleChange,
  ]);

  const validateFirmInfo = () => {
    const errors = {};
    // if (!formData.firmLogo) errors.firmLogo = "Firm Logo is required";
    if (!formData.firmName) errors.firmName = "Firm name is required";
    if (!formData.firmTitle) errors.firmTitle = "Firm title is required";
    if (!formData.advisory || formData.advisory.length === 0)
      errors.advisory = "Please add at least one advisory";
    if (!formData.firmType) errors.firmType = "Firm type is required";
    if (!formData.establishedYear)
      errors.establishedYear = "Year established is required";
    if (!formData.description)
      errors.description = "Firm description is required";
    if (formData.services?.length === 0)
      errors.services = "Please select at least one service";
    if (formData.specialty?.length === 0)
      errors.specialty = "Please select at least one practice area";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateFirmInfo()) {
      setFieldErrors({});
      nextSection();
    }
  };

  // Helper function to render error message
  const renderError = (field) => {
    return fieldErrors[field] ? (
      <p className="text-red-500 text-xs mt-1">{fieldErrors[field]}</p>
    ) : null;
  };

  // Add a handler for checkbox changes
  const handleCheckboxChange = (e, arrayName, maxItems) => {
    const { value, checked } = e.target;
    const currentArray = Array.isArray(formData[arrayName])
      ? [...formData[arrayName]]
      : [];

    if (checked && currentArray.length < maxItems) {
      // Add the value to the array
      handleChange({
        target: {
          name: arrayName,
          value: [...currentArray, value],
        },
      });
    } else if (!checked) {
      // Remove the value from the array
      handleChange({
        target: {
          name: arrayName,
          value: currentArray.filter((item) => item !== value),
        },
      });
    }
  };

  // Handle profile image upload
  const handleProfileImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(URL.createObjectURL(e.target.files[0]));
      handleChange({
        target: {
          name: "profileImage",
          type: "file",
          files: e.target.files,
        },
      });
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    handleChange({
      target: {
        name: "profileImage",
        value: null,
        type: "file",
        files: [],
      },
    });
  };

  // Handle banner image upload
  const handleBannerImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBannerImage(URL.createObjectURL(e.target.files[0]));
      handleChange({
        target: {
          name: "bannerImage",
          type: "file",
          files: e.target.files,
        },
      });
    }
  };

  const handleRemoveBannerImage = () => {
    setBannerImage(null);
    handleChange({
      target: {
        name: "bannerImage",
        value: null,
        type: "file",
        files: [],
      },
    });
  };

  // Handle adding new advisory item
  const handleAddAdvisory = () => {
    const currentAdvisory = Array.isArray(formData.advisory)
      ? [...formData.advisory]
      : [];

    handleChange({
      target: {
        name: "advisory",
        value: [...currentAdvisory, ""],
      },
    });
  };

  // Handle removing advisory item
  const handleRemoveAdvisory = (index) => {
    const currentAdvisory = Array.isArray(formData.advisory)
      ? [...formData.advisory]
      : [];

    currentAdvisory.splice(index, 1);

    handleChange({
      target: {
        name: "advisory",
        value: currentAdvisory,
      },
    });
  };

  // Handle updating specific advisory item
  const handleAdvisoryChange = (index, value) => {
    const currentAdvisory = Array.isArray(formData.advisory)
      ? [...formData.advisory]
      : [];

    currentAdvisory[index] = value;

    handleChange({
      target: {
        name: "advisory",
        value: currentAdvisory,
      },
    });
  };

  return (
    <div>
      {/* Section 1: User Information - Always visible */}
      <UserInfo
        formData={formData}
        handleChange={handleChange}
        nextFormStep={nextSection}
        isActive={activeSection === 1}
      />

      {/* Section 2: Firm Information - Visible when activeSection >= 2 */}
      <div
        className={`transition-all duration-300 ${
          activeSection >= 2
            ? "opacity-100 max-h-[2000px]"
            : "opacity-0 max-h-0 overflow-hidden"
        }`}
      >
        {/* Merged NewFirmInfo Content */}
        <div>
          <h2 className="text-md font-semibold mb-1">Firm Information</h2>

          {/* Profile Image Upload */}
          <div className="mb-8 mt-2">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Firm Logo <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex items-start space-x-6">
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center relative">
                {profileImage ? (
                  <>
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </>
                ) : (
                  <>
                    <i className="ri-image-add-line text-3xl text-gray-400 mb-2"></i>
                    <p className="text-xs text-gray-500">Upload logo</p>
                  </>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <label
                    htmlFor="profileImage"
                    className="bg-[#04121B] text-xs text-white px-3 py-1.5 rounded-lg cursor-pointer hover:bg-opacity-90 transition-colors"
                  >
                    {profileImage ? "Change Image" : "Choose Image"}
                  </label>
                  <input
                    type="file"
                    id="profileImage"
                    name="profileImage"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    className="hidden"
                  />
                  {profileImage && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Recommended size: 300x300px. Max file size: 2MB.
                  <br />
                  Supported formats: JPG, PNG, GIF
                </p>
              </div>
            </div>
          </div>

          {/* Banner Image Upload */}
          <div className="mb-8">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Banner Image <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex items-start space-x-6">
              <div
                className="w-full max-w-md h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center relative"
                style={{ aspectRatio: "16/6" }}
              >
                {bannerImage ? (
                  <>
                    <img
                      src={bannerImage}
                      alt="Banner"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveBannerImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </>
                ) : (
                  <>
                    <i className="ri-landscape-line text-3xl text-gray-400 mb-2"></i>
                    <p className="text-xs text-gray-500">Upload banner</p>
                  </>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <label
                    htmlFor="bannerImage"
                    className="bg-[#04121B] text-xs text-white px-3 py-1.5 rounded-lg cursor-pointer hover:bg-opacity-90 transition-colors"
                  >
                    {bannerImage ? "Change Banner" : "Choose Banner"}
                  </label>
                  <input
                    type="file"
                    id="bannerImage"
                    name="bannerImage"
                    accept="image/*"
                    onChange={handleBannerImageUpload}
                    className="hidden"
                  />
                  {bannerImage && (
                    <button
                      type="button"
                      onClick={handleRemoveBannerImage}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Recommended size: 1200x450px (16:6 ratio). Max file size: 5MB.
                  <br />
                  Supported formats: JPG, PNG, GIF
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Firm Name */}
            <div className="col-span-2">
              <label
                htmlFor="firmName"
                className="block font-medium text-gray-700 mb-1"
              >
                Firm Name<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="firmName"
                name="firmName"
                value={formData.firmName}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.firmName ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                placeholder="Enter your firm's legal name"
              />
              {renderError("firmName")}
            </div>

            {/* Firm Title */}
            <div className="col-span-2">
              <label
                htmlFor="firmTitle"
                className="block font-medium text-gray-700 mb-1"
              >
                Firm Title<span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                id="firmTitle"
                name="firmTitle"
                value={formData.firmTitle || ""}
                onChange={handleChange}
                required
                maxLength={80}
                rows={2}
                className={`w-full text-3xl px-3 py-2 border ${
                  fieldErrors.firmTitle ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none overflow-hidden`}
                placeholder="Enter your firm's title or tagline"
                style={{ minHeight: "60px" }}
              />
              <p className="mt-1 text-xs text-gray-500">
                <span className="text-gray-700 font-medium">
                  {formData.firmTitle ? formData.firmTitle.length : 0}
                </span>
                /80 characters
              </p>
              {renderError("firmTitle")}
            </div>

            {/* Advisory */}
            <div className="col-span-2">
              <label
                htmlFor="advisory"
                className="block font-medium text-gray-700 mb-2"
              >
                Advisory of<span className="text-red-500 ml-1">*</span>
              </label>

              <div className="space-y-2">
                {/* Plus button or advisory inputs */}
                <div className="flex items-center gap-2">
                  {Array.isArray(formData.advisory) &&
                    formData.advisory.length > 0 && (
                      <div className="flex items-center gap-2 flex-1">
                        {formData.advisory.map((advisory, index) => (
                          <input
                            key={index}
                            type="text"
                            value={advisory}
                            onChange={(e) =>
                              handleAdvisoryChange(index, e.target.value)
                            }
                            className={`px-3 py-2 border ${
                              fieldErrors.advisory
                                ? "border-red-500"
                                : "border-gray-300"
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs w-24`}
                            placeholder={index === 0 ? "PIA" : "CDA"}
                            maxLength={10}
                          />
                        ))}
                      </div>
                    )}

                  {Array.isArray(formData.advisory) &&
                  formData.advisory.length < 2 ? (
                    <button
                      type="button"
                      onClick={handleAddAdvisory}
                      className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors"
                      title="Add Advisory"
                    >
                      <i className="ri-add-line text-sm"></i>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleChange({
                          target: {
                            name: "advisory",
                            value: [],
                          },
                        })
                      }
                      className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Cancel Advisories"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  )}
                </div>
              </div>

              {renderError("advisory")}
            </div>

            {/* Firm Type */}
            <div>
              <label
                htmlFor="firmType"
                className="block font-medium text-gray-700 mb-1"
              >
                Firm Type<span className="text-red-500 ml-1">*</span>
              </label>
              <select
                id="firmType"
                name="firmType"
                value={formData.firmType}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.firmType ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
              >
                <option value="">Select firm type</option>
                <option value="soleProprietorship">Sole Proprietorship</option>
                <option value="partnership">Partnership</option>
                <option value="llc">Limited Liability Company (LLC)</option>
                <option value="professional">Professional Corporation</option>
                <option value="other">Other</option>
              </select>
              {renderError("firmType")}
            </div>

            {/* Established Year */}
            <div>
              <label
                htmlFor="establishedYear"
                className="block font-medium text-gray-700 mb-1"
              >
                Year Established<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                id="establishedYear"
                name="establishedYear"
                value={formData.establishedYear}
                onChange={handleChange}
                required
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                className={`w-full px-3 py-2 border ${
                  fieldErrors.establishedYear
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                placeholder="YYYY"
              />
              {renderError("establishedYear")}
            </div>

            {/* Services Offered */}
            <div className="col-span-2">
              <label
                htmlFor="services"
                className="block font-medium text-gray-700 mb-1"
              >
                Services Offered<span className="text-red-500 ml-1">*</span>{" "}
                (Select up to 5)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: "legalConsultation", label: "Legal Consultation" },
                  {
                    value: "courtRepresentation",
                    label: "Court Representation",
                  },
                  { value: "documentDrafting", label: "Document Drafting" },
                  { value: "contractReview", label: "Contract Review" },
                  { value: "legalResearch", label: "Legal Research" },
                  { value: "mediation", label: "Mediation" },
                  { value: "arbitration", label: "Arbitration" },
                  { value: "legalOpinion", label: "Legal Opinion" },
                  { value: "dueDiligence", label: "Due Diligence" },
                  { value: "compliance", label: "Compliance" },
                ].map((service) => (
                  <div key={service.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={service.value}
                      name="services"
                      value={service.value}
                      checked={
                        Array.isArray(formData.services) &&
                        formData.services.includes(service.value)
                      }
                      onChange={(e) => handleCheckboxChange(e, "services", 5)}
                      className="h-4 w-4  accent-[#0c0c0c] border-gray-300 rounded"
                    />
                    <label
                      htmlFor={service.value}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {service.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Selected:{" "}
                {Array.isArray(formData.services)
                  ? formData.services.length
                  : 0}
                /5 services
              </p>
              {renderError("services")}
            </div>

            {/* Primary Practice Areas */}
            <div className="col-span-2">
              <label
                htmlFor="specialty"
                className="block font-medium text-gray-700 mb-1"
              >
                Primary Practice Areas<span className="text-red-500">*</span>{" "}
                (Select up to 3)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: "corporateLaw", label: "Corporate Law" },
                  { value: "criminalLaw", label: "Criminal Law" },
                  { value: "familyLaw", label: "Family Law" },
                  { value: "civilLitigation", label: "Civil Litigation" },
                  { value: "realEstate", label: "Real Estate Law" },
                  {
                    value: "intellectualProperty",
                    label: "Intellectual Property",
                  },
                  { value: "taxLaw", label: "Tax Law" },
                  { value: "employmentLaw", label: "Employment Law" },
                  { value: "immigrationLaw", label: "Immigration Law" },
                  { value: "personalInjury", label: "Personal Injury" },
                  { value: "generalPractice", label: "General Practice" },
                ].map((specialty) => (
                  <div key={specialty.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={specialty.value}
                      name="specialty"
                      value={specialty.value}
                      checked={
                        Array.isArray(formData.specialty) &&
                        formData.specialty.includes(specialty.value)
                      }
                      onChange={(e) => handleCheckboxChange(e, "specialty", 3)}
                      className="h-4 w-4 accent-[#0c0c0c] border-gray-300 rounded"
                    />
                    <label
                      htmlFor={specialty.value}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {specialty.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Selected:{" "}
                {Array.isArray(formData.specialty)
                  ? formData.specialty.length
                  : 0}
                /3 specialties
              </p>
              {renderError("specialty")}
            </div>

            {/* Secondary Practice Areas */}
            <div className="col-span-2">
              <label
                htmlFor="secondarySpecialties"
                className="block font-medium text-gray-700 mb-1"
              >
                Secondary Practice Areas (Select up to 2)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: "bankruptcy", label: "Bankruptcy" },
                  { value: "environmentalLaw", label: "Environmental Law" },
                  { value: "medicalMalpractice", label: "Medical Malpractice" },
                  {
                    value: "intellectualProperty",
                    label: "Intellectual Property",
                  },
                  { value: "internationalLaw", label: "International Law" },
                  { value: "cyberLaw", label: "Cyber Law" },
                  { value: "laborLaw", label: "Labor Law" },
                  { value: "constitutionalLaw", label: "Constitutional Law" },
                ].map((specialty) => (
                  <div key={specialty.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`secondary-${specialty.value}`}
                      name="secondarySpecialties"
                      value={specialty.value}
                      checked={
                        Array.isArray(formData.secondarySpecialties) &&
                        formData.secondarySpecialties.includes(specialty.value)
                      }
                      onChange={(e) =>
                        handleCheckboxChange(e, "secondarySpecialties", 2)
                      }
                      className="h-4 w-4 accent-[#0c0c0c] border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`secondary-${specialty.value}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {specialty.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Selected:{" "}
                {Array.isArray(formData.secondarySpecialties)
                  ? formData.secondarySpecialties.length
                  : 0}
                /2 secondary practice areas
              </p>
              {renderError("secondarySpecialties")}
            </div>

            {/* Firm Description */}
            <div className="col-span-2">
              <label
                htmlFor="description"
                className="block font-medium text-gray-700 mb-1"
              >
                Firm Description<span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Provide a detailed description of your law firm, expertise, and services offered..."
              ></textarea>
              {renderError("description")}
              <p className="mt-1 text-xs text-gray-500">
                <span className="text-gray-700 font-medium">
                  {formData.description ? formData.description.length : 0}
                </span>
                /500 characters (minimum 100)
              </p>
            </div>
          </div>

          <div className="my-6 flex text-xs justify-center gap-6">
            {activeSection === 2 && (
              <>
                <button
                  type="button"
                  onClick={prevSection}
                  className="bg-gray-200 text-gray-800 px-24 py-2 cursor-pointer hover:bg-gray-300 transition-colors"
                >
                  Back to User Info
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-[#00A4B4] text-white px-24 py-2 cursor-pointer hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Contact Info
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Contact Information - Visible when activeSection >= 3 */}
      <div
        className={`transition-all duration-300 ${
          activeSection >= 3
            ? "opacity-100 max-h-[2000px]"
            : "opacity-0 max-h-0 overflow-hidden"
        }`}
      >
        <ContactDetails
          formData={formData}
          handleChange={handleChange}
          nextFormStep={nextFormStep}
          prevFormStep={prevSection}
          isActive={activeSection === 3}
        />
      </div>
    </div>
  );
};

export default FirmInfo;
