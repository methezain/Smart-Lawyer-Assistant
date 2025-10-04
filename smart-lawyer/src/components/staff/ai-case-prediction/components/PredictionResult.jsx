import React from "react";
import PropTypes from "prop-types";
import formatPdfText from "../utils/formatPdfText.jsx";

const PredictionResult = ({
  prediction,
  variant = "current",
  onClose,
  onCopy,
}) => {
  if (!prediction) return null;
  const { verdict, pdf_text: pdfText, case_id: caseId } = prediction;
  const isSelected = variant === "selected";

  return (
    <div
      className={`rounded-xl border bg-white ${
        isSelected ? "border-blue-200 shadow-sm" : "border-gray-200"
      } overflow-hidden`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-lg ${
              isSelected
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <i className="ri-scales-line" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              {isSelected ? `Case #${caseId}` : "Latest Prediction"}
            </h3>
            {isSelected && (
              <p className="text-xs text-gray-500">Viewing from history</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCopy(verdict)}
            className="px-3 py-1 text-xs bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 flex items-center gap-1"
            type="button"
          >
            <span className="ri-clipboard-line" aria-hidden="true" />
            <span>Copy</span>
          </button>
          {isSelected && (
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center gap-1"
              type="button"
            >
              <span className="ri-close-line" aria-hidden="true" />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border border-blue-100">
          <p className="text-[11px] tracking-wide text-blue-500 font-medium mb-2 uppercase flex items-center gap-1">
            <span className="ri-scales-2-line" /> Verdict
          </p>
          <p className="text-sm font-semibold text-blue-700 leading-relaxed break-words">
            {verdict}
          </p>
        </div>
        {pdfText && (
          <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
            <p className="text-[11px] tracking-wide text-gray-500 font-medium mb-3 uppercase flex items-center gap-1">
              <span className="ri-file-text-line" /> Full Document Text
            </p>
            <div className="max-h-[420px] overflow-y-auto pr-1 custom-scrollbar text-[13px] leading-relaxed">
              {formatPdfText(pdfText) || (
                <pre className="whitespace-pre-wrap break-words text-xs text-gray-700">
                  {pdfText}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

PredictionResult.propTypes = {
  prediction: PropTypes.shape({
    verdict: PropTypes.string,
    pdf_text: PropTypes.string,
    case_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  variant: PropTypes.oneOf(["current", "selected"]),
  onClose: PropTypes.func,
  onCopy: PropTypes.func,
};

export default PredictionResult;
