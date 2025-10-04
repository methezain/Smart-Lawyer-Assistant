import React from "react";
import PropTypes from "prop-types";
import { formatTextWithBold } from "../utils/formatting.jsx";

const SummaryResult = ({
  summary,
  onCopy,
  calculateReduction,
  variant = "current", // 'current' or 'selected'
  onClose,
}) => {
  if (!summary) return null;
  const {
    text = "",
    originalLength = 0,
    summaryLength = 0,
    case_id,
    filename,
  } = summary || {};
  const reduction = calculateReduction(summary);
  const isSelected = variant === "selected";

  return (
    <>
      <div className="p-3 rounded-xl border border-gray-100 shadow-md bg-white space-y-4">
        {/* Unified Header */}
        <div className="flex justify-between items-center gap-4">
          <h2 className="font-semibold text-gray-800 text-sms ">
            Summary Result
          </h2>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onCopy(text)}
              className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full"
            >
              Copy
            </button>
            {/* <button className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            Read
          </button> */}
            {isSelected && (
              <div>
                <span className="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">
                  Previous Summary
                </span>
              </div>
            )}
            {isSelected && onClose && (
              <button
                onClick={onClose}
                className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full"
              >
                Close
              </button>
            )}
          </div>
        </div>

        <div className="whitespace-pre-wrap text-xs">
          {formatTextWithBold(text)}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center bg-white border border-gray-100 rounded-xl shadow-md p-2">
        <div className="bg-blue-50 rounded-xl p-2 border border-blue-100">
          <p className="text-xs text-blue-700">Original Length</p>
          <p className="font-bold text-sm text-blue-800">
            {originalLength} characters
          </p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100">
          <p className="text-xs text-emerald-700">Summary Length</p>
          <p className="font-bold text-sm text-emerald-800">
            {summaryLength} characters
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl p-2 border border-amber-100">
          <p className="text-xs text-amber-700">Reduction</p>
          <p className="font-bold text-sm text-amber-800">{reduction}%</p>
        </div>
      </div>
    </>
  );
};

export default SummaryResult;

SummaryResult.propTypes = {
  summary: PropTypes.shape({
    text: PropTypes.string,
    originalLength: PropTypes.number,
    summaryLength: PropTypes.number,
    case_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    filename: PropTypes.string,
  }).isRequired,
  onCopy: PropTypes.func.isRequired,
  calculateReduction: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(["current", "selected"]),
  onClose: PropTypes.func,
};
