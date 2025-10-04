import React from "react";
import PropTypes from "prop-types";

export default function StrengthStars({ score }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Strength score ${score} of 5`}
    >
      <span className="text-xs font-medium text-gray-600">Strength:</span>
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <i
            key={i}
            className={`ri-star-fill ${
              i < score ? "text-amber-500" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

StrengthStars.propTypes = {
  score: PropTypes.number.isRequired,
};
