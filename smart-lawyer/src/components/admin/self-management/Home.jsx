import React, { useEffect, useState } from "react";
import DetailedStats from "./DetailedStats";
import { useGetUpcomingHearingsQuery } from "../../../reduxstore/services/HearingsManagementAPI";
import { useNavigate } from "react-router-dom";

const DashboardHome = () => {
  const navigate = useNavigate();
  const [recentActivities, setRecentActivities] = useState([]);

  // Fetch upcoming hearings
  const { data: upcomingHearingsResponse, isLoading: hearingsLoading } =
    useGetUpcomingHearingsQuery(5);
  const upcomingHearings = upcomingHearingsResponse?.data || [];

  // Simulate recent activities (in real app, this would come from activity logs)
  useEffect(() => {
    const mockActivities = [
      {
        id: 1,
        action: "Case Created",
        type: "case",
        user: "John Doe",
        caseNumber: "CIV-2024-001",
        caseTitle: "Property Dispute Case",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      },
      {
        id: 2,
        action: "Hearing Scheduled",
        type: "hearing",
        user: "Jane Smith",
        caseNumber: "CRI-2024-002",
        caseTitle: "Criminal Defense Case",
        details: {
          court: "Sessions Court Lahore",
          time: "10:30 AM",
          type: "Preliminary Hearing",
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        id: 3,
        action: "Case Status Updated",
        type: "case",
        user: "Mike Johnson",
        caseNumber: "CIV-2024-003",
        caseTitle: "Contract Dispute",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      },
    ];

    setRecentActivities(mockActivities);
  }, []);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  // // Generate activity notifications from upcoming hearings
  // useEffect(() => {
  //   // Get today's date
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   // Filter hearings for the next 7 days
  //   const nextWeekHearings = hearingsData
  //     .filter((hearing) => {
  //       const hearingDate = new Date(hearing.date);
  //       hearingDate.setHours(0, 0, 0, 0);

  //       // Get hearings in the next 7 days
  //       const nextWeek = new Date(today);
  //       nextWeek.setDate(nextWeek.getDate() + 7);

  //       return (
  //         hearingDate >= today &&
  //         hearingDate <= nextWeek &&
  //         hearing.status === "scheduled"
  //       );
  //     })
  //     .sort((a, b) => new Date(a.date) - new Date(b.date))
  //     .slice(0, 3); // Only take the first 3

  //   setUpcomingHearings(nextWeekHearings);

  //   // Create activity items for upcoming hearings
  //   const hearingActivities = nextWeekHearings.map((hearing) => {
  //     const hearingDate = new Date(hearing.date);
  //     const daysToHearing = Math.ceil(
  //       (hearingDate - today) / (1000 * 60 * 60 * 24)
  //     );

  //     return {
  //       id: `hearing-${hearing.id}`,
  //       action: `Upcoming Hearing (${daysToHearing} day${
  //         daysToHearing > 1 ? "s" : ""
  //       })`,
  //       type: "hearing",
  //       user: "System",
  //       caseNumber: hearing.caseNumber,
  //       caseTitle: hearing.caseTitle,
  //       details: {
  //         court: hearing.court,
  //         time: hearing.time,
  //         type: hearing.type,
  //       },
  //       timestamp: new Date().toISOString().split("T")[0] + " 08:00",
  //     };
  //   });

  //   // Combine with existing activities
  //   setRecentActivities([...hearingActivities, ...stats.recentActivities]);
  // }, [stats.recentActivities]);

  return (
    <div>
      {/* Statistics Section */}
      <div className="mb-4">
        <DetailedStats />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Hearings */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Upcoming Hearings</h2>
            <button
              onClick={() => navigate("/admin/case-management/hearings")}
              className="text-sm text-emerald-600 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Case</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Court</th>
                  <th className="px-4 py-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {hearingsLoading ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      <div className="animate-pulse">Loading hearings...</div>
                    </td>
                  </tr>
                ) : upcomingHearings.length > 0 ? (
                  upcomingHearings.map((hearing) => (
                    <tr key={hearing.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-sm">
                            {hearing.case_title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {hearing.case_number}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm">
                            {new Date(hearing.hearing_date).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {hearing.hearing_time}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {hearing.court_name}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {hearing.hearing_type}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No upcoming hearings in the next 7 days
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <button className="text-sm text-emerald-600 hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0"
              >
                <div
                  className={`bg-${
                    activity.type === "hearing"
                      ? "orange"
                      : activity.type === "case"
                      ? "blue"
                      : "gray"
                  }-100 p-2 rounded-full mt-1`}
                >
                  <i
                    className={`${
                      activity.type === "hearing"
                        ? "ri-calendar-event-line"
                        : activity.type === "case"
                        ? "ri-file-text-line"
                        : "ri-notification-3-line"
                    } text-sm text-${
                      activity.type === "hearing"
                        ? "orange"
                        : activity.type === "case"
                        ? "blue"
                        : "gray"
                    }-600`}
                  ></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-gray-500">By {activity.user}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <p className="text-xs text-blue-600">
                      {activity.caseNumber}
                    </p>
                    <span className="text-gray-300">•</span>
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>

                  {activity.type === "hearing" && activity.details && (
                    <div className="mt-1.5 px-2 py-1 bg-orange-50 border border-orange-100 rounded-md text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-orange-700">
                          {activity.details.time}
                        </span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-600">
                          {activity.details.court}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
