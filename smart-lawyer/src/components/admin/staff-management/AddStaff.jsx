import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateStaffMutation } from "../../../reduxstore/services/StaffAPI";
import { useSelector } from "react-redux";

const AddStaff = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const initialFormState = {
    name: "",
    username: "",
    role: "",
    specialization: "",
    experience: "",
    email: "",
    phone: "",
    avatar: "",
    joinDate: new Date().toISOString().split("T")[0],
    education: [{ degree: "", institution: "", year: "" }],
    barAssociations: [""],
    bio: "",
    address: "",
    password: "",
    confirmPassword: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const auth = useSelector((s) => s.auth);
  const adminUsername = auth?.user?.username;
  const isLoggedIn = Boolean(auth?.token);

  // Available role options
  const roleOptions = [
    "Senior Advocate",
    "Advocate",
    "Junior Advocate",
    "Legal Assistant",
    "Paralegal",
    "Office Manager",
    "Administrative Staff",
    "Clerk",
    "IT Staff",
  ];

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };

  // Handle avatar upload
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const fileTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!fileTypes.includes(file.type)) {
      setFormErrors({
        ...formErrors,
        avatar: "Please upload a valid image file (JPG, JPEG, or PNG)",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors({
        ...formErrors,
        avatar: "Image size should be less than 5MB",
      });
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result);
      setFormData({
        ...formData,
        avatar: event.target.result,
      });

      // Clear any previous errors
      if (formErrors.avatar) {
        setFormErrors({
          ...formErrors,
          avatar: null,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle avatar removal
  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setFormData({
      ...formData,
      avatar: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle clicking the avatar area to open file input
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  // Handle education fields
  const handleEducationChange = (index, field, value) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value,
    };

    setFormData({
      ...formData,
      education: updatedEducation,
    });
  };

  // Add more education field
  const addEducationField = () => {
    setFormData({
      ...formData,
      education: [
        ...formData.education,
        { degree: "", institution: "", year: "" },
      ],
    });
  };

  // Remove education field
  const removeEducationField = (index) => {
    if (formData.education.length > 1) {
      const updatedEducation = formData.education.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        education: updatedEducation,
      });
    }
  };

  // Handle bar association fields
  const handleBarAssociationChange = (index, value) => {
    const updatedAssociations = [...formData.barAssociations];
    updatedAssociations[index] = value;

    setFormData({
      ...formData,
      barAssociations: updatedAssociations,
    });
  };

  // Add more bar association field
  const addBarAssociationField = () => {
    setFormData({
      ...formData,
      barAssociations: [...formData.barAssociations, ""],
    });
  };

  // Remove bar association field
  const removeBarAssociationField = (index) => {
    if (formData.barAssociations.length > 1) {
      const updatedAssociations = formData.barAssociations.filter(
        (_, i) => i !== index
      );
      setFormData({
        ...formData,
        barAssociations: updatedAssociations,
      });
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.username.trim()) errors.username = "Username is required";
    if (!formData.role) errors.role = "Role is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Email is invalid";

    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    if (!formData.joinDate) errors.joinDate = "Join date is required";

    if (formData.password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    // Avatar is optional, so we only validate if it's provided
    if (formData.avatar && formData.avatar.length > 5 * 1024 * 1024) {
      errors.avatar = "Profile image is too large (max 5MB)";
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      window.scrollTo(0, 0);
      return;
    }

    setSubmitStatus("loading");

    // Format arrays for backend
    const formattedEducation = formData.education
      .map(
        (edu) =>
          `${edu.degree}, ${edu.institution}${edu.year ? `, ${edu.year}` : ""}`
      )
      .filter((edu) => edu.trim() !== ",");
    const formattedBarAssociations = formData.barAssociations.filter(
      (assoc) => assoc.trim() !== ""
    );

    const payload = {
      name: formData.name,
      username: formData.username,
      role: formData.role,
      specialization: formData.specialization || null,
      experience: formData.experience || null,
      email: formData.email,
      phone: formData.phone,
      join_date: formData.joinDate,
      address: formData.address || null,
      bio: formData.bio || null,
      education: formattedEducation,
      bar_associations: formattedBarAssociations,
      avatar_url: formData.avatar || null,
      password: formData.password,
    };

    try {
      await createStaff(payload).unwrap();
      setSubmitStatus("success");
      if (adminUsername) {
        navigate(`/admin/${adminUsername}/staff-directory`);
      } else {
        navigate("/admin/staff-directory");
      }
    } catch (err) {
      console.error("Failed to create staff:", err);
      setSubmitStatus(null);
      const status = err?.status;
      const msg = err?.data?.message || err?.data?.detail || err?.error;
      if (status === 409) {
        setFormErrors({ api: "A staff member with this email already exists" });
      } else {
        setFormErrors({ api: msg || "Failed to create staff" });
      }
      window.scrollTo(0, 0);
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    if (adminUsername) {
      navigate(`/admin/${adminUsername}/staff-directory`);
    } else {
      navigate("/admin/staff-directory");
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {submitStatus === "success" && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-start shadow-sm">
          <i className="ri-checkbox-circle-line text-xl mr-2 mt-0.5"></i>
          <div>
            <p className="font-medium">Staff member successfully added!</p>
            <p className="text-xs">
              Login credentials have been sent to the provided email address.
            </p>
          </div>
        </div>
      )}

      {Object.keys(formErrors).length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-sm">
          <p className="font-medium flex items-center">
            <i className="ri-error-warning-line mr-2"></i>
            Please fix the following errors:
          </p>
          <ul className="list-disc ml-5 mt-1 text-xs">
            {Object.values(formErrors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Layout: main form + aside */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 ">
        {/* Main form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
          {/* Page header */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-3">
            <h1 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
              <i className="ri-user-add-line"></i>
              Add New Staff Member
            </h1>
          </div>
          {/* Basic Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-user-3-line text-emerald-600"></i>
              <h3 className="font-semibold">Basic Information</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-gray-700"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full border ${
                    formErrors.name ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                  placeholder="e.g. Muhammad Ahmed Khan"
                />
                {formErrors.name && (
                  <p className="text-xs text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="block text-xs font-medium text-gray-700"
                >
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <i className="ri-user-line text-gray-400"></i>
                  </span>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full border ${
                      formErrors.username ? "border-red-300" : "border-gray-300"
                    } rounded-lg pl-10 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                    placeholder="Choose a username"
                  />
                </div>
                {formErrors.username && (
                  <p className="text-xs text-red-600">{formErrors.username}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="role"
                  className="block text-xs font-medium text-gray-700"
                >
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`w-full border ${
                    formErrors.role ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                >
                  <option value="">Select a role</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {formErrors.role && (
                  <p className="text-xs text-red-600">{formErrors.role}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="specialization"
                  className="block text-xs font-medium text-gray-700"
                >
                  Specialization Area
                </label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  placeholder="e.g. Family Law, Criminal Law, etc."
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="joinDate"
                  className="block text-xs font-medium text-gray-700"
                >
                  Join Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="joinDate"
                  name="joinDate"
                  value={formData.joinDate}
                  onChange={handleInputChange}
                  className={`w-full border ${
                    formErrors.joinDate ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                />
                {formErrors.joinDate && (
                  <p className="text-xs text-red-600">{formErrors.joinDate}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="experience"
                  className="block text-xs font-medium text-gray-700"
                >
                  Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className={`w-full border ${
                    formErrors.experience ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                  placeholder="e.g. 3 Years"
                />
                {formErrors.experience && (
                  <p className="text-xs text-red-600">
                    {formErrors.experience}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-contacts-line text-emerald-600"></i>
              <h3 className="font-semibold">Contact Information</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-gray-700"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <i className="ri-mail-line text-gray-400"></i>
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full border ${
                      formErrors.email ? "border-red-300" : "border-gray-300"
                    } rounded-lg pl-10 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                    placeholder="e.g. name@smartlawyer.ai"
                  />
                </div>
                {formErrors.email && (
                  <p className="text-xs text-red-600">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="phone"
                  className="block text-xs font-medium text-gray-700"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <i className="ri-phone-line text-gray-400"></i>
                  </span>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full border ${
                      formErrors.phone ? "border-red-300" : "border-gray-300"
                    } rounded-lg pl-10 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                    placeholder="e.g. +92 300 1234567"
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-xs text-red-600">{formErrors.phone}</p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label
                  htmlFor="address"
                  className="block text-xs font-medium text-gray-700"
                >
                  Office Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <i className="ri-map-pin-line text-gray-400"></i>
                  </span>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg pl-10 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    placeholder="e.g. Office #405, Lawyers Complex, Lahore High Court, Lahore"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-briefcase-4-line text-emerald-600"></i>
              <h3 className="font-semibold">Professional Information</h3>
            </div>
            <div className="p-4 space-y-6">
              {/* Education */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <label className="text-xs font-medium text-gray-700 mb-3 flex items-center">
                  <i className="ri-graduation-cap-line text-emerald-600 mr-2"></i>
                  Education
                </label>
                <div className="space-y-3">
                  {formData.education.map((edu, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-4 gap-3"
                    >
                      <input
                        type="text"
                        placeholder="Degree (e.g. LLB, LLM)"
                        value={edu.degree}
                        onChange={(e) =>
                          handleEducationChange(index, "degree", e.target.value)
                        }
                        className="md:col-span-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                      />
                      <input
                        type="text"
                        placeholder="Institution"
                        value={edu.institution}
                        onChange={(e) =>
                          handleEducationChange(
                            index,
                            "institution",
                            e.target.value
                          )
                        }
                        className="md:col-span-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Year"
                          value={edu.year}
                          onChange={(e) =>
                            handleEducationChange(index, "year", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeEducationField(index)}
                          className="px-3 py-2 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                          disabled={formData.education.length === 1}
                          title="Remove"
                        >
                          <i className="ri-subtract-line"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addEducationField}
                  className="mt-3 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 shadow-sm transition-colors inline-flex items-center text-xs"
                >
                  <i className="ri-add-line mr-1"></i> Add More Education
                </button>
              </div>

              {/* Bar Associations */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <label className="text-xs font-medium text-gray-700 mb-3 flex items-center">
                  <i className="ri-scales-line text-emerald-600 mr-2"></i>
                  Bar Associations (if applicable)
                </label>
                <div className="space-y-2">
                  {formData.barAssociations.map((assoc, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Bar Association Name"
                        value={assoc}
                        onChange={(e) =>
                          handleBarAssociationChange(index, e.target.value)
                        }
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeBarAssociationField(index)}
                        className="px-3 py-2 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                        disabled={formData.barAssociations.length === 1}
                        title="Remove"
                      >
                        <i className="ri-subtract-line"></i>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addBarAssociationField}
                  className="mt-3 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 shadow-sm transition-colors inline-flex items-center text-xs"
                >
                  <i className="ri-add-line mr-1"></i> Add Bar Association
                </button>
              </div>

              {/* Bio */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <label
                  htmlFor="bio"
                  className="text-xs font-medium text-gray-700 mb-3 flex items-center"
                >
                  <i className="ri-file-text-line text-emerald-600 mr-2"></i>
                  Professional Biography
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows="4"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  placeholder="Brief professional biography and expertise description..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-lock-line text-emerald-600"></i>
              <h3 className="font-semibold">Account Information</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-700"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <i className="ri-lock-password-line text-gray-400"></i>
                  </span>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full border ${
                      formErrors.password ? "border-red-300" : "border-gray-300"
                    } rounded-lg pl-10 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                    placeholder="Enter password"
                  />
                </div>
                {formErrors.password && (
                  <p className="text-xs text-red-600">{formErrors.password}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium text-gray-700"
                >
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <i className="ri-checkbox-circle-line text-gray-400"></i>
                  </span>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full border ${
                      formErrors.confirmPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-lg pl-10 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                    placeholder="Confirm password"
                  />
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-xs text-red-600">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-2 bg-white/80 backdrop-blur rounded-xl border border-gray-200 p-3 flex items-center justify-end gap-3 shadow-sm">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-xs border border-gray-300 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center"
            >
              <i className="ri-close-line mr-1"></i>
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-colors flex items-center"
              disabled={submitStatus === "loading" || isCreating || !isLoggedIn}
            >
              {submitStatus === "loading" ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Adding Staff...
                </>
              ) : (
                <>
                  <i className="ri-user-add-line mr-1"></i>
                  Add Staff Member
                </>
              )}
            </button>
          </div>
        </form>

        {/* Aside: Avatar & preview */}
        <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          {/* Helpful guidelines */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-information-line text-emerald-600"></i>
              <h3 className="font-semibold">Guidelines</h3>
            </div>
            <div className="p-4 text-xs text-gray-700 space-y-2">
              <div className="flex items-start gap-2">
                <i className="ri-camera-line text-gray-400 mt-0.5"></i>
                <span>
                  Use a clear headshot for the profile photo (JPG/PNG, max 5MB).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <i className="ri-asterisk text-gray-400 mt-0.5"></i>
                <span>
                  Required fields: Full Name, Role, Join Date, Experience,
                  Email, Phone, Password.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <i className="ri-graduation-cap-line text-gray-400 mt-0.5"></i>
                <span>
                  Education and Bar Associations are optional but improve the
                  profile.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <i className="ri-shield-keyhole-line text-gray-400 mt-0.5"></i>
                <span>Password must be at least 6 characters.</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="ri-edit-2-line text-gray-400 mt-0.5"></i>
                <span>
                  You can update these details later from the Staff Directory.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-image-line text-emerald-600"></i>
              <h3 className="font-semibold">Profile Picture</h3>
            </div>
            <div className="p-4 pb-2 flex flex-col items-center">
              <div
                onClick={handleAvatarClick}
                className="w-36 h-36 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden mb-3 hover:border-emerald-500 transition-colors bg-gray-50 shadow-sm"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    <i className="ri-camera-line text-3xl text-gray-400"></i>
                    <p className="text-xs text-gray-500 mt-1">
                      Click to upload
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="px-4 py-2 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg shadow-sm transition-colors flex items-center"
                >
                  <i
                    className={`${
                      avatarPreview ? "ri-refresh-line" : "ri-upload-2-line"
                    } mr-1`}
                  ></i>
                  {avatarPreview ? "Change Photo" : "Upload Photo"}
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-4 py-2 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg shadow-sm transition-colors flex items-center"
                  >
                    <i className="ri-delete-bin-line mr-1"></i>
                    Remove
                  </button>
                )}
              </div>

              {formErrors.avatar && (
                <p className="text-xs text-red-600 mt-2">{formErrors.avatar}</p>
              )}
              <p className="text-[10px] text-gray-500 mt-3">
                Upload a profile photo (JPG, PNG). Max size 5MB.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-eye-line text-emerald-600"></i>
              <h3 className="font-semibold">Quick Preview</h3>
            </div>
            <div className="p-4 pb-2.5 text-xs text-gray-700 space-y-2">
              <div className="flex items-center gap-2">
                <i className="ri-user-line text-gray-400"></i>
                <span className="font-medium">
                  {formData.name || "Full Name"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-scales-2-line text-gray-400"></i>
                <span className="truncate">
                  {(formData.barAssociations && formData.barAssociations[0]) ||
                    "Bar Council"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-briefcase-line text-gray-400"></i>
                <span>{formData.role || "Role"}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-mail-line text-gray-400"></i>
                <span className="truncate">
                  {formData.email || "email@example.com"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-phone-line text-gray-400"></i>
                <span>{formData.phone || "+92 300 1234567"}</span>
              </div>
              {formData.specialization && (
                <div className="flex items-center gap-2">
                  <i className="ri-magic-line text-gray-400"></i>
                  <span className="truncate">{formData.specialization}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
                This is a quick glance of the information that will appear on
                the staff directory.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AddStaff;
