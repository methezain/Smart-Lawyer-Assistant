// Utility to format text containing **bold** markdown into JSX <strong> elements
import React from "react";

export const formatTextWithBold = (text) => {
  if (!text) return "";

  const parts = String(text).split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-gray-900">
          {boldText}
        </strong>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

export default formatTextWithBold;
