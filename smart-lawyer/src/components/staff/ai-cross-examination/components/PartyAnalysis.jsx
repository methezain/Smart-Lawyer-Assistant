import React from "react";
import PropTypes from "prop-types";
import StrengthStars from "./StrengthStars";

function ListGroup({ title, items, color, icon }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className={`font-medium mb-2 ${color}`}>{title}</h4>
      <ul className="space-y-1">
        {items.map((t, idx) => (
          <li
            key={`${title}-${t}-${idx}`}
            className="flex items-start text-sm text-gray-700"
          >
            <i className={`${icon} mt-1 mr-2`} />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

ListGroup.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.array,
  color: PropTypes.string,
  icon: PropTypes.string,
};

export default function PartyAnalysis({ title, data }) {
  if (!data) return null;
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col gap-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-800 flex-1 leading-snug">
          {title}
        </h3>
        <StrengthStars score={data.strengthScore} />
      </div>
      <div className="space-y-5">
        <ListGroup
          title="Strengths"
          items={data.strengths}
          color="text-green-600"
          icon="ri-check-line text-green-500"
        />
        <ListGroup
          title="Weaknesses"
          items={data.weaknesses}
          color="text-red-600"
          icon="ri-close-line text-red-500"
        />
      </div>
    </div>
  );
}

PartyAnalysis.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.shape({
    strengthScore: PropTypes.number,
    strengths: PropTypes.array,
    weaknesses: PropTypes.array,
  }),
  // variant removed - styling currently identical for both parties; reintroduce if needed
};
