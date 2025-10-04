import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import "./Calendar.css";
// Note: FullCalendar v6 packages don't export CSS files via ESM. Styling is handled via our wrapper classes.

const EVENT_TYPES = [
  { value: "hearing", label: "Hearing", color: "bg-red-500" },
  { value: "meeting", label: "Meeting", color: "bg-blue-500" },
  { value: "deadline", label: "Deadline", color: "bg-amber-500" },
  { value: "deposition", label: "Deposition", color: "bg-purple-500" },
  { value: "training", label: "Training", color: "bg-green-500" },
  { value: "internal", label: "Internal", color: "bg-gray-500" },
];

// Type themes for icons and light background tints used in the aside lists
const TYPE_THEMES = {
  hearing: {
    color: "bg-red-500",
    light: "bg-red-50",
    border: "border-red-100",
    icon: "ri-auction-line",
  },
  meeting: {
    color: "bg-blue-500",
    light: "bg-blue-50",
    border: "border-blue-100",
    icon: "ri-team-line",
  },
  deadline: {
    color: "bg-amber-500",
    light: "bg-amber-50",
    border: "border-amber-100",
    icon: "ri-alarm-warning-line",
  },
  deposition: {
    color: "bg-purple-500",
    light: "bg-purple-50",
    border: "border-purple-100",
    icon: "ri-mic-line",
  },
  training: {
    color: "bg-green-500",
    light: "bg-green-50",
    border: "border-green-100",
    icon: "ri-graduation-cap-line",
  },
  internal: {
    color: "bg-gray-500",
    light: "bg-gray-50",
    border: "border-gray-200",
    icon: "ri-building-line",
  },
};

const typeTheme = (type) => TYPE_THEMES[type] || TYPE_THEMES.internal;
const typeLabel = (type) =>
  EVENT_TYPES.find((t) => t.value === type)?.label || "Internal";

// Distinct event color palette (Tailwind classes)
const EVENT_COLOR_PALETTE = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-fuchsia-500",
  "bg-cyan-500",
];

// Map Tailwind bg-* classes to hex for FullCalendar event background/border
const COLOR_HEX = {
  "bg-emerald-500": "#10B981",
  "bg-sky-500": "#0EA5E9",
  "bg-blue-500": "#3B82F6",
  "bg-green-500": "#22C55E",
  "bg-red-500": "#EF4444",
  "bg-gray-500": "#6B7280",
  "bg-rose-500": "#F43F5E",
  "bg-amber-500": "#F59E0B",
  "bg-purple-500": "#8B5CF6",
  "bg-pink-500": "#EC4899",
  "bg-teal-500": "#14B8A6",
  "bg-indigo-500": "#6366F1",
  "bg-fuchsia-500": "#D946EF",
  "bg-cyan-500": "#06B6D4",
};

const hexForClass = (cls) => COLOR_HEX[cls] || "#0EA5E9"; // fallback sky-500

const hexToRgba = (hex, alpha) => {
  const clean = hex.replace("#", "");
  const bigint = parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Given a date and list of events, choose a color not used on that day (or rotate)
const pickColorForDate = (date, allEvents) => {
  const used = new Set(
    allEvents
      .filter((e) => e.start && isSameDay(new Date(e.start), date))
      .map((e) => e.colorClass)
      .filter(Boolean)
  );
  for (const c of EVENT_COLOR_PALETTE) {
    if (!used.has(c)) return c;
  }
  // If all are used, rotate by count
  const count = used.size;
  return EVENT_COLOR_PALETTE[count % EVENT_COLOR_PALETTE.length];
};

const Calendar = () => {
  const calendarRef = useRef(null);
  const calendarBoxRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [activeView, setActiveView] = useState("dayGridMonth");
  const [draft, setDraft] = useState(null); // {id?, title, start, end, allDay, type, location, caseId, description}
  const [calendarHeight, setCalendarHeight] = useState(null);
  const [selected, setSelected] = useState(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return { mode: "day", start, end };
  });

  // Load events (from localStorage or seed)
  useEffect(() => {
    const cached = localStorage.getItem("calendarEvents");
    if (cached) {
      try {
        const parsed = JSON.parse(cached).map((e) => ({
          ...e,
          start: e.start ? new Date(e.start) : undefined,
          end: e.end ? new Date(e.end) : undefined,
        }));

        // Migration: ensure colorClass/background/border/text are set
        const colored = [];
        for (const ev of parsed.sort(
          (a, b) => new Date(a.start) - new Date(b.start)
        )) {
          if (ev.colorClass) {
            // ensure hex properties
            const hex = hexForClass(ev.colorClass);
            colored.push({
              ...ev,
              backgroundColor: ev.backgroundColor || hex,
              borderColor: ev.borderColor || hex,
              textColor: ev.textColor || "#ffffff",
            });
          } else {
            const startDate = ev.start ? new Date(ev.start) : new Date();
            const colorClass = pickColorForDate(startDate, colored);
            const hex = hexForClass(colorClass);
            colored.push({
              ...ev,
              colorClass,
              backgroundColor: hex,
              borderColor: hex,
              textColor: "#ffffff",
            });
          }
        }

        setEvents(colored);
        setLoading(false);
        return;
      } catch {
        // fall back to seeding
      }
    }

    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();

    let seed = [
      {
        id: String(Date.now() + 1),
        title: "Hearing - Smith vs. Jones",
        start: new Date(y, m, 15, 10, 0),
        end: new Date(y, m, 15, 12, 0),
        allDay: false,
        type: "hearing",
        location: "Court Room 302, Central District Court",
        caseId: "CASE-2023-001",
        description: "Divorce proceedings - Initial hearing",
      },
      {
        id: String(Date.now() + 2),
        title: "Client Meeting - XYZ Corp",
        start: new Date(y, m, 20, 14, 30),
        end: new Date(y, m, 20, 15, 30),
        allDay: false,
        type: "meeting",
        location: "Office - Conference Room B",
        caseId: "CASE-2023-002",
        description: "Contract review meeting",
      },
      {
        id: String(Date.now() + 3),
        title: "Document Submission Deadline",
        start: new Date(y, m, 25),
        end: new Date(y, m, 26), // FullCalendar allDay spans end-exclusive
        allDay: true,
        type: "deadline",
        caseId: "CASE-2023-001",
        description:
          "Final deadline for submitting financial disclosure documents",
      },
      {
        id: String(Date.now() + 4),
        title: "Team Meeting",
        start: new Date(y, m, 10, 9, 0),
        end: new Date(y, m, 10, 10, 0),
        allDay: false,
        type: "internal",
        location: "Office - Main Conference Room",
        description: "Weekly team meeting to discuss case progress",
      },
      {
        id: String(Date.now() + 5),
        title: "Deposition - Johnson Property Case",
        start: new Date(y, m, 18, 13, 0),
        end: new Date(y, m, 18, 16, 0),
        allDay: false,
        type: "deposition",
        location: "Office - Deposition Room",
        caseId: "CASE-2023-004",
        description: "Deposition of expert witness",
      },
      {
        id: String(Date.now() + 6),
        title: "Case Review - Estate of Williams",
        start: new Date(y, m, 22, 11, 0),
        end: new Date(y, m, 22, 12, 0),
        allDay: false,
        type: "internal",
        location: "Office",
        caseId: "CASE-2023-003",
        description: "Internal review of case documents",
      },
      {
        id: String(Date.now() + 7),
        title: "Training Session - New Legal Database",
        start: new Date(y, m, 28, 14, 0),
        end: new Date(y, m, 28, 16, 0),
        allDay: false,
        type: "training",
        location: "Office - Training Room",
        description: "Staff training on the new legal research database",
      },
    ];
    // Assign distinct colors to seed events for visual variety
    seed = seed.map((e, idx) => {
      const colorClass = EVENT_COLOR_PALETTE[idx % EVENT_COLOR_PALETTE.length];
      const hex = hexForClass(colorClass);
      return {
        ...e,
        colorClass,
        backgroundColor: hex,
        borderColor: hex,
        textColor: "#ffffff",
      };
    });
    setEvents(seed);
    setLoading(false);
  }, []);

  // Keep aside height in sync with calendar card height
  useEffect(() => {
    if (!calendarBoxRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCalendarHeight(entry.contentRect.height);
      }
    });
    ro.observe(calendarBoxRef.current);
    return () => ro.disconnect();
  }, []);

  // Helpers for dates/formatting
  const startOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addMinutes = (d, minutes) =>
    new Date(d.getTime() + minutes * 60 * 1000);
  const nextDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  const fmtDate = (d, opts = {}) =>
    new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
      ...opts,
    }).format(d);
  const fmtTime = (d) =>
    new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(d);

  const selectedEvents = useMemo(() => {
    if (!selected) return [];
    const overlapsRange = (rangeStart, rangeEnd, ev) => {
      const s = new Date(ev.start);
      let e;
      if (ev.end) {
        e = new Date(ev.end);
      } else if (ev.allDay) {
        e = nextDay(s);
      } else {
        e = s;
      }
      return s < rangeEnd && e > rangeStart;
    };
    return events
      .filter((e) => overlapsRange(selected.start, selected.end, e))
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [selected, events]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => new Date(e.end || e.start) >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 6);
  }, [events]);

  // Persist events
  useEffect(() => {
    const serializable = events.map((e) => ({
      ...e,
      start: e.start ? new Date(e.start).toISOString() : undefined,
      end: e.end ? new Date(e.end).toISOString() : undefined,
    }));
    localStorage.setItem("calendarEvents", JSON.stringify(serializable));
  }, [events]);

  const openNewModal = (start, end, allDay = false) => {
    setDraft({
      id: undefined,
      title: "",
      start,
      end,
      allDay,
      type: "internal",
      location: "",
      caseId: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (event) => {
    setDraft({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      type: event.extendedProps?.type || "internal",
      location: event.extendedProps?.location || "",
      caseId: event.extendedProps?.caseId || "",
      description: event.extendedProps?.description || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDraft(null);
  };

  const upsertEvent = (data) => {
    if (data.id) {
      setEvents((prev) =>
        prev.map((e) => (e.id === data.id ? { ...e, ...data } : e))
      );
    } else {
      const id = String(Date.now());
      setEvents((prev) => {
        const startDate = new Date(data.start);
        const colorClass = data.colorClass || pickColorForDate(startDate, prev);
        const hex = hexForClass(colorClass);
        return [
          ...prev,
          {
            ...data,
            id,
            colorClass,
            backgroundColor: hex,
            borderColor: hex,
            textColor: "#ffffff",
          },
        ];
      });
    }
    closeModal();
  };

  const deleteEvent = (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    closeModal();
  };

  // FullCalendar handlers
  const handleDateSelect = (selectInfo) => {
    // Update aside to reflect selected range, and open modal for quick add
    setSelected({
      mode: selectInfo.allDay ? "day" : "time",
      start: selectInfo.start,
      end: selectInfo.end,
    });
    openNewModal(selectInfo.start, selectInfo.end, selectInfo.allDay);
  };

  const handleDateClick = (clickInfo) => {
    // Single cell click: month day or specific time slot
    if (clickInfo.view.type === "dayGridMonth") {
      const d = clickInfo.date;
      setSelected({ mode: "day", start: startOfDay(d), end: nextDay(d) });
    } else {
      const s = clickInfo.date;
      // Consider a 30-min window centered on click start
      setSelected({ mode: "time", start: s, end: addMinutes(s, 30) });
    }
  };

  const handleEventClick = (clickInfo) => {
    const ev = clickInfo.event;
    setSelected({
      mode: ev.allDay ? "day" : "time",
      start: ev.start,
      end: ev.end || (ev.allDay ? nextDay(ev.start) : ev.start),
    });
    openEditModal(clickInfo.event);
  };

  const handleEventDrop = (changeInfo) => {
    const ev = changeInfo.event;
    setEvents((prev) => {
      const targetDate = new Date(ev.start);
      const others = prev.filter((p) => p.id !== ev.id);
      const nextColor = pickColorForDate(targetDate, others);
      const hex = hexForClass(nextColor);
      return prev.map((e) =>
        e.id === ev.id
          ? {
              ...e,
              start: ev.start,
              end: ev.end,
              allDay: ev.allDay,
              colorClass: nextColor,
              backgroundColor: hex,
              borderColor: hex,
              textColor: "#ffffff",
            }
          : e
      );
    });
  };

  const handleEventResize = (resizeInfo) => {
    const ev = resizeInfo.event;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === ev.id ? { ...e, start: ev.start, end: ev.end } : e
      )
    );
  };

  const changeView = (viewName) => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.changeView(viewName);
  };

  const goToday = () => calendarRef.current?.getApi().today();
  const goPrev = () => calendarRef.current?.getApi().prev();
  const goNext = () => calendarRef.current?.getApi().next();

  const formatForInput = (date) => {
    if (!date) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const parseFromInput = (value) => (value ? new Date(value) : null);

  const eventContent = (arg) => {
    const type = arg.event.extendedProps?.type || "internal";
    const theme = typeTheme(type);
    return (
      <div className="flex items-center w-full mx-1 min-w-0 gap-1 leading-4">
        <i className={`${theme.icon} text-[12px]  text-white shrink-0`}></i>
        {arg.timeText && (
          <span className="text-xs font-semibold shrink-0 whitespace-nowrap">
            {arg.timeText}
          </span>
        )}
        <span className="truncate text-xs min-w-0">{arg.event.title}</span>
      </div>
    );
  };

  const calendarControls = (
    <div className="bg-white/70 backdrop-blur rounded-2xl ring-1 ring-black/5 mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="h-8 w-8 inline-flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition"
            aria-label="Previous"
          >
            <i className="ri-arrow-left-s-line" aria-hidden="true"></i>
          </button>
          <div className="flex-1 h-8 font-semibold px-2.5 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 ">
            <h2 className=" text-xs tracking-tight text-gray-800">{title}</h2>
          </div>

          <button
            onClick={goNext}
            className="h-8 w-8 inline-flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition"
            aria-label="Next"
          >
            <i className="ri-arrow-right-s-line" aria-hidden="true"></i>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50">
            <button
              onClick={() => changeView("dayGridMonth")}
              className={`px-3 h-8 rounded-xl text-xs transition ${
                activeView === "dayGridMonth"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => changeView("timeGridWeek")}
              className={`px-3 h-8 rounded-xl text-xs transition ${
                activeView === "timeGridWeek"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => changeView("timeGridDay")}
              className={`px-3 h-8 rounded-xl text-xs transition ${
                activeView === "timeGridDay"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Day
            </button>
          </div>
          <button
            onClick={goToday}
            className="px-3 h-8 inline-flex items-center rounded-xl border border-gray-200 hover:bg-gray-50 text-xs transition"
          >
            Today
          </button>
          <button
            onClick={() =>
              openNewModal(
                new Date(),
                new Date(Date.now() + 60 * 60 * 1000),
                false
              )
            }
            className="inline-flex items-center h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs text-white px-4 shadow-sm transition"
          >
            <i className="ri-add-line mr-1" aria-hidden="true"></i>
            <span>Add Event</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Legend UI can be reintroduced later if needed.

  return (
    <div>
      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <>
          {calendarControls}
          <div className="flex justify-between items-start gap-4">
            <div
              ref={calendarBoxRef}
              className="sl-calendar rounded-2xl w-[840px] text-[13px] font-semibold overflow-hidden border border-gray-200 bg-white"
              style={{ ["--fc-border-color"]: "#e5e7eb" }}
            >
              <FullCalendar
                ref={calendarRef}
                plugins={[
                  dayGridPlugin,
                  timeGridPlugin,
                  listPlugin,
                  interactionPlugin,
                ]}
                initialView="dayGridMonth"
                headerToolbar={false}
                height="auto"
                nowIndicator={true}
                weekends={true}
                selectable={true}
                selectMirror={true}
                editable={true}
                eventStartEditable={true}
                eventDurationEditable={true}
                dayMaxEventRows={3}
                slotDuration="00:30:00"
                snapDuration="00:15:00"
                slotMinTime="00:00:00"
                slotMaxTime="24:00:00"
                scrollTime="07:00:00"
                events={events}
                eventContent={eventContent}
                eventDidMount={(info) => {
                  // Ensure event colors apply consistently in all views
                  let bg = info.event.backgroundColor;
                  if (!bg) {
                    const cls = info.event.extendedProps?.colorClass;
                    if (cls) bg = hexForClass(cls);
                  }
                  if (bg) {
                    info.el.style.setProperty(
                      "background-color",
                      bg,
                      "important"
                    );
                    info.el.style.setProperty("border-color", bg, "important");
                    // Prefer white text for readability on strong backgrounds
                    info.el.style.setProperty("color", "#ffffff", "important");
                  }
                }}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                dateClick={handleDateClick}
                eventClassNames={[
                  "rounded-lg",
                  "px-1.5",
                  "cursor-pointer",
                  "border",
                  "border-transparent",
                  // "hover:shadow-sm",
                  "transition",
                ]}
                dayHeaderClassNames={() => [
                  "bg-gray-100",
                  "text-gray-500",
                  "text-[11px]",
                  "font-semibold",
                  "uppercase",
                  "tracking-wide",
                  "font-medium",
                ]}
                stickyHeaderDates={true}
                // Add a class to the selected day in month view so we can style its border
                dayCellClassNames={(arg) => {
                  const classes = [];
                  if (arg.view.type === "dayGridMonth" && selected?.start) {
                    const sd = selected.start;
                    if (
                      arg.date.getFullYear() === sd.getFullYear() &&
                      arg.date.getMonth() === sd.getMonth() &&
                      arg.date.getDate() === sd.getDate()
                    ) {
                      classes.push("sl-selected-day");
                    }
                  }
                  return classes;
                }}
                datesSet={(arg) => {
                  setTitle(arg.view.title);
                  setActiveView(arg.view.type);
                }}
              />
            </div>
            <aside
              className="w-[375px] rounded-2xl border border-gray-200 bg-white"
              style={{ height: calendarHeight ?? "auto" }}
            >
              <div className="h-full flex flex-col">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Schedule
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selected.mode === "day"
                      ? fmtDate(selected.start)
                      : `${fmtDate(selected.start, {
                          month: "short",
                          day: "numeric",
                        })} • ${fmtTime(selected.start)}`}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                  <section>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">
                      Selected
                    </h4>
                    {selectedEvents.length === 0 ? (
                      <div className="text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl p-3">
                        {selected.mode === "day"
                          ? "No events scheduled for this day"
                          : "No events at this time"}
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {selectedEvents.map((e) => {
                          const hex = e.colorClass
                            ? hexForClass(e.colorClass)
                            : hexForClass(typeTheme(e.type).color);
                          const bg = hexToRgba(hex, 0.08);
                          return (
                            <li
                              key={e.id}
                              className={`rounded-2xl p-3 border relative`}
                              style={{
                                backgroundColor: bg,
                                borderColor: hex + "22",
                              }}
                            >
                              <div className="flex flex-col items-start gap-1 ">
                                <div className="flex items-start gap-2">
                                  <i
                                    className={`${
                                      typeTheme(e.type).icon
                                    } text-[12px]`}
                                    style={{ color: hex }}
                                  ></i>
                                  <div className="flex items-center gap-2 text-xs">
                                    <p className=" font-medium text-gray-900 truncate">
                                      {e.title}
                                    </p>
                                    {e.type && (
                                      <span
                                        className={`px-1.5 py-0.5 absolute right-2 top-2 rounded-md text-[10px] text-white`}
                                        style={{ backgroundColor: hex }}
                                      >
                                        {typeLabel(e.type)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-1 space-y-1">
                                  <div className="flex items-start gap-2 text-xs text-gray-600">
                                    <i className="ri-time-line mt-0.5 text-gray-500"></i>
                                    <span>
                                      {e.allDay
                                        ? `${fmtDate(
                                            new Date(e.start)
                                          )} • All day`
                                        : `${fmtDate(new Date(e.start), {
                                            month: "short",
                                            day: "numeric",
                                          })} • ${fmtTime(
                                            new Date(e.start)
                                          )} - ${fmtTime(
                                            new Date(e.end || e.start)
                                          )}`}
                                    </span>
                                  </div>
                                  {e.location && (
                                    <div className="flex items-start gap-2 text-xs text-gray-600 truncate">
                                      <i className="ri-map-pin-2-line mt-0.5 text-gray-500"></i>
                                      <span className="truncate">
                                        {e.location}
                                      </span>
                                    </div>
                                  )}
                                  {e.caseId && (
                                    <div className="flex items-start gap-2 text-xs text-gray-600 truncate">
                                      <i className="ri-hashtag mt-0.5 text-gray-500"></i>
                                      <span className="truncate">
                                        {e.caseId}
                                      </span>
                                    </div>
                                  )}
                                  {e.description && (
                                    <div className="flex items-start gap-2 text-xs text-gray-600">
                                      <i className="ri-file-text-line mt-0.5 text-gray-500"></i>
                                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                        {e.description}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">
                      Upcoming
                    </h4>
                    {upcomingEvents.length === 0 ? (
                      <div className="text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl p-3">
                        No upcoming events
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {upcomingEvents.map((e) => {
                          const hex = e.colorClass
                            ? hexForClass(e.colorClass)
                            : hexForClass(typeTheme(e.type).color);
                          const bg = hexToRgba(hex, 0.08);
                          return (
                            <li
                              key={e.id}
                              className={`rounded-2xl p-3 border relative`}
                              style={{
                                backgroundColor: bg,
                                borderColor: hex + "22",
                              }}
                            >
                              <div className="flex flex-col items-start gap-1 ">
                                <div className="flex items-start gap-2">
                                  <i
                                    className={`${
                                      typeTheme(e.type).icon
                                    } text-[12px]`}
                                    style={{ color: hex }}
                                  ></i>
                                  <div className="flex items-center gap-2 text-xs">
                                    <p className=" font-medium text-gray-900 truncate">
                                      {e.title}
                                    </p>
                                    {e.type && (
                                      <span
                                        className={`px-1.5 py-0.5 absolute right-2 top-2 rounded-md text-[10px] text-white`}
                                        style={{ backgroundColor: hex }}
                                      >
                                        {typeLabel(e.type)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-1 space-y-1">
                                  <div className="flex items-start gap-2 text-xs text-gray-600">
                                    <i className="ri-time-line mt-0.5 text-gray-500"></i>
                                    <span>
                                      {e.allDay
                                        ? `${fmtDate(
                                            new Date(e.start)
                                          )} • All day`
                                        : `${fmtDate(new Date(e.start), {
                                            month: "short",
                                            day: "numeric",
                                          })} • ${fmtTime(
                                            new Date(e.start)
                                          )} - ${fmtTime(
                                            new Date(e.end || e.start)
                                          )}`}
                                    </span>
                                  </div>
                                  {e.location && (
                                    <div className="flex items-start gap-2 text-xs text-gray-600 truncate">
                                      <i className="ri-map-pin-2-line mt-0.5 text-gray-500"></i>
                                      <span className="truncate">
                                        {e.location}
                                      </span>
                                    </div>
                                  )}
                                  {e.caseId && (
                                    <div className="flex items-start gap-2 text-xs text-gray-600 truncate">
                                      <i className="ri-hashtag mt-0.5 text-gray-500"></i>
                                      <span className="truncate">
                                        {e.caseId}
                                      </span>
                                    </div>
                                  )}
                                  {e.description && (
                                    <div className="flex items-start gap-2 text-xs text-gray-600">
                                      <i className="ri-file-text-line mt-0.5 text-gray-500"></i>
                                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                        {e.description}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                </div>
              </div>
            </aside>
          </div>

          {/* Modal */}
          {isModalOpen && draft && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <button
                type="button"
                className="absolute inset-0 bg-black/30"
                aria-label="Close modal"
                onClick={closeModal}
              />
              <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">
                    {draft.id ? "Edit Event" : "Add Event"}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="ri-close-line text-xl" aria-hidden="true"></i>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="event-title"
                      className="block text-xs text-gray-600 mb-1"
                    >
                      Title
                      <input
                        id="event-title"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={draft.title}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, title: e.target.value }))
                        }
                        placeholder="Event title"
                      />
                    </label>
                  </div>
                  <div>
                    <label
                      htmlFor="event-type"
                      className="block text-xs text-gray-600 mb-1"
                    >
                      Type
                      <select
                        id="event-type"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={draft.type}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, type: e.target.value }))
                        }
                      >
                        {EVENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div>
                    <label
                      htmlFor="event-start"
                      className="block text-xs text-gray-600 mb-1"
                    >
                      Start
                      <input
                        id="event-start"
                        type="datetime-local"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={formatForInput(draft.start)}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            start: parseFromInput(e.target.value),
                          }))
                        }
                        disabled={draft.allDay}
                      />
                    </label>
                  </div>
                  <div>
                    <label
                      htmlFor="event-end"
                      className="block text-xs text-gray-600 mb-1"
                    >
                      End
                      <input
                        id="event-end"
                        type="datetime-local"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={formatForInput(draft.end)}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            end: parseFromInput(e.target.value),
                          }))
                        }
                        disabled={draft.allDay}
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      id="allday"
                      type="checkbox"
                      checked={!!draft.allDay}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, allDay: e.target.checked }))
                      }
                    />
                    <label htmlFor="allday" className="text-sm text-gray-700">
                      All day
                    </label>
                  </div>
                  <div>
                    <label
                      htmlFor="event-location"
                      className="block text-xs text-gray-600 mb-1"
                    >
                      Location
                      <input
                        id="event-location"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={draft.location}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, location: e.target.value }))
                        }
                        placeholder="Where?"
                      />
                    </label>
                  </div>
                  <div>
                    <label
                      htmlFor="event-case"
                      className="block text-xs text-gray-600 mb-1"
                    >
                      Case ID
                      <input
                        id="event-case"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={draft.caseId}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, caseId: e.target.value }))
                        }
                        placeholder="CASE-####"
                      />
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="event-description"
                      className="block text-xs text-gray-600 mb-1"
                    >
                      Description
                      <textarea
                        id="event-description"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={draft.description}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Details..."
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  {draft.id ? (
                    <button
                      onClick={() => deleteEvent(draft.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      <i
                        className="ri-delete-bin-line mr-1"
                        aria-hidden="true"
                      ></i>
                      <span>Delete</span>
                    </button>
                  ) : (
                    <span />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={closeModal}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => upsertEvent(draft)}
                      disabled={!draft.title}
                      className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Calendar;
