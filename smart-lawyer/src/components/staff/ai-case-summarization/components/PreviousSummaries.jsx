import React from "react";
import PropTypes from "prop-types";
import { formatTextWithBold } from "../utils/formatting.jsx";
import "./PreviousSummaries.css";

// When standalone, the component renders its own header bar.
const PreviousSummaries = ({
  allSummaries,
  onView,
  onCopy,
  standalone = false,
}) => {
  if (!allSummaries || allSummaries.length === 0) {
    return standalone ? (
      <div className="flex h-[640px] bg-white p-3 rounded-xl border border-gray-100 shadow-md flex-col items-center justify-center text-center min-h-60 ">
        <span
          className="ri-file-text-line text-8xl text-gray-400 mb-2"
          aria-hidden="true"
        ></span>
        <p className="font-semibold text-gray-600">
          Nothing in the History yet.
        </p>
      </div>
    ) : null;
  }

  return (
    <div className=" bg-white p-3 rounded-xl border border-gray-100 shadow-md ">
      {standalone && (
        <h2 className=" font-semibold text-sm text-gray-800">
          Previous Summaries ({allSummaries.length})
        </h2>
      )}

      <div className=" max-h-[482px] overflow-y-auto mt-4 scrollbar-hide">
        {allSummaries.map((summaryItem, index) => (
          <div key={summaryItem.case_id || index}>
            <div className="relative mb-2 border border-gray-100 p-3 rounded-xl ">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-700">
                  Case #{summaryItem.case_id}
                </div>

                {/* <div className="font-medium text-gray-900 truncate">
                  {summaryItem.filename}
                </div> */}

                <p className="mt-1 text-[10px] text-gray-500">
                  {(summaryItem.pdf_text?.length || 0).toLocaleString()} chars →{" "}
                  {(summaryItem.case_summary?.length || 0).toLocaleString()}{" "}
                  chars
                </p>

                <span className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-3 mt-1">
                  {formatTextWithBold(summaryItem.case_summary)}
                </span>
              </div>

              <div className="flex gap-2 shrink-0 absolute right-1 top-1">
                {/* <div className="px-2.5 py-0.5 bg-gray-100 text-gray-800 text-[10px] rounded-full">
                  category
                </div> */}
                <button
                  onClick={() => onView(summaryItem)}
                  className="px-2.5 py-0.5 text-[10px] bg-sky-50 border border-sky-200 rounded-full text-sky-600 hover:bg-sky-100"
                >
                  View Full
                </button>
                <button
                  onClick={() =>
                    summaryItem.case_summary && onCopy(summaryItem.case_summary)
                  }
                  className="px-2.5 py-0.5 text-[10px] bg-emerald-50 border border-emerald-200 rounded-full text-emerald-600 hover:bg-emerald-100"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviousSummaries;

PreviousSummaries.propTypes = {
  allSummaries: PropTypes.arrayOf(
    PropTypes.shape({
      case_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      filename: PropTypes.string,
      pdf_text: PropTypes.string,
      case_summary: PropTypes.string,
    })
  ),
  onView: PropTypes.func.isRequired,
  onCopy: PropTypes.func.isRequired,
  standalone: PropTypes.bool,
};
