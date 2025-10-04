import React from "react";

export default function EmptyState() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="absolute -inset-6" aria-hidden="true" />
        <svg
          width="160"
          height="120"
          viewBox="0 0 160 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <rect x="22" y="34" width="80" height="64" rx="8" fill="#E6F4F1" />
          <rect
            x="54"
            y="18"
            width="80"
            height="78"
            rx="10"
            fill="#34D399"
            opacity="0.15"
          />
          <path
            d="M116 26H80a6 6 0 00-6 6v60a6 6 0 006 6h52a6 6 0 006-6V48l-22-22z"
            fill="#10B981"
            opacity="0.15"
          />
          <path
            d="M116 26v16a6 6 0 006 6h16"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect
            x="70"
            y="56"
            width="56"
            height="8"
            rx="4"
            fill="#10B981"
            opacity="0.25"
          />
          <rect
            x="70"
            y="72"
            width="40"
            height="8"
            rx="4"
            fill="#10B981"
            opacity="0.2"
          />
          <circle cx="40" cy="86" r="6" fill="#34D399" />
        </svg>
      </div>

      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
        A place for all of your files
      </h1>
      <p className="mt-3 text-gray-600 max-w-2xl mx-auto text-base md:text-lg">
        use the Upload button in the toolbar to add documents.
      </p>
    </div>
  );
}
