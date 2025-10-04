import React from "react";
import PropTypes from "prop-types";

export default function KeyIssues({ issues }) {
  if (!issues?.length) return null;
  return (
    <section className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
      <h3 className="text-base font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <i className="ri-scales-2-line text-blue-600" /> Key Legal Issues
      </h3>
      <ul className="grid md:grid-cols-2 gap-2">
        {issues.map((issue, index) => (
          <li key={index} className="flex items-start text-sm text-gray-700">
            <i className="ri-checkbox-circle-fill text-blue-600 mt-0.5 mr-2"></i>
            <span>{issue}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

KeyIssues.propTypes = {
  issues: PropTypes.array,
};
