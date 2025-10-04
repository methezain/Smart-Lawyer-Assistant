import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  useBulkApplyPermissionsMutation,
  useLazyListPermissionsQuery,
  useListPermissionsQuery,
} from "../../../reduxstore/services/PermissionsAPI";
import { useListStaffQuery } from "../../../reduxstore/services/StaffAPI";

// A simple toggle switch component
const Toggle = ({ checked, onChange, label, disabled }) => (
  <label
    className={`inline-flex items-center gap-2 select-none ${
      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
    }`}
  >
    <input
      type="checkbox"
      className="sr-only"
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
      disabled={disabled}
    />
    <span
      className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
        checked ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </span>
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

// Default modules (now includes Clients)
const DEFAULT_MODULES = [
  { id: "cases", label: "Cases" },
  { id: "judgments", label: "Judgments" },
  { id: "hearings", label: "Hearings" },
  { id: "documents", label: "Documents" },
  { id: "clients", label: "Clients" },
];

// Helper to create empty permissions set
const emptyPerms = () => ({ add: false, edit: false, delete: false });

const buildInitialModuleToggles = (modules) =>
  modules.reduce((acc, m) => {
    acc[m.id] = emptyPerms();
    return acc;
  }, {});

const ensureStaffPermStructure = (permissions, staffId, modules) => {
  if (!permissions[staffId]) permissions[staffId] = {};
  for (const m of modules) {
    if (!permissions[staffId][m.id]) permissions[staffId][m.id] = emptyPerms();
  }
};

/**
 * Permissions management component
 * Props:
 * - staff: optional array of { id, name, role? }
 * - modules: optional array of { id, label }
 * - onApply: optional callback({ selectedStaffIds, permissionsDelta })
 */
const Permissions = ({ modules = DEFAULT_MODULES, onApply }) => {
  const auth = useSelector((s) => s.auth);
  const adminId = useMemo(() => {
    const u = auth?.user || {};
    return u.admin_id || u.firmId || u.firm_id || null;
  }, [auth?.user]);

  const [bulkApply, { isLoading: applying }] =
    useBulkApplyPermissionsMutation();
  const [triggerListPermissions] = useLazyListPermissionsQuery();
  // Fetch all existing permissions for this admin (for aside when no selection)
  const { data: allPermData } = useListPermissionsQuery(
    { admin_id: adminId },
    { skip: !adminId }
  );
  // Live staff list from StaffAPI only (no dummy fallback)
  const { data: staffList = [], isLoading: staffLoading } = useListStaffQuery();
  const staffOptions = useMemo(() => {
    const normalize = (arr) =>
      (arr || [])
        .map((s) => {
          const id = s?.id ?? s?.staff_id ?? s?.user_id ?? s?.uid;
          const nameRaw =
            s?.name ??
            [s?.first_name, s?.last_name].filter(Boolean).join(" ") ??
            s?.username ??
            s?.email;
          const name = String(
            nameRaw || (id != null ? `Staff #${id}` : "Staff")
          );
          const role = s?.role ?? s?.title ?? s?.position ?? s?.designation;
          return id != null ? { id, name, role } : null;
        })
        .filter(Boolean);

    return normalize(staffList);
  }, [staffList]);

  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);

  // What to apply: per-module toggles (defaults: all off)
  const [moduleToggles, setModuleToggles] = useState(() =>
    buildInitialModuleToggles(modules)
  );

  // Persisted permissions per staff (preview mapping) and raw items (for dates)
  const [permissions, setPermissions] = useState({}); // { [staffId]: { [moduleId]: {add,edit,delete} } }
  const [rawByStaff, setRawByStaff] = useState({}); // { [staffId]: Array<PermissionOut> }

  // Group all permissions by staff for aside display without selection
  const rawAllByStaff = useMemo(() => {
    const map = {};
    const items = Array.isArray(allPermData?.items) ? allPermData.items : [];
    for (const p of items) {
      const sid = p?.assigned_lawyer_id;
      if (sid == null) continue;
      if (!map[sid]) map[sid] = [];
      map[sid].push(p);
    }
    return map;
  }, [allPermData]);

  // Load existing saved permissions for selected staff from backend (preview)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!adminId || !selectedStaffIds.length) return;
      try {
        const updates = {};
        const rawUpdates = {};
        await Promise.all(
          selectedStaffIds.map(async (sid) => {
            try {
              const resp = await triggerListPermissions(
                { admin_id: Number(adminId), assigned_lawyer_id: Number(sid) },
                true
              ).unwrap();
              const items = Array.isArray(resp?.items) ? resp.items : [];
              // Initialize all modules to false then overlay saved values
              const perModule = modules.reduce((acc, m) => {
                acc[m.id] = { add: false, edit: false, delete: false };
                return acc;
              }, {});
              items.forEach((p) => {
                if (p?.module && perModule[p.module] !== undefined) {
                  perModule[p.module] = {
                    add: !!p.can_add,
                    edit: !!p.can_edit,
                    delete: !!p.can_delete,
                  };
                }
              });
              updates[sid] = perModule;
              rawUpdates[sid] = items;
            } catch (e) {
              // Ignore individual failures; keep preview best-effort
              console.warn("Failed loading permissions for", sid, e);
            }
          })
        );
        if (!cancelled) {
          setPermissions((prev) => ({ ...prev, ...updates }));
          setRawByStaff((prev) => ({ ...prev, ...rawUpdates }));
        }
      } catch {
        // noop
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [adminId, triggerListPermissions, modules, selectedStaffIds]);

  const filteredStaff = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staffOptions;
    return staffOptions.filter((s) =>
      [s.name, s.role]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    );
  }, [query, staffOptions]);

  const isSelected = (id) => selectedStaffIds.includes(id);
  const toggleSelect = (id) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearSelected = () => setSelectedStaffIds([]);

  const setToggle = (moduleId, key, value) => {
    setModuleToggles((prev) => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [key]: value },
    }));
  };

  const setToggleAllForModule = (moduleId, value) => {
    setModuleToggles((prev) => ({
      ...prev,
      [moduleId]: { add: value, edit: value, delete: value },
    }));
  };

  const handleApply = async () => {
    if (!selectedStaffIds.length) return;

    const next = { ...permissions };
    for (const sid of selectedStaffIds) {
      ensureStaffPermStructure(next, sid, modules);
      for (const m of modules) {
        const toApply = moduleToggles[m.id] || emptyPerms();
        next[sid][m.id] = { ...toApply };
      }
    }
    setPermissions(next);

    // Fire optional callback
    onApply?.({ selectedStaffIds, permissionsDelta: moduleToggles });

    // Persist via API if admin id available
    try {
      const adminIdNum = Number(adminId);
      const numericIds = selectedStaffIds
        .map((id) => (typeof id === "number" ? id : Number(id)))
        .filter((n) => Number.isFinite(n));

      if (!Number.isFinite(adminIdNum) || !numericIds.length) return;

      await bulkApply({
        admin_id: adminIdNum,
        assigned_lawyer_ids: numericIds,
        permissions: moduleToggles,
      }).unwrap();

      // Refresh preview and aside by reloading from backend
      const updates = {};
      const rawUpdates = {};
      await Promise.all(
        numericIds.map(async (sid) => {
          try {
            const resp = await triggerListPermissions(
              { admin_id: adminIdNum, assigned_lawyer_id: sid },
              true
            ).unwrap();
            const items = Array.isArray(resp?.items) ? resp.items : [];
            const perModule = modules.reduce((acc, m) => {
              acc[m.id] = { add: false, edit: false, delete: false };
              return acc;
            }, {});
            items.forEach((p) => {
              if (p?.module && perModule[p.module] !== undefined) {
                perModule[p.module] = {
                  add: !!p.can_add,
                  edit: !!p.can_edit,
                  delete: !!p.can_delete,
                };
              }
            });
            updates[sid] = perModule;
            rawUpdates[sid] = items;
          } catch (e) {
            console.warn("Failed to refresh permissions for", sid, e);
          }
        })
      );
      setPermissions((prev) => ({ ...prev, ...updates }));
      setRawByStaff((prev) => ({ ...prev, ...rawUpdates }));
    } catch (e) {
      console.error("Bulk apply permissions failed", e);
    }
  };

  const selectedStaff = selectedStaffIds
    .map((id) => staffOptions.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: selection + module cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Staff Selection */}
          <div className="mt-6 mx-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                  <i className="ri-user-settings-line text-base  text-gray-500 " />
                  Staff Access
                </h3>
                <p className="text-xs text-gray-500">
                  Select staff to whom the permissions will apply
                </p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="inline-flex justify-between items-center text-xs gap-2 px-3 w-80 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200"
                >
                  <span className="flex gap-2.5">
                    <i className="ri-user-add-line" /> Select Staff
                  </span>
                  <i
                    className={`ri-arrow-down-s-line transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg z-10 p-3">
                    <div className="flex items-center gap-2 mb-3 px-2 py-1 bg-gray-100 rounded-md">
                      <i className="ri-search-line text-gray-400" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search staff by name or role"
                        className="w-full bg-transparent outline-none text-sm"
                      />
                    </div>
                    <div className="max-h-76 overflow-y-auto pr-1">
                      {staffLoading && !filteredStaff.length && (
                        <div className="text-sm text-gray-500 px-3 py-6 text-center">
                          Loading staff…
                        </div>
                      )}
                      {filteredStaff.length ? (
                        filteredStaff.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleSelect(s.id)}
                            className={`w-full text-left flex items-center gap-3 mb-1 px-3 py-1.5 rounded-lg hover:bg-gray-50 ${
                              isSelected(s.id)
                                ? "bg-emerald-50 border border-emerald-200"
                                : ""
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isSelected(s.id)
                                  ? "bg-emerald-500"
                                  : "bg-gray-300"
                              }`}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-800">
                                {s.name}{" "}
                                {s.role && (
                                  <span className="text-xs text-gray-500">
                                    {s.role}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isSelected(s.id) && (
                              <i className="ri-check-line text-emerald-600" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 px-3 py-6 text-center">
                          No staff found
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-3">
                      <button
                        type="button"
                        onClick={clearSelected}
                        className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(false)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-gray-900 text-white hover:bg-black"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedStaff.length ? (
              <div className="flex flex-wrap gap-2">
                {selectedStaff.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg text-xs"
                  >
                    <i className="ri-user-line text-gray-500" /> {s.name}
                    <button
                      type="button"
                      onClick={() => toggleSelect(s.id)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                      title="Remove"
                    >
                      <i className="ri-close-line" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 bg-gray-100 p-1.5 rounded-lg text-center w-full">
                No staff selected yet.
              </div>
            )}
          </div>

          {/* Module Permissions - redesigned cards */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <i className="ri-shield-keyhole-line text-gray-500" /> Module
                Permissions
              </h3>
              <p className="text-sm text-gray-500">
                By default all permissions are OFF. Configure below and apply to
                selected staff.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
              {modules.map((m) => {
                const t = moduleToggles[m.id] || emptyPerms();
                const allOn = t.add && t.edit && t.delete;
                const anyOn = t.add || t.edit || t.delete;
                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-gray-200 p-4 hover:shadow transition-shadow bg-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-600 text-xs">
                          {m.label.substring(0, 1)}
                        </span>
                        {m.label}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-md border ${
                          allOn
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : anyOn
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {allOn ? "All on" : anyOn ? "Mixed" : "All off"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Toggle
                        label="Add"
                        checked={!!t.add}
                        onChange={(v) => setToggle(m.id, "add", v)}
                      />
                      <Toggle
                        label="Edit"
                        checked={!!t.edit}
                        onChange={(v) => setToggle(m.id, "edit", v)}
                      />
                      <Toggle
                        label="Delete"
                        checked={!!t.delete}
                        onChange={(v) => setToggle(m.id, "delete", v)}
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setToggleAllForModule(m.id, !allOn)}
                        className="text-[11px] px-2 py-1 rounded-md border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      >
                        {allOn ? "Turn all OFF" : "Turn all ON"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 mt-5">
              <div className="text-sm text-gray-500">
                Applying to:{" "}
                <span className="font-medium text-gray-700">
                  {selectedStaff.length}
                </span>{" "}
                staff
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setModuleToggles(buildInitialModuleToggles(modules))
                  }
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!selectedStaff.length || applying}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applying ? "Applying..." : "Apply to selected"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Aside summary */}
        <aside className="lg:col-span-1">
          <div className="sticky top-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 overflow-visible">
              <div className="mb-3">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <i className="ri-information-line text-gray-500" /> Active
                  permissions
                </h3>
                <p className="text-xs text-gray-500">
                  Clear, real-time summary per staff and module with dates.
                </p>
              </div>

              {(() => {
                const showingSelected = selectedStaff.length > 0;
                const staffToShow = showingSelected
                  ? selectedStaff
                  : Object.keys(rawAllByStaff).map((sidStr) => {
                      const sid = Number(sidStr);
                      const found = staffOptions.find((s) => s.id === sid);
                      return (
                        found || {
                          id: sid,
                          name: `Staff #${sid}`,
                          role: undefined,
                        }
                      );
                    });

                if (!staffToShow.length)
                  return (
                    <div className="text-sm text-gray-500">
                      No active permissions yet.
                    </div>
                  );

                return (
                  <div className="space-y-4">
                    {staffToShow.map((s) => {
                      const items = showingSelected
                        ? rawByStaff[s.id] || []
                        : rawAllByStaff[s.id] || [];
                      const activeItems = items.filter(
                        (p) => !!(p.can_add || p.can_edit || p.can_delete)
                      );
                      return (
                        <div
                          key={s.id}
                          className="border border-gray-100 rounded-xl"
                        >
                          <div className="px-3 py-2 bg-gray-50 flex items-center justify-between rounded-t-xl">
                            <div className="font-medium text-gray-800 flex items-center gap-2">
                              <i className="ri-user-line text-gray-500" />{" "}
                              {s.name}
                            </div>
                            {s.role && (
                              <span className="text-[11px] text-gray-500">
                                {s.role}
                              </span>
                            )}
                          </div>
                          <div className="p-3 space-y-2">
                            {activeItems.length ? (
                              activeItems.map((p) => (
                                <div
                                  key={`${s.id}-${p.module}`}
                                  className="flex items-start justify-between gap-2 border border-gray-100 rounded-lg px-3 py-2"
                                >
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {modules.find((m) => m.id === p.module)
                                        ?.label || p.module}
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                      {p.can_add && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border bg-emerald-50 text-emerald-700 border-emerald-200">
                                          <i className="ri-add-line" /> Add
                                        </span>
                                      )}
                                      {p.can_edit && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border bg-emerald-50 text-emerald-700 border-emerald-200">
                                          <i className="ri-edit-line" /> Edit
                                        </span>
                                      )}
                                      {p.can_delete && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border bg-emerald-50 text-emerald-700 border-emerald-200">
                                          <i className="ri-delete-bin-6-line" />{" "}
                                          Delete
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right text-[11px] text-gray-500">
                                    {p.updated_at ? (
                                      <div>
                                        Updated:{" "}
                                        {new Date(
                                          p.updated_at
                                        ).toLocaleDateString()}
                                      </div>
                                    ) : p.created_at ? (
                                      <div>
                                        Assigned:{" "}
                                        {new Date(
                                          p.created_at
                                        ).toLocaleDateString()}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-gray-500">
                                No active permissions assigned yet.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Permissions;
