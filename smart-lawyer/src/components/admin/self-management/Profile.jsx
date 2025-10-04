import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Aside from "./Aside";
import ProfileStaffSection from "./ProfileStaffSection";
import ClientReviews from "./ClientReviews";

export default function Profile() {
  const [profileImage, setProfileImage] = useState("/user.svg");
  const [bannerImage, setBannerImage] = useState("/bannar.svg");
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [firmDetails, setFirmDetails] = useState({
    firmName: "",
    overview: "",
    values: [],
    achievements: "",
    approach: "",
    advisoryOrgs: [],
  });
  // Upwork-style title modal
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const MAX_TITLE_CHARS = 80;
  const fileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);

  // Upwork-style overview (description) modal
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);
  const [overviewDraft, setOverviewDraft] = useState("");
  const MAX_OVERVIEW_CHARS = 5000;

  // Overview view-more/less
  const overviewRef = useRef(null);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [canToggleOverview, setCanToggleOverview] = useState(false);
  // Inline edit for bullet points
  const [isValuesInlineEdit, setIsValuesInlineEdit] = useState(false);
  // valuesEditDraft holds objects with stable ids for reliable React keys
  const [valuesEditDraft, setValuesEditDraft] = useState([]);
  const createId = () =>
    Math.random().toString(36).slice(2) + Date.now().toString(36);

  useEffect(() => {
    const updateOverflow = () => {
      const el = overviewRef.current;
      if (!el) return;
      // With line-clamp applied, compare scroll vs client heights
      const needsClamp = el.scrollHeight - el.clientHeight > 1;
      // Only update the capability flag when collapsed so it persists while expanded
      if (!isOverviewExpanded) setCanToggleOverview(needsClamp);
    };
    // Run after paint to ensure styles applied
    const rAF = requestAnimationFrame(updateOverflow);
    window.addEventListener("resize", updateOverflow);
    return () => {
      cancelAnimationFrame(rAF);
      window.removeEventListener("resize", updateOverflow);
    };
  }, [isOverviewExpanded, firmDetails.overview]);

  // Run once on mount to set initial canToggleOverview before any interaction
  useEffect(() => {
    const cb = () => {
      const el = overviewRef.current;
      if (!el) return;
      const needsClamp = el.scrollHeight - el.clientHeight > 1;
      setCanToggleOverview(needsClamp);
    };
    const rAF = requestAnimationFrame(cb);
    return () => cancelAnimationFrame(rAF);
  }, []);

  const handleFieldEdit = (fieldName) => {
    setEditingField(fieldName);
    if (fieldName === "values") {
      setTempValue(""); // For new bullet point
    } else {
      setTempValue(firmDetails[fieldName] || "");
    }
  };

  const handleFieldSave = () => {
    if (editingField) {
      if (editingField === "values") {
        // Handle bullet point addition
        const next = tempValue.trim();
        if (
          next &&
          firmDetails.values.length < 7 &&
          !firmDetails.values.includes(next)
        ) {
          setFirmDetails((prev) => ({
            ...prev,
            values: [...prev.values, next],
          }));
        }
      } else {
        setFirmDetails((prev) => ({
          ...prev,
          [editingField]: tempValue,
        }));
      }
      setEditingField(null);
      setTempValue("");
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setTempValue("");
  };

  // Removed read-only remove handler; removal is available in inline edit mode

  // Inline edit handlers for bullet points
  const openValuesInlineEdit = () => {
    const initial = (firmDetails.values || []).map((v) => ({
      id: createId(),
      value: v,
    }));
    setValuesEditDraft(initial);
    setIsValuesInlineEdit(true);
  };
  const cancelValuesInlineEdit = () => {
    setIsValuesInlineEdit(false);
    setValuesEditDraft([]);
  };
  const saveValuesInlineEdit = () => {
    const cleaned = valuesEditDraft
      .map((row) => (row.value || "").trim())
      .filter(Boolean);
    const unique = Array.from(new Set(cleaned)).slice(0, 7);
    setFirmDetails((prev) => ({ ...prev, values: unique }));
    setIsValuesInlineEdit(false);
  };
  const updateValuesDraftAt = (id, val) => {
    setValuesEditDraft((prev) =>
      prev.map((row) => (row.id === id ? { ...row, value: val } : row))
    );
  };
  const removeValuesDraftAt = (id) => {
    setValuesEditDraft((prev) => prev.filter((row) => row.id !== id));
  };
  const addValuesDraftRow = () => {
    setValuesEditDraft((prev) =>
      prev.length < 7 ? [...prev, { id: createId(), value: "" }] : prev
    );
  };

  // Tabs: details | staff | review
  const [activeTab, setActiveTab] = useState("details");
  const [staffCount, setStaffCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // Upwork-like chips: Offered Services (7), Primary (5), Secondary (3)
  const [offeredServices, setOfferedServices] = useState([
    "Legal Consultation",
    "Court Representation",
    "Document Drafting",
  ]);
  const [primarySpecializations, setPrimarySpecializations] = useState([
    "Legal Consultation",
    "Court Representation",
  ]);
  const [secondarySpecializations, setSecondarySpecializations] = useState([
    "Document Drafting",
  ]);

  // Generic edit modal state for chips
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [skillsModalType, setSkillsModalType] = useState(null); // 'offered' | 'primary' | 'secondary'
  const [skillsDraft, setSkillsDraft] = useState([]);
  const [skillsInput, setSkillsInput] = useState("");

  const SKILLS_LIMITS = { offered: 7, primary: 5, secondary: 3 };
  const SKILLS_LABELS = {
    offered: "Offered Services",
    primary: "Primary Specialization",
    secondary: "Secondary Specialization",
  };
  const getSkillsArrayByType = (type) => {
    if (type === "offered") return offeredServices;
    if (type === "primary") return primarySpecializations;
    if (type === "secondary") return secondarySpecializations;
    return [];
  };
  const setSkillsArrayByType = (type, next) => {
    if (type === "offered") return setOfferedServices(next);
    if (type === "primary") return setPrimarySpecializations(next);
    if (type === "secondary") return setSecondarySpecializations(next);
  };
  // Ensure only one modal is open at a time
  const closeAllModals = () => {
    setIsTitleModalOpen(false);
    setIsOverviewModalOpen(false);
    setIsSkillsModalOpen(false);
    setIsCertModalOpen(false);
  };
  const openSkillsModal = (type) => {
    closeAllModals();
    setSkillsModalType(type);
    setSkillsDraft(getSkillsArrayByType(type));
    setSkillsInput("");
    // Defer to next tick to avoid any race with other modal closures
    setTimeout(() => setIsSkillsModalOpen(true), 0);
  };
  const closeSkillsModal = () => {
    setIsSkillsModalOpen(false);
    setSkillsModalType(null);
    setSkillsDraft([]);
    setSkillsInput("");
  };
  const normalizeTag = (s) => s.trim().replace(/\s+/g, " ");
  const addTagToDraft = () => {
    const max = SKILLS_LIMITS[skillsModalType] || 0;
    const v = normalizeTag(skillsInput);
    if (!v) return;
    const exists = skillsDraft.some((t) => t.toLowerCase() === v.toLowerCase());
    if (exists) {
      setSkillsInput("");
      return;
    }
    if (skillsDraft.length >= max) return;
    setSkillsDraft((prev) => [...prev, v]);
    setSkillsInput("");
  };
  const removeDraftTagAt = (idx) => {
    setSkillsDraft((prev) => prev.filter((_, i) => i !== idx));
  };
  const saveSkillsModal = () => {
    const max = SKILLS_LIMITS[skillsModalType] || 0;
    // clean + dedupe, then cap
    const cleaned = skillsDraft.map((t) => normalizeTag(t)).filter(Boolean);
    const unique = [];
    const seen = new Set();
    for (const t of cleaned) {
      const k = t.toLowerCase();
      if (!seen.has(k)) {
        unique.push(t);
        seen.add(k);
      }
      if (unique.length >= max) break;
    }
    setSkillsArrayByType(skillsModalType, unique);
    closeSkillsModal();
  };

  // Certifications (max 3)
  const CERTS_MAX = 3;
  const [certifications, setCertifications] = useState([]);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certModalMode, setCertModalMode] = useState(null); // 'add' | 'edit'
  const [certEditIndex, setCertEditIndex] = useState(null);
  const [certForm, setCertForm] = useState({
    imageUrl: "",
    title: "",
    description: "",
  });
  const [isCertEditMode, setIsCertEditMode] = useState(false);

  const openCertAddModal = () => {
    closeAllModals();
    setCertModalMode("add");
    setCertEditIndex(null);
    setCertForm({ imageUrl: "", title: "", description: "" });
    setTimeout(() => setIsCertModalOpen(true), 0);
  };
  const openCertEditModal = (index) => {
    const item = certifications[index];
    if (!item) return;
    closeAllModals();
    setCertModalMode("edit");
    setCertEditIndex(index);
    setCertForm({
      imageUrl: item.imageUrl || "",
      title: item.title || "",
      description: item.description || "",
    });
    setTimeout(() => setIsCertModalOpen(true), 0);
  };
  const closeCertModal = () => {
    setIsCertModalOpen(false);
    setCertModalMode(null);
    setCertEditIndex(null);
    setCertForm({ imageUrl: "", title: "", description: "" });
  };
  const handleCertImageChange = (e) => {
    const file = e.target?.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCertForm((prev) => ({ ...prev, imageUrl: url }));
    }
  };
  const saveCert = () => {
    const next = {
      ...certForm,
      title: (certForm.title || "").trim(),
      description: (certForm.description || "").trim(),
    };
    if (!next.title) return closeCertModal();
    if (certModalMode === "add") {
      setCertifications((prev) => {
        const arr = [...prev];
        if (arr.length >= CERTS_MAX) return arr;
        arr.push({ id: createId(), ...next });
        return arr;
      });
    } else if (certModalMode === "edit" && certEditIndex !== null) {
      setCertifications((prev) =>
        prev.map((c, i) => (i === certEditIndex ? { ...c, ...next } : c))
      );
    }
    closeCertModal();
  };
  const deleteCertAt = (idx) => {
    setCertifications((prev) => prev.filter((_, i) => i !== idx));
  };

  // Title modal handlers
  const openTitleModal = () => {
    closeAllModals();
    setTitleDraft(firmDetails.firmName || "");
    setIsTitleModalOpen(true);
  };
  const closeTitleModal = () => {
    setIsTitleModalOpen(false);
    setTitleDraft("");
  };
  const saveTitle = () => {
    const next = titleDraft.slice(0, MAX_TITLE_CHARS).trim();
    setFirmDetails((prev) => ({ ...prev, firmName: next || prev.firmName }));
    closeTitleModal();
  };

  // Banner/Profile image handlers
  const handleProfileButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  const handleImageChange = (e) => {
    const file = e.target?.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfileImage(url);
    }
  };
  const handleBannerClick = () => {
    if (bannerFileInputRef.current) bannerFileInputRef.current.click();
  };
  const handleBannerChange = (e) => {
    const file = e.target?.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBannerImage(url);
    }
  };

  // Overview modal handlers
  const openOverviewModal = () => {
    closeAllModals();
    setOverviewDraft(firmDetails.overview || "");
    setIsOverviewModalOpen(true);
  };
  const closeOverviewModal = () => {
    setIsOverviewModalOpen(false);
  };
  const saveOverview = () => {
    const next = overviewDraft.trim();
    setFirmDetails((prev) => ({ ...prev, overview: next }));
    closeOverviewModal();
  };

  return (
    <div className="max-w-[1200px] mx-auto lg:grid lg:grid-cols-[minmax(0,1fr)_375px] lg:gap-6">
      {/* Left: Profile content */}
      <div className="px-4 lg:px-0">
        {/* Banner + Profile header */}
        <div className="relative max-w-[800px] mx-auto">
          <button
            className="w-full h-52 rounded-2xl relative cursor-pointer group border-0 p-0 overflow-hidden"
            onClick={handleBannerClick}
            aria-label="Click to change banner image"
            type="button"
          >
            <img
              src={bannerImage}
              alt="Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-white bg-opacity-90 rounded-full size-10 flex items-center justify-center">
                  <i className="ri-camera-line text-gray-700 text-xl"></i>
                </div>
              </div>
            </div>
            <input
              type="file"
              ref={bannerFileInputRef}
              onChange={handleBannerChange}
              accept="image/*"
              className="hidden"
            />
          </button>
          <div className="absolute -bottom-12 left-2 lg:left-6 z-10">
            <div className="relative rounded-full">
              <img
                src={profileImage}
                alt="Profile"
                className="size-32 bg-amber-50 rounded-full object-cover p-[3px]"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={handleProfileButtonClick}
                className="absolute bottom-1 right-1 size-8 ring-3 ring-white bg-emerald-500 cursor-pointer text-white rounded-full hover:bg-emerald-700 transition-colors duration-200 ease-in-out shadow"
              >
                <i className="ri-camera-line"></i>
              </button>
            </div>
          </div>
        </div>
        {/* Header info */}
        <div className="max-w-[800px] mx-auto mt-2 px-4 lg:px-0 ">
          <div className="flex items-start justify-between gap-6">
            <div className="pl-42">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-gray-900">John Doe</h1>
                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                <i className="ri-at-line"></i>
                <p>username</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-black">
              <div className="text-center p-1">
                <div className="flex items-center justify-center gap-1 text-gray-500 text-[10px]">
                  <i className="ri-trophy-line"></i>
                  <span>Success</span>
                </div>
                <h2 className="text-xl font-bold">0%</h2>
              </div>
              <div className="text-center p-1">
                <div className="flex items-center justify-center gap-1 text-gray-500 text-[10px]">
                  <i className="ri-briefcase-line"></i>
                  <span>Cases</span>
                </div>
                <h2 className="text-xl font-bold">0</h2>
              </div>
              <div className="text-center p-1">
                <div className="flex items-center justify-center gap-1 text-gray-500 text-[10px]">
                  <i className="ri-star-line"></i>
                  <span>Rating</span>
                </div>
                <h2 className="text-xl font-bold">0.0</h2>
              </div>
            </div>
          </div>
        </div>
        {/* Intro/About (X-style) */}
        <div className="max-w-[800px]">
          <div className="mt-2 text-xs text-gray-900 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-gray-500">
              <i className="ri-team-line"></i>
              <span>Advisory Organizations:</span>
            </span>
            {firmDetails.advisoryOrgs && firmDetails.advisoryOrgs.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {firmDetails.advisoryOrgs.map((org) => (
                  <span
                    key={org}
                    className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full"
                  >
                    <i className="ri-building-line text-[10px]"></i>
                    <span className="text-[11px]">{org}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400">
                Add your advisory organizations
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
            {/* Association with Bar Council */}
            <span className="inline-flex items-center gap-1.5">
              <i className="ri-scales-2-line"></i>
              <span>Association: Lahore High Court Bar </span>
            </span>

            {/* Established date & year */}
            <span className="inline-flex items-center gap-1.5">
              <i className="ri-calendar-check-line"></i>
              <span>Established June 2015</span>
            </span>
            {/* Experience */}
            <span className="inline-flex items-center gap-1.5">
              <i className="ri-timer-line"></i>
              <span>Hold Experience: 10+ years</span>
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
            {/* Firm type */}
            <span className="inline-flex items-center gap-1.5">
              <i className="ri-building-4-line"></i>
              <span>Firm Type: Partnership</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="ri-map-pin-line"></i>
              <span>Lahore, Punjab, Pakistan</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="ri-calendar-2-line"></i>
              <span>Joined June 2025</span>
            </span>
          </div>
        </div>
        <div className="border-t-[1px] border-gray-200 mt-6 mb-10 text-[10px] font-semibold relative">
          <div className="flex items-center justify-center gap-3.5 absolute -top-[1px] left-0 right-0">
            <button
              data-tab="details"
              className={`border-t-2 p-2 uppercase cursor-pointer Staff -widest flex items-center gap-1 ${
                activeTab === "details"
                  ? "text-gray-600 border-t-[1px] hover:border-gray-600"
                  : "text-gray-400 border-t-[1px] border-gray-400 hover:text-gray-600 hover:border-gray-600 transition-all duration-300 ease-in-out"
              }`}
              onClick={() => setActiveTab("details")}
            >
              <i className="ri-user-3-line text-[10px]" />
              About
            </button>
            <button
              data-tab="staff"
              className={`border-t-2 p-2 uppercase cursor-pointer Staff -widest flex items-center gap-1 ${
                activeTab === "staff"
                  ? "text-gray-600 border-t-[1px] hover:border-gray-600"
                  : "text-gray-400 border-t-[1px] border-gray-400 hover:text-gray-600 hover:border-gray-600 transition-all duration-300 ease-in-out"
              }`}
              onClick={() => setActiveTab("staff")}
            >
              <i className="ri-team-line text-[10px]" />
              Staff ({staffCount})
            </button>
            <button
              data-tab="review"
              className={`border-t-2 p-2 uppercase cursor-pointer Staff -widest flex items-center gap-1 ${
                activeTab === "review"
                  ? "text-gray-600 border-t-[1px] hover:border-gray-600"
                  : "text-gray-400 border-t-[1px] border-gray-400 hover:text-gray-600 hover:border-gray-600"
              }`}
              onClick={() => setActiveTab("review")}
            >
              <i className="ri-star-line text-[10px]" />
              Review ({reviewCount})
            </button>
          </div>
        </div>
        {activeTab === "details" && (
          <div className="max-w-[800px] mx-auto space-y-6">
            {/* Firm Profile */}
            <div className="mt-3 border-b-2 border-gray-100">
              <div key="firmName" className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {firmDetails.firmName || "Title"}
                  </h3>
                  <button
                    type="button"
                    onClick={openTitleModal}
                    className="inline-flex w-8 h-8 aspect-square items-center justify-center p-0 leading-none shrink-0 cursor-pointer text-emerald-600 hover:bg-emerald-50 rounded-full border-2 border-emerald-600 transition-colors duration-200"
                    title="Edit title"
                  >
                    <i className="ri-pencil-line text-lg"></i>
                  </button>
                </div>

                {/* Overview */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Overview
                    </h4>
                    <button
                      type="button"
                      onClick={openOverviewModal}
                      className="relative z-10 inline-flex w-8 h-8 aspect-square items-center justify-center p-0 leading-none cursor-pointer text-emerald-600 hover:bg-emerald-50 rounded-full border-2 border-emerald-600 transition-colors duration-200"
                      title="Edit overview"
                      aria-label="Edit overview"
                    >
                      <i className="ri-pencil-line text-lg"></i>
                    </button>
                  </div>
                  <div className="relative group">
                    <p
                      ref={overviewRef}
                      className={`text-sm text-gray-600 whitespace-pre-line leading-6 transition-all ${
                        isOverviewExpanded ? "" : "line-clamp-6 overflow-hidden"
                      }`}
                    >
                      {firmDetails.overview ||
                        "Use this space to show clients you have the skills and experience they're looking for. Click to add your overview."}
                    </p>
                    {!isOverviewExpanded && canToggleOverview && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 " />
                    )}
                  </div>
                  {(canToggleOverview || isOverviewExpanded) && (
                    <button
                      type="button"
                      onClick={() => setIsOverviewExpanded((v) => !v)}
                      className="mt-1 text-emerald-600 cursor-pointer hover:text-emerald-700 text-xs font-medium"
                      aria-expanded={isOverviewExpanded}
                    >
                      {isOverviewExpanded ? "View less" : "View more"}
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Core Values */}
            <div key="values">
              <div className="flex items-start justify-between ">
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">
                    Bullet Points
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add short, impactful points about your firm (max 7).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      isValuesInlineEdit
                        ? addValuesDraftRow()
                        : handleFieldEdit("values")
                    }
                    disabled={
                      (isValuesInlineEdit
                        ? valuesEditDraft.length
                        : firmDetails.values.length) >= 7
                    }
                    className="inline-flex w-8 h-8 aspect-square items-center justify-center p-0 leading-none shrink-0 cursor-pointer text-emerald-600 hover:bg-emerald-50 rounded-full border-2 border-emerald-600 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={
                      isValuesInlineEdit ? "Add a new row" : "Add bullet point"
                    }
                    aria-label="Add bullet point"
                  >
                    <i className="ri-add-line text-lg mt-[2px]" />
                  </button>
                  {!isValuesInlineEdit && firmDetails.values.length > 0 && (
                    <button
                      type="button"
                      onClick={openValuesInlineEdit}
                      className="inline-flex w-8 h-8 aspect-square items-center justify-center p-0 leading-none shrink-0 cursor-pointer text-emerald-600 hover:bg-emerald-50 rounded-full border-2 border-emerald-600 transition-colors duration-200"
                      title="Edit all bullet points"
                      aria-label="Edit all bullet points"
                    >
                      <i className="ri-pencil-line text-lg"></i>
                    </button>
                  )}
                </div>
              </div>

              {isValuesInlineEdit ? (
                <div className="my-4 space-y-2 ">
                  {valuesEditDraft.map((row) => (
                    <div key={row.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) =>
                          updateValuesDraftAt(row.id, e.target.value)
                        }
                        placeholder="Bullet point"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeValuesDraftAt(row.id)}
                        className="inline-flex w-8 h-8 items-center justify-center rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Remove row"
                        aria-label="Remove row"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {
                        valuesEditDraft.filter((v) => (v.value || "").trim())
                          .length
                      }
                      /7 items (duplicates removed on save)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelValuesInlineEdit}
                        className="px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveValuesInlineEdit}
                        className="px-3 py-1 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                firmDetails.values.length > 0 && (
                  <ul className="my-4 list-disc pl-5 text-sm text-gray-700 space-y-2 marker:text-emerald-600">
                    {firmDetails.values.map((value) => (
                      <li key={value} className="pr-2">
                        <span className="break-words">{value}</span>
                      </li>
                    ))}
                  </ul>
                )
              )}
              {editingField === "values" && (
                <div className="space-y-2 mt-2">
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    placeholder="Enter a bullet point..."
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleFieldSave();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {firmDetails.values.length}/7 values added
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleFieldCancel}
                        className="px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleFieldSave}
                        className="px-3 py-1 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {firmDetails.values.length === 0 && editingField !== "values" && (
                <div className="text-gray-400 italic py-8 text-xs text-center">
                  Click + to add your core values (up to 7)
                </div>
              )}
            </div>
            {/* Upwork-style chips: Offered Services */}
            <div>
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-sm text-gray-800">
                  Offered Services
                </h4>
                <button
                  type="button"
                  onClick={() => openSkillsModal("offered")}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  title="Edit offered services"
                  aria-label="Edit offered services"
                >
                  <i className="ri-pencil-line text-lg" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {offeredServices.length > 0 ? (
                  offeredServices.map((s) => (
                    <span
                      key={`offered-${s}`}
                      className="inline-flex items-center rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-[10px] font-medium"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">
                    Add up to 7 services
                  </span>
                )}
              </div>
            </div>
            {/* Upwork-style chips: Primary Specialization */}
            <div>
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-sm text-gray-800">
                  Primary Specialization
                </h4>
                <button
                  type="button"
                  onClick={() => openSkillsModal("primary")}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  title="Edit primary specialization"
                  aria-label="Edit primary specialization"
                >
                  <i className="ri-pencil-line text-lg" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {primarySpecializations.length > 0 ? (
                  primarySpecializations.map((s) => (
                    <span
                      key={`primary-${s}`}
                      className="inline-flex items-center rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-[10px] font-medium"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">
                    Add up to 5 skills
                  </span>
                )}
              </div>
            </div>
            {/* Upwork-style chips: Secondary Specialization */}
            <div>
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-sm text-gray-800">
                  Secondary Specialization
                </h4>
                <button
                  type="button"
                  onClick={() => openSkillsModal("secondary")}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  title="Edit secondary specialization"
                  aria-label="Edit secondary specialization"
                >
                  <i className="ri-pencil-line text-lg" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {secondarySpecializations.length > 0 ? (
                  secondarySpecializations.map((s) => (
                    <span
                      key={`secondary-${s}`}
                      className="inline-flex items-center rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-[10px] font-medium"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">
                    Add up to 3 skills
                  </span>
                )}
              </div>
            </div>
            {/* Certifications (dynamic, max 3) */}
            <div key="certifications">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-sm text-gray-900">
                  Certifications & Licenses
                </h3>
                <div className="flex items-center gap-2">
                  {certifications.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCertEditMode((v) => !v)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                      title="Edit certifications"
                      aria-label="Edit certifications"
                    >
                      <i className="ri-pencil-line text-lg" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={openCertAddModal}
                    disabled={certifications.length >= CERTS_MAX}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Add certification"
                  >
                    <i className="ri-add-line text-lg mt-[2px]" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {certifications.slice(0, 3).map((c, idx) => (
                  <div
                    key={c.id || idx}
                    className="relative border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {c.imageUrl ? (
                      <img
                        src={c.imageUrl}
                        alt={c.title || "Certification"}
                        className="h-32 w-full object-cover"
                      />
                    ) : (
                      <div className="h-32 w-full bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                        No image
                      </div>
                    )}
                    <div className="p-2">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                        {c.title || "Untitled"}
                      </h4>
                      {c.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {c.description}
                        </p>
                      )}
                    </div>
                    {isCertEditMode && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => openCertEditModal(idx)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-emerald-600 text-emerald-600 bg-white hover:bg-emerald-50"
                          title="Edit"
                          aria-label="Edit certification"
                        >
                          <i className="ri-pencil-line text-sm" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCertAt(idx)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-red-600 text-red-600 bg-white hover:bg-red-50"
                          title="Delete"
                          aria-label="Delete certification"
                        >
                          <i className="ri-delete-bin-6-line text-sm" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {certifications.length < CERTS_MAX && (
                  <button
                    type="button"
                    onClick={openCertAddModal}
                    className="border-dashed border-2 h-32 border-gray-300 rounded-lg cursor-pointer group flex flex-col space-y-1 items-center justify-center text-center hover:bg-gray-50"
                    title="Add certification"
                  >
                    <i className="ri-add-line text-2xl text-gray-400 group-hover:text-emerald-600" />
                    <span className="text-xs text-gray-500">
                      Add certification
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "staff" && (
          <ProfileStaffSection onCountChange={setStaffCount} />
        )}
        {activeTab === "review" && (
          <ClientReviews onCountChange={setReviewCount} />
        )}
      </div>

      {/* Right: Aside */}
      <div>
        <Aside />
      </div>

      {/* Title Edit Modal (Upwork-style) */}
      {isTitleModalOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/40" />
          {/* Native dialog */}
          <dialog
            open
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-xl rounded-xl bg-white shadow-xl"
            aria-labelledby="edit-title-heading"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <h2
                id="edit-title-heading"
                className="text-lg font-semibold text-gray-900"
              >
                Edit your title
              </h2>
              <button
                type="button"
                onClick={closeTitleModal}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            {/* Body */}
            <form
              className="px-4 pb-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveTitle();
              }}
            >
              <p className="text-sm text-gray-600 mb-2">
                Create a concise, keyword-rich firm title. It appears in search
                results and your profile header, helping you rank higher and
                attract more clients.
              </p>
              <ul className="list-disc pl-5 text-xs text-gray-500 mb-3 space-y-1">
                <li>Lead with your primary practice areas and niche.</li>
                <li>Add location or jurisdiction if relevant.</li>
                <li>
                  Mention years of experience or firm structure
                  (LLP/Partnership).
                </li>
              </ul>
              <label
                className="block text-sm font-medium text-gray-900 mb-1"
                htmlFor="title-input"
              >
                Your title
              </label>
              <input
                id="title-input"
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                maxLength={MAX_TITLE_CHARS}
                className="w-full rounded-lg border-2 border-emerald-500/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600"
                placeholder="e.g. Remix JS + GSAP with DRF Developer | Frontend Guru | Backend Pawa"
                autoFocus
              />
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-4 pb-4">
              <button
                type="button"
                onClick={closeTitleModal}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveTitle}
                className="px-5 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          </dialog>
        </>
      )}

      {/* Overview Edit Modal (Upwork-style) */}
      {isOverviewModalOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/40" />
          {/* Native dialog */}
          <dialog
            open
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-2xl rounded-xl bg-white shadow-xl"
            aria-labelledby="edit-overview-heading"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <h2
                id="edit-overview-heading"
                className="text-lg font-semibold text-gray-900"
              >
                Profile overview
              </h2>
              <button
                type="button"
                onClick={closeOverviewModal}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>
            {/* Body */}
            <form
              className="px-4 pb-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveOverview();
              }}
            >
              <p className="text-sm text-gray-600 mb-2">
                Use this space to show clients you have the skills and
                experience they're looking for.
              </p>
              <ul className="list-disc pl-5 text-xs text-gray-500 mb-3 space-y-1">
                <li>Describe your strengths and skills</li>
                <li>Highlight projects, accomplishments and education</li>
                <li>Keep it short and make sure it's error-free</li>
              </ul>
              <label
                htmlFor="overview-input"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                Profile overview
              </label>
              <textarea
                id="overview-input"
                value={overviewDraft}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.length <= MAX_OVERVIEW_CHARS) setOverviewDraft(v);
                }}
                placeholder="Write an engaging overview…"
                className="w-full px-3 py-2 h-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {MAX_OVERVIEW_CHARS - overviewDraft.length} characters left
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeOverviewModal}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                    disabled={!overviewDraft.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </dialog>
        </>
      )}

      {/* Skills Edit Modal */}
      {isSkillsModalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" />
          <dialog
            open
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-xl rounded-xl bg-white shadow-xl"
            aria-labelledby="skills-modal-heading"
          >
            <div className="flex items-center justify-between p-4">
              <h2
                id="skills-modal-heading"
                className="text-lg font-semibold text-gray-900"
              >
                {SKILLS_LABELS[skillsModalType] || "Edit"}
              </h2>
              <button
                type="button"
                onClick={closeSkillsModal}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>
            <div className="px-4 pb-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {skillsDraft.map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeDraftTagAt(idx)}
                      className="ml-1 text-gray-500 hover:text-red-600"
                      title="Remove"
                      aria-label={`Remove ${tag}`}
                    >
                      <i className="ri-close-line text-sm" />
                    </button>
                  </span>
                ))}
                {skillsDraft.length === 0 && (
                  <span className="text-xs text-gray-400">
                    No items added yet
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTagToDraft();
                    }
                  }}
                  placeholder="Type and press Enter to add"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <button
                  type="button"
                  onClick={addTagToDraft}
                  className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Add
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {skillsDraft.length}/{SKILLS_LIMITS[skillsModalType] || 0}{" "}
                  items
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeSkillsModal}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveSkillsModal}
                    className="px-5 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                    disabled={(SKILLS_LIMITS[skillsModalType] || 0) === 0}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </dialog>
        </>
      )}

      {/* Certifications Modal */}
      {isCertModalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" />
          <dialog
            open
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-xl rounded-xl bg-white shadow-xl"
            aria-labelledby="cert-modal-heading"
          >
            <div className="flex items-center justify-between p-4">
              <h2
                id="cert-modal-heading"
                className="text-lg font-semibold text-gray-900"
              >
                {certModalMode === "edit"
                  ? "Edit certification"
                  : "Add certification"}
              </h2>
              <button
                type="button"
                onClick={closeCertModal}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>
            <div className="px-4 pb-4 space-y-3">
              {/* Elegant Image Picker */}
              <div className="mb-6 flex flex-col items-center">
                <label
                  htmlFor="cert-image-input"
                  className="w-full cursor-pointer"
                >
                  <div className="h-32 max-w-full mx-auto border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-center transition hover:border-emerald-400 hover:bg-emerald-50 relative overflow-hidden">
                    {certForm.imageUrl ? (
                      <img
                        src={certForm.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover object-center rounded-lg"
                        // style={{ aspectRatio: "3/4" }}
                      />
                    ) : (
                      <>
                        <i className="ri-upload-cloud-2-line text-4xl text-gray-300 mb-2" />
                        <span className="block text-xs text-gray-500">
                          Upload Image
                        </span>
                        <span className="block text-[11px] text-gray-400 mt-1">
                          JPG, PNG, up to 5MB
                        </span>
                      </>
                    )}
                    <input
                      id="cert-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleCertImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      tabIndex={-1}
                    />
                  </div>
                </label>
                <label
                  htmlFor="cert-image-input"
                  className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 cursor-pointer inline-block"
                >
                  Browse Files
                </label>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Supported file types: JPG, PNG (Max 5MB)
                </p>
              </div>
              {/* Title */}
              <div>
                <label
                  htmlFor="cert-title-input"
                  className="block text-sm font-medium text-gray-900 mb-1"
                >
                  Title
                </label>
                <input
                  id="cert-title-input"
                  type="text"
                  value={certForm.title}
                  onChange={(e) =>
                    setCertForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  placeholder="e.g., Corporate Law Certification"
                />
              </div>
              {/* Description */}
              <div>
                <label
                  htmlFor="cert-desc-input"
                  className="block text-sm font-medium text-gray-900 mb-1"
                >
                  Short description
                </label>
                <textarea
                  id="cert-desc-input"
                  rows={3}
                  value={certForm.description}
                  onChange={(e) =>
                    setCertForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  placeholder="Issuing authority and year, or a brief note"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCertModal}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveCert}
                  className="px-5 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={!certForm.title.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </dialog>
        </>
      )}

      {/* (Inline edit replaces modal; no popup) */}
    </div>
  );
}
