import React from "react";
import PropTypes from "prop-types";

export default function LegalAnalysis({ text }) {
  if (!text) return null;
  return (
    <section className="p-5 bg-gray-50 rounded-lg border border-gray-100">
      <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <i className="ri-book-2-line text-gray-500" /> Legal Analysis
      </h3>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </section>
  );
}

LegalAnalysis.propTypes = {
  text: PropTypes.string,
};
