import React from "react";
import PropTypes from "prop-types";
import "./PreviousPredictions.css";

const PreviousPredictions = ({ predictions, loading, onView, standalone }) => {
  const hasItems = predictions && predictions.length > 0;

  return (
    <div
      className={`space-y-3 ${
        standalone ? "bg-white rounded-xl border border-gray-200 p-4" : ""
      }`}
    >
      {standalone && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <span className="ri-history-line text-base" /> History
          </h3>
          {hasItems && (
            <button
              onClick={() => {}}
              disabled
              className="text-xs text-gray-400 cursor-not-allowed"
            >
              {/* Reserved for future refresh button */}
              Refresh
            </button>
          )}
        </div>
      )}

      <div className="relative">
        <div className="overflow-y-auto max-h-[570px] pr-1 prediction-scrollbar-hide space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full"></span>
                <span>Loading predictions...</span>
              </div>
            </div>
          )}
          {!loading && !hasItems && (
            <div className="flex flex-col h-[570px]  items-center justify-center py-16 text-center text-gray-400">
              <span className="ri-file-list-line text-7xl mb-4" />
              <p className="text-sm font-medium text-gray-600 mb-1">
                Nothing in the History yet.
              </p>
              <p className="text-xs text-gray-400 max-w-[180px]">
                Upload PDFs to generate verdict predictions.
              </p>
            </div>
          )}
          {!loading &&
            hasItems &&
            predictions.map((pred) => (
              <div
                key={pred.case_id}
                className="group relative bg-white border border-gray-200 hover:border-blue-300 rounded-lg transition-all shadow-sm hover:shadow overflow-hidden"
              >
                {/* Section 1: Header row */}
                <div className="flex items-start gap-3 p-3 pb-2 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-base shrink-0">
                    <span className="ri-scales-line" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-medium text-gray-600">
                          Case #{pred.case_id}
                        </span>
                        <span
                          className="text-[10px] text-gray-400 truncate max-w-[140px]"
                          title={pred.file_name || "Unknown file"}
                        >
                          {pred.file_name || "Unknown file"}
                        </span>
                      </div>
                      <button
                        onClick={() => onView(pred)}
                        type="button"
                        className="px-3 py-0.5 text-[10px] bg-sky-50 border border-sky-200 rounded-full text-sky-600 hover:bg-sky-100 flex items-center gap-1 shrink-0"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
                {/* Section 2: Verdict */}
                <div className="p-3 pt-2">
                  <p className="text-[12px] leading-snug text-gray-700 line-clamp-3">
                    {pred.verdict}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

PreviousPredictions.propTypes = {
  predictions: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onView: PropTypes.func.isRequired,
  standalone: PropTypes.bool,
};

export default PreviousPredictions;
