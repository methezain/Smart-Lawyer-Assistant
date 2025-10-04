import React from "react";
import { useGetCaseStatisticsQuery } from "../../../reduxstore/services/CaseManagementAPI";
import { useGetHearingStatisticsQuery } from "../../../reduxstore/services/HearingsManagementAPI";
import { useNavigate } from "react-router-dom";

export default function DetailedStats() {
  const navigate = useNavigate();
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useGetCaseStatisticsQuery();

  const {
    data: hearingStats,
    isLoading: hearingStatsLoading,
    error: hearingStatsError,
  } = useGetHearingStatisticsQuery();

  if (statsLoading || hearingStatsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (statsError || hearingStatsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600">
          Error loading statistics:{" "}
          {statsError?.message || hearingStatsError?.message}
        </p>
      </div>
    );
  }

  const handleViewCases = (filter = {}) => {
    const queryParams = new URLSearchParams();
    if (filter.status) queryParams.set("status", filter.status);
    if (filter.type) queryParams.set("type", filter.type);

    navigate(`/admin/case-management/cases?${queryParams.toString()}`);
  };

  const handleViewHearings = (filter = {}) => {
    const queryParams = new URLSearchParams();
    if (filter.status) queryParams.set("status", filter.status);
    if (filter.view) queryParams.set("view", filter.view);

    navigate(`/admin/case-management/hearings?${queryParams.toString()}`);
  };

  return (
    <div>
      {/* <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Statistics Overview
        </h2>
        <button
          onClick={() => navigate("/admin/case-management/cases")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Manage Cases
        </button>
      </div> */}

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Total Cases */}
        <div className="bg-white rounded-xl p-4 shadow-sm ">
          <div className="flex justify-between items-center mb-2">
            <p className=" text-gray-500 font-bold">Total Cases</p>
            <button
              onClick={() => handleViewCases()}
              className="text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.total_cases || 0}
              </h3>
              <p className="text-[10px] text-blue-600 mt-1">
                +{stats?.monthly_changes?.total_cases || 0} this month
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <i className="ri-file-list-line text-xl text-blue-600"></i>
            </div>
          </div>
        </div>

        {/* Active Cases */}
        <div className="bg-white rounded-xl p-4 shadow-sm ">
          <div className="flex justify-between items-center mb-2">
            <p className=" text-gray-500 font-bold">Active Cases</p>
            <button
              onClick={() => handleViewCases({ status: "active" })}
              className="text-green-600 hover:text-green-700 cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.active_cases || 0}
              </h3>
              <p className="text-[10px] text-green-600 mt-1">
                +{stats?.monthly_changes?.active_cases || 0} this month
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <i className="ri-file-text-line text-xl text-green-600"></i>
            </div>
          </div>
        </div>

        {/* Pending Cases */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className=" text-gray-500 font-bold">Pending Cases</p>
            <button
              onClick={() => handleViewCases({ status: "pending" })}
              className="text-yellow-600 hover:text-yellow-700 cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.pending_cases || 0}
              </h3>
              <p className="text-[10px] text-yellow-600 mt-1">
                {stats?.upcoming_hearings || 0} upcoming hearings
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <i className="ri-time-line text-xl text-yellow-600"></i>
            </div>
          </div>
        </div>

        {/* Closed Cases */}
        <div className="bg-white rounded-xl p-4 shadow-sm ">
          <div className="flex justify-between items-center mb-2">
            <p className=" text-gray-500 font-bold">Closed Cases</p>
            <button
              onClick={() => handleViewCases({ status: "closed" })}
              className="text-purple-600 hover:text-purple-700 cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.closed_cases || 0}
              </h3>
              <p className="text-[10px] text-purple-600 mt-1">
                {stats?.total_cases > 0
                  ? Math.round((stats.closed_cases / stats.total_cases) * 100)
                  : 0}
                % completion rate
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <i className="ri-check-line text-xl text-purple-600"></i>
            </div>
          </div>
        </div>

        {/* Total Hearings */}
        <div className="bg-white rounded-xl p-4 shadow-sm ">
          <div className="flex justify-between items-center mb-2">
            <p className=" text-gray-500 font-bold">Total Hearings</p>
            <button
              onClick={() => handleViewHearings()}
              className="text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {hearingStats?.data?.total_hearings || 0}
              </h3>
              <p className="text-[10px] text-indigo-600 mt-1">
                All scheduled hearings
              </p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <i className="ri-calendar-line text-xl text-indigo-600"></i>
            </div>
          </div>
        </div>

        {/* Upcoming Hearings */}
        <div className="bg-white rounded-xl p-4 shadow-sm ">
          <div className="flex justify-between items-center mb-2">
            <p className=" text-gray-500 font-bold">Upcoming Hearings</p>
            <button
              onClick={() => handleViewHearings({ view: "upcoming" })}
              className="text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {hearingStats?.data?.scheduled_hearings || 0}
              </h3>
              <p className="text-[10px] text-orange-600 mt-1">
                {hearingStats?.data?.upcoming_this_week || 0} this week
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <i className="ri-calendar-event-line text-xl text-orange-600"></i>
            </div>
          </div>
        </div>

        {/* Completed Hearings */}
        <div className="bg-white rounded-xl p-4 shadow-sm ">
          <div className="flex justify-between items-center mb-2">
            <p className=" text-gray-500 font-bold">Completed Hearings</p>
            <button
              onClick={() => handleViewHearings({ status: "completed" })}
              className="text-green-600 hover:text-green-700 cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {hearingStats?.data?.completed_hearings || 0}
              </h3>
              <p className="text-[10px] text-green-600 mt-1">
                {hearingStats?.data?.total_hearings > 0
                  ? Math.round(
                      (hearingStats.data.completed_hearings /
                        hearingStats.data.total_hearings) *
                        100
                    )
                  : 0}
                % completion rate
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <i className="ri-check-double-line text-xl text-green-600"></i>
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-xl p-4 shadow-sm ">
          <div className="flex justify-between items-center mb-2">
            <p className=" text-gray-500 font-bold">Success Rate</p>
            <button
              // onClick={}
              className="text-green-600 hover:text-green-700 cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.total_cases > 0
                  ? Math.round((stats.closed_cases / stats.total_cases) * 100)
                  : 0}
                %{" "}
              </h3>
              <p className="text-[10px] text-green-600 mt-1">
                {/* {stats?.quarterly_clients || 0}  */}
                Cases completed
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <i className="ri-line-chart-line text-xl text-green-600"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
