import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  useAdminLoginMutation,
  useGetLoginActivityQuery,
} from "../../../reduxstore/services/AdminAuthAPI";
import { useRevealStaffPasswordMutation } from "../../../reduxstore/services/StaffAPI";

const StaffView = ({ staff, onBack, onVerifyAdminPassword }) => {
  // Admin password verification state for revealing staff password
  const auth = useSelector((s) => s.auth);
  const adminUsername = auth?.user?.username || auth?.username;
  const [verifyLogin] = useAdminLoginMutation();
  const [revealStaffPassword] = useRevealStaffPasswordMutation();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAdminPwdVisible, setIsAdminPwdVisible] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState("");
  const staffId = staff?.id;
  const { data: loginActivity = [] } = useGetLoginActivityQuery(staffId, {
    skip: !staffId,
  });

  // Reset revealed state when staff changes or password length changes
  useEffect(() => {
    setIsPasswordVisible(false);
    setRevealedPassword("");
  }, [staff?.id, staff?.password_length]);

  const handleRequestShowPassword = () => {
    setVerifyError("");
    setAdminPasswordInput("");
    setIsAdminPwdVisible(false);
    // Ensure we don't reuse an older revealed password
    setIsPasswordVisible(false);
    setRevealedPassword("");
    setShowPasswordModal(true);
  };

  const handleVerifyAdminPassword = async () => {
    setIsVerifying(true);
    setVerifyError("");
    try {
      let ok = false;
      if (typeof onVerifyAdminPassword === "function") {
        ok = await onVerifyAdminPassword(adminPasswordInput);
      } else {
        if (!adminUsername) {
          setVerifyError("Missing admin username in session.");
          setIsVerifying(false);
          return;
        }
        // Re-authenticate the admin using their username and entered password
        await verifyLogin({
          username: adminUsername,
          password: adminPasswordInput,
        }).unwrap();
        ok = true;
      }
      if (ok) {
        try {
          const res = await revealStaffPassword(staff.id).unwrap();
          setRevealedPassword(res?.password || "");
          setIsPasswordVisible(true);
          setShowPasswordModal(false);
        } catch (re) {
          console.error(re);
          setVerifyError("Unable to reveal password.");
        }
      } else {
        setVerifyError("Incorrect password.");
      }
    } catch (err) {
      console.error(err);
      setVerifyError("Incorrect password.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Note: keep conditional return after hooks (moved below) to satisfy React rules

  // Derived stats with safe fallbacks
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

  const maskedPassword = (() => {
    const len = Number.isFinite(staff.password_length)
      ? staff.password_length
      : revealedPassword
      ? revealedPassword.length
      : 0;
    return len > 0 ? "\u2022".repeat(len) : "—";
  })();

  const firmName = auth?.user?.firmName || "";

  // ---------- Login activity helpers ----------
  // Parse dates robustly: if backend sends naive strings (no timezone), assume UTC
  const parseAsUTC = (val) => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === "number") {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof val === "string") {
      const s = val.trim();
      // If contains timezone info (Z or +/-HH:MM), rely on native parsing
      if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) {
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
      }
      // Otherwise, coerce to ISO and append Z to treat as UTC
      const isoish = s.includes("T") ? s : s.replace(" ", "T");
      const d = new Date(`${isoish}Z`);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  // Accept multiple potential shapes for sessions data
  const sessionsRaw = Array.isArray(loginActivity)
    ? loginActivity
    : Array.isArray(staff?.loginSessions)
    ? staff.loginSessions
    : Array.isArray(staff?.sessions)
    ? staff.sessions
    : [];

  // Normalize sessions into { loginAt: Date, logoutAt?: Date, durationMinutes?: number }
  const sessions = sessionsRaw
    .map((s) => {
      const loginAt =
        s.loginAt || s.login_at || s.login || s.start || s.signInAt;
      const logoutAt =
        s.logoutAt || s.logout_at || s.logout || s.end || s.signOutAt;
      const durationMinutes = s.durationMinutes ?? s.duration_minutes;
      const li = parseAsUTC(loginAt);
      const lo = parseAsUTC(logoutAt);
      if (!li || isNaN(li.getTime())) return null;
      return {
        loginAt: li,
        logoutAt: lo && !isNaN(lo.getTime()) ? lo : null,
        durationMinutes:
          Number.isFinite(durationMinutes) && durationMinutes >= 0
            ? durationMinutes
            : undefined,
      };
    })
    .filter(Boolean)
    // newest first
    .sort((a, b) => b.loginAt - a.loginAt);

  const lastSession = sessions[0] || null;
  // Active only if the latest session is open (no logout yet)
  const isActive = !!(lastSession && !lastSession.logoutAt);

  // Live tick every minute while an active session is open (forces re-render)
  const [liveTick, setLiveTick] = useState(0);
  useEffect(() => {
    if (!lastSession || lastSession.logoutAt) return; // no live ticking for closed sessions
    const id = setInterval(() => setLiveTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [lastSession]);

  // Format time in Pakistan Standard Time (Asia/Karachi)
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

  // Duration since last login (kitni der tak login raha)
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

  // Rolling 3-month window (current month + previous two)
  const DAYS = 7; // Mon..Sun
  const today = new Date();
  const [endYear, setEndYear] = useState(today.getFullYear());
  const [endMonthIdx, setEndMonthIdx] = useState(today.getMonth());
  const endOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999
  );

  // Compute 3-month window bounds
  const shiftMonth = (year, month, delta) => {
    const d = new Date(year, month + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  };
  const startPair = shiftMonth(endYear, endMonthIdx, -3); // three months back (May when end is Aug)
  const endPair = { year: endYear, month: endMonthIdx };

  const rawStart = new Date(startPair.year, startPair.month, 1);
  const rawEnd = new Date(endPair.year, endPair.month + 1, 0, 23, 59, 59, 999);

  // Align to Monday at start
  const startTmp = new Date(rawStart);
  const startWeekday = (startTmp.getDay() + 6) % 7; // 0=Mon..6=Sun
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

  // Align to Sunday at end
  const endTmp = new Date(rawEnd);
  const endWeekday = (endTmp.getDay() + 6) % 7; // 0..6
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

  // Build day ranges by iterating dates (resilient to DST and avoids rounding issues)
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
      let remainingMs = Number.isFinite(s.durationMinutes)
        ? Math.min(sessionMsRaw, s.durationMinutes * 60 * 1000)
        : sessionMsRaw;
      if (remainingMs <= 0) continue;

      for (let i = 0; i < dayRanges.length; i++) {
        if (remainingMs <= 0) break;
        const { start, end } = dayRanges[i];
        // Skip days before or after session entirely
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

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; // matches Monday-first grid
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
  // Header label for window range
  const headerLabel = (() => {
    const sName = monthNamesShort[startPair.month];
    const eName = monthNamesShort[endPair.month];
    if (startPair.year === endPair.year)
      return `${sName}–${eName} ${endPair.year}`;
    return `${sName} ${startPair.year} – ${eName} ${endPair.year}`;
  })();
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  // Ensure full current month (endPair) is visible and cap total columns to fit
  const MAX_WEEKS = 17; // trims older weeks (e.g., April) while keeping August fully visible
  let displayWeeks = weeksCols;
  // find first and last week that contain any day from the current (end) month
  const weekHasEndMonth = (week) =>
    week.some(
      (cell) =>
        cell.date.getMonth() === endPair.month &&
        cell.date.getFullYear() === endPair.year
    );
  let firstEndIdx = -1;
  for (let i = 0; i < displayWeeks.length; i++) {
    if (weekHasEndMonth(displayWeeks[i])) {
      if (firstEndIdx === -1) firstEndIdx = i;
    }
  }
  if (displayWeeks.length > MAX_WEEKS) {
    let startIdx = displayWeeks.length - MAX_WEEKS; // keep rightmost weeks
    // If trimming would cut off the first week of the current month, shift left boundary leftward
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

  // Navigation slides window by 1 month
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

  // Ensure hooks are called before any conditional return
  if (!staff) return null;

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200/80 bg-white/80 backdrop-blur-sm text-xs p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/3">
          <div className="relative overflow-hidden rounded-xl border border-gray-200/80 bg-white/90 shadow-sm mb-4">
            <div className="h-16 bg-gradient-to-r from-emerald-600 to-teal-600">
              <div className="absolute inset-0 opacity-10 bg-pattern-grid" />
            </div>
            <div className="p-3 text-center">
              <div className="-mt-10 mx-auto w-28 h-28 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-white relative">
                {/* Fallback initials avatar */}
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
                {/* Image if provided; hide it on error to reveal fallback */}
                {staff.avatar ? (
                  <img
                    src={staff.avatar}
                    alt={staff.name}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      // Hide broken image to reveal initials fallback
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
                  Login Activity
                </h4>
                <div className="bg-gray-700 w-1 h-1 shrink-0 rounded-full"></div>
                <span className="text-[11px] font-semibold text-gray-500">
                  {headerLabel}
                </span>
              </div>
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
            </div>

            {/* Grid */}
            <div className="flex items-start gap-1 overflow-hidden">
              {/* Day labels (rows) */}
              <div className="flex flex-col gap-1 shrink-0">
                {/* top spacer to align with month header */}
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

            {/* Last login + duration (Pakistan time) */}
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
                        const totalMin = Number.isFinite(
                          lastSession.durationMinutes
                        )
                          ? lastSession.durationMinutes
                          : (() => {
                              const ms =
                                new Date(lastSession.logoutAt) -
                                new Date(lastSession.loginAt);
                              return Math.max(0, Math.floor(ms / 60000));
                            })();
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
          </div>

          <div className="rounded-xl p-4 mb-4 shadow-sm border border-gray-200/80 bg-white/80 backdrop-blur-sm">
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
                  {staff.email}
                </a>
              </div>
              <div className="flex items-center">
                <i className="ri-phone-line text-gray-500 mr-3"></i>
                <a
                  href={`tel:${staff.phone}`}
                  className=" hover:underline text-blue-600"
                >
                  {staff.phone}
                </a>
              </div>
              <div className="flex items-start">
                <i className="ri-map-pin-line text-gray-500 mr-3"></i>
                <p className=" text-gray-600">{staff.address}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl py-3 px-4 shadow-sm border border-gray-200/80 bg-white/80 backdrop-blur-sm flex justify-between items-center">
            <h4 className="font-semibold text-gray-700 flex items-center">
              <i className="ri-contacts-line text-emerald-600 mr-2"></i>
              Staff Password
            </h4>
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-800 select-all">
                {isPasswordVisible ? revealedPassword || "—" : maskedPassword}
              </span>
              {!isPasswordVisible ? (
                <button
                  onClick={handleRequestShowPassword}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 ring-1 ring-emerald-200"
                >
                  <i className="ri-eye-line"></i>
                  Show
                </button>
              ) : (
                <button
                  onClick={() => setIsPasswordVisible(false)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 ring-1 ring-gray-200"
                >
                  <i className="ri-eye-off-line"></i>
                  Hide
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="md:w-2/3">
          <div className="bg-white/90 rounded-xl p-4 shadow-sm border border-gray-200/80 mb-4">
            <h4 className="font-semibold mb-3 flex items-center text-gray-800">
              <i className="ri-file-text-line text-emerald-600 mr-2"></i>
              Biography
            </h4>
            <p className="text-gray-600 leading-relaxed">{staff.bio}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-white/90 rounded-xl p-4 shadow-sm border border-gray-200/80">
              <h4 className="font-semibold mb-3 flex items-center text-gray-800">
                <i className="ri-graduation-cap-line text-emerald-600 mr-2"></i>
                Education
              </h4>
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
            </div>

            <div className="bg-white/90 rounded-xl p-4 shadow-sm border border-gray-200/80">
              <h4 className=" font-semibold mb-3 flex items-center text-gray-800">
                <i className="ri-award-line text-emerald-600 mr-2"></i>
                Bar Associations
              </h4>
              {staff.barAssociations.length > 0 ? (
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
                  {staff.assignedCases}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500">Active Cases</p>
                <p className="font-bold text-emerald-700">
                  {staff.activeCases}
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
      <div className="bg-white/90 rounded-xl p-3 shadow-sm border border-gray-200/80 mt-4">
        <h4 className="font-semibold mb-3 flex items-center text-gray-800">
          <i className="ri-settings-line text-emerald-600 mr-2"></i>
          Management Options
        </h4>
        <div className=" flex justify-between items-center">
          <div>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2  font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-white"
            >
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
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowPasswordModal(false)}
          ></div>
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white shadow-lg border border-gray-200 p-4">
            <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
              <i className="ri-shield-keyhole-line text-emerald-600 mr-2"></i>
              Confirm Admin Password
            </h5>
            <p className="text-xs text-gray-600 mb-3">
              Enter your admin password to reveal the staff password.
            </p>
            <div className="relative mb-2">
              <input
                type={isAdminPwdVisible ? "text" : "password"}
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
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
                onClick={() => setShowPasswordModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyAdminPassword}
                disabled={isVerifying || !adminPasswordInput}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
              >
                {isVerifying ? (
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

export default StaffView;
