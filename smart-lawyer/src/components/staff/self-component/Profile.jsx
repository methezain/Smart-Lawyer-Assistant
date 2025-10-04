import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useGetLoginActivityQuery } from "../../../reduxstore/services/AdminAuthAPI";
import { useGetStaffQuery } from "../../../reduxstore/services/StaffAPI";

const Profile = ({ staff: staffProp, isAdminView = false }) => {
  const auth = useSelector((s) => s.auth);

  const firmName = auth?.user?.firmName || "";

  // Normalizer to adapt various shapes to the UI contract
  const normalizeStaff = (u = {}) => {
    // Normalize education: accept array of strings or array of objects
    const rawEdu = Array.isArray(u.education)
      ? u.education
      : typeof u.education === "string"
      ? u.education
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const education = rawEdu.map((item) => {
      if (item && typeof item === "object") {
        const degree = item.degree || item.title || "";
        const inst = item.institution || item.school || "";
        const year = item.year || item.passed || "";
        return [degree, inst, year].filter(Boolean).join(", ");
      }
      return String(item);
    });

    // Normalize bar associations: array or comma/line separated string
    const barRaw = Array.isArray(u.barAssociations)
      ? u.barAssociations
      : typeof u.barAssociations === "string"
      ? u.barAssociations
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    return {
      id: u.id ?? u.user_id ?? u.staff_id ?? 0,
      name:
        u.name ||
        [u.first_name, u.last_name].filter(Boolean).join(" ") ||
        u.username ||
        "—",
      role: u.role || u.title || "—",
      specialization: u.specialization || u.expertise || "",
      email: u.email || "",
      phone: u.phone || u.contact || "",
      address: u.address || "",
      bio: u.bio || "",
      education,
      barAssociations: barRaw,
      avatar: u.avatar || u.profile_image || u.image || null,
      joinDate: u.joinDate || u.join_date || u.created_at || null,
      assignedCases: u.assignedCases ?? u.assigned_cases ?? 0,
      activeCases: u.activeCases ?? u.active_cases ?? 0,
      closedCases: u.closedCases ?? u.caseCount ?? 0,
      winRate: u.winRate ?? u.win_rate ?? null,
      upcomingHearings: u.upcomingHearings ?? 0,
      clients: u.clients ?? u.clientCount ?? 0,
      billableHoursThisMonth: u.billableHoursThisMonth ?? 0,
      sessions: Array.isArray(u.sessions) ? u.sessions : [],
      password_length: u.password_length ?? 0,
    };
  };

  // Base from props/auth
  const baseStaff = useMemo(
    () => normalizeStaff(staffProp || auth?.user || {}),
    [staffProp, auth?.user]
  );

  // Fetch enriched staff details from StaffAPI
  const baseId = baseStaff?.id;
  const { data: staffData } = useGetStaffQuery(baseId, { skip: !baseId });

  const fetchedStaff = useMemo(
    () => normalizeStaff(staffData || {}),
    [staffData]
  );

  // Merge fetched over base, preferring non-empty fetched values
  const staff = useMemo(() => {
    const pick = (a, b) => {
      // Prefer 'a' (fetched) if meaningful; else fallback to 'b' (base)
      if (Array.isArray(a)) return a.length ? a : b;
      if (typeof a === "string") return a && a.trim() ? a : b;
      if (a === 0) return 0; // explicit zero
      return a ?? b;
    };
    return {
      id: fetchedStaff.id || baseStaff.id,
      name: pick(fetchedStaff.name, baseStaff.name),
      role: pick(fetchedStaff.role, baseStaff.role),
      specialization: pick(
        fetchedStaff.specialization,
        baseStaff.specialization
      ),
      email: pick(fetchedStaff.email, baseStaff.email),
      phone: pick(fetchedStaff.phone, baseStaff.phone),
      address: pick(fetchedStaff.address, baseStaff.address),
      bio: pick(fetchedStaff.bio, baseStaff.bio),
      education: pick(fetchedStaff.education, baseStaff.education),
      barAssociations: pick(
        fetchedStaff.barAssociations,
        baseStaff.barAssociations
      ),
      avatar: pick(fetchedStaff.avatar, baseStaff.avatar),
      joinDate: pick(fetchedStaff.joinDate, baseStaff.joinDate),
      assignedCases: pick(fetchedStaff.assignedCases, baseStaff.assignedCases),
      activeCases: pick(fetchedStaff.activeCases, baseStaff.activeCases),
      closedCases: pick(fetchedStaff.closedCases, baseStaff.closedCases),
      winRate: pick(fetchedStaff.winRate, baseStaff.winRate),
      upcomingHearings: pick(
        fetchedStaff.upcomingHearings,
        baseStaff.upcomingHearings
      ),
      clients: pick(fetchedStaff.clients, baseStaff.clients),
      billableHoursThisMonth: pick(
        fetchedStaff.billableHoursThisMonth,
        baseStaff.billableHoursThisMonth
      ),
      sessions: pick(fetchedStaff.sessions, baseStaff.sessions),
      password_length: pick(
        fetchedStaff.password_length,
        baseStaff.password_length
      ),
    };
  }, [fetchedStaff, baseStaff]);

  const staffId = staff?.id;
  const { data: loginActivity = [] } = useGetLoginActivityQuery(staffId, {
    skip: !staffId,
  });

  // ---------- Helpers copied from StaffView for activity grid ----------
  const parseAsUTC = (val) => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === "number") {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof val === "string") {
      const s = val.trim();
      if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) {
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
      }
      const isoish = s.includes("T") ? s : s.replace(" ", "T");
      const d = new Date(`${isoish}Z`);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  const sessionsRaw = Array.isArray(loginActivity)
    ? loginActivity
    : Array.isArray(staff?.loginSessions)
    ? staff.loginSessions
    : Array.isArray(staff?.sessions)
    ? staff.sessions
    : [];

  const sessions = sessionsRaw
    .map((s) => {
      const loginAt =
        s.loginAt || s.login_at || s.login || s.start || s.signInAt;
      const logoutAt =
        s.logoutAt || s.logout_at || s.logout || s.end || s.signOutAt;
      const li = parseAsUTC(loginAt);
      const lo = parseAsUTC(logoutAt);
      if (!li || isNaN(li.getTime())) return null;
      return { loginAt: li, logoutAt: lo && !isNaN(lo.getTime()) ? lo : null };
    })
    .filter(Boolean)
    .sort((a, b) => b.loginAt - a.loginAt);

  const lastSession = sessions[0] || null;
  const isActive = !!(lastSession && !lastSession.logoutAt);

  const [liveTick, setLiveTick] = useState(0);
  useEffect(() => {
    if (!lastSession || lastSession.logoutAt) return;
    const id = setInterval(() => setLiveTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [lastSession]);

  const fmtDateTime = (raw) => {
    if (!raw) return "—";
    const d = raw instanceof Date ? raw : parseAsUTC(raw);
    if (!d || isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-GB", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const durationSince = (from) => {
    const start = from instanceof Date ? from : new Date(from);
    if (!start || isNaN(start.getTime())) return "—";
    const now = new Date();
    const ms = Math.max(0, now - start);
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    if (hours > 0 && remMin > 0) return `${hours}h ${remMin}m`;
    if (hours > 0) return `${hours}h`;
    return `${remMin}m`;
  };

  // Rolling 3-month window grid (same as StaffView)
  const DAYS = 7;
  const today = new Date();
  const [endYear, setEndYear] = useState(today.getFullYear());
  const [endMonthIdx, setEndMonthIdx] = useState(today.getMonth());
  // endOfToday no longer needed; ongoing sessions are capped to 'now'.

  const shiftMonth = (year, month, delta) => {
    const d = new Date(year, month + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  };
  const startPair = shiftMonth(endYear, endMonthIdx, -3);
  const endPair = { year: endYear, month: endMonthIdx };

  const rawStart = new Date(startPair.year, startPair.month, 1);
  const rawEnd = new Date(endPair.year, endPair.month + 1, 0, 23, 59, 59, 999);

  const startTmp = new Date(rawStart);
  const startWeekday = (startTmp.getDay() + 6) % 7;
  startTmp.setDate(startTmp.getDate() - startWeekday);
  const gridStart = new Date(
    startTmp.getFullYear(),
    startTmp.getMonth(),
    startTmp.getDate(),
    0,
    0,
    0,
    0
  );

  const endTmp = new Date(rawEnd);
  const endWeekday = (endTmp.getDay() + 6) % 7;
  endTmp.setDate(endTmp.getDate() + (6 - endWeekday));
  const gridEnd = new Date(
    endTmp.getFullYear(),
    endTmp.getMonth(),
    endTmp.getDate(),
    23,
    59,
    59,
    999
  );

  const dayRanges = [];
  for (
    let d = new Date(gridStart);
    d <= gridEnd;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    dayRanges.push({
      start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
      end: new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        23,
        59,
        59,
        999
      ),
    });
  }

  const hoursByDay = (() => {
    const arrMs = new Array(dayRanges.length).fill(0);
    const now = new Date();
    for (const s of sessions) {
      const sStart = s.loginAt;
      const sEnd = s.logoutAt || now; // ongoing session counted up to current time
      if (!sStart || !(sStart instanceof Date)) continue;
      if (!sEnd || !(sEnd instanceof Date)) continue;
      const sessionMsRaw = Math.max(0, sEnd - sStart);
      let remainingMs = sessionMsRaw;
      if (remainingMs <= 0) continue;

      for (let i = 0; i < dayRanges.length; i++) {
        if (remainingMs <= 0) break;
        const { start, end } = dayRanges[i];
        if (end < sStart || start > sEnd) continue;
        const overlapStart = sStart > start ? sStart : start;
        const overlapEnd = sEnd < end ? sEnd : end;
        const overlapMs = Math.max(0, overlapEnd - overlapStart);
        if (overlapMs <= 0) continue;
        const allocMs = Math.min(overlapMs, remainingMs);
        arrMs[i] += allocMs;
        remainingMs -= allocMs;
      }
    }
    return arrMs.map((ms) => Math.min(24, Math.max(0, ms / (1000 * 60 * 60))));
  })();

  const levelToClass = {
    1: "bg-emerald-100",
    2: "bg-emerald-200",
    3: "bg-emerald-300",
    4: "bg-emerald-400",
    5: "bg-emerald-500",
    6: "bg-emerald-600",
    7: "bg-emerald-700",
    8: "bg-emerald-800",
  };
  const hoursToShadeClass = (h) => {
    // < 1 hour stays gray; 1..8 hours map to 100..800 by floor
    if (!h || h < 1) return "bg-gray-100";
    const lvl = Math.min(8, Math.floor(h));
    return levelToClass[lvl] || "bg-emerald-800";
  };

  const weeksCols = Array.from(
    { length: Math.ceil(dayRanges.length / DAYS) },
    (_, w) =>
      Array.from({ length: DAYS }, (_, d) => {
        const idx = w * DAYS + d;
        const dr = dayRanges[idx];
        if (!dr) {
          const fallback = new Date(gridStart);
          fallback.setDate(gridStart.getDate() + idx);
          return { date: fallback, hours: 0 };
        }
        const h = hoursByDay[idx] ?? 0;
        return { date: dr.start, hours: h };
      })
  );

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthNamesShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const headerLabel = (() => {
    const shift = (year, month, delta) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    };
    const s = shift(endYear, endMonthIdx, -3);
    const sName = monthNamesShort[s.month];
    const eName = monthNamesShort[endMonthIdx];
    return s.year === endYear
      ? `${sName}–${eName} ${endYear}`
      : `${sName} ${s.year} – ${eName} ${endYear}`;
  })();

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const MAX_WEEKS = 17;
  let displayWeeks = weeksCols;
  const weekHasEndMonth = (week) =>
    week.some(
      (cell) =>
        cell.date.getMonth() === endMonthIdx &&
        cell.date.getFullYear() === endYear
    );
  let firstEndIdx = -1;
  for (let i = 0; i < displayWeeks.length; i++) {
    if (weekHasEndMonth(displayWeeks[i])) {
      if (firstEndIdx === -1) firstEndIdx = i;
    }
  }
  if (displayWeeks.length > MAX_WEEKS) {
    let startIdx = displayWeeks.length - MAX_WEEKS;
    if (firstEndIdx !== -1 && firstEndIdx < startIdx) {
      startIdx = firstEndIdx;
    }
    displayWeeks = displayWeeks.slice(startIdx);
  }
  const labelForWeekInWindow = (wi) => {
    const cur = displayWeeks[wi]?.[0]?.date;
    if (!cur) return "";
    const prev = displayWeeks[wi - 1]?.[0]?.date;
    const curM = cur.getMonth();
    if (wi === 0 || !prev || prev.getMonth() !== curM) {
      return monthNamesShort[curM];
    }
    return "";
  };

  const goPrevMonth = () => {
    const prev = new Date(endYear, endMonthIdx - 1, 1);
    setEndYear(prev.getFullYear());
    setEndMonthIdx(prev.getMonth());
  };
  const goNextMonth = () => {
    const nxt = new Date(endYear, endMonthIdx + 1, 1);
    setEndYear(nxt.getFullYear());
    setEndMonthIdx(nxt.getMonth());
  };

  // Derived stats & computed values
  const closedCases = staff.closedCases ?? staff.caseCount ?? 0;
  const winRate =
    typeof staff.winRate === "number"
      ? `${Math.round(staff.winRate)}%`
      : staff.winRate ?? "—";
  const upcomingHearings = staff.upcomingHearings ?? 0;
  const clients = staff.clients ?? staff.clientCount ?? 0;
  const billableHoursThisMonth = staff.billableHoursThisMonth ?? 0;
  const tenure = (() => {
    const raw = staff.joinDate || staff.join_date;
    const d = raw ? new Date(raw) : null;
    if (!d || isNaN(d.getTime())) return "—";
    const now = new Date();
    let years = now.getFullYear() - d.getFullYear();
    let months = now.getMonth() - d.getMonth();
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    if (years <= 0) return `${months}m`;
    return `${years}y${months > 0 ? ` ${months}m` : ""}`;
  })();

  if (!staff) return null;

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 text-xs">
        {/* Left column */}
        <div className="md:w-1/3">
          <div className="relative overflow-hidden rounded-xl border border-gray-200/80 bg-white/90 shadow-sm mb-4">
            <div className="h-16 bg-gradient-to-r from-emerald-600 to-teal-600">
              <div className="absolute inset-0 opacity-10 bg-pattern-grid" />
            </div>
            <div className="p-3 text-center">
              <div className="-mt-10 mx-auto w-28 h-28 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-white relative">
                <div className="avatar-fallback absolute inset-0 flex items-center justify-center rounded-full bg-emerald-100">
                  <span className="text-emerald-600 font-semibold text-2xl leading-none">
                    {(() => {
                      const name = staff.name || "";
                      const parts = name.trim().split(/\s+/).filter(Boolean);
                      if (parts.length === 0) return "UN";
                      if (parts.length === 1)
                        return parts[0].slice(0, 2).toUpperCase();
                      return (
                        parts[0][0] + parts[parts.length - 1][0]
                      ).toUpperCase();
                    })()}
                  </span>
                </div>
                {staff.avatar ? (
                  <img
                    src={staff.avatar}
                    alt={staff.name}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
              </div>
              <h3 className="mt-2.5 font-semibold text-gray-900 tracking-tight">
                {staff.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{staff.role}</p>
              {staff.specialization && (
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-medium">
                  <i className="ri-magic-line"></i>
                  {staff.specialization}
                </div>
              )}
              {firmName ? (
                <div className="mt-1 text-xs text-gray-600 flex items-center justify-center gap-1">
                  <i className="ri-building-2-line text-emerald-600"></i>
                  <span>{firmName}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Login Activity */}
          <div className="rounded-xl p-4 mb-4 shadow-sm border border-gray-200/80 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-gray-700 flex items-center">
                  <i className="ri-activity-line text-emerald-600"></i>
                  User Activity
                </h4>
                <div className="bg-gray-700 w-1 h-1 shrink-0 rounded-full"></div>
                <span className="text-[11px] font-semibold text-gray-500">
                  {headerLabel}
                </span>
              </div>
              {/* Status pill hidden for self-view */}
              {isAdminView && (
                <div className="flex items-center gap-2 -mt-1">
                  <span
                    className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium ring-1 ${
                      isActive
                        ? "text-emerald-700 bg-emerald-50 ring-emerald-200"
                        : "text-gray-600 bg-gray-50 ring-gray-200"
                    }`}
                  >
                    <span
                      className={`w-[5px] h-[5px] rounded-full ${
                        isActive ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    ></span>
                    {isActive ? "Active" : "Offline"}
                  </span>
                </div>
              )}
            </div>

            {/* Grid */}
            <div className="flex items-start gap-1 overflow-hidden">
              {/* Day labels (rows) */}
              <div className="flex flex-col gap-1 shrink-0">
                <div className="h-3" />
                {dayLabels.map((d) => (
                  <div
                    key={d}
                    className="h-3 leading-3 w-6 pr-1 text-right text-[10px] text-gray-400"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1 flex-1 items-end">
                {/* Month labels header */}
                <div className="flex gap-1 justify-end w-full mr-1">
                  {displayWeeks.map((week, wi) => (
                    <div
                      key={`m-${wi}`}
                      className="w-3 h-3 text-[10px] text-gray-400 leading-3 text-center"
                      title={labelForWeekInWindow(wi)}
                    >
                      {labelForWeekInWindow(wi)}
                    </div>
                  ))}
                </div>
                {/* Grid columns */}
                <div className="flex gap-1 justify-end w-full mr-1">
                  {displayWeeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {week.map((cell, di) => {
                        const todayCell = isSameDay(cell.date, today);
                        const cellBase = todayCell
                          ? "bg-sky-200 border border-sky-300 ring-1 ring-sky-300"
                          : `${hoursToShadeClass(
                              cell.hours
                            )} border border-black/5`;
                        return (
                          <div
                            key={`${wi}-${di}`}
                            title={`${cell.date.toDateString()} • ${cell.hours.toFixed(
                              2
                            )}h`}
                            className={`w-3 h-3 rounded-sm ${cellBase}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="mt-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  className="inline-flex items-center justify-center w-3 h-3  rounded-sm ring-1 ring-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"
                  title="Previous month"
                >
                  <i className="ri-arrow-left-s-line"></i>
                </button>
                <button
                  type="button"
                  onClick={goNextMonth}
                  className="inline-flex items-center justify-center w-3 h-3 rounded-sm ring-1 ring-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"
                  title="Next month"
                >
                  <i className="ri-arrow-right-s-line"></i>
                </button>
              </div>
              <div className="flex items-center gap-1">
                <div className="text-[10px] text-gray-500 mr-2">Less</div>
                <span className="w-3 h-3 rounded-sm bg-gray-100 border border-black/5"></span>
                <span className="w-3 h-3 rounded-sm border border-black/5 bg-emerald-100"></span>
                <span className="w-3 h-3 rounded-sm border border-black/5 bg-emerald-200"></span>
                <span className="w-3 h-3 rounded-sm border border-black/5 bg-emerald-300"></span>
                <span className="w-3 h-3 rounded-sm border border-black/5 bg-emerald-400"></span>
                <span className="w-3 h-3 rounded-sm border border-black/5 bg-emerald-500"></span>
                <span className="w-3 h-3 rounded-sm border border-black/5 bg-emerald-600"></span>
                <span className="w-3 h-3 rounded-sm border border-black/5 bg-emerald-700"></span>
                <span className="w-3 h-3 rounded-sm border border-black/5 bg-emerald-800"></span>
                <div className="text-[10px] text-gray-500 ml-2">More</div>
              </div>
            </div>

            {/* Last login + duration: hidden in self-view */}
            {isAdminView && (
              <div className="mt-3 border-t border-gray-100  pt-3">
                {lastSession ? (
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="text-gray-700">
                      <div className="flex items-center gap-1">
                        <i className="ri-login-circle-line mr-1 text-emerald-600"></i>
                        <div className="text-gray-600">Last Login</div>
                        <span className="text-gray-800">
                          {fmtDateTime(lastSession.loginAt)}
                        </span>
                      </div>
                      {lastSession.logoutAt && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <i className="ri-logout-circle-line mr-1 text-emerald-600"></i>
                          <div className="text-gray-600">Logout</div>
                          <span className="text-gray-800">
                            {fmtDateTime(lastSession.logoutAt)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-[10px] font-medium text-emerald-700 p-2 bg-emerald-50 ring-1 ring-emerald-200 rounded-md h-fit">
                      <i className="ri-time-line mr-1 text-emerald-600"></i>
                      {lastSession.logoutAt ? (
                        (() => {
                          const ms =
                            new Date(lastSession.logoutAt) -
                            new Date(lastSession.loginAt);
                          const totalMin = Math.max(0, Math.floor(ms / 60000));
                          const h = Math.floor(totalMin / 60);
                          const m = totalMin % 60;
                          return h > 0 ? `${h}h ${m || 0}m` : `${m}m`;
                        })()
                      ) : (
                        <>
                          {durationSince(lastSession.loginAt)}
                          <span className="hidden" aria-hidden="true">
                            {liveTick}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-500 italic">
                    No login data
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="rounded-xl p-4 shadow-sm border border-gray-200/80 bg-white/80 backdrop-blur-sm">
            <h4 className="font-semibold mb-3 text-gray-700 flex items-center">
              <i className="ri-contacts-line text-emerald-600 mr-2"></i>
              Contact Information
            </h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <i className="ri-mail-line text-gray-500 mr-3"></i>
                <a
                  href={`mailto:${staff.email}`}
                  className=" hover:underline text-blue-600"
                >
                  {staff.email || "—"}
                </a>
              </div>
              {staff.phone ? (
                <div className="flex items-center">
                  <i className="ri-phone-line text-gray-500 mr-3"></i>
                  <a
                    href={`tel:${staff.phone}`}
                    className=" hover:underline text-blue-600"
                  >
                    {staff.phone}
                  </a>
                </div>
              ) : null}
              {staff.address ? (
                <div className="flex items-start">
                  <i className="ri-map-pin-line text-gray-500 mr-3"></i>
                  <p className=" text-gray-600">{staff.address}</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Password reveal: admin-only; hidden in self-view */}
          {isAdminView && (
            <div className="rounded-xl py-3 px-4 shadow-sm border border-gray-200/80 bg-white/80 backdrop-blur-sm flex justify-between items-center">
              <h4 className="font-semibold text-gray-700 flex items-center">
                <i className="ri-contacts-line text-emerald-600 mr-2"></i>
                Staff Password
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                Hidden in this view
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="md:w-2/3">
          <div className="bg-white/90 rounded-xl p-4 shadow-sm border border-gray-200/80 mb-4">
            <h4 className="font-semibold mb-3 flex items-center text-gray-800">
              <i className="ri-file-text-line text-emerald-600 mr-2"></i>
              Biography
            </h4>
            <p className="text-gray-600 leading-relaxed">
              {staff.bio || "No biography information provided."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-white/90 rounded-xl p-4 shadow-sm border border-gray-200/80">
              <h4 className="font-semibold mb-3 flex items-center text-gray-800">
                <i className="ri-graduation-cap-line text-emerald-600 mr-2"></i>
                Education
              </h4>
              {staff.education && staff.education.length > 0 ? (
                <ul className="space-y-3">
                  {staff.education.map((edu, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 mr-3 flex-shrink-0">
                        <i className="ri-bookmark-line text-sm"></i>
                      </span>
                      <span className="text-gray-600">{edu}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Not provided</p>
              )}
            </div>

            <div className="bg-white/90 rounded-xl p-4 shadow-sm border border-gray-200/80">
              <h4 className=" font-semibold mb-3 flex items-center text-gray-800">
                <i className="ri-award-line text-emerald-600 mr-2"></i>
                Bar Associations
              </h4>
              {staff.barAssociations && staff.barAssociations.length > 0 ? (
                <ul className="space-y-3">
                  {staff.barAssociations.map((bar, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 mr-3 flex-shrink-0">
                        <i className="ri-scales-line text-sm"></i>
                      </span>
                      <span className="text-gray-600">{bar}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Not applicable</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl p-4 shadow-sm border border-emerald-100">
            <h4 className="font-semibold mb-3 text-emerald-800 flex items-center">
              <i className="ri-dashboard-line text-emerald-600 mr-2"></i>
              Quick Stats
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500">Assigned Cases</p>
                <p className="font-bold text-emerald-700">
                  {staff.assignedCases ?? 0}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500">Active Cases</p>
                <p className="font-bold text-emerald-700">
                  {staff.activeCases ?? 0}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500">Closed Cases</p>
                <p className="font-bold text-gray-800">{closedCases}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500">Win Rate</p>
                <p className="font-bold text-gray-800">{winRate}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500">Hearings</p>
                <p className="font-bold text-gray-800">{upcomingHearings}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500">Clients</p>
                <p className="font-bold text-gray-800">{clients}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500">Billable (mo)</p>
                <p className="font-bold text-gray-800">
                  {billableHoursThisMonth}h
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500">Tenure</p>
                <p className="font-bold text-gray-800">{tenure}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500">Joined</p>
                <p className="font-medium text-gray-800">
                  {(() => {
                    const raw = staff.joinDate || staff.join_date;
                    const d = raw ? new Date(raw) : null;
                    if (!d || isNaN(d.getTime())) return "—";
                    return d.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Management Options: admin-only */}
      {isAdminView && (
        <div className="bg-white/90 rounded-xl p-3 shadow-sm border border-gray-200/80 mt-4">
          <h4 className="font-semibold mb-3 flex items-center text-gray-800">
            <i className="ri-settings-line text-emerald-600 mr-2"></i>
            Management Options
          </h4>
          <div className=" flex justify-between items-center">
            <div>
              <button className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2  font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-white">
                <i className="ri-arrow-left-line"></i>
                Back
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-1 px-4 py-2 rounded-xl  font-medium text-white shadow-sm transition-colors bg-blue-600 hover:bg-blue-700">
                <i className="ri-calendar-line mr-2"></i>
                View Schedule
              </button>
              <button className="inline-flex items-center gap-1 px-4 py-2 rounded-xl  font-medium text-white shadow-sm transition-colors bg-purple-600 hover:bg-purple-700">
                <i className="ri-file-list-3-line mr-2"></i>
                Assigned Cases
              </button>
              <button className="inline-flex items-center gap-1 px-4 py-2 rounded-xl  font-medium text-white shadow-sm transition-colors bg-orange-500 hover:bg-orange-600">
                <i className="ri-time-line mr-2"></i>
                Time Records
              </button>
              <button className="inline-flex items-center gap-1 px-4 py-2 rounded-xl  font-medium text-white shadow-sm transition-colors bg-red-500 hover:bg-red-600">
                <i className="ri-user-unfollow-line mr-2"></i>
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
