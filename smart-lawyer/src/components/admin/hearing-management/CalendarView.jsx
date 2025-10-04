import React from "react";

const CalendarView = ({
  currentCalendarMonth,
  currentCalendarYear,
  goToPreviousMonth,
  goToNextMonth,
  generateCalendarDays,
  formatDateForComparison,
  hearingsData,
  onViewCase,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Hearing Calendar</h2>
        <p className="text-sm text-gray-500">
          View all scheduled hearings in calendar format
        </p>
      </div>

      <div className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium" id="calendarMonth">
            {new Date(currentCalendarYear, currentCalendarMonth).toLocaleString(
              "default",
              { month: "long", year: "numeric" }
            )}
          </h3>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
              onClick={goToPreviousMonth}
            >
              <i className="ri-arrow-left-s-line"></i> Previous
            </button>
            <button
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
              onClick={goToNextMonth}
            >
              Next <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg bg-white">
          <div className="grid grid-cols-7 gap-0">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day, index) => (
                <div
                  key={index}
                  className="p-2 text-center font-medium text-sm bg-gray-50 border-b border-gray-200"
                >
                  {day}
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-7 gap-0 h-[600px]">
            {generateCalendarDays().map((day, index) => {
              const dayHearings = hearingsData.filter((hearing) => {
                if (!day.date) return false;
                return hearing.date === formatDateForComparison(day.date);
              });

              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const isPast = day.date && day.date < today;
              const isFuture = day.date && day.date > today;

              let dayTypeClass = "";
              if (day.isToday) {
                dayTypeClass = "bg-blue-50";
              } else if (isPast && day.isCurrentMonth) {
                dayTypeClass = "bg-gray-50";
              } else if (isFuture && day.isCurrentMonth) {
                dayTypeClass = "bg-white";
              } else if (!day.isCurrentMonth) {
                dayTypeClass = "bg-gray-100";
              }

              return (
                <div
                  key={index}
                  className={`border-r border-b border-gray-200 p-1 ${dayTypeClass} overflow-y-auto relative min-h-[100px] calendar-day`}
                >
                  {day.date && (
                    <>
                      <div className="flex justify-between mb-1">
                        <span
                          className={`text-sm font-medium ${
                            day.isToday
                              ? "today-indicator"
                              : isPast
                              ? "past-day"
                              : "text-gray-800"
                          }`}
                        >
                          {day.date.getDate()}
                        </span>
                        {dayHearings.length > 0 && (
                          <span className="hearing-count">
                            {dayHearings.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayHearings.map((hearing, hIndex) => (
                          <div
                            key={hIndex}
                            className={`text-xs p-1 rounded cursor-pointer truncate ${
                              hearing.status === "scheduled"
                                ? "bg-green-100 text-green-800"
                                : hearing.status === "adjourned"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                            title={`${hearing.time} - ${hearing.caseTitle} (${hearing.type})`}
                            onClick={() => onViewCase(hearing)}
                          >
                            <span className="font-medium">{hearing.time}</span>{" "}
                            -{" "}
                            {hearing.caseTitle.length > 15
                              ? hearing.caseTitle.substring(0, 15) + "..."
                              : hearing.caseTitle}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
