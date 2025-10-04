import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Tools from "./Tools";
import StaffView from "./StaffView";
import StaffDirectory from "./StaffDirectory";
import EditStaff from "./EditStaff";
import {
  useListStaffQuery,
  useDeleteStaffMutation,
} from "../../../reduxstore/services/StaffAPI";

const IndexStaff = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const token = useSelector((s) => s.auth?.token);
  const { data, isLoading, isError, error } = useListStaffQuery(undefined, {
    skip: !token,
  });
  const [deleteStaff] = useDeleteStaffMutation();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Backend is the source of truth; remove URL-based injections

  const uiStaffList = useMemo(() => {
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data)
      ? data.data
      : [];
    return list.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      specialization: s.specialization ?? "",
      email: s.email,
      phone: s.phone,
      avatar: s.avatar_url || s.avatar || "",
      joinDate: s.join_date || s.joinDate,
      education: Array.isArray(s.education) ? s.education : [],
      barAssociations: (() => {
        if (Array.isArray(s.bar_associations)) return s.bar_associations;
        if (Array.isArray(s.barAssociations)) return s.barAssociations;
        return [];
      })(),
      bio: s.bio ?? "",
      address: s.address ?? "",
      assignedCases: s.assigned_cases ?? s.assignedCases ?? 0,
      activeCases: s.active_cases ?? s.activeCases ?? 0,
    }));
  }, [data]);

  const filteredStaff = useMemo(() => {
    return uiStaffList.filter((staff) => {
      const matchesSearch =
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.specialization.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === "all" || staff.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [uiStaffList, searchTerm, filterRole]);

  const uniqueRoles = useMemo(
    () => [...new Set(uiStaffList.map((staff) => staff.role))],
    [uiStaffList]
  );

  const onAddStaff = () => navigate("/admin/profile/add-staff");
  const onToggleDropdown = (id) =>
    setActiveDropdown((cur) => (cur === id ? null : id));
  const onViewProfile = (staff) => setSelectedStaff(staff);
  const onBack = () => setSelectedStaff(null);
  const onResetFilters = () => {
    setSearchTerm("");
    setFilterRole("all");
  };

  const onStaffAction = (action, staff) => {
    setActiveDropdown(null);
    switch (action) {
      case "view":
        onViewProfile(staff);
        break;
      case "edit":
        setEditingStaffId(staff.id);
        break;
      case "deactivate":
        if (
          window.confirm(`Are you sure you want to deactivate ${staff.name}?`)
        ) {
          console.log("Staff deactivated");
        }
        break;
      case "delete":
        if (
          window.confirm(
            `Are you sure you want to delete ${staff.name}? This action cannot be undone.`
          )
        ) {
          deleteStaff(staff.id).catch((e) =>
            console.error("Failed to delete staff:", e)
          );
        }
        break;
      case "stats":
        console.log("View stats for:", staff.name);
        break;
      default:
        break;
    }
  };

  if (editingStaffId) {
    return (
      <div className="pb-8">
        <EditStaff
          staffId={editingStaffId}
          onCancel={() => setEditingStaffId(null)}
        />
      </div>
    );
  }

  if (selectedStaff) {
    return (
      <div className="pb-8">
        <StaffView staff={selectedStaff} onBack={onBack} />
      </div>
    );
  }

  let body = null;
  if (!token) {
    body = (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl shadow-sm text-sm">
        <p className="font-medium">You're not logged in.</p>
        <p className="mt-1">
          Please log in as admin to view your firm's staff.
        </p>
      </div>
    );
  } else if (isLoading) {
    body = (
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-sm text-gray-500">
        Loading staff…
      </div>
    );
  } else if (isError) {
    body = (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-sm text-sm">
        <p className="font-medium">Failed to load staff.</p>
        {error?.data?.message && (
          <p className="mt-1">{String(error.data.message)}</p>
        )}
        {error?.status && (
          <p className="mt-1 text-xs text-red-600">Status: {error.status}</p>
        )}
      </div>
    );
  } else {
    body = (
      <StaffDirectory
        staffList={filteredStaff}
        onViewProfile={onViewProfile}
        activeDropdown={activeDropdown}
        onToggleDropdown={onToggleDropdown}
        onStaffAction={onStaffAction}
        dropdownRef={dropdownRef}
        noResults={filteredStaff.length === 0}
        onResetFilters={onResetFilters}
        onAddStaff={onAddStaff}
      />
    );
  }

  return (
    <div className="pb-8">
      <Tools
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterRole={filterRole}
        onFilterChange={setFilterRole}
        roles={uniqueRoles}
        onAddStaff={onAddStaff}
      />
      {body}
    </div>
  );
};

export default IndexStaff;
