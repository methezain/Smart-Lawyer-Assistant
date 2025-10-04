import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useAdminLoginMutation } from "../../../reduxstore/services/AdminAuthAPI";
import { useNavigate, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import {
  useGetStaffQuery,
  useUpdateStaffMutation,
  useRevealStaffPasswordMutation,
} from "../../../reduxstore/services/StaffAPI";

const toInputDate = (value) => {
  try {
    const d = value ? new Date(value) : null;
    if (!d || isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
};

const parseEducation = (items) => {
  if (!Array.isArray(items)) return [{ degree: "", institution: "", year: "" }];
  const parsed = items.map((s) => {
    if (typeof s !== "string") return { degree: "", institution: "", year: "" };
    const bits = s.split(",").map((x) => x.trim());
    return {
      degree: bits[0] || "",
      institution: bits[1] || "",
      year: bits[2] || "",
    };
  });
  return parsed.length ? parsed : [{ degree: "", institution: "", year: "" }];
};

const stringifyEducation = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map(
      (r) =>
        `${r.degree || ""}, ${r.institution || ""}${
          r.year ? `, ${r.year}` : ""
        }`
    )
    .filter((s) => s.replaceAll(",", "").trim() !== "");
};

const EditStaff = ({ staffId: staffIdProp, onCancel }) => {
  const { id: idFromRoute } = useParams();
  const staffId = staffIdProp ?? idFromRoute;
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { data, isFetching, isError, error } = useGetStaffQuery(staffId, {
    skip: !staffId,
  });
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
  const [revealStaffPassword] = useRevealStaffPasswordMutation();

  const initialFormState = useMemo(
    () => ({
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
    }),
    []
  );

  const [formData, setFormData] = useState(initialFormState);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [status, setStatus] = useState("idle");
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [adminPwd, setAdminPwd] = useState("");
  const [isAdminPwdVisible, setIsAdminPwdVisible] = useState(false);
  const [isNewPwdVisible, setIsNewPwdVisible] = useState(false);
  const [isConfirmPwdVisible, setIsConfirmPwdVisible] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const auth = useSelector((s) => s.auth);
  const adminUsername = auth?.user?.username || auth?.username;
  const [verifyLogin] = useAdminLoginMutation();

  useEffect(() => {
    if (!data) return;
    let bas = [""];
    if (Array.isArray(data.bar_associations)) {
      bas = data.bar_associations;
    } else if (Array.isArray(data.barAssociations)) {
      bas = data.barAssociations;
    }
    const mapped = {
      name: data.name || "",
      username: data.username || "",
      role: data.role || "",
      specialization: data.specialization || "",
      experience: data.experience || "",
      email: data.email || "",
      phone: data.phone || "",
      avatar: data.avatar_url || "",
      joinDate: toInputDate(data.join_date || data.joinDate),
      education: parseEducation(data.education),
      barAssociations: bas,
      bio: data.bio || "",
      address: data.address || "",
      password: "",
    };
    setFormData(mapped);
    setAvatarPreview(mapped.avatar || null);
  }, [data]);

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

  const onInput = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
    if (formErrors[name]) setFormErrors((x) => ({ ...x, [name]: null }));
  };

  const onEducationChange = (idx, field, value) => {
    setFormData((s) => {
      const next = [...s.education];
      next[idx] = { ...next[idx], [field]: value };
      return { ...s, education: next };
    });
  };

  const addEducation = () =>
    setFormData((s) => ({
      ...s,
      education: [...s.education, { degree: "", institution: "", year: "" }],
    }));

  const removeEducation = (idx) =>
    setFormData((s) => ({
      ...s,
      education:
        s.education.length > 1
          ? s.education.filter((_, i) => i !== idx)
          : s.education,
    }));

  const onBarChange = (idx, value) =>
    setFormData((s) => {
      const next = [...s.barAssociations];
      next[idx] = value;
      return { ...s, barAssociations: next };
    });

  const addBar = () =>
    setFormData((s) => ({ ...s, barAssociations: [...s.barAssociations, ""] }));
  const removeBar = (idx) =>
    setFormData((s) => ({
      ...s,
      barAssociations:
        s.barAssociations.length > 1
          ? s.barAssociations.filter((_, i) => i !== idx)
          : s.barAssociations,
    }));

  const onAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const types = ["image/jpeg", "image/png", "image/jpg"];
    if (!types.includes(file.type)) {
      setFormErrors((x) => ({ ...x, avatar: "Upload JPG or PNG" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors((x) => ({ ...x, avatar: "Max size 5MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const preview = evt.target?.result;
      setAvatarPreview(preview);
      setFormData((s) => ({ ...s, avatar: preview }));
      setFormErrors((x) => ({ ...x, avatar: null }));
    };
    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    setAvatarPreview(null);
    setFormData((s) => ({ ...s, avatar: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.role) errs.role = "Role is required";
    if (!formData.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Invalid email";
    if (!formData.phone.trim()) errs.phone = "Phone is required";
    if (!formData.joinDate) errs.joinDate = "Join date is required";
    if (formData.password && formData.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    if (formData.password && formData.password !== confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      window.scrollTo(0, 0);
      return;
    }

    // If changing password, require admin confirmation first
    const isChangingPassword = Boolean(formData.password);
    if (isChangingPassword) {
      setShowPwdModal(true);
      return;
    }

    setStatus("loading");

    // Map to backend schema
    const education = stringifyEducation(formData.education);
    const bar_associations = formData.barAssociations.filter(
      (x) => x.trim() !== ""
    );
    const payload = {
      id: staffId,
      name: formData.name,
      username: formData.username || null,
      role: formData.role,
      specialization: formData.specialization || null,
      experience: formData.experience || null,
      email: formData.email,
      phone: formData.phone,
      join_date: formData.joinDate,
      address: formData.address || null,
      bio: formData.bio || null,
      education,
      bar_associations,
      avatar_url: formData.avatar || data?.avatar_url || null,
      // password handled separately after admin verification
    };

    try {
      await updateStaff(payload).unwrap();
      setStatus("success");
      if (typeof onCancel === "function") {
        onCancel();
      } else {
        navigate(-1);
      }
    } catch (err) {
      console.error("Failed to update staff:", err);
      setStatus("idle");
      setFormErrors({
        api:
          err?.data?.detail || err?.data?.message || "Failed to update staff",
      });
      window.scrollTo(0, 0);
    }
  };

  const submitWithPassword = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    setVerifyError("");
    setVerifying(true);
    try {
      if (!adminUsername) {
        setVerifyError("Missing admin username in session.");
        setVerifying(false);
        return;
      }
      await verifyLogin({
        username: adminUsername,
        password: adminPwd,
      }).unwrap();

      // Fetch current password to ensure new password is different
      try {
        const res = await revealStaffPassword(staffId).unwrap();
        const currentPwd = res?.password || "";
        if (currentPwd && currentPwd === formData.password) {
          setVerifyError("You entered the same old password.");
          setFormErrors((e) => ({
            ...e,
            password: "You entered the same old password.",
          }));
          setVerifying(false);
          return;
        }
      } catch (re) {
        // If reveal fails (e.g., not stored), proceed with update
        console.warn("Could not reveal current password", re);
      }
      const education = stringifyEducation(formData.education);
      const bar_associations = formData.barAssociations.filter(
        (x) => x.trim() !== ""
      );
      const payload = {
        id: staffId,
        name: formData.name,
        username: formData.username || null,
        role: formData.role,
        specialization: formData.specialization || null,
        experience: formData.experience || null,
        email: formData.email,
        phone: formData.phone,
        join_date: formData.joinDate,
        address: formData.address || null,
        bio: formData.bio || null,
        education,
        bar_associations,
        avatar_url: formData.avatar || data?.avatar_url || null,
        password: formData.password,
      };
      setStatus("loading");
      await updateStaff(payload).unwrap();
      setStatus("success");
      setShowPwdModal(false);
      setAdminPwd("");
      setConfirmPassword("");
      if (typeof onCancel === "function") onCancel();
      else navigate(-1);
    } catch (err) {
      console.error("Admin verification failed or update error:", err);
      setVerifyError("Incorrect admin password or update failed.");
      setStatus("idle");
    } finally {
      setVerifying(false);
    }
  };

  if (!staffId) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-sm">
        Staff id is missing.
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="animate-pulse space-y-3 text-sm text-gray-500">
          Loading staff details…
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-sm">
        {error?.data?.detail || "Failed to load staff"}
      </div>
    );
  }

  const avatarSrc = avatarPreview || formData.avatar || null;
  return (
    <div className="space-y-4 text-xs">
      {status === "success" && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-start shadow-sm">
          <i className="ri-checkbox-circle-line text-xl mr-2 mt-0.5"></i>
          <div>
            <p className="font-medium">Staff member updated!</p>
            <p className="text-xs">Changes have been saved successfully.</p>
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
            {Object.entries(formErrors).map(([field, msg]) => (
              <li key={field}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={onSubmit} className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-3">
            <h1 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
              <i className="ri-user-settings-line"></i>
              Edit Staff Member
            </h1>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-user-3-line text-emerald-600"></i>
              <h3 className="font-semibold">Basic Information</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="block text-xs font-medium text-gray-700"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={onInput}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  placeholder="e.g. ahmed.khan"
                />
              </div>
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
                  onChange={onInput}
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
                  htmlFor="role"
                  className="block text-xs font-medium text-gray-700"
                >
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={onInput}
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
                  onChange={onInput}
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
                  onChange={onInput}
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
                  Experience (years)
                </label>
                <input
                  type="number"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={onInput}
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  placeholder="e.g. 5"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-gray-700"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={onInput}
                  className={`w-full border ${
                    formErrors.email ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                  placeholder="e.g. ahmed@example.com"
                />
                {formErrors.email && (
                  <p className="text-xs text-red-600">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="phone"
                  className="block text-xs font-medium text-gray-700"
                >
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={onInput}
                  className={`w-full border ${
                    formErrors.phone ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                  placeholder="e.g. 0300-1234567"
                />
                {formErrors.phone && (
                  <p className="text-xs text-red-600">{formErrors.phone}</p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <span className="block text-xs font-medium text-gray-700">
                  Profile Image
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <i className="ri-user-line"></i>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onAvatarPick}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
                    >
                      <i className="ri-upload-2-line"></i>
                      Upload
                    </button>
                    {(avatarPreview || formData.avatar) && (
                      <button
                        type="button"
                        onClick={clearAvatar}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-red-600 shadow-sm ring-1 ring-red-200 hover:bg-red-50"
                      >
                        <i className="ri-delete-bin-line"></i>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {formErrors.avatar && (
                  <p className="text-xs text-red-600">{formErrors.avatar}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-graduation-cap-line text-emerald-600"></i>
              <h3 className="font-semibold">Education</h3>
            </div>
            <div className="p-4 space-y-3">
              {formData.education.map((row, idx) => (
                <div
                  key={`${row.degree}-${row.institution}-${row.year}-${idx}`}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  <input
                    type="text"
                    placeholder="Degree"
                    value={row.degree}
                    onChange={(e) =>
                      onEducationChange(idx, "degree", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  />
                  <input
                    type="text"
                    placeholder="Institution"
                    value={row.institution}
                    onChange={(e) =>
                      onEducationChange(idx, "institution", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  />
                  <input
                    type="text"
                    placeholder="Year"
                    value={row.year}
                    onChange={(e) =>
                      onEducationChange(idx, "year", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addEducation}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
                >
                  <i className="ri-add-line"></i>
                  Add Education
                </button>
                {formData.education.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      removeEducation(formData.education.length - 1)
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-red-600 shadow-sm ring-1 ring-red-200 hover:bg-red-50"
                  >
                    <i className="ri-subtract-line"></i>
                    Remove Last
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-scales-2-line text-emerald-600"></i>
              <h3 className="font-semibold">Bar Associations</h3>
            </div>
            <div className="p-4 space-y-3">
              {formData.barAssociations.map((v, idx) => (
                <div key={`${idx}-${v}`} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="e.g. Lahore High Court Bar Association"
                    value={v}
                    onChange={(e) => onBarChange(idx, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                  />
                  {formData.barAssociations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBar(idx)}
                      className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-red-600 shadow-sm ring-1 ring-red-200 hover:bg-red-50"
                    >
                      <i className="ri-delete-bin-line"></i>
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addBar}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
              >
                <i className="ri-add-line"></i>
                Add Association
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-file-text-line text-emerald-600"></i>
              <h3 className="font-semibold">Biography & Address</h3>
            </div>
            <div className="p-4 grid grid-cols-1 gap-3">
              <textarea
                rows="4"
                name="bio"
                value={formData.bio}
                onChange={onInput}
                placeholder="Brief biography..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
              />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={onInput}
                placeholder="Office address"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i className="ri-lock-password-line text-emerald-600"></i>
              <h3 className="font-semibold">Security</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={isNewPwdVisible ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={onInput}
                    placeholder="Leave blank to keep current"
                    className={`w-full border ${
                      formErrors.password ? "border-red-300" : "border-gray-300"
                    } rounded-lg pl-3 pr-9 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsNewPwdVisible((v) => !v)}
                    className="absolute inset-y-0 right-2 my-auto h-7 px-1.5 inline-flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                    aria-label={
                      isNewPwdVisible ? "Hide password" : "Show password"
                    }
                  >
                    <i
                      className={
                        isNewPwdVisible ? "ri-eye-off-line" : "ri-eye-line"
                      }
                    ></i>
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-xs text-red-600">{formErrors.password}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={isConfirmPwdVisible ? "text" : "password"}
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`w-full border ${
                      formErrors.confirmPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-lg pl-3 pr-9 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsConfirmPwdVisible((v) => !v)}
                    className="absolute inset-y-0 right-2 my-auto h-7 px-1.5 inline-flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                    aria-label={
                      isConfirmPwdVisible ? "Hide password" : "Show password"
                    }
                  >
                    <i
                      className={
                        isConfirmPwdVisible ? "ri-eye-off-line" : "ri-eye-line"
                      }
                    ></i>
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-xs text-red-600">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isUpdating}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60"
            >
              {isUpdating ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="ri-save-3-line"></i>
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                typeof onCancel === "function" ? onCancel() : navigate(-1)
              }
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
            >
              <i className="ri-close-line"></i>
              Cancel
            </button>
          </div>
        </form>

        {/* Aside */}
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h4 className="font-semibold mb-2 text-gray-800 flex items-center gap-2">
              <i className="ri-lightbulb-flash-line text-emerald-600"></i>
              Editing Tips
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Only change password if you need to reset it.</li>
              <li>Keep specialization short and specific.</li>
              <li>
                Education entries can be multiple; include year where possible.
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h4 className="font-semibold mb-2 text-gray-800 flex items-center gap-2">
              <i className="ri-eye-line text-emerald-600"></i>
              Quick Preview
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                {avatarPreview || formData.avatar ? (
                  <img
                    src={avatarPreview || formData.avatar}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <i className="ri-user-line"></i>
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  {formData.name || "—"}
                </p>
                <p className="text-gray-500">{formData.role || "—"}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowPwdModal(false)}
          ></div>
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white shadow-lg border border-gray-200 p-4">
            <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
              <i className="ri-shield-keyhole-line text-emerald-600 mr-2"></i>
              Confirm Admin Password
            </h5>
            <p className="text-xs text-gray-600 mb-3">
              Enter your admin password to save the new staff password.
            </p>
            <div className="relative mb-2">
              <input
                type={isAdminPwdVisible ? "text" : "password"}
                value={adminPwd}
                onChange={(e) => setAdminPwd(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Admin password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsAdminPwdVisible((v) => !v)}
                className="absolute inset-y-0 right-2 my-auto h-7 px-1.5 inline-flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                aria-label={
                  isAdminPwdVisible ? "Hide password" : "Show password"
                }
              >
                <i
                  className={
                    isAdminPwdVisible ? "ri-eye-off-line" : "ri-eye-line"
                  }
                ></i>
              </button>
            </div>
            {verifyError && (
              <div className="text-red-600 text-xs mb-2">{verifyError}</div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPwdModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitWithPassword}
                disabled={verifying || !adminPwd}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
              >
                {verifying ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Verifying
                  </>
                ) : (
                  <>
                    <i className="ri-check-line"></i>
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

EditStaff.propTypes = {
  staffId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCancel: PropTypes.func,
};

export default EditStaff;
