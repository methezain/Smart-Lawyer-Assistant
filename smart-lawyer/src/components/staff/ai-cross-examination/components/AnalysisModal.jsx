import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import StrengthStars from "./StrengthStars";
import PartyAnalysis from "./PartyAnalysis";
import KeyIssues from "./KeyIssues";
import LegalAnalysis from "./LegalAnalysis";

const AnalysisModal = forwardRef(function AnalysisModal(
  { analysis, caseArguments, onClose },
  ref
) {
  if (!analysis) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        ref={ref}
        className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-200"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="inline-flex w-9 h-9 rounded-lg bg-blue-100 text-blue-600 items-center justify-center">
                <i className="ri-file-paper-2-line" />
              </span>
              Argument Analysis Report
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              AI generated comparative strength overview
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close analysis modal"
            className="text-gray-500 hover:text-gray-700 rounded-lg p-2 hover:bg-gray-100 transition"
            type="button"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          <section className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex flex-wrap gap-4 justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <i className="ri-briefcase-line text-blue-500" /> Case Overview
              </h3>
              {caseArguments.caseSummary && (
                <p className="text-sm text-gray-700 max-w-xl">
                  {caseArguments.caseSummary}
                </p>
              )}
            </div>
            {caseArguments.relevantLaws && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">
                  Relevant Laws:
                </span>
                <span className="text-gray-600 ml-1">
                  {caseArguments.relevantLaws}
                </span>
              </div>
            )}
          </section>

          <KeyIssues issues={analysis.keyIssues} />

          <section className="p-5 bg-emerald-50 rounded-lg border border-emerald-100 flex flex-col gap-2">
            <h3 className="text-base font-semibold text-emerald-800 flex items-center gap-2">
              <i className="ri-shield-check-line" /> Stronger Party
            </h3>
            <p className="text-sm text-emerald-700">
              {analysis.strongerParty}: {analysis.analysis.conclusion}
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PartyAnalysis
              title="Petitioner's Analysis"
              data={analysis.analysis.petitioner}
              variant="petitioner"
            />
            <PartyAnalysis
              title="Respondent's Analysis"
              data={analysis.analysis.respondent}
              variant="respondent"
            />
          </div>

          <LegalAnalysis text={analysis.analysis.legalAnalysis} />
        </div>

        <footer className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            type="button"
          >
            Close
          </button>
          <button
            className="text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 shadow"
            type="button"
          >
            <i className="ri-download-line" /> Export Report
          </button>
        </footer>
      </div>
    </div>
  );
});

AnalysisModal.propTypes = {
  analysis: PropTypes.object,
  caseArguments: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AnalysisModal;
